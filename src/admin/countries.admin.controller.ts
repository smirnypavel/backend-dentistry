import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Country, CountryDocument } from '../catalog/countries/country.schema';
import { AdminGuard } from './admin.guard';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

class CreateCountryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(3)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  slug!: string;

  @IsOptional()
  @IsString()
  flagUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(3)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  slug?: string;

  @IsOptional()
  @IsString()
  flagUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('admin:countries')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/countries')
export class AdminCountriesController {
  constructor(@InjectModel(Country.name) private readonly model: Model<CountryDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List countries' })
  findAll() {
    return this.model.find().sort({ name: 1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by id' })
  findOne(@Param('id') id: string) {
    return this.model.findById(id).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create country' })
  create(@Body() dto: CreateCountryDto) {
    return this.model.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update country' })
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.model.findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true }).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete country' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
