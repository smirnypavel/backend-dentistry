import { Body, ConflictException, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { CustomerDocument } from './customer.schema';
import { CustomerDto, toCustomerDto } from './dto/customer.dto';
import { CustomerOrdersQueryDto } from './dto/customer-orders-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CustomerOrdersPage, OrdersService } from '../orders/orders.service';
import { CustomersService } from './customers.service';

@Controller('me')
@UseGuards(CustomerAuthGuard)
export class CustomerProfileController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  me(@CurrentCustomer() customer: CustomerDocument): CustomerDto {
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

  @Patch()
  async updateProfile(
    @CurrentCustomer() customer: CustomerDocument,
    @Body() dto: UpdateProfileDto,
  ): Promise<CustomerDto> {
    // Check e-mail uniqueness when changing
    if (dto.email && dto.email !== customer.email) {
      const existing = await this.customersService.findByEmail(dto.email);
      if (existing && existing._id.toString() !== customer._id.toString()) {
        throw new ConflictException('Email вже зайнятий');
      }
    }

    const updated = await this.customersService.updateProfile(customer._id, {
      name: dto.name,
      email: dto.email,
    });

    return toCustomerDto(updated);
  }
}
