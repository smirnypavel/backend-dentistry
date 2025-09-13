import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from '../admin/admin.guard';

class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}

class CreateAdminDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

@ApiTags('admin:auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with username/password to get JWT' })
  @ApiBody({ schema: { $ref: '#/components/schemas/LoginRequest' } })
  @ApiOkResponse({ schema: { $ref: '#/components/schemas/LoginResponse' } })
  async login(@Body() dto: LoginDto) {
    return this.service.login(dto.username, dto.password);
  }

  // Admin management endpoints protected by x-api-key for simplicity
  @Get('users')
  @UseGuards(AdminGuard)
  @ApiSecurity('x-api-key')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List admin users' })
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: '#/components/schemas/AdminUserListItem' } },
  })
  listAdmins() {
    return this.service.listAdmins();
  }

  @Post('users')
  @UseGuards(AdminGuard)
  @ApiSecurity('x-api-key')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create admin user (no roles, full access)' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateAdminRequest' } })
  @ApiOkResponse({ schema: { $ref: '#/components/schemas/AdminUserListItem' } })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.service.createAdmin(dto);
  }
}
