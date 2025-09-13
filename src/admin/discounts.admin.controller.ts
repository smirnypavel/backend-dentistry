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
import { Discount, DiscountDocument } from '../discounts/discount.schema';
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

class CreateDiscountDto {
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

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: 'Higher runs later or wins (non-stackable)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  productIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  manufacturerIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  countryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

class UpdateDiscountDto extends CreateDiscountDto {}

class ListDiscountsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by active state' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort expression, e.g. -createdAt,name' })
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

// DTO for bulk targets operations
class ApplyDiscountTargetsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  productIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  manufacturerIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  countryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

@ApiTags('admin:discounts')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@Controller('admin/discounts')
export class AdminDiscountsController {
  constructor(@InjectModel(Discount.name) private readonly model: Model<DiscountDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List discounts' })
  async list(@Query() query: ListDiscountsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
    const filter: Partial<Record<keyof Discount, unknown>> = {};
    if (query.q) filter.name = { $regex: query.q, $options: 'i' } as unknown as Discount['name'];
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
  @ApiOperation({ summary: 'Get discount by id' })
  findOne(@Param('id') id: string) {
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create discount' })
  @ApiBody({ type: CreateDiscountDto })
  async create(@Body() dto: CreateDiscountDto) {
    const doc = await this.model.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      value: dto.value,
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      priority: dto.priority ?? 0,
      stackable: dto.stackable ?? false,
      productIds: toIds(dto.productIds),
      categoryIds: toIds(dto.categoryIds),
      manufacturerIds: toIds(dto.manufacturerIds),
      countryIds: toIds(dto.countryIds),
      tags: dto.tags ?? [],
    });
    return doc.toObject();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update discount' })
  @ApiBody({ type: UpdateDiscountDto })
  async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    const patch: Partial<Discount> & Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.type !== undefined) patch.type = dto.type as Discount['type'];
    if (dto.value !== undefined) patch.value = dto.value;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    if (dto.startsAt !== undefined)
      patch.startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
    if (dto.endsAt !== undefined) patch.endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.stackable !== undefined) patch.stackable = dto.stackable;
    if (dto.productIds !== undefined) patch.productIds = toIds(dto.productIds);
    if (dto.categoryIds !== undefined) patch.categoryIds = toIds(dto.categoryIds);
    if (dto.manufacturerIds !== undefined) patch.manufacturerIds = toIds(dto.manufacturerIds);
    if (dto.countryIds !== undefined) patch.countryIds = toIds(dto.countryIds);
    if (dto.tags !== undefined) patch.tags = dto.tags ?? [];
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: patch });
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Patch(':id/targets')
  @ApiOperation({
    summary: 'Bulk add discount targets (products/categories/manufacturers/countries/tags)',
  })
  @ApiBody({ type: ApplyDiscountTargetsDto })
  async addTargets(@Param('id') id: string, @Body() dto: ApplyDiscountTargetsDto) {
    const addToSet: Record<string, unknown> = {};
    if (dto.productIds?.length) addToSet.productIds = { $each: toIds(dto.productIds) };
    if (dto.categoryIds?.length) addToSet.categoryIds = { $each: toIds(dto.categoryIds) };
    if (dto.manufacturerIds?.length)
      addToSet.manufacturerIds = { $each: toIds(dto.manufacturerIds) };
    if (dto.countryIds?.length) addToSet.countryIds = { $each: toIds(dto.countryIds) };
    if (dto.tags?.length) addToSet.tags = { $each: (dto.tags ?? []).filter(Boolean) };

    if (Object.keys(addToSet).length) {
      await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $addToSet: addToSet });
    }
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Patch(':id/targets/remove')
  @ApiOperation({
    summary: 'Bulk remove discount targets (products/categories/manufacturers/countries/tags)',
  })
  @ApiBody({ type: ApplyDiscountTargetsDto })
  async removeTargets(@Param('id') id: string, @Body() dto: ApplyDiscountTargetsDto) {
    const pulls: Record<string, unknown> = {};
    if (dto.productIds?.length) pulls.productIds = { $in: toIds(dto.productIds) };
    if (dto.categoryIds?.length) pulls.categoryIds = { $in: toIds(dto.categoryIds) };
    if (dto.manufacturerIds?.length) pulls.manufacturerIds = { $in: toIds(dto.manufacturerIds) };
    if (dto.countryIds?.length) pulls.countryIds = { $in: toIds(dto.countryIds) };
    if (dto.tags?.length) pulls.tags = { $in: (dto.tags ?? []).filter(Boolean) };

    const update: Record<string, unknown> = {};
    for (const [field, condition] of Object.entries(pulls)) {
      update[`$pull`] = { ...(update[`$pull`] as Record<string, unknown>), [field]: condition };
    }
    if (Object.keys(update).length) {
      await this.model.updateOne({ _id: new Types.ObjectId(id) }, update);
    }
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete discount' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
