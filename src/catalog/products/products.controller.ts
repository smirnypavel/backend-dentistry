import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { FindProductsQueryDto } from './dto';

@ApiTags('catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  @ApiOkResponse({
    description: 'Paginated products list',
    schema: {
      example: {
        items: [
          {
            _id: '665f1a2b3c4d5e6f7a8b9c0d',
            slug: 'universal-composite',
            title: 'Композит универсальный',
            description: 'Универсальный светополимерный композит для пломбирования',
            categoryIds: ['665f00000000000000000001'],
            tags: ['popular', 'stock'],
            images: [],
            attributes: [{ key: 'purpose', value: 'restoration' }],
            variants: [
              {
                _id: '665f0000000000000000a001',
                sku: 'UC-1',
                manufacturerId: '665f00000000000000001001',
                countryId: '665f00000000000000002001',
                options: { shade: 'A2', size: '2g' },
                price: 350,
                unit: 'шт',
                images: [],
                barcode: '482000000001',
                isActive: true,
                variantKey: '665f00000000000000001001:665f00000000000000002001:shade=A2|size=2g',
              },
            ],
            manufacturerIds: ['665f00000000000000001001', '665f00000000000000001002'],
            countryIds: ['665f00000000000000002001', '665f00000000000000002002'],
            priceMin: 350,
            priceMax: 480,
            optionsSummary: { shade: ['A2', 'A3', 'B2'], size: ['2g', '4g'] },
            isActive: true,
            createdAt: '2025-09-10T12:00:00.000Z',
            updatedAt: '2025-09-10T12:00:00.000Z',
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      },
    },
  })
  getAll(@Query() query: FindProductsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get product by id or slug' })
  @ApiOkResponse({
    description: 'Product document',
    schema: {
      example: {
        _id: '665f1a2b3c4d5e6f7a8b9c0d',
        slug: 'universal-composite',
        title: 'Композит универсальный',
        description: 'Универсальный светополимерный композит для пломбирования',
        categoryIds: ['665f00000000000000000001'],
        tags: ['popular', 'stock'],
        images: [],
        attributes: [{ key: 'purpose', value: 'restoration' }],
        variants: [
          {
            _id: '665f0000000000000000a001',
            sku: 'UC-1',
            manufacturerId: '665f00000000000000001001',
            countryId: '665f00000000000000002001',
            options: { shade: 'A2', size: '2g' },
            price: 350,
            unit: 'шт',
            images: [],
            barcode: '482000000001',
            isActive: true,
            variantKey: '665f00000000000000001001:665f00000000000000002001:shade=A2|size=2g',
          },
          {
            _id: '665f0000000000000000a002',
            sku: 'UC-2',
            manufacturerId: '665f00000000000000001002',
            countryId: '665f00000000000000002002',
            options: { shade: 'A3', size: '4g' },
            price: 420,
            unit: 'шт',
            images: [],
            barcode: '590000000002',
            isActive: true,
            variantKey: '665f00000000000000001002:665f00000000000000002002:shade=A3|size=4g',
          },
          {
            _id: '665f0000000000000000a003',
            sku: 'UC-3',
            manufacturerId: '665f00000000000000001003',
            countryId: '665f00000000000000002003',
            options: { shade: 'B2', size: '4g' },
            price: 480,
            unit: 'шт',
            images: [],
            barcode: '400000000003',
            isActive: true,
            variantKey: '665f00000000000000001003:665f00000000000000002003:shade=B2|size=4g',
          },
        ],
        manufacturerIds: [
          '665f00000000000000001001',
          '665f00000000000000001002',
          '665f00000000000000001003',
        ],
        countryIds: [
          '665f00000000000000002001',
          '665f00000000000000002002',
          '665f00000000000000002003',
        ],
        priceMin: 350,
        priceMax: 480,
        optionsSummary: { shade: ['A2', 'A3', 'B2'], size: ['2g', '4g'] },
        isActive: true,
        createdAt: '2025-09-10T12:00:00.000Z',
        updatedAt: '2025-09-10T12:00:00.000Z',
      },
    },
  })
  getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.service.findOne(idOrSlug);
  }
}
