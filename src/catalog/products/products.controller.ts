import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { ProductsService } from './products.service';
import { FindProductsQueryDto } from './dto';
import { ReviewsService } from '../../reviews/reviews.service';

class CreateReviewDto {
  @IsString()
  @MaxLength(120)
  authorName!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  comment?: string;
}

@ApiTags('catalog')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly jwtService: JwtService,
  ) {}

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
            titleI18n: { uk: 'Композит универсальный', en: 'Universal composite' },
            descriptionI18n: {
              uk: 'Универсальный светополимерный композит для пломбирования',
              en: 'Universal light-cure composite for fillings',
            },
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
                priceOriginal: 350,
                priceFinal: 315,
                discountsApplied: [
                  {
                    discountId: '6677000000000000000000d1',
                    name: 'Осенняя распродажа',
                    type: 'percent',
                    value: 10,
                    priceBefore: 350,
                    priceAfter: 315,
                  },
                ],
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
            priceMinFinal: 315,
            priceMaxFinal: 432,
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
  @ApiOperation({ summary: 'Get product by id or slug' })  @ApiOkResponse({
    description: 'Product document',
    schema: {
      example: {
        _id: '665f1a2b3c4d5e6f7a8b9c0d',
        slug: 'universal-composite',
        titleI18n: { uk: 'Композит универсальный', en: 'Universal composite' },
        descriptionI18n: {
          uk: 'Универсальный светополимерный композит для пломбирования',
          en: 'Universal light-cure composite for fillings',
        },
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
            priceOriginal: 350,
            priceFinal: 315,
            discountsApplied: [
              {
                discountId: '6677000000000000000000d1',
                name: 'Осенняя распродажа',
                type: 'percent',
                value: 10,
                priceBefore: 350,
                priceAfter: 315,
              },
            ],
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
            priceOriginal: 420,
            priceFinal: 378,
            discountsApplied: [
              {
                discountId: '6677000000000000000000d1',
                name: 'Осенняя распродажа',
                type: 'percent',
                value: 10,
                priceBefore: 420,
                priceAfter: 378,
              },
            ],
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
            priceOriginal: 480,
            priceFinal: 432,
            discountsApplied: [
              {
                discountId: '6677000000000000000000d1',
                name: 'Осенняя распродажа',
                type: 'percent',
                value: 10,
                priceBefore: 480,
                priceAfter: 432,
              },
            ],
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
        priceMinFinal: 315,
        priceMaxFinal: 432,
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

  @Get(':idOrSlug/reviews')
  @ApiOperation({ summary: 'Get approved reviews for a product' })
  async getReviews(@Param('idOrSlug') idOrSlug: string) {
    const product = await this.service.findOne(idOrSlug);
    if (!product) return [];
    return this.reviewsService.findByProduct(String(product._id), true);
  }

  @Post(':idOrSlug/reviews')
  @HttpCode(201)
  @ApiOperation({ summary: 'Submit a customer review' })
  @ApiBody({ type: CreateReviewDto })
  async createReview(
    @Param('idOrSlug') idOrSlug: string,
    @Body() body: CreateReviewDto,
    @Req() req: Request,
  ) {
    const product = await this.service.findOne(idOrSlug);
    if (!product) throw new NotFoundException('Product not found');

    let customerId: string | undefined;
    let authorName = body.authorName;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await this.jwtService.verifyAsync<{ sub?: string; name?: string }>(token);
        if (payload?.sub) {
          customerId = payload.sub;
          if (!authorName && payload.name) authorName = payload.name;
        }
      } catch {
        // ignore invalid token — allow anonymous submission
      }
    }

    await this.reviewsService.create({
      productId: String(product._id),
      customerId,
      authorName: authorName || 'Анонім',
      rating: body.rating,
      comment: body.comment,
      isApproved: false,
      source: 'customer',
    });
    return { message: 'Дякуємо! Відгук надіслано на перевірку.' };
  }
}
