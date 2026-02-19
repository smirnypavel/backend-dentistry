import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const trimLower = (value: unknown): string | undefined => {
  const trimmed = trim(value);
  return trimmed ? trimmed.toLowerCase() : undefined;
};

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Іван Петрович', maxLength: 120 })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @Transform(({ value }) => trimLower(value))
  @IsOptional()
  @IsEmail()
  email?: string;
}
