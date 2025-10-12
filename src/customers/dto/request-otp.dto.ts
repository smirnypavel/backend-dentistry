import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { CustomerOtpReason } from '../customer-otp.schema';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const trimLower = (value: unknown): string | undefined => {
  const trimmed = trim(value);
  return trimmed ? trimmed.toLowerCase() : undefined;
};

export class RequestOtpDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(1, 64)
  clientId!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(5, 32)
  phone!: string;

  @Transform(({ value }) => trimLower(value))
  @IsOptional()
  @IsString()
  @Matches(/^(login|signup|reset)$/)
  reason?: CustomerOtpReason;
}
