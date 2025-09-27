import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Manufacturer, ManufacturerDocument } from '../catalog/manufacturers/manufacturer.schema';
import { AdminGuard } from './admin.guard';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class I18nNameCreateDto {
  @IsString()
  uk!: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class I18nNameUpdateDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class I18nDescDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class CreateManufacturerDto {
  @ValidateNested()
  @Type(() => I18nNameCreateDto)
  nameI18n!: I18nNameCreateDto;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  slug!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countryIds?: string[];

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDescDto)
  descriptionI18n?: I18nDescDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateManufacturerDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nNameUpdateDto)
  nameI18n?: I18nNameUpdateDto;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countryIds?: string[];

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDescDto)
  descriptionI18n?: I18nDescDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('admin:manufacturers')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/manufacturers')
export class AdminManufacturersController {
  constructor(
    @InjectModel(Manufacturer.name) private readonly model: Model<ManufacturerDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List manufacturers' })
  findAll() {
    return this.model.find().sort({ 'nameI18n.uk': 1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manufacturer by id' })
  findOne(@Param('id') id: string) {
    return this.model.findById(id).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create manufacturer' })
  create(@Body() dto: CreateManufacturerDto) {
    const countryIds = (dto.countryIds ?? []).map((id) => new Types.ObjectId(id));
    return this.model.create({ ...dto, countryIds });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update manufacturer' })
  update(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.countryIds) patch.countryIds = dto.countryIds.map((id) => new Types.ObjectId(id));
    return this.model.findByIdAndUpdate(new Types.ObjectId(id), patch, { new: true }).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete manufacturer' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
