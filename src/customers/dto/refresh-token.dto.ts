import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token received from login / register / previous refresh' })
  @IsString()
  refreshToken!: string;
}
