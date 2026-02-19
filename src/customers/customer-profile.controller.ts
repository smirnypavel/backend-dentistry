import { Body, ConflictException, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { CustomerDocument } from './customer.schema';
import { CustomerDto, toCustomerDto } from './dto/customer.dto';
import { CustomerOrdersQueryDto } from './dto/customer-orders-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CustomerOrdersPageDto } from './dto/swagger-responses.dto';
import { CustomerOrdersPage, OrdersService } from '../orders/orders.service';
import { CustomersService } from './customers.service';

@ApiTags('customer / profile')
@ApiBearerAuth('customer-bearer')
@Controller('me')
@UseGuards(CustomerAuthGuard)
export class CustomerProfileController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Отримати профіль поточного покупця' })
  @ApiOkResponse({ type: CustomerDto, description: 'Дані покупця' })
  @ApiUnauthorizedResponse({ description: 'Токен відсутній або недійсний' })
  me(@CurrentCustomer() customer: CustomerDocument): CustomerDto {
    return toCustomerDto(customer);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Історія замовлень покупця (пагінація)' })
  @ApiOkResponse({ type: CustomerOrdersPageDto, description: 'Список замовлень { items, page, limit, total, hasNextPage }' })
  @ApiUnauthorizedResponse({ description: 'Токен відсутній або недійсний' })
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
  @ApiOperation({ summary: 'Оновити профіль (name, email)' })
  @ApiOkResponse({ type: CustomerDto, description: 'Оновлені дані покупця' })
  @ApiConflictResponse({ description: 'Email вже зайнятий іншим користувачем' })
  @ApiUnauthorizedResponse({ description: 'Токен відсутній або недійсний' })
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
