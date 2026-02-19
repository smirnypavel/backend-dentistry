import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CustomerPasswordService, RegisterResult, LoginResult } from './customer-password.service';
import { CustomerAuthService, CustomerAuthTokens } from './customer-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class CustomerPasswordAuthController {
  private readonly logger = new Logger(CustomerPasswordAuthController.name);

  constructor(
    private readonly passwordService: CustomerPasswordService,
    private readonly authService: CustomerAuthService,
  ) {}

  /**
   * Register a new customer with email + password.
   * If a guest customer with the same phone exists, upgrades the account.
   * Attaches guest orders (by phone + clientId) to the new profile.
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<RegisterResult> {
    return this.passwordService.register({
      phone: dto.phone,
      email: dto.email,
      password: dto.password,
      name: dto.name,
      clientId: dto.clientId,
      marketingOptIn: dto.marketingOptIn,
    });
  }

  /**
   * Login with email (or phone) + password.
   */
  @Post('login')
  async login(@Body() dto: LoginPasswordDto): Promise<LoginResult> {
    return this.passwordService.login(dto.login, dto.password, dto.clientId);
  }

  /**
   * Request a password reset link via e-mail.
   * Always returns success (prevents e-mail enumeration).
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.passwordService.forgotPassword(dto.email);
  }

  /**
   * Reset password using a token received via e-mail.
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.passwordService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * Exchange a valid refresh token for a new access + refresh pair.
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<CustomerAuthTokens> {
    return await this.authService.refreshTokens(dto.refreshToken);
  }
}
