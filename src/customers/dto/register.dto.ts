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
  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(5, 32)
  phone!: string;

  @Transform(({ value }) => trimLower(value))
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(1, 64)
  clientId!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
