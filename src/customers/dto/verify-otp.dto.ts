import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { CustomerOtpReason } from '../customer-otp.schema';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const trimLower = (value: unknown): string | undefined => {
  const trimmed = trim(value);
  return trimmed ? trimmed.toLowerCase() : undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return undefined;
};

export class VerifyOtpDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(1, 64)
  clientId!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(5, 32)
  phone!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(6, 64)
  requestId!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(4, 10)
  @Matches(/^[0-9]+$/)
  code!: string;

  @Transform(({ value }) => trimLower(value))
  @IsOptional()
  @IsString()
  @Matches(/^(login|signup|reset)$/)
  reason?: CustomerOtpReason;

  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
