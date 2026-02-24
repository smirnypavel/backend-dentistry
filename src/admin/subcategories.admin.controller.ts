import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Subcategory, SubcategoryDocument } from '../catalog/subcategories/subcategory.schema';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from '../catalog/subcategories/dto';
import { AdminGuard } from './admin.guard';

@ApiTags('admin:subcategories')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/subcategories')
export class AdminSubcategoriesController {
  constructor(@InjectModel(Subcategory.name) private readonly model: Model<SubcategoryDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List subcategories' })
  findAll() {
    return this.model.find().sort({ sort: 1, 'nameI18n.uk': 1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subcategory by id' })
  findOne(@Param('id') id: string) {
    return this.model.findById(id).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create subcategory' })
  create(@Body() dto: CreateSubcategoryDto) {
    const data = {
      ...dto,
      categoryId: new Types.ObjectId(dto.categoryId),
    };
    return this.model.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subcategory' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.categoryId) patch.categoryId = new Types.ObjectId(dto.categoryId);
    return this.model.findByIdAndUpdate(new Types.ObjectId(id), patch, { new: true }).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subcategory' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
