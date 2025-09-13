import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Manufacturer, ManufacturerDocument } from '../catalog/manufacturers/manufacturer.schema';
import { AdminGuard } from './admin.guard';

class CreateManufacturerDto {
  name!: string;
  slug!: string;
  countryIds?: string[];
  logoUrl?: string;
  bannerUrl?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
}

class UpdateManufacturerDto {
  name?: string;
  slug?: string;
  countryIds?: string[];
  logoUrl?: string;
  bannerUrl?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
}

@ApiTags('admin:manufacturers')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
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
