import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash } from 'crypto';
import { CustomersService } from './customers.service';
import { CustomerAuthService, CustomerAuthTokens } from './customer-auth.service';
import { OrdersService } from '../orders/orders.service';
import { EMAIL_SENDER, EmailSender } from './email/email.sender';
import { Customer, CustomerDocument } from './customer.schema';
import { CustomerDto, toCustomerDto } from './dto/customer.dto';

/** Helper: safely extract passwordHash from a customer document */
function getPasswordHash(customer: CustomerDocument): string | undefined {
  return (customer as unknown as Customer).passwordHash;
}

/* ------------------------------------------------------------------ */
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */

export interface RegisterInput {
  phone: string;
  email: string;
  password: string;
  name?: string;
  clientId: string;
  marketingOptIn?: boolean;
}

export interface RegisterResult {
  customer: CustomerDto;
  tokens: CustomerAuthTokens;
}

export interface LoginResult {
  customer: CustomerDto;
  tokens: CustomerAuthTokens;
}

interface PasswordResetPayload {
  sub: string;
  purpose: 'password-reset';
  fp: string; // fingerprint of current passwordHash — auto-invalidates after use
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

@Injectable()
export class CustomerPasswordService {
  private readonly logger = new Logger(CustomerPasswordService.name);
  private readonly saltRounds: number;
  private readonly resetTokenExpiresIn: string;
  private readonly resetUrl: string;

  constructor(
    private readonly customersService: CustomersService,
    private readonly customerAuthService: CustomerAuthService,
    @Inject(forwardRef(() => OrdersService)) private readonly ordersService: OrdersService,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds =
      Number(this.configService.get<string>('CUSTOMER_PASSWORD_SALT_ROUNDS')) || 10;
    this.resetTokenExpiresIn =
      this.configService.get<string>('CUSTOMER_RESET_TOKEN_EXPIRES_IN') ?? '1h';
    this.resetUrl =
      this.configService.get<string>('CUSTOMER_RESET_URL') ??
      'http://localhost:5173/reset-password';
  }

  /* ======================== REGISTER ============================== */

  async register(input: RegisterInput): Promise<RegisterResult> {
    const normalizedPhone = this.customersService.normalizePhone(input.phone);
    const email = input.email.trim().toLowerCase();

    // Check e-mail uniqueness
    const existingByEmail: CustomerDocument | null = await this.customersService.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictException('Email вже зайнятий');
    }

    // Check phone — allow upgrade of guest / OTP customers (no password yet)
    const existingByPhone = await this.customersService.findByPhone(input.phone);
    if (existingByPhone && getPasswordHash(existingByPhone)) {
      throw new ConflictException('Цей номер телефону вже зареєстровано');
    }

    const passwordHash = await hash(input.password, this.saltRounds);

    try {
      // Upsert: creates new or upgrades existing guest/OTP customer
      const customer = await this.customersService.upsertCustomer({
        phone: normalizedPhone,
        name: input.name,
        email,
        marketingOptIn: input.marketingOptIn,
        markPhoneVerified: false, // don't change phone verification status
        touchLastLogin: true,
      });

      await this.customersService.setPassword(String(customer._id), passwordHash);

      // Reload to include passwordHash
      const updated = (await this.customersService.findById(customer._id))!;

      // Attach guest orders created with the same phone + clientId
      try {
        const attached = await this.ordersService.attachByPhoneAndClientId(
          updated._id,
          normalizedPhone,
          input.clientId,
        );
        if (attached > 0) {
          this.logger.log(`Attached ${attached} guest order(s) to customer ${String(updated._id)}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to attach guest orders: ${(error as Error).message}`);
      }

      const tokens = await this.customerAuthService.createAuthTokens(updated, input.clientId);

      return { customer: toCustomerDto(updated), tokens };
    } catch (error: unknown) {
      // MongoDB unique-index race on email / phone
      if ((error as { code?: number })?.code === 11000) {
        throw new ConflictException('Email або телефон вже зайнятий');
      }
      throw error;
    }
  }

  /* ========================= LOGIN ================================ */

  async login(login: string, password: string, clientId: string): Promise<LoginResult> {
    const normalizedLogin = login.trim().toLowerCase();

    let customer: CustomerDocument | null = null;

    if (normalizedLogin.includes('@')) {
      customer = await this.customersService.findByEmail(normalizedLogin);
    } else {
      try {
        customer = await this.customersService.findByPhone(normalizedLogin);
      } catch {
        // Phone normalization failed → not a valid phone, treat as "not found"
        customer = null;
      }
    }

    const pwHash = customer ? getPasswordHash(customer) : undefined;
    if (!customer || !pwHash) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    const isValid = await compare(password, pwHash);
    if (!isValid) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    await this.customersService.touchLastLogin(String(customer._id));

    const tokens = await this.customerAuthService.createAuthTokens(customer, clientId);
    return { customer: toCustomerDto(customer), tokens };
  }

  /* ==================== FORGOT PASSWORD =========================== */

  async forgotPassword(email: string): Promise<{ message: string }> {
    const customer = await this.customersService.findByEmail(email.trim().toLowerCase());

    // Always return success to prevent e-mail enumeration
    const successMessage = 'Якщо email існує, лист з інструкціями буде надіслано';

    if (!customer || !getPasswordHash(customer)) {
      return { message: successMessage };
    }

    const resetToken = await this.createPasswordResetToken(customer);
    const resetLink = `${this.resetUrl}?token=${resetToken}`;

    const customerEmail = customer.email ?? '';
    const html = `
      <h2>Відновлення пароля</h2>
      <p>Ви запросили відновлення пароля для вашого акаунту.</p>
      <p>Перейдіть за посиланням для встановлення нового пароля:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Посилання дійсне протягом 1 години.</p>
      <p>Якщо ви не запитували відновлення пароля, просто ігноруйте цей лист.</p>
    `;

    try {
      await this.emailSender.sendEmail(customerEmail, 'Відновлення пароля', html);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${customerEmail}`, (error as Error).stack);
    }

    return { message: successMessage };
  }

  /* ==================== RESET PASSWORD ============================ */

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const customer = await this.verifyPasswordResetToken(token);

    const passwordHash = await hash(newPassword, this.saltRounds);
    await this.customersService.setPassword(String(customer._id), passwordHash);

    return { message: 'Пароль успішно змінено' };
  }

  /* ==================== PRIVATE HELPERS =========================== */

  private async createPasswordResetToken(customer: CustomerDocument): Promise<string> {
    const fp = this.buildPasswordFingerprint(getPasswordHash(customer) ?? '');

    const payload: PasswordResetPayload = {
      sub: customer._id.toString(),
      purpose: 'password-reset',
      fp,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.resetTokenExpiresIn,
      issuer: 'dentistry-password-reset',
    });
  }

  private async verifyPasswordResetToken(token: string): Promise<CustomerDocument> {
    let payload: PasswordResetPayload;

    try {
      payload = await this.jwtService.verifyAsync<PasswordResetPayload>(token, {
        issuer: 'dentistry-password-reset',
      });
    } catch {
      throw new BadRequestException('Невірний або прострочений токен відновлення');
    }

    if (payload.purpose !== 'password-reset' || !payload.sub) {
      throw new BadRequestException('Невірний токен відновлення');
    }

    const customer = await this.customersService.findById(payload.sub);
    if (!customer) {
      throw new NotFoundException('Покупця не знайдено');
    }

    // Fingerprint check — auto-invalidates if password was already changed
    const currentFp = this.buildPasswordFingerprint(getPasswordHash(customer) ?? '');
    if (currentFp !== payload.fp) {
      throw new BadRequestException('Токен вже використано або пароль був змінено');
    }

    return customer;
  }

  private buildPasswordFingerprint(passwordHash: string): string {
    return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
  }
}
