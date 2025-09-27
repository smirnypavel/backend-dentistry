import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ManufacturersService } from './manufacturers.service';

@ApiTags('catalog')
@Controller('manufacturers')
export class ManufacturersController {
  constructor(private readonly service: ManufacturersService) {}

  @Get()
  @ApiOperation({ summary: 'Get active manufacturers' })
  @ApiOkResponse({
    description: 'Array of manufacturers',
    schema: {
      example: [
        {
          _id: '665f00000000000000001001',
          nameI18n: { uk: 'Dent UA', en: 'Dent UA' },
          slug: 'dent-ua',
          countryIds: ['665f00000000000000002001'],
          isActive: true,
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-09-10T12:00:00.000Z',
        },
        {
          _id: '665f00000000000000001002',
          nameI18n: { uk: 'Stoma PL', en: 'Stoma PL' },
          slug: 'stoma-pl',
          countryIds: ['665f00000000000000002002'],
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
