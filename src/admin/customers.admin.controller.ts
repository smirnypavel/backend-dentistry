import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiExtraModels,
  ApiOperation,
  ApiSecurity,
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../customers/customer.schema';
import { Order, OrderDocument } from '../orders/order.schema';
import { AdminGuard } from './admin.guard';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/* ---------- Query DTO ---------- */

class AdminListCustomersQueryDto {
  @ApiPropertyOptional({ description: 'Search by phone, name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort, e.g. -createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;
}

class AdminListCustomerOrdersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}

/* ---------- Helpers ---------- */

function parseSort(sort?: string): Record<string, 1 | -1> | undefined {
  if (!sort) return undefined;
  const result: Record<string, 1 | -1> = {};
  for (const part of sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (part.startsWith('-')) result[part.slice(1)] = -1;
    else result[part] = 1;
  }
  return Object.keys(result).length ? result : undefined;
}

/* ---------- Controller ---------- */

@ApiTags('admin:customers')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@ApiExtraModels(AdminListCustomersQueryDto)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  /* ---- List customers (paginated, searchable) ---- */
  @Get()
  @ApiOperation({ summary: 'List customers (paginated)' })
  @ApiOkResponse({
    description: 'Paginated customers list',
    schema: {
      example: {
        items: [
          {
            _id: '666600000000000000000001',
            phone: '+380971112233',
            name: 'Ivan',
            email: 'ivan@example.com',
            ordersCount: 3,
            ordersTotal: 2100,
            lastLoginAt: '2025-09-10T12:00:00.000Z',
            createdAt: '2025-09-10T12:00:00.000Z',
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      },
    },
  })
  async list(@Query() query: AdminListCustomersQueryDto) {
    const { search, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { phone: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sortSpec = parseSort(query.sort) ?? { createdAt: -1 };
    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .select('-passwordHash -metadata -__v')
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.customerModel.countDocuments(filter),
    ]);

    // Enrich with order stats
    const customerIds = items.map((c) => c._id);
    const orderStats = await this.orderModel.aggregate<{
      _id: Types.ObjectId;
      ordersCount: number;
      ordersTotal: number;
    }>([
      { $match: { customerId: { $in: customerIds } } },
      {
        $group: {
          _id: '$customerId',
          ordersCount: { $sum: 1 },
          ordersTotal: { $sum: '$total' },
        },
      },
    ]);

    const statsMap = new Map(orderStats.map((s) => [String(s._id), s]));
    const enriched = items.map((c) => {
      const stats = statsMap.get(String(c._id));
      return {
        ...c,
        ordersCount: stats?.ordersCount ?? 0,
        ordersTotal: stats?.ordersTotal ?? 0,
      };
    });

    return { items: enriched, page, limit, total };
  }

  /* ---- Get single customer ---- */
  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiOkResponse({ description: 'Customer document with order stats' })
  async getById(@Param('id') id: string) {
    const customer = await this.customerModel
      .findById(new Types.ObjectId(id))
      .select('-passwordHash -metadata -__v')
      .lean();

    if (!customer) return null;

    const orderStats = await this.orderModel.aggregate<{
      ordersCount: number;
      ordersTotal: number;
    }>([
      { $match: { customerId: customer._id } },
      {
        $group: {
          _id: null,
          ordersCount: { $sum: 1 },
          ordersTotal: { $sum: '$total' },
        },
      },
    ]);

    return {
      ...customer,
      ordersCount: orderStats[0]?.ordersCount ?? 0,
      ordersTotal: orderStats[0]?.ordersTotal ?? 0,
    };
  }

  /* ---- Get customer orders ---- */
  @Get(':id/orders')
  @ApiOperation({ summary: 'List orders for a customer' })
  @ApiOkResponse({ description: 'Paginated orders for customer' })
  async getCustomerOrders(
    @Param('id') id: string,
    @Query() query: AdminListCustomerOrdersQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    const customerId = new Types.ObjectId(id);

    const filter = { customerId };
    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  }
}
