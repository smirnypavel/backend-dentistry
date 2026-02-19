import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const trimLower = (value: unknown): string | undefined => {
  const trimmed = trim(value);
  return trimmed ? trimmed.toLowerCase() : undefined;
};

export class UpdateProfileDto {
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Transform(({ value }) => trimLower(value))
  @IsOptional()
  @IsEmail()
  email?: string;
}
