import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('catalog')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active categories' })
  @ApiOkResponse({
    description: 'Array of categories',
    schema: {
      example: [
        {
          _id: '665f00000000000000000001',
          slug: 'materials',
          nameI18n: { uk: 'Матеріали', en: 'Materials' },
          descriptionI18n: { uk: 'Витратні матеріали', en: 'Consumables' },
          sort: 1,
          isActive: true,
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-09-10T12:00:00.000Z',
        },
        {
          _id: '665f00000000000000000002',
          slug: 'tools',
          nameI18n: { uk: 'Інструменти', en: 'Tools' },
          descriptionI18n: { uk: 'Інструменти та пристосування', en: 'Tools and accessories' },
          sort: 2,
          isActive: true,
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-09-10T12:00:00.000Z',
        },
      ],
    },
  })
  getAll() {
    return this.service.findAllActive();
  }
}
