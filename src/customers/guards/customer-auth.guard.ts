import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CustomerAuthService } from '../customer-auth.service';
import { CustomerDocument } from '../customer.schema';

export interface CustomerRequest extends Request {
  customer?: CustomerDocument;
  bearerToken?: string;
}

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly authService: CustomerAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Отсутствует токен авторизации');
    }

    const customer = await this.authService.verifyAccessToken(token);
    request.customer = customer;
    request.bearerToken = token;

    return true;
  }

  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) {
      return null;
    }

    const [type, token] = header.trim().split(' ');
    if (!token || type.toLowerCase() !== 'bearer') {
      return null;
    }

    return token;
  }
}
