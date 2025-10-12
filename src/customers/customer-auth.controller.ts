import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CustomerAuthService } from './customer-auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { toCustomerDto } from './dto/customer.dto';
import { VerifyOtpResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class CustomerAuthController {
  private readonly logger = new Logger(CustomerAuthController.name);

  constructor(private readonly authService: CustomerAuthService) {}

  @Post('request-code')
  async requestCode(@Body() body: RequestOtpDto, @Req() request: Request) {
    try {
      const result = await this.authService.requestOtp({
        phone: body.phone,
        clientId: body.clientId,
        reason: body.reason,
        ip: this.extractClientIp(request),
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to request OTP', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  @Post('verify-code')
  async verifyCode(@Body() body: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    const upsertPayload = {
      ...(body.name ? { name: body.name } : {}),
      ...(body.marketingOptIn !== undefined ? { marketingOptIn: body.marketingOptIn } : {}),
    };

    const { customer } = await this.authService.verifyOtp({
      phone: body.phone,
      code: body.code,
      requestId: body.requestId,
      clientId: body.clientId,
      reason: body.reason,
      upsertPayload,
    });

    const tokens = await this.authService.createAuthTokens(customer, body.clientId);

    return {
      customer: toCustomerDto(customer),
      tokens,
    };
  }

  private extractClientIp(req: Request): string | undefined {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
      const forwarded = xForwardedFor.split(',')[0]?.trim();
      if (forwarded) {
        return forwarded;
      }
    }

    return req.ip;
  }
}
