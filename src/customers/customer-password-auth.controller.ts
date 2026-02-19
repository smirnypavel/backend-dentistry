import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CustomerPasswordService, RegisterResult, LoginResult } from './customer-password.service';
import { CustomerAuthService, CustomerAuthTokens } from './customer-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResultDto, AuthTokensDto, MessageResponseDto } from './dto/swagger-responses.dto';

@ApiTags('customer / auth')
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
  @ApiOperation({ summary: 'Регистрация покупателя (phone + email + пароль)' })
  @ApiCreatedResponse({ type: AuthResultDto, description: 'Покупатель создан, токены выданы' })
  @ApiConflictResponse({ description: 'Email або телефон вже зайняті' })
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
  @ApiOperation({ summary: 'Логін покупателя (email або телефон + пароль)' })
  @ApiCreatedResponse({ type: AuthResultDto, description: 'Успішний логін' })
  @ApiUnauthorizedResponse({ description: 'Невірний логін або пароль' })
  async login(@Body() dto: LoginPasswordDto): Promise<LoginResult> {
    return this.passwordService.login(dto.login, dto.password, dto.clientId);
  }

  /**
   * Request a password reset link via e-mail.
   * Always returns success (prevents e-mail enumeration).
   */
  @Post('forgot-password')
  @ApiOperation({ summary: 'Запит на скидання пароля (надсилає email)' })
  @ApiCreatedResponse({ type: MessageResponseDto, description: 'Завжди повертає успіх (захист від перебору)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.passwordService.forgotPassword(dto.email);
  }

  /**
   * Reset password using a token received via e-mail.
   */
  @Post('reset-password')
  @ApiOperation({ summary: 'Скидання пароля за токеном з email' })
  @ApiCreatedResponse({ type: MessageResponseDto, description: 'Пароль успішно змінено' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.passwordService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * Exchange a valid refresh token for a new access + refresh pair.
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Оновлення токенів (refresh → нові access + refresh)' })
  @ApiCreatedResponse({ type: AuthTokensDto, description: 'Нова пара токенів' })
  @ApiUnauthorizedResponse({ description: 'Refresh-токен невалідний або закінчився' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<CustomerAuthTokens> {
    return await this.authService.refreshTokens(dto.refreshToken);
  }
}
