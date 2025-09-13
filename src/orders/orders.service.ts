import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto } from './dto';
import { InjectModel as InjectModel2 } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../catalog/products/product.schema';
import type { ProductVariant } from '../catalog/products/product.schema';
import { DiscountsService } from '../discounts/discounts.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>,
    @InjectModel2(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly discounts: DiscountsService,
  ) {}

  async create(dto: CreateOrderDto) {
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
          title: i.title ?? (product as { title?: string }).title ?? '',
          options: i.options ?? (variant.options as Record<string, string | number>) ?? {},
          manufacturerId: new Types.ObjectId(String(variant.manufacturerId)),
          countryId: variant.countryId ? new Types.ObjectId(String(variant.countryId)) : undefined,
          unit: i.unit ?? variant.unit,
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

    const order = await this.model.create({
      phone: dto.phone,
      clientId: dto.clientId,
      items,
      itemsTotal,
      deliveryFee,
      total,
      status: 'new',
      name: dto.name,
      comment: dto.comment,
    });
    return order.toObject();
  }

  async history(phone: string, clientId: string) {
    return this.model.find({ phone, clientId }).sort({ createdAt: -1 }).limit(50).lean();
  }
}
