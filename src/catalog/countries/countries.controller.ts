import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';

@ApiTags('catalog')
@Controller('countries')
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active countries' })
  @ApiOkResponse({
    description: 'Array of countries',
    schema: {
      example: [
        {
          _id: '665f00000000000000002001',
          code: 'UA',
          name: 'Украина',
          slug: 'ua',
          isActive: true,
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-09-10T12:00:00.000Z',
        },
        {
          _id: '665f00000000000000002002',
          code: 'PL',
          name: 'Польша',
          slug: 'pl',
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
