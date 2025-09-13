import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiExtraModels,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../orders/order.schema';
import { AdminGuard } from './admin.guard';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

function normalizePhone(input: unknown): string {
  const s = String(input ?? '')
    .replace(/\s|\(|\)|-/g, '')
    .replace(/^00/, '+');
  if (s.startsWith('+')) return s;
  const digits = s.replace(/[^0-9]/g, '');
  return digits ? `+${digits}` : '';
}

class AdminListOrdersQueryDto {
  @ApiPropertyOptional({ enum: ['new', 'processing', 'done', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Phone (normalized E.164)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizePhone(value))
  phone?: string;

  @ApiPropertyOptional({ description: 'Frontend client identifier' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ISO date string (inclusive lower bound)' })
  @IsOptional()
  @IsString()
  createdFrom?: string; // ISO date string

  @ApiPropertyOptional({ description: 'ISO date string (inclusive upper bound)' })
  @IsOptional()
  @IsString()
  createdTo?: string; // ISO date string

  @ApiPropertyOptional({ description: 'Sort, e.g. -createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;

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

class UpdateOrderStatusDto {
  @IsIn(['new', 'processing', 'done', 'cancelled'])
  status!: OrderStatus;
}

@ApiTags('admin:orders')
@ApiSecurity('x-api-key')
@UseGuards(AdminGuard)
@ApiExtraModels(AdminListOrdersQueryDto)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(@InjectModel(Order.name) private readonly model: Model<OrderDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List orders (paginated)' })
  @ApiOkResponse({
    description: 'Paginated orders list',
    schema: {
      example: {
        items: [
          {
            _id: '666600000000000000000001',
            phone: '+380971112233',
            clientId: 'abc-123',
            itemsTotal: 700,
            deliveryFee: 0,
            total: 700,
            status: 'new',
            createdAt: '2025-09-10T12:00:00.000Z',
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      },
    },
  })
  async list(@Query() query: AdminListOrdersQueryDto) {
    const { status, phone, clientId, createdFrom, createdTo, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (phone) filter.phone = phone;
    if (clientId) filter.clientId = clientId;
    if (createdFrom || createdTo) {
      filter.createdAt = {} as Record<string, Date>;
      if (createdFrom) (filter.createdAt as Record<string, Date>).$gte = new Date(createdFrom);
      if (createdTo) (filter.createdAt as Record<string, Date>).$lte = new Date(createdTo);
    }
    const sortSpec = parseSort(query.sort) ?? { createdAt: -1 };
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, page, limit, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiOkResponse({
    description: 'Order document',
    schema: {
      example: {
        _id: '666600000000000000000001',
        phone: '+380971112233',
        clientId: 'abc-123',
        items: [
          {
            productId: '665f1a2b3c4d5e6f7a8b9c0d',
            sku: 'UC-1',
            quantity: 2,
            price: 350,
            title: 'Композит универсальный',
            options: { shade: 'A2' },
            manufacturerId: '665f00000000000000001001',
            countryId: '665f00000000000000002001',
            unit: 'шт',
          },
        ],
        itemsTotal: 700,
        deliveryFee: 0,
        total: 700,
        status: 'new',
        name: 'Иван',
        comment: 'Позвоните перед доставкой',
        createdAt: '2025-09-10T12:00:00.000Z',
        updatedAt: '2025-09-10T12:00:00.000Z',
      },
    },
  })
  get(@Param('id') id: string) {
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiOkResponse({ description: 'Updated order with new status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.model
      .findByIdAndUpdate(new Types.ObjectId(id), { status: dto.status }, { new: true })
      .lean();
  }
}
