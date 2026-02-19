import { Transform } from 'class-transformer';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

export class LoginPasswordDto {
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : String(value),
  )
  @IsString()
  @Length(3, 120)
  login!: string; // email or phone

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(1, 64)
  clientId!: string;
}
