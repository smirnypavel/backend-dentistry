import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { AdminGuard } from './admin.guard';
import {
  PromoSlide,
  PromoSlideDocument,
} from '../company/promo-slides/promo-slide.schema';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/* ── DTOs ── */

class PromoSlideFeatureDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  href?: string;
}

class CreatePromoSlideDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  oldPrice?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromoSlideFeatureDto)
  features?: PromoSlideFeatureDto[];

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

class UpdatePromoSlideDto extends CreatePromoSlideDto {
  @IsOptional()
  @IsString()
  override title!: string;
}

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

/* ── Controller ── */

@ApiTags('admin:promo-slides')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/promo-slides')
export class AdminPromoSlidesController {
  constructor(
    @InjectModel(PromoSlide.name)
    private readonly model: Model<PromoSlideDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all promo slides (sorted)' })
  @ApiOkResponse({ description: 'Array of promo slides' })
  async list() {
    return this.model.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo slide by id' })
  @ApiOkResponse({ description: 'Promo slide or null' })
  async getById(@Param('id') id: string) {
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create promo slide' })
  @ApiOkResponse({ description: 'Created promo slide' })
  async create(@Body() dto: CreatePromoSlideDto) {
    // Auto-assign sortOrder to end if not specified
    if (dto.sortOrder == null) {
      const last = await this.model
        .findOne()
        .sort({ sortOrder: -1 })
        .lean();
      dto.sortOrder = last ? (last.sortOrder ?? 0) + 1 : 0;
    }
    return this.model.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      oldPrice: dto.oldPrice,
      badge: dto.badge,
      imageUrl: dto.imageUrl,
      color: dto.color ?? 'from-yellow-300 to-yellow-400',
      features: dto.features ?? [],
      linkUrl: dto.linkUrl,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive ?? true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update promo slide' })
  @ApiOkResponse({ description: 'Updated promo slide or null' })
  async update(@Param('id') id: string, @Body() dto: UpdatePromoSlideDto) {
    return this.model
      .findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true })
      .lean();
  }

  @Patch('reorder/bulk')
  @ApiOperation({ summary: 'Reorder promo slides by id array' })
  @ApiOkResponse({ description: 'ok' })
  async reorder(@Body() dto: ReorderDto) {
    const ops = dto.ids.map((idStr, i) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(idStr) },
        update: { $set: { sortOrder: i } },
      },
    }));
    await this.model.bulkWrite(ops);
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete promo slide' })
  @ApiOkResponse({ description: 'Deleted promo slide or null' })
  async remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
