import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Country, CountryDocument } from '../catalog/countries/country.schema';
import { AdminGuard } from './admin.guard';

class CreateCountryDto {
  code!: string;
  name!: string;
  slug!: string;
  isActive?: boolean;
}

class UpdateCountryDto {
  code?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
}

@ApiTags('admin:countries')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
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
