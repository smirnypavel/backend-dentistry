import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto } from './dto';
import { InjectModel as InjectModel2 } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../catalog/products/product.schema';
import type { ProductVariant } from '../catalog/products/product.schema';
import { DiscountsService } from '../discounts/discounts.service';
import crypto from 'crypto';

export interface ListCustomerOrdersParams {
  page: number;
  limit: number;
}

type OrderLean = Order & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date };

export interface CustomerOrdersPage {
  items: OrderLean[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

interface CreateOrderOptions {
  customerId?: string | Types.ObjectId;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>,
    @InjectModel2(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly discounts: DiscountsService,
  ) {}

  async create(dto: CreateOrderDto, idempotencyKey?: string, options?: CreateOrderOptions) {
    // Idempotency: if header is provided, try to find an existing order by (clientId + hash)
    const key = (idempotencyKey ?? '').trim();
    const clientIdNormalized = dto.clientId.trim();
    const ownerForHash = options?.customerId ? String(options.customerId) : clientIdNormalized;
    const idemHash = key
      ? crypto.createHash('sha256').update(`${ownerForHash}:${key}`).digest('hex')
      : undefined;

    const customerObjectId = options?.customerId
      ? new Types.ObjectId(String(options.customerId))
      : undefined;

    if (idemHash) {
      const existingFilter = customerObjectId
        ? { customerId: customerObjectId, idempotencyKeyHash: idemHash }
        : { clientId: clientIdNormalized, idempotencyKeyHash: idemHash };
      const existing = await this.model.findOne(existingFilter).lean();
      if (existing) return existing;
    }
    // Load products to validate variants and compute prices server-side
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productModel
      .find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) }, isActive: true })
      .lean();

    const productMap = new Map<string, (typeof products)[number]>();
    for (const p of products) productMap.set(String(p._id), p);

    const items = await Promise.all(
      dto.items.map(async (i) => {
        const pid = String(i.productId);
        const product = productMap.get(pid);
        if (!product) throw new NotFoundException(`Product not found: ${pid}`);

        const variant = (product.variants || []).find(
          (v: ProductVariant) => v.sku === i.sku && v.isActive !== false,
        );
        if (!variant)
          throw new BadRequestException(`Variant not found or inactive for product ${pid}`);

        const ctx = {
          price: variant.price,
          productId: new Types.ObjectId(String(product._id)),
          categoryIds: (product.categoryIds || []).map((id) => new Types.ObjectId(String(id))),
          manufacturerId: new Types.ObjectId(String(variant.manufacturerId)),
          countryId: variant.countryId ? new Types.ObjectId(String(variant.countryId)) : undefined,
          tags: product.tags || [],
        };
        const { priceFinal, applied } = await this.discounts.computePrice(ctx);

        return {
          productId: new Types.ObjectId(pid),
          sku: i.sku,
          quantity: i.quantity,
          price: priceFinal,
          priceOriginal: variant.price,
          title:
            i.title ??
            (product as { titleI18n?: { uk?: string; en?: string } }).titleI18n?.uk ??
            '',
          options: i.options ?? (variant.options as Record<string, string | number>) ?? {},
          manufacturerId: new Types.ObjectId(String(variant.manufacturerId)),
          countryId: variant.countryId ? new Types.ObjectId(String(variant.countryId)) : undefined,
          unit: i.unit ?? variant.unit,
          image:
            (variant.images && variant.images.length > 0 ? variant.images[0] : null) ||
            (product.images && product.images.length > 0 ? product.images[0] : null) ||
            undefined,
          discountsApplied: applied.map((a) => ({
            discountId: a.discountId,
            name: a.name,
            type: a.type,
            value: a.value,
            priceBefore: a.priceBefore,
            priceAfter: a.priceAfter,
          })),
        };
      }),
    );

    const itemsTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const deliveryFee = dto.deliveryFee ?? 0;
    const total = itemsTotal + deliveryFee;

    // Create the order; use unique index on (clientId, idempotencyKeyHash) to avoid races
    try {
      const order = await this.model.create({
        phone: dto.phone,
        clientId: clientIdNormalized,
        customerId: customerObjectId,
        items,
        itemsTotal,
        deliveryFee,
        total,
        status: 'new',
        name: dto.name,
        comment: dto.comment,
        idempotencyKey: key || undefined,
        idempotencyKeyHash: idemHash,
      });
      return order.toObject();
    } catch (err: unknown) {
      // If duplicate key due to race, fetch and return existing
      const anyErr = err as { code?: number } | undefined;
      if (anyErr?.code === 11000 && idemHash) {
        const conflictFilter = customerObjectId
          ? { customerId: customerObjectId, idempotencyKeyHash: idemHash }
          : { clientId: clientIdNormalized, idempotencyKeyHash: idemHash };
        const existing = await this.model.findOne(conflictFilter).lean();
        if (existing) return existing;
      }
      throw err;
    }
  }

  async history(phone: string, clientId: string) {
    return this.model
      .find({ phone, clientId: clientId.trim() })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async attachByPhoneAndClientId(
    customerId: Types.ObjectId | string,
    phone: string,
    clientId: string,
  ): Promise<number> {
    const normalizedPhone = phone.trim();
    const normalizedClientId = clientId.trim();
    const targetCustomerId =
      customerId instanceof Types.ObjectId ? customerId : new Types.ObjectId(customerId);

    const result = await this.model
      .updateMany(
        {
          phone: normalizedPhone,
          clientId: normalizedClientId,
          $or: [{ customerId: { $exists: false } }, { customerId: null }],
        },
        { $set: { customerId: targetCustomerId } },
      )
      .exec();

    return result.modifiedCount ?? 0;
  }

  async listCustomerOrders(
    customerId: Types.ObjectId | string,
    params: ListCustomerOrdersParams,
  ): Promise<CustomerOrdersPage> {
    const page = Math.max(params.page, 1);
    const limit = Math.min(Math.max(params.limit, 1), 100);
    const skip = (page - 1) * limit;
    const targetCustomerId =
      customerId instanceof Types.ObjectId ? customerId : new Types.ObjectId(customerId);

    const filter = { customerId: targetCustomerId };

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    // Enrich legacy order items that have no image snapshot
    const enrichedItems = await this.enrichItemImages(items as OrderLean[]);

    return {
      items: enrichedItems,
      total,
      page,
      limit,
      hasNextPage: skip + items.length < total,
    };
  }

  /**
   * For orders that were placed before the `image` snapshot field was added,
   * look up the current product and fill in the first available image.
   */
  private async enrichItemImages(orders: OrderLean[]): Promise<OrderLean[]> {
    // Collect product IDs where at least one item is missing an image
    const missingProductIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items ?? []) {
        if (!item.image && item.productId) {
          missingProductIds.add(String(item.productId));
        }
      }
    }
    if (missingProductIds.size === 0) return orders;

    const products = await this.productModel
      .find({ _id: { $in: Array.from(missingProductIds).map((id) => new Types.ObjectId(id)) } })
      .lean();
    const productMap = new Map<string, (typeof products)[number]>();
    for (const p of products) productMap.set(String(p._id), p);

    return orders.map((order) => ({
      ...order,
      items: (order.items ?? []).map((item) => {
        if (item.image) return item;
        const product = productMap.get(String(item.productId));
        if (!product) return item;
        const variant = (product.variants || []).find(
          (v: ProductVariant) => v.sku === item.sku,
        );
        const image =
          (variant?.images?.length ? variant.images[0] : null) ||
          (product.images?.length ? product.images[0] : null) ||
          undefined;
        return image ? { ...item, image } : item;
      }),
    }));
  }
}
