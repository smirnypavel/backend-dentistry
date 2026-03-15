import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { AdminGuard } from './admin.guard';
import { PromoCode, PromoCodeDocument } from '../promo-codes/promo-code.schema';
import { Order, OrderDocument } from '../orders/order.schema';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreatePromoCodeDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['percent', 'fixed'] })
  @IsEnum(['percent', 'fixed'])
  type!: 'percent' | 'fixed';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number | null;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allowedProductIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allowedCategoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  excludedProductIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  excludedCategoryIds?: string[];
}

class UpdatePromoCodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['percent', 'fixed'] })
  @IsOptional()
  @IsEnum(['percent', 'fixed'])
  type?: 'percent' | 'fixed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number | null;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allowedProductIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allowedCategoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  excludedProductIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  excludedCategoryIds?: string[];
}

class ListPromoCodesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

function toIds(list?: string[]) {
  return (list ?? []).filter(Boolean).map((s) => new Types.ObjectId(s));
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

@ApiTags('admin:promo-codes')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@Controller('admin/promo-codes')
export class AdminPromoCodesController {
  constructor(
    @InjectModel(PromoCode.name) private readonly model: Model<PromoCodeDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List promo codes' })
  async list(@Query() query: ListPromoCodesQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
    const filter: Record<string, unknown> = {};
    if (query.q) {
      filter.$or = [
        { code: { $regex: query.q, $options: 'i' } },
        { name: { $regex: query.q, $options: 'i' } },
      ];
    }
    if (typeof query.isActive === 'boolean') filter.isActive = query.isActive;
    const sortSpec = parseSort(query.sort) ?? { createdAt: -1 };
    const [items, total] = await Promise.all([
      this.model
        .find(filter as never)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter as never),
    ]);
    return { items, page, limit, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo code by id' })
  findOne(@Param('id') id: string) {
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get promo code usage statistics' })
  async stats(@Param('id') id: string) {
    const promo = await this.model.findById(new Types.ObjectId(id)).lean();
    if (!promo) return null;

    // Find orders that used this promo code
    const orders = await this.orderModel
      .find({ promoCode: promo.code })
      .sort({ createdAt: -1 })
      .limit(100)
      .select({ _id: 1, phone: 1, total: 1, promoCodeDiscount: 1, createdAt: 1, status: 1 })
      .lean();

    const totalDiscount = orders.reduce(
      (sum, o) => sum + (((o as Record<string, unknown>).promoCodeDiscount as number) ?? 0),
      0,
    );

    return {
      promoCode: promo,
      usageCount: promo.usageCount,
      usageLimit: promo.usageLimit,
      orders,
      totalDiscount: Number(totalDiscount.toFixed(2)),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create promo code' })
  @ApiBody({ type: CreatePromoCodeDto })
  async create(@Body() dto: CreatePromoCodeDto) {
    const doc = await this.model.create({
      code: (dto.code || '').trim().toUpperCase(),
      name: dto.name,
      description: dto.description,
      type: dto.type,
      value: dto.value,
      isActive: dto.isActive ?? true,
      usageLimit: dto.usageLimit ?? null,
      usageCount: 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      allowedProductIds: toIds(dto.allowedProductIds),
      allowedCategoryIds: toIds(dto.allowedCategoryIds),
      excludedProductIds: toIds(dto.excludedProductIds),
      excludedCategoryIds: toIds(dto.excludedCategoryIds),
    });
    return doc.toObject();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update promo code' })
  @ApiBody({ type: UpdatePromoCodeDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    const patch: Record<string, unknown> = {};
    if (dto.code !== undefined) patch.code = (dto.code || '').trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.value !== undefined) patch.value = dto.value;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    if (dto.usageLimit !== undefined) patch.usageLimit = dto.usageLimit;
    if (dto.startsAt !== undefined)
      patch.startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
    if (dto.endsAt !== undefined) patch.endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    if (dto.allowedProductIds !== undefined) patch.allowedProductIds = toIds(dto.allowedProductIds);
    if (dto.allowedCategoryIds !== undefined)
      patch.allowedCategoryIds = toIds(dto.allowedCategoryIds);
    if (dto.excludedProductIds !== undefined)
      patch.excludedProductIds = toIds(dto.excludedProductIds);
    if (dto.excludedCategoryIds !== undefined)
      patch.excludedCategoryIds = toIds(dto.excludedCategoryIds);

    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: patch });
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete promo code' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
