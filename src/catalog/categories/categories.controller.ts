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
          name: 'Материалы',
          description: 'Расходные материалы',
          sort: 1,
          isActive: true,
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-09-10T12:00:00.000Z',
        },
        {
          _id: '665f00000000000000000002',
          slug: 'tools',
          name: 'Инструменты',
          description: 'Инструменты и приспособления',
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
