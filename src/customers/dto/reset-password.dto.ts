import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'JWT token from the password-reset email link' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'newStrongPassword456', minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword!: string;
}
