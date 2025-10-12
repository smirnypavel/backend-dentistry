import { CustomerAuthTokens } from '../customer-auth.service';
import { CustomerDto } from './customer.dto';

export interface VerifyOtpResponseDto {
  tokens: CustomerAuthTokens;
  customer: CustomerDto;
}
