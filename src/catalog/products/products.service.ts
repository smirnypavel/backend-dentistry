import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductVariant } from './product.schema';
import { DiscountsService } from '../../discounts/discounts.service';
import { AppliedDiscountInfo } from '../../discounts/discount.schema';

export interface ProductQuery {
  q?: string;
  category?: string;
  manufacturerId?: string | string[];
  countryId?: string | string[];
  priceFrom?: number;
  priceTo?: number;
  options?: Record<string, string | number>;
  tags?: string | string[];
  sort?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly model: Model<ProductDocument>,
    private readonly discounts: DiscountsService,
  ) {}

  async findAll(query: ProductQuery & { opt?: Record<string, string[]> }) {
    const {
      q,
      category,
      manufacturerId,
      countryId,
      priceFrom,
      priceTo,
      options,
      opt,
      tags,
      sort = '-createdAt',
      page = 1,
      limit = 20,
    } = query;

    type ProductFilter = FilterQuery<ProductDocument> & {
      $and?: ProductFilter[];
      $text?: { $search: string };
    };
    const filter: ProductFilter = { isActive: true };
    const andClauses: ProductFilter[] = [];

    if (q && q.trim().length > 0) {
      filter.$text = { $search: q.trim() };
    }

    if (category) {
      const catId = this.toObjectIdOrNull(category);
      if (catId) filter.categoryIds = catId;
    }

    const toArray = (v?: string | string[]) => (Array.isArray(v) ? v : v ? [v] : []);
    const manIds = toArray(manufacturerId)
      .map((id) => this.toObjectIdOrNull(id))
      .filter((id): id is Types.ObjectId => !!id);
    if (manIds.length) filter.manufacturerIds = { $in: manIds };

    const ctryIds = toArray(countryId)
      .map((id) => this.toObjectIdOrNull(id))
      .filter((id): id is Types.ObjectId => !!id);
    if (ctryIds.length) filter.countryIds = { $in: ctryIds };

    if (typeof priceFrom === 'number') andClauses.push({ priceMax: { $gte: priceFrom } });
    if (typeof priceTo === 'number') andClauses.push({ priceMin: { $lte: priceTo } });

    // Variant options filter: support both JSON `options` and opt.* params collected into `opt`
    const hasOptionsJson = options && Object.keys(options).length > 0;
    const hasOptParams = opt && Object.keys(opt).length > 0;
    if (hasOptionsJson || hasOptParams) {
      const elem: Record<string, unknown> = {};
      if (hasOptionsJson && options) {
        for (const [k, v] of Object.entries(options)) {
          elem[`options.${k}`] = v;
        }
      }
      if (hasOptParams && opt) {
        for (const [k, rawVals] of Object.entries(opt)) {
          const candidates = new Set<unknown>();
          for (const raw of rawVals) {
            const s = String(raw);
            candidates.add(s);
            const num = Number(s);
            if (Number.isFinite(num) && s.trim() !== '' && String(num) === s) {
              candidates.add(num);
            }
          }
          const arr = Array.from(candidates);
          elem[`options.${k}`] = arr.length > 1 ? { $in: arr } : arr[0];
        }
      }
      if (Object.keys(elem).length) {
        andClauses.push({ variants: { $elemMatch: elem } } as unknown as ProductFilter);
      }
    }

    const tagList = toArray(tags);
    if (tagList.length) filter.tags = { $in: tagList };

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const sortObj = this.parseSort(sort);

    const finalFilter: ProductFilter = andClauses.length
      ? { $and: [filter, ...andClauses] }
      : filter;

    const [itemsRaw, total] = await Promise.all([
      this.model
        .find(finalFilter)
        .sort(sortObj)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.model.countDocuments(finalFilter),
    ]);

    const items = await Promise.all(itemsRaw.map((p) => this.withDiscounts(p)));

    return { items, page: safePage, limit: safeLimit, total };
  }

  async findOne(idOrSlug: string) {
    if (Types.ObjectId.isValid(idOrSlug)) {
      const byId = await this.model.findById(idOrSlug).lean();
      if (byId) return this.withDiscounts(byId);
    }
    const bySlug = await this.model.findOne({ slug: idOrSlug }).lean();
    return bySlug ? this.withDiscounts(bySlug) : null;
  }

  private async withDiscounts(product: ProductLeanForView): Promise<ProductWithDiscounts> {
    // compute per-variant discounted price and attach priceOriginal/priceFinal/discountsApplied
    const tags: string[] = Array.isArray(product.tags) ? product.tags : [];
    const variants = product.variants ?? [];

    const variantsWithDiscounts: VariantWithDiscounts[] = await Promise.all(
      variants.map(async (v) => {
        const ctx = {
          price: v.price,
          productId: product._id,
          categoryIds: product.categoryIds,
          manufacturerId: v.manufacturerId,
          countryId: v.countryId,
          tags,
        };
        const { priceFinal, applied } = await this.discounts.computePrice(ctx);
        const discountsApplied: AppliedDiscountInfo[] = applied;
        return {
          ...v,
          priceOriginal: v.price,
          priceFinal,
          discountsApplied,
        };
      }),
    );

    const prices = variantsWithDiscounts
      .filter((v) => v.isActive !== false)
      .map((v) => v.priceFinal)
      .filter((n): n is number => typeof n === 'number');

    const priceMinFinal = prices.length ? Math.min(...prices) : 0;
    const priceMaxFinal = prices.length ? Math.max(...prices) : 0;

    return { ...product, variants: variantsWithDiscounts, priceMinFinal, priceMaxFinal };
  }

  private toObjectIdOrNull(id?: string) {
    if (!id) return null;
    try {
      return new Types.ObjectId(id);
    } catch {
      return null;
    }
  }

  private parseSort(sort?: string) {
    if (!sort) return { createdAt: -1 } as const;
    const fields = sort
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const obj: Record<string, 1 | -1> = {};
    for (const f of fields) {
      if (f.startsWith('-')) obj[f.slice(1)] = -1;
      else obj[f] = 1;
    }
    return obj;
  }
}

// Types for discounted view models
export interface ProductLeanForView extends Pick<Product, 'variants' | 'categoryIds' | 'tags'> {
  _id: Types.ObjectId;
  variants: ProductVariant[];
  categoryIds: Types.ObjectId[];
  tags?: string[];
}

export interface VariantWithDiscounts extends ProductVariant {
  priceOriginal: number;
  priceFinal: number;
  discountsApplied: AppliedDiscountInfo[];
}

export interface ProductWithDiscounts extends Omit<ProductLeanForView, 'variants'> {
  variants: VariantWithDiscounts[];
  priceMinFinal: number;
  priceMaxFinal: number;
}
