import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PromoCode, PromoCodeDocument } from './promo-code.schema';

export interface PromoApplicableItem {
  productId: string | Types.ObjectId;
  categoryIds: (string | Types.ObjectId)[];
  subcategoryIds?: (string | Types.ObjectId)[];
  priceFinal: number; // price after automatic discounts
}

export interface PromoAppliedItem {
  productId: string;
  promoDiscount: number; // discount amount for this item
  priceAfterPromo: number;
}

@Injectable()
export class PromoCodesService {
  constructor(@InjectModel(PromoCode.name) private readonly model: Model<PromoCodeDocument>) {}

  /**
   * Validate a promo code: check existence, active, dates, usage limit.
   * Returns the promo code document or throws BadRequestException.
   */
  async validate(code: string): Promise<PromoCode & { _id: Types.ObjectId }> {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Promo code is required');

    const promo = await this.model.findOne({ code: normalized }).lean();
    if (!promo) throw new BadRequestException('Promo code not found');
    if (!promo.isActive) throw new BadRequestException('Promo code is not active');

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) {
      throw new BadRequestException('Promo code is not yet active');
    }
    if (promo.endsAt && promo.endsAt < now) {
      throw new BadRequestException('Promo code has expired');
    }
    if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    return promo as PromoCode & { _id: Types.ObjectId };
  }

  /**
   * Determine if a product is applicable for the promo code.
   */
  isApplicable(
    promo: PromoCode,
    productId: string | Types.ObjectId,
    categoryIds: (string | Types.ObjectId)[],
    subcategoryIds?: (string | Types.ObjectId)[],
  ): boolean {
    const pid = String(productId);
    const cids = categoryIds.map(String);
    const sids = (subcategoryIds || []).map(String);

    // Check exclusions first
    if (promo.excludedProductIds?.some((id) => String(id) === pid)) return false;
    if (
      promo.excludedCategoryIds?.length &&
      cids.some((c) => promo.excludedCategoryIds.some((ec) => String(ec) === c))
    ) {
      return false;
    }
    if (
      promo.excludedSubcategoryIds?.length &&
      sids.some((s) => promo.excludedSubcategoryIds.some((es) => String(es) === s))
    ) {
      return false;
    }

    // If allowed lists are all empty => applies to all
    const hasAllowedProducts = (promo.allowedProductIds?.length ?? 0) > 0;
    const hasAllowedCategories = (promo.allowedCategoryIds?.length ?? 0) > 0;
    const hasAllowedSubcategories = (promo.allowedSubcategoryIds?.length ?? 0) > 0;

    if (!hasAllowedProducts && !hasAllowedCategories && !hasAllowedSubcategories) return true;

    // Check allowed
    if (hasAllowedProducts && promo.allowedProductIds.some((id) => String(id) === pid)) {
      return true;
    }
    if (
      hasAllowedCategories &&
      cids.some((c) => promo.allowedCategoryIds.some((ac) => String(ac) === c))
    ) {
      return true;
    }
    if (
      hasAllowedSubcategories &&
      sids.some((s) => promo.allowedSubcategoryIds.some((as) => String(as) === s))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Apply a promo code to a list of items (after automatic discounts).
   * Returns per-item discount info.
   */
  applyToItems(promo: PromoCode, items: PromoApplicableItem[]): PromoAppliedItem[] {
    return items.map((item) => {
      const applicable = this.isApplicable(promo, item.productId, item.categoryIds, item.subcategoryIds);
      if (!applicable) {
        return {
          productId: String(item.productId),
          promoDiscount: 0,
          priceAfterPromo: item.priceFinal,
        };
      }

      let priceAfterPromo: number;
      if (promo.type === 'percent') {
        const pct = Math.max(0, Math.min(100, promo.value));
        priceAfterPromo = Math.max(0, Number((item.priceFinal * (1 - pct / 100)).toFixed(2)));
      } else {
        priceAfterPromo = Math.max(
          0,
          Number((item.priceFinal - Math.max(0, promo.value)).toFixed(2)),
        );
      }

      return {
        productId: String(item.productId),
        promoDiscount: Number((item.priceFinal - priceAfterPromo).toFixed(2)),
        priceAfterPromo,
      };
    });
  }

  /**
   * Atomically increment usage count.
   */
  async incrementUsage(promoCodeId: Types.ObjectId | string): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(String(promoCodeId)) },
      { $inc: { usageCount: 1 } },
    );
  }
}
