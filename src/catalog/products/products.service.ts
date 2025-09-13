import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';

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
  constructor(@InjectModel(Product.name) private readonly model: Model<ProductDocument>) {}

  async findAll(query: ProductQuery) {
    const {
      q,
      category,
      manufacturerId,
      countryId,
      priceFrom,
      priceTo,
      options,
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

    if (options && Object.keys(options).length) {
      for (const [k, v] of Object.entries(options)) {
        andClauses.push({ [`variants.options.${k}`]: v } as unknown as ProductFilter);
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

    const [items, total] = await Promise.all([
      this.model
        .find(finalFilter)
        .sort(sortObj)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.model.countDocuments(finalFilter),
    ]);

    return { items, page: safePage, limit: safeLimit, total };
  }

  async findOne(idOrSlug: string) {
    if (Types.ObjectId.isValid(idOrSlug)) {
      const byId = await this.model.findById(idOrSlug).lean();
      if (byId) return byId;
    }
    return this.model.findOne({ slug: idOrSlug }).lean();
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
