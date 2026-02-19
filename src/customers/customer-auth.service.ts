import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { randomInt, randomUUID } from 'crypto';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { CustomerOtp, CustomerOtpDocument, CustomerOtpReason } from './customer-otp.schema';
import { CustomersService, UpsertCustomerInput } from './customers.service';
import { SMS_SENDER, SmsSender } from './sms/sms.sender';
import { CustomerDocument } from './customer.schema';
import { OrdersService } from '../orders/orders.service';

export interface RequestOtpOptions {
  phone: string;
  clientId: string;
  ip?: string;
  reason?: CustomerOtpReason;
}

export interface RequestOtpResult {
  requestId: string;
  resendDelaySec: number;
  expiresInSec: number;
}

export interface VerifyOtpOptions {
  requestId: string;
  phone: string;
  code: string;
  clientId: string;
  reason?: CustomerOtpReason;
  upsertPayload?: Omit<UpsertCustomerInput, 'phone'>;
}

export interface VerifyOtpResult {
  customer: CustomerDocument;
  otpId: Types.ObjectId;
}

export interface CustomerJwtPayload {
  sub: string;
  phone: string;
  clientId: string;
}

export interface CustomerAuthTokens {
  accessToken: string;
  accessTokenExpiresInSec: number;
  tokenType: 'bearer';
  refreshToken?: string;
  refreshTokenExpiresInSec?: number;
}

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);
  private readonly otpLength: number;
  private readonly otpTtlSec: number;
  private readonly otpResendDelaySec: number;
  private readonly otpMaxAttempts: number;
  private readonly rateLimitPerPhone: number;
  private readonly rateLimitPerClient: number;
  private readonly rateLimitPerIp: number;
  private readonly rateWindowPhoneSec: number;
  private readonly rateWindowClientSec: number;
  private readonly rateWindowIpSec: number;
  private readonly otpMessageTemplate: string;
  private readonly otpHashRounds: number;
  private readonly jwtAudience?: string;
  private readonly jwtIssuer: string;
  private readonly accessTokenTtl: string | number;
  private readonly accessTokenExpiresInSec: number;
  private readonly refreshTokenTtl?: string | number;
  private readonly refreshTokenExpiresInSec?: number;
  private readonly refreshSecret?: string;

  constructor(
    @InjectModel(CustomerOtp.name)
    private readonly customerOtpModel: Model<CustomerOtpDocument>,
    private readonly customersService: CustomersService,
    @Inject(SMS_SENDER) private readonly smsSender: SmsSender,
    @Inject(forwardRef(() => OrdersService)) private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly throttlerStorage: ThrottlerStorageService,
  ) {
    this.otpLength = this.configService.get<number>('CUSTOMER_OTP_LENGTH') ?? 4;
    this.otpTtlSec = this.configService.get<number>('CUSTOMER_OTP_TTL_SEC') ?? 300;
    this.otpResendDelaySec = this.configService.get<number>('CUSTOMER_OTP_RESEND_DELAY_SEC') ?? 30;
    this.otpMaxAttempts = this.configService.get<number>('CUSTOMER_OTP_MAX_ATTEMPTS') ?? 5;

    this.rateLimitPerPhone = this.configService.get<number>('CUSTOMER_OTP_PHONE_LIMIT') ?? 5;
    this.rateLimitPerClient = this.configService.get<number>('CUSTOMER_OTP_CLIENT_LIMIT') ?? 10;
    this.rateLimitPerIp = this.configService.get<number>('CUSTOMER_OTP_IP_LIMIT') ?? 20;

    this.rateWindowPhoneSec =
      this.configService.get<number>('CUSTOMER_OTP_PHONE_WINDOW_SEC') ?? 900; // 15 min
    this.rateWindowClientSec =
      this.configService.get<number>('CUSTOMER_OTP_CLIENT_WINDOW_SEC') ?? 900;
    this.rateWindowIpSec = this.configService.get<number>('CUSTOMER_OTP_IP_WINDOW_SEC') ?? 900;

    this.otpMessageTemplate =
      this.configService.get<string>('CUSTOMER_OTP_MESSAGE_TEMPLATE') ??
      'Ваш код подтверждения: {{code}}';
    const otpHashRoundsRaw = this.configService.get<string>('CUSTOMER_OTP_SALT_ROUNDS');
    const parsedOtpRounds = otpHashRoundsRaw ? Number(otpHashRoundsRaw) : NaN;
    this.otpHashRounds = Number.isFinite(parsedOtpRounds) ? parsedOtpRounds : 10;
    this.jwtAudience = this.configService.get<string>('CUSTOMER_JWT_AUDIENCE') ?? undefined;
    this.jwtIssuer =
      this.configService.get<string>('CUSTOMER_JWT_ISSUER') ?? 'dentistry-storefront';
    this.accessTokenTtl = this.configService.get<string>('CUSTOMER_JWT_EXPIRES_IN') ?? '15m';
    this.accessTokenExpiresInSec = this.resolveSeconds(this.accessTokenTtl, 15 * 60);
    this.refreshTokenTtl = this.configService.get<string>('CUSTOMER_REFRESH_EXPIRES_IN') ?? '30d';
    this.refreshSecret = this.configService.get<string>('CUSTOMER_REFRESH_SECRET') ?? undefined;
    this.refreshTokenExpiresInSec = this.refreshSecret
      ? this.resolveSeconds(this.refreshTokenTtl, 30 * 24 * 60 * 60)
      : undefined;
  }

  async requestOtp(options: RequestOtpOptions): Promise<RequestOtpResult> {
    const reason = options.reason ?? 'login';
    const normalizedPhone = this.customersService.normalizePhone(options.phone);

    const clientId = options.clientId.trim();

    await this.enforceRateLimits(normalizedPhone, clientId, options.ip);

    const existing = await this.customerOtpModel.findOne({ phone: normalizedPhone, reason }).exec();

    if (existing) {
      const nextAllowedTime = this.getNextAllowedRequestTime(existing);
      if (nextAllowedTime && nextAllowedTime > Date.now()) {
        const waitSeconds = Math.ceil((nextAllowedTime - Date.now()) / 1000);
        const message = `SMS already sent. Попробуйте через ${waitSeconds} секунд`;
        this.throwTooManyRequests(message);
      }
    }

    const requestId = randomUUID();
    const otpCode = this.generateNumericOtp();
    const expiresAt = new Date(Date.now() + this.otpTtlSec * 1000);
    const codeHash = await hash(otpCode, this.otpHashRounds);

    const update: Partial<CustomerOtp> & { attempts: number } = {
      requestId,
      clientId,
      codeHash,
      expiresAt,
      attempts: 0,
    };

    await this.customerOtpModel
      .findOneAndUpdate({ phone: normalizedPhone, reason }, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();

    const message = this.otpMessageTemplate.replace('{{code}}', otpCode);
    await this.smsSender.sendSms(normalizedPhone, message);

    return {
      requestId,
      resendDelaySec: this.otpResendDelaySec,
      expiresInSec: this.otpTtlSec,
    };
  }

  async verifyOtp(options: VerifyOtpOptions): Promise<VerifyOtpResult> {
    const reason = options.reason ?? 'login';
    const normalizedPhone = this.customersService.normalizePhone(options.phone);
    const clientId = options.clientId.trim();

    const record = await this.customerOtpModel
      .findOne({ phone: normalizedPhone, requestId: options.requestId, reason })
      .exec();

    if (!record) {
      throw new UnauthorizedException('Неверный или просроченный код');
    }

    if (record.clientId !== clientId) {
      throw new UnauthorizedException('Неверный клиент');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.customerOtpModel.deleteOne({ _id: record._id }).exec();
      throw new UnauthorizedException('Код истёк');
    }

    const isValid = await compare(options.code, record.codeHash);

    if (!isValid) {
      await this.handleInvalidAttempt(record);
      throw new UnauthorizedException('Неверный код');
    }

    await this.customerOtpModel.deleteOne({ _id: record._id }).exec();

    const customer = await this.customersService.upsertCustomer({
      phone: normalizedPhone,
      ...(options.upsertPayload ?? {}),
      markPhoneVerified: true,
      touchLastLogin: true,
    });

    try {
      await this.ordersService.attachByPhoneAndClientId(customer._id, normalizedPhone, clientId);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed to attach guest orders: ${details}`);
    }

    return { customer, otpId: record._id };
  }

  async createAuthTokens(
    customer: CustomerDocument,
    clientId: string,
  ): Promise<CustomerAuthTokens> {
    const payload = this.buildJwtPayload(customer, clientId);

    const signOptions = this.buildJwtOptions(this.accessTokenTtl);
    const accessToken = await this.jwtService.signAsync(payload, signOptions);

    let refreshToken: string | undefined;
    let refreshTokenExpiresInSec: number | undefined;

    if (this.refreshSecret) {
      const refreshOptions = this.buildJwtOptions(this.refreshTokenTtl, this.refreshSecret);
      refreshToken = await this.jwtService.signAsync(payload, refreshOptions);
      refreshTokenExpiresInSec = this.refreshTokenExpiresInSec;
    }

    return {
      accessToken,
      accessTokenExpiresInSec: this.accessTokenExpiresInSec,
      tokenType: 'bearer',
      refreshToken,
      refreshTokenExpiresInSec,
    };
  }

  async verifyAccessToken(token: string): Promise<CustomerDocument> {
    try {
      const verifyOptions = this.buildJwtVerifyOptions();
      const payload = await this.jwtService.verifyAsync<CustomerJwtPayload>(token, verifyOptions);

      if (!payload?.sub) {
        throw new UnauthorizedException('Недействительный токен');
      }

      const customer = await this.customersService.findById(payload.sub);
      if (!customer) {
        throw new UnauthorizedException('Покупатель не найден');
      }

      return customer;
    } catch (error) {
      const details = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed to verify customer token: ${details}`);
      throw new UnauthorizedException('Недействительный токен');
    }
  }

  async refreshTokens(refreshToken: string): Promise<CustomerAuthTokens> {
    if (!this.refreshSecret) {
      throw new BadRequestException('Refresh tokens не налаштовано');
    }

    let payload: CustomerJwtPayload;
    try {
      const verifyOptions: JwtVerifyOptions = {
        secret: this.refreshSecret,
      };
      if (this.jwtAudience) verifyOptions.audience = this.jwtAudience;
      if (this.jwtIssuer) verifyOptions.issuer = this.jwtIssuer;

      payload = await this.jwtService.verifyAsync<CustomerJwtPayload>(refreshToken, verifyOptions);
    } catch {
      throw new UnauthorizedException('Невірний або прострочений refresh токен');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Невірний refresh токен');
    }

    const customer = await this.customersService.findById(payload.sub);
    if (!customer) {
      throw new UnauthorizedException('Покупця не знайдено');
    }

    return this.createAuthTokens(customer, payload.clientId);
  }

  private buildJwtPayload(customer: CustomerDocument, clientId: string): CustomerJwtPayload {
    return {
      sub: customer._id.toString(),
      phone: customer.phone,
      clientId,
    };
  }

  private buildJwtOptions(expiresIn: string | number | undefined, secret?: string): JwtSignOptions {
    const options: JwtSignOptions = {};

    if (expiresIn) {
      options.expiresIn = expiresIn;
    }

    if (this.jwtAudience) {
      options.audience = this.jwtAudience;
    }

    if (this.jwtIssuer) {
      options.issuer = this.jwtIssuer;
    }

    if (secret) {
      options.secret = secret;
    }

    return options;
  }

  private buildJwtVerifyOptions(): JwtVerifyOptions {
    const options: JwtVerifyOptions = {};

    if (this.jwtAudience) {
      options.audience = this.jwtAudience;
    }

    if (this.jwtIssuer) {
      options.issuer = this.jwtIssuer;
    }

    return options;
  }

  async invalidateActiveOtps(phone: string, reason: CustomerOtpReason = 'login'): Promise<void> {
    const normalizedPhone = this.customersService.normalizePhone(phone);
    await this.customerOtpModel.deleteMany({ phone: normalizedPhone, reason }).exec();
  }

  private getNextAllowedRequestTime(record: CustomerOtpDocument): number | null {
    const referenceTime = record.updatedAt ?? record.createdAt;
    if (!referenceTime) {
      return null;
    }

    return referenceTime.getTime() + this.otpResendDelaySec * 1000;
  }

  private async handleInvalidAttempt(record: CustomerOtpDocument): Promise<void> {
    const nextAttempts = (record.attempts ?? 0) + 1;

    if (nextAttempts >= this.otpMaxAttempts) {
      await this.customerOtpModel.deleteOne({ _id: record._id }).exec();
      return;
    }

    await this.customerOtpModel
      .updateOne(
        { _id: record._id },
        {
          $set: { attempts: nextAttempts },
        },
      )
      .exec();
  }

  private generateNumericOtp(): string {
    if (this.otpLength < 4 || this.otpLength > 10) {
      throw new BadRequestException('CUSTOMER_OTP_LENGTH must be between 4 and 10');
    }

    const digits: string[] = [];

    for (let i = 0; i < this.otpLength; i += 1) {
      digits.push(randomInt(0, 10).toString());
    }

    return digits.join('');
  }

  private resolveSeconds(value: string | number | undefined, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      return fallback;
    }

    const match = trimmed.match(/^([0-9]+)([smhd])?$/);
    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2] ?? 's';

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
    };

    const multiplier = multipliers[unit];

    return amount * multiplier;
  }

  private async enforceRateLimits(phone: string, clientId: string, ip?: string): Promise<void> {
    await this.checkLimit(
      `customer-otp:phone:${phone}`,
      this.rateWindowPhoneSec,
      this.rateLimitPerPhone,
    );
    await this.checkLimit(
      `customer-otp:client:${clientId}`,
      this.rateWindowClientSec,
      this.rateLimitPerClient,
    );

    if (ip) {
      await this.checkLimit(`customer-otp:ip:${ip}`, this.rateWindowIpSec, this.rateLimitPerIp);
    }
  }

  private async checkLimit(key: string, ttlSec: number, limit: number): Promise<void> {
    if (limit <= 0) {
      return;
    }

    const record = await this.throttlerStorage.increment(key, ttlSec, limit, 0, 'default');

    const attempts = typeof record === 'number' ? record : (record.totalHits ?? 0);

    if (attempts > limit) {
      this.throwTooManyRequests('Превышено количество запросов. Попробуйте позже');
    }
  }

  private throwTooManyRequests(message: string): never {
    throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
