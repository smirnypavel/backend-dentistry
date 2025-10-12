import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CustomerDocument } from '../customer.schema';
import { CustomerRequest } from '../guards/customer-auth.guard';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CustomerDocument => {
    const request = ctx.switchToHttp().getRequest<CustomerRequest>();

    if (!request.customer) {
      throw new UnauthorizedException('Не авторизован');
    }

    return request.customer;
  },
);
