import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : String(value),
  )
  @IsEmail()
  email!: string;
}
