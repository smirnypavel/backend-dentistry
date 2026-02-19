import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ivan@example.com' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : String(value),
  )
  @IsEmail()
  email!: string;
}
