import { Module, Provider, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { Customer, CustomerSchema } from './customer.schema';
import { CustomerOtp, CustomerOtpSchema } from './customer-otp.schema';
import { CustomersService } from './customers.service';
import { SMS_SENDER } from './sms/sms.sender';
import { ConsoleSmsSender } from './sms/console-sms.sender';
import { NoopSmsSender } from './sms/noop-sms.sender';
import { HttpSmsSender } from './sms/http-sms.sender';
import { TwilioSmsSender } from './sms/twilio-sms.sender';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerPasswordService } from './customer-password.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { OrdersModule } from '../orders/orders.module';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerProfileController } from './customer-profile.controller';
import { CustomerPasswordAuthController } from './customer-password-auth.controller';
import { EMAIL_SENDER } from './email/email.sender';
import { ConsoleEmailSender } from './email/console-email.sender';
import { SmtpEmailSender } from './email/smtp-email.sender';

const smsSenderProvider: Provider = {
  provide: SMS_SENDER,
  useFactory: (configService: ConfigService) => {
    const provider = configService.get<string>('SMS_PROVIDER')?.toLowerCase() ?? 'console';

    if (provider === 'disabled' || provider === 'noop') {
      return new NoopSmsSender();
    }

    if (provider === 'http') {
      const baseUrl = configService.get<string>('SMS_API_URL');

      if (!baseUrl) {
        throw new Error('SMS_API_URL is required when SMS_PROVIDER=http');
      }

      return new HttpSmsSender({
        baseUrl,
        apiKey: configService.get<string>('SMS_API_KEY'),
        from: configService.get<string>('SMS_FROM'),
        timeoutMs: configService.get<number>('SMS_TIMEOUT_MS') ?? 5000,
      });
    }

    if (provider === 'twilio') {
      const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID')?.trim();
      const authToken = configService.get<string>('TWILIO_AUTH_TOKEN')?.trim();
      const apiKeySid = configService.get<string>('TWILIO_API_KEY_SID')?.trim();
      const apiKeySecret = configService.get<string>('TWILIO_API_KEY_SECRET')?.trim();
      const from = configService.get<string>('SMS_FROM')?.trim();

      if (!accountSid) {
        throw new Error('TWILIO_ACCOUNT_SID is required when SMS_PROVIDER=twilio');
      }

      if (!authToken && (!apiKeySid || !apiKeySecret)) {
        throw new Error(
          'Provide either TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID/TWILIO_API_KEY_SECRET when SMS_PROVIDER=twilio',
        );
      }

      if (!from) {
        throw new Error('SMS_FROM is required when SMS_PROVIDER=twilio');
      }

      return new TwilioSmsSender({
        accountSid,
        from,
        authToken: authToken || undefined,
        apiKeySid: apiKeySid || undefined,
        apiKeySecret: apiKeySecret || undefined,
      });
    }

    return new ConsoleSmsSender();
  },
  inject: [ConfigService],
};

const customerModels = MongooseModule.forFeature([
  { name: Customer.name, schema: CustomerSchema },
  { name: CustomerOtp.name, schema: CustomerOtpSchema },
]);

const customerJwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const secret = configService.get<string>('CUSTOMER_JWT_SECRET');

    if (!secret) {
      throw new Error('CUSTOMER_JWT_SECRET must be configured');
    }

    return {
      secret,
      signOptions: {
        issuer: configService.get<string>('CUSTOMER_JWT_ISSUER') ?? 'dentistry-storefront',
        audience: configService.get<string>('CUSTOMER_JWT_AUDIENCE') ?? undefined,
      },
    };
  },
});

const emailSenderProvider: Provider = {
  provide: EMAIL_SENDER,
  useFactory: (configService: ConfigService) => {
    const provider = configService.get<string>('EMAIL_PROVIDER')?.toLowerCase() ?? 'console';
    if (provider === 'smtp') {
      return new SmtpEmailSender({
        host: configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
        port: configService.get<number>('SMTP_PORT') ?? 587,
        secure: configService.get<string>('SMTP_SECURE') === 'true',
        user: configService.get<string>('SMTP_USER') ?? '',
        pass: configService.get<string>('SMTP_PASS') ?? '',
        from: configService.get<string>('SMTP_FROM') ?? '',
      });
    }
    return new ConsoleEmailSender();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule, customerModels, customerJwtModule, forwardRef(() => OrdersModule)],
  controllers: [CustomerAuthController, CustomerProfileController, CustomerPasswordAuthController],
  providers: [
    CustomersService,
    CustomerAuthService,
    CustomerPasswordService,
    CustomerAuthGuard,
    ThrottlerStorageService,
    smsSenderProvider,
    emailSenderProvider,
  ],
  exports: [
    CustomersService,
    CustomerAuthService,
    CustomerPasswordService,
    customerModels,
    customerJwtModule,
    smsSenderProvider,
    emailSenderProvider,
  ],
})
export class CustomersModule {}
