import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Model } from 'mongoose';
import { AdminGuard } from './admin.guard';
import { Order, OrderDocument } from '../orders/order.schema';
import { Product, ProductDocument } from '../catalog/products/product.schema';
import { Discount, DiscountDocument } from '../discounts/discount.schema';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

class AdminDashboardQueryDto {
  @ApiPropertyOptional({
    description: 'ISO date string (inclusive lower bound). Defaults to 30 days before `to`.',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    description: 'ISO date string (inclusive upper bound). Defaults to now (UTC).',
  })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: 'Timezone identifier for bucketing (e.g. Europe/Kyiv). Defaults to UTC.',
  })
  @IsOptional()
  @IsString()
  tz?: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  topLimit?: number = 10;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recentLimit?: number = 10;
}

type SummaryKpi = {
  ordersTotal: number;
  ordersNonCancelled: number;
  revenue: number;
  itemsSold: number;
  avgOrderValue: number;
};

type SeriesPoint = {
  periodStart: Date;
  orders: number;
  revenue: number;
  itemsSold: number;
};

type TopProductRow = {
  productId: string;
  title: string;
  quantity: number;
  revenue: number;
};

type CatalogAgg = {
  variantsTotal: number;
  productsWithImages: number;
  productsWithoutImages: number;
};

type RecentOrderRow = {
  _id: unknown;
  phone: string;
  clientId: string;
  itemsTotal: number;
  total: number;
  status: 'new' | 'processing' | 'done' | 'cancelled';
  itemsCount: number;
  createdAt: Date | string | undefined;
};

@ApiTags('admin:dashboard')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@ApiExtraModels(AdminDashboardQueryDto)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
    @InjectModel(Discount.name) private readonly discounts: Model<DiscountDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard: summary, series, top products, recent orders, health' })
  @ApiOkResponse({
    description: 'Dashboard payload with KPIs and series',
    schema: {
      example: {
        range: {
          from: '2025-08-14T00:00:00.000Z',
          to: '2025-09-13T23:59:59.999Z',
          granularity: 'day',
          timezone: 'UTC',
        },
        summary: {
          ordersTotal: 23,
          ordersNonCancelled: 21,
          revenue: 15230,
          itemsSold: 87,
          avgOrderValue: 725.24,
        },
        salesSeries: [
          { periodStart: '2025-09-10T00:00:00.000Z', orders: 3, revenue: 2100, itemsSold: 12 },
        ],
        topProducts: [
          {
            productId: '665f1a2b3c4d5e6f7a8b9c0d',
            title: 'Композит A2',
            quantity: 24,
            revenue: 8400,
          },
        ],
        recentOrders: [
          {
            _id: '66f000000000000000000001',
            phone: '+380971112233',
            clientId: 'web-abc',
            itemsTotal: 700,
            total: 700,
            status: 'new',
            itemsCount: 2,
            createdAt: '2025-09-12T12:00:00.000Z',
          },
        ],
        catalogHealth: {
          productsTotal: 128,
          productsActive: 120,
          variantsTotal: 356,
          productsWithImages: 97,
          productsWithoutImages: 31,
        },
        discountsHealth: {
          total: 12,
          activeNow: 7,
          upcoming: 2,
          expired: 3,
        },
      },
    },
  })
  async get(@Query() q: AdminDashboardQueryDto) {
    // Resolve range
    const to = q.to ? new Date(q.to) : new Date();
    if (Number.isNaN(to.getTime())) throw new BadRequestException('Invalid `to` date');
    const fromDefaultMillis = 30 * 24 * 60 * 60 * 1000; // 30 days
    const from = q.from ? new Date(q.from) : new Date(to.getTime() - fromDefaultMillis);
    if (Number.isNaN(from.getTime())) throw new BadRequestException('Invalid `from` date');
    const tz = q.tz || 'UTC';
    const unit = q.granularity || 'day';
    const topLimit = Math.min(Math.max(q.topLimit ?? 10, 1), 100);
    const recentLimit = Math.min(Math.max(q.recentLimit ?? 10, 1), 100);

    const dateMatch = { createdAt: { $gte: from, $lte: to } } as const;

    // Summary
    const summaryPromise: Promise<SummaryKpi> = this.orders
      .aggregate<SummaryKpi>([
        { $match: dateMatch },
        {
          $addFields: {
            itemsQty: { $sum: { $map: { input: '$items', as: 'it', in: '$$it.quantity' } } },
            rev: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$total'] },
          },
        },
        {
          $group: {
            _id: null,
            ordersTotal: { $sum: 1 },
            ordersNonCancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, 1] },
            },
            revenue: { $sum: '$rev' },
            itemsSold: { $sum: '$itemsQty' },
          },
        },
        {
          $project: {
            _id: 0,
            ordersTotal: 1,
            ordersNonCancelled: 1,
            revenue: 1,
            itemsSold: 1,
            avgOrderValue: {
              $cond: [
                { $gt: ['$ordersNonCancelled', 0] },
                { $divide: ['$revenue', '$ordersNonCancelled'] },
                0,
              ],
            },
          },
        },
      ])
      .then(
        (arr) =>
          (arr?.[0] as SummaryKpi | undefined) ?? {
            ordersTotal: 0,
            ordersNonCancelled: 0,
            revenue: 0,
            itemsSold: 0,
            avgOrderValue: 0,
          },
      );

    // Sales series
    const seriesPromise: Promise<SeriesPoint[]> = this.orders.aggregate<SeriesPoint>([
      { $match: dateMatch },
      {
        $addFields: {
          itemsQty: { $sum: { $map: { input: '$items', as: 'it', in: '$$it.quantity' } } },
          rev: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$total'] },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: { date: '$createdAt', unit: unit, timezone: tz },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$rev' },
          itemsSold: { $sum: '$itemsQty' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          periodStart: '$_id',
          orders: 1,
          revenue: 1,
          itemsSold: 1,
        },
      },
    ]);

    // Top products (non-cancelled)
    const topProductsPromise: Promise<TopProductRow[]> = this.orders.aggregate<TopProductRow>([
      { $match: { ...dateMatch, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { productId: '$items.productId', title: '$items.title' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: topLimit },
      {
        $project: {
          _id: 0,
          productId: { $toString: '$_id.productId' },
          title: '$_id.title',
          quantity: 1,
          revenue: 1,
        },
      },
    ]);

    // Recent orders (last N in range)
    const recentOrdersPromise: Promise<RecentOrderRow[]> = this.orders
      .find(dateMatch, {
        phone: 1,
        clientId: 1,
        itemsTotal: 1,
        total: 1,
        status: 1,
        items: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(recentLimit)
      .lean()
      .then(
        (
          rows: Array<{
            _id: unknown;
            phone: string;
            clientId: string;
            itemsTotal: number;
            total: number;
            status: 'new' | 'processing' | 'done' | 'cancelled';
            items?: Array<unknown>;
            createdAt?: Date | string;
          }>,
        ) =>
          rows.map((r) => ({
            _id: r._id,
            phone: r.phone,
            clientId: r.clientId,
            itemsTotal: r.itemsTotal,
            total: r.total,
            status: r.status,
            itemsCount: (r.items ?? []).length,
            createdAt: r.createdAt,
          })),
      );

    // Catalog health
    const productsTotalPromise = this.products.countDocuments({});
    const productsActivePromise = this.products.countDocuments({ isActive: true });
    const variantsAndImagesPromise: Promise<CatalogAgg> = this.products
      .aggregate<CatalogAgg>([
        {
          $project: {
            variantsCount: { $size: { $ifNull: ['$variants', []] } },
            hasImages: { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] },
          },
        },
        {
          $group: {
            _id: null,
            variantsTotal: { $sum: '$variantsCount' },
            productsWithImages: { $sum: { $cond: ['$hasImages', 1, 0] } },
            productsWithoutImages: { $sum: { $cond: ['$hasImages', 0, 1] } },
          },
        },
        { $project: { _id: 0 } },
      ])
      .then(
        (arr) =>
          (arr?.[0] as CatalogAgg | undefined) ?? {
            variantsTotal: 0,
            productsWithImages: 0,
            productsWithoutImages: 0,
          },
      );

    // Discounts health
    const now = new Date();
    const discountsTotalPromise = this.discounts.countDocuments({});
    const discountsActiveNowPromise = this.discounts.countDocuments({
      isActive: true,
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
      ],
    });
    const discountsUpcomingPromise = this.discounts.countDocuments({
      isActive: true,
      startsAt: { $gt: now },
    });
    const discountsExpiredPromise = this.discounts.countDocuments({
      isActive: true,
      endsAt: { $lt: now },
    });

    const [
      summary,
      series,
      topProducts,
      recentOrders,
      productsTotal,
      productsActive,
      catAgg,
      dTotal,
      dActive,
      dUpcoming,
      dExpired,
    ]: [
      SummaryKpi,
      SeriesPoint[],
      TopProductRow[],
      RecentOrderRow[],
      number,
      number,
      CatalogAgg,
      number,
      number,
      number,
      number,
    ] = await Promise.all([
      summaryPromise,
      seriesPromise,
      topProductsPromise,
      recentOrdersPromise,
      productsTotalPromise,
      productsActivePromise,
      variantsAndImagesPromise,
      discountsTotalPromise,
      discountsActiveNowPromise,
      discountsUpcomingPromise,
      discountsExpiredPromise,
    ]);

    return {
      range: { from, to, granularity: unit, timezone: tz },
      summary,
      salesSeries: series,
      topProducts,
      recentOrders,
      catalogHealth: {
        productsTotal,
        productsActive,
        variantsTotal: catAgg.variantsTotal,
        productsWithImages: catAgg.productsWithImages,
        productsWithoutImages: catAgg.productsWithoutImages,
      },
      discountsHealth: {
        total: dTotal,
        activeNow: dActive,
        upcoming: dUpcoming,
        expired: dExpired,
      },
    };
  }
}

// no default export
