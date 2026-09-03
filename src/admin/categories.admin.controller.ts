import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../catalog/categories/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../catalog/categories/dto';
import { AdminGuard } from './admin.guard';

@ApiTags('admin:categories')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(@InjectModel(Category.name) private readonly model: Model<CategoryDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List categories' })
  findAll() {
    return this.model.find().sort({ sort: 1, 'nameI18n.uk': 1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  findOne(@Param('id') id: string) {
    return this.model.findById(id).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  create(@Body() dto: CreateCategoryDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.relatedProductIds !== undefined)
      data.relatedProductIds = (dto.relatedProductIds ?? []).map(
        (id) => new Types.ObjectId(id),
      );
    return this.model.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.relatedProductIds !== undefined)
      patch.relatedProductIds = (dto.relatedProductIds ?? []).map(
        (rid) => new Types.ObjectId(rid),
      );
    return this.model.findByIdAndUpdate(new Types.ObjectId(id), patch, { new: true }).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
