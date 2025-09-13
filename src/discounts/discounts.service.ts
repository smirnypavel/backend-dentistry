import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  Discount,
  DiscountDocument,
  DiscountType,
  AppliedDiscountInfo,
  DiscountContext,
} from './discount.schema';

@Injectable()
export class DiscountsService {
  constructor(@InjectModel(Discount.name) private readonly model: Model<DiscountDocument>) {}

  async findActiveForContext(ctx: DiscountContext) {
    const now = new Date();
    const filter: FilterQuery<DiscountDocument> = {
      isActive: true,
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
      ],
    } as FilterQuery<DiscountDocument>;

    const and: FilterQuery<DiscountDocument>[] = [];

    // Match by any of the scopes; empty arrays mean not targeted by that scope
    and.push({ $or: [{ productIds: ctx.productId }, { productIds: { $size: 0 } }] });

    if (ctx.categoryIds?.length) {
      and.push({ $or: [{ categoryIds: { $in: ctx.categoryIds } }, { categoryIds: { $size: 0 } }] });
    } else {
      and.push({ $or: [{ categoryIds: { $size: 0 } }] });
    }

    if (ctx.manufacturerId) {
      and.push({
        $or: [{ manufacturerIds: ctx.manufacturerId }, { manufacturerIds: { $size: 0 } }],
      });
    } else {
      and.push({ $or: [{ manufacturerIds: { $size: 0 } }] });
    }

    if (ctx.countryId) {
      and.push({ $or: [{ countryIds: ctx.countryId }, { countryIds: { $size: 0 } }] });
    } else {
      and.push({ $or: [{ countryIds: { $size: 0 } }] });
    }

    if (ctx.tags?.length) {
      and.push({ $or: [{ tags: { $in: ctx.tags } }, { tags: { $size: 0 } }] });
    } else {
      and.push({ $or: [{ tags: { $size: 0 } }] });
    }

    const final: FilterQuery<DiscountDocument> = {
      ...filter,
      $and: [...(filter.$and || []), ...and],
    };
    const discounts = await this.model.find(final).sort({ priority: 1, createdAt: 1 }).lean();
    return discounts;
  }

  applyOne(price: number, d: { type: DiscountType; value: number }) {
    if (d.type === 'percent') {
      const pct = Math.max(0, Math.min(100, d.value));
      return Math.max(0, Number((price * (1 - pct / 100)).toFixed(2)));
    }
    return Math.max(0, Number((price - Math.max(0, d.value)).toFixed(2)));
  }

  async computePrice(
    ctx: DiscountContext,
  ): Promise<{ priceFinal: number; applied: AppliedDiscountInfo[] }> {
    const discounts = await this.findActiveForContext(ctx);
    let price = ctx.price;
    const applied: AppliedDiscountInfo[] = [];

    // Non-stackable: choose the best single discount by resulting price; stackable: apply in priority order
    const nonStackable = discounts.filter((d) => !d.stackable);
    const stackable = discounts.filter((d) => d.stackable);

    let bestSingle: { d: (typeof discounts)[number]; after: number } | null = null;
    for (const d of nonStackable) {
      const after = this.applyOne(ctx.price, { type: d.type, value: d.value });
      if (!bestSingle || after < bestSingle.after) bestSingle = { d, after };
    }

    // Start from either best single or original price
    if (bestSingle) {
      const before = price;
      price = bestSingle.after;
      applied.push({
        discountId: String(bestSingle.d._id),
        name: bestSingle.d.name,
        type: bestSingle.d.type,
        value: bestSingle.d.value,
        priceBefore: before,
        priceAfter: price,
      });
    }

    // Then stack stackable discounts in order on the resulting price
    for (const d of stackable) {
      const before = price;
      const after = this.applyOne(before, { type: d.type, value: d.value });
      if (after < before) {
        price = after;
        applied.push({
          discountId: String(d._id),
          name: d.name,
          type: d.type,
          value: d.value,
          priceBefore: before,
          priceAfter: after,
        });
      }
    }

    return { priceFinal: price, applied };
  }
}
