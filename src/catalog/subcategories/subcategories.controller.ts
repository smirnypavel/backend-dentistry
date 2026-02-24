import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SubcategoriesService } from './subcategories.service';

@ApiTags('catalog')
@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly service: SubcategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active subcategories, optionally filtered by category' })
  @ApiQuery({ name: 'category', required: false, description: 'Category ID to filter by' })
  @ApiOkResponse({
    description: 'Array of subcategories',
    schema: {
      example: [
        {
          _id: '665f00000000000000003001',
          slug: 'composites',
          nameI18n: { uk: 'Композити', en: 'Composites' },
          descriptionI18n: { uk: 'Фотополімерні композити' },
          categoryId: '665f00000000000000000001',
          sort: 1,
          isActive: true,
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-09-10T12:00:00.000Z',
        },
      ],
    },
  })
  getAll(@Query('category') category?: string) {
    if (category) {
      return this.service.findByCategoryId(category);
    }
    return this.service.findAllActive();
  }
}
