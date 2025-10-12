import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { CustomerDocument } from './customer.schema';
import { toCustomerDto } from './dto/customer.dto';
import { CustomerOrdersQueryDto } from './dto/customer-orders-query.dto';
import { CustomerOrdersPage, OrdersService } from '../orders/orders.service';

@Controller('me')
@UseGuards(CustomerAuthGuard)
export class CustomerProfileController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  me(@CurrentCustomer() customer: CustomerDocument) {
    return toCustomerDto(customer);
  }

  @Get('orders')
  async orders(
    @CurrentCustomer() customer: CustomerDocument,
    @Query() query: CustomerOrdersQueryDto,
  ): Promise<CustomerOrdersPage> {
    return this.ordersService.listCustomerOrders(customer._id, {
      page: query.page,
      limit: query.limit,
    });
  }
}
