import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

const trim = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

export class LoginPasswordDto {
  @ApiProperty({ example: 'ivan@example.com', description: 'Email or phone' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : String(value),
  )
  @IsString()
  @Length(3, 120)
  login!: string; // email or phone

  @ApiProperty({ example: 'mypassword123', minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Frontend session ID' })
  @Transform(({ value }) => trim(value))
  @IsString()
  @Length(1, 64)
  clientId!: string;
}
