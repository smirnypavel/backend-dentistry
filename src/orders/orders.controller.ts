import { Body, Controller, Get, Post, Query, Headers, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, GetHistoryQueryDto } from './dto';
import { Request } from 'express';
import { CustomerAuthService } from '../customers/customer-auth.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly customerAuthService: CustomerAuthService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать заказ' })
  @Throttle({
    orders: {
      // Lenient defaults in dev (see AppModule throttlers 'orders')
      limit: Number(
        process.env.ORDERS_RATE_LIMIT ?? (process.env.NODE_ENV === 'production' ? 5 : 1000),
      ),
      ttl:
        Number(
          process.env.ORDERS_RATE_TTL_SEC ?? (process.env.NODE_ENV === 'production' ? 60 : 1),
        ) * 1000,
    },
  })
  @ApiBody({
    description: 'Тело запроса для создания заказа',
    schema: {
      example: {
        phone: '+380501234567',
        clientId: 'web-abc-123',
        items: [
          {
            productId: '665f1a2b3c4d5e6f7a8b9c0d',
            sku: 'UC-1',
            quantity: 2,
            price: 350,
            title: 'Композит универсальный',
            options: { shade: 'A2', size: '2g' },
            manufacturerId: '665f00000000000000001001',
            countryId: '665f00000000000000002001',
            unit: 'шт',
          },
        ],
        deliveryFee: 60,
        name: 'Иван',
        comment: 'Позвоните перед доставкой',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Созданный заказ',
    schema: {
      example: {
        _id: '666000000000000000000001',
        phone: '+380501234567',
        clientId: 'web-abc-123',
        items: [
          {
            productId: '665f1a2b3c4d5e6f7a8b9c0d',
            sku: 'UC-1',
            quantity: 2,
            price: 350,
            title: 'Композит универсальный',
            options: { shade: 'A2', size: '2g' },
            manufacturerId: '665f00000000000000001001',
            countryId: '665f00000000000000002001',
            unit: 'шт',
          },
        ],
        itemsTotal: 700,
        deliveryFee: 60,
        total: 760,
        status: 'new',
        name: 'Иван',
        comment: 'Позвоните перед доставкой',
        createdAt: '2025-09-13T12:00:00.000Z',
        updatedAt: '2025-09-13T12:00:00.000Z',
      },
    },
  })
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('x-idempotency-key') idemKey?: string,
    @Req() request?: Request,
  ) {
    const customerId = await this.resolveCustomerId(request?.headers.authorization);
    return this.service.create(dto, idemKey, { customerId });
  }

  @Get('history')
  @ApiOperation({ summary: 'История заказов пользователя (phone + clientId)' })
  @ApiOkResponse({
    description: 'Список заказов',
    schema: {
      example: [
        {
          _id: '666000000000000000000001',
          phone: '+380501234567',
          clientId: 'web-abc-123',
          items: [
            {
              productId: '665f1a2b3c4d5e6f7a8b9c0d',
              sku: 'UC-1',
              quantity: 2,
              price: 350,
              title: 'Композит универсальный',
              options: { shade: 'A2', size: '2g' },
              manufacturerId: '665f00000000000000001001',
              countryId: '665f00000000000000002001',
              unit: 'шт',
            },
          ],
          itemsTotal: 700,
          deliveryFee: 60,
          total: 760,
          status: 'new',
          name: 'Иван',
          comment: 'Позвоните перед доставкой',
          createdAt: '2025-09-13T12:00:00.000Z',
          updatedAt: '2025-09-13T12:00:00.000Z',
        },
      ],
    },
  })
  history(@Query() query: GetHistoryQueryDto) {
    return this.service.history(query.phone, query.clientId);
  }

  private async resolveCustomerId(authorization?: string | null): Promise<string | undefined> {
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    if (!token || type.toLowerCase() !== 'bearer') {
      return undefined;
    }

    const customer = await this.customerAuthService.verifyAccessToken(token);
    return customer._id.toString();
  }
}
