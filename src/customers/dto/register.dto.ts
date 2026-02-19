import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const trimLower = (value: unknown): string | undefined => {
  const trimmed = trim(value);
  return trimmed ? trimmed.toLowerCase() : undefined;
};

export class RegisterDto {
  @ApiProperty({ example: '+380971112233', description: 'Phone (5–32 chars)' })
  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(5, 32)
  phone!: string;

  @ApiProperty({ example: 'ivan@example.com' })
  @Transform(({ value }) => trimLower(value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'mypassword123', minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: 'Іван', maxLength: 120 })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Frontend session ID' })
  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(1, 64)
  clientId!: string;

  @ApiPropertyOptional({ example: true, description: 'Marketing opt-in consent' })
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
