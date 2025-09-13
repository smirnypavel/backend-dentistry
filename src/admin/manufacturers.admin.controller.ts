import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Manufacturer, ManufacturerDocument } from '../catalog/manufacturers/manufacturer.schema';
import { AdminGuard } from './admin.guard';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

class CreateManufacturerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

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
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateManufacturerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

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
  @IsString()
  description?: string;

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
    return this.model.find().sort({ name: 1 }).lean();
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
