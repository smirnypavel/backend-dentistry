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

    // Otherwise, fallback to legacy top-level fields logic (OR within each scope with empty meaning "any").
    // Group 0-length means ignore groups; we model via $or in final filter

    // We cannot pre-expand all possible groups with values from ctx because Mongo query needs to check membership conditions.
    // Instead, we use $elemMatch with AND conditions inside.
    const groupElemMatch: Record<string, unknown> = {};
    const subAnd: Record<string, unknown>[] = [];
    // productIds: exact match OR empty within group
    subAnd.push({ $or: [{ productIds: ctx.productId }, { productIds: { $size: 0 } }] });
    // categoryIds
    if (ctx.categoryIds?.length) {
      subAnd.push({
        $or: [{ categoryIds: { $in: ctx.categoryIds } }, { categoryIds: { $size: 0 } }],
      });
    } else {
      subAnd.push({ $or: [{ categoryIds: { $size: 0 } }] });
    }
    // manufacturerIds
    if (ctx.manufacturerId) {
      subAnd.push({
        $or: [{ manufacturerIds: ctx.manufacturerId }, { manufacturerIds: { $size: 0 } }],
      });
    } else {
      subAnd.push({ $or: [{ manufacturerIds: { $size: 0 } }] });
    }
    // countryIds
    if (ctx.countryId) {
      subAnd.push({ $or: [{ countryIds: ctx.countryId }, { countryIds: { $size: 0 } }] });
    } else {
      subAnd.push({ $or: [{ countryIds: { $size: 0 } }] });
    }
    // tags
    if (ctx.tags?.length) {
      subAnd.push({ $or: [{ tags: { $in: ctx.tags } }, { tags: { $size: 0 } }] });
    } else {
      subAnd.push({ $or: [{ tags: { $size: 0 } }] });
    }

    groupElemMatch['$and'] = subAnd;

    // Final filter matches when either there are no groups (so legacy fields apply),
    // OR at least one group matches the ctx
    const final: FilterQuery<DiscountDocument> = {
      ...filter,
      $and: [
        ...(filter.$and || []),
        { $or: [{ targetGroups: { $size: 0 } }, { targetGroups: { $elemMatch: groupElemMatch } }] },
        // legacy top-level fields still respected to further restrict
        { $or: [{ productIds: ctx.productId }, { productIds: { $size: 0 } }] },
        ctx.categoryIds?.length
          ? ({
              $or: [{ categoryIds: { $in: ctx.categoryIds } }, { categoryIds: { $size: 0 } }],
            } as never)
          : ({ $or: [{ categoryIds: { $size: 0 } }] } as never),
        ctx.manufacturerId
          ? ({
              $or: [{ manufacturerIds: ctx.manufacturerId }, { manufacturerIds: { $size: 0 } }],
            } as never)
          : ({ $or: [{ manufacturerIds: { $size: 0 } }] } as never),
        ctx.countryId
          ? ({ $or: [{ countryIds: ctx.countryId }, { countryIds: { $size: 0 } }] } as never)
          : ({ $or: [{ countryIds: { $size: 0 } }] } as never),
        ctx.tags?.length
          ? ({ $or: [{ tags: { $in: ctx.tags } }, { tags: { $size: 0 } }] } as never)
          : ({ $or: [{ tags: { $size: 0 } }] } as never),
      ],
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
