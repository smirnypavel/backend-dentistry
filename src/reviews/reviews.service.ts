import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewSource } from './review.schema';
import { Product, ProductDocument } from '../catalog/products/product.schema';

export interface CreateReviewDto {
  productId: string;
  customerId?: string;
  authorName?: string;
  rating: number;
  comment?: string;
  isApproved?: boolean;
  source?: ReviewSource;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly model: Model<ReviewDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    const doc = await this.model.create({
      productId: new Types.ObjectId(dto.productId),
      customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
      authorName: dto.authorName,
      rating: dto.rating,
      comment: dto.comment,
      isApproved: dto.isApproved ?? false,
      source: dto.source ?? 'customer',
    });
    await this.recompute(dto.productId);
    return doc.toObject();
  }

  async findByProduct(productId: string, onlyApproved = true): Promise<Review[]> {
    const filter: Record<string, unknown> = { productId: new Types.ObjectId(productId) };
    if (onlyApproved) filter.isApproved = true;
    return this.model
      .find(filter as never)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async listAll(params: { page?: number; limit?: number; isApproved?: boolean }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const filter: Record<string, unknown> = {};
    if (typeof params.isApproved === 'boolean') filter.isApproved = params.isApproved;
    const [items, total] = await Promise.all([
      this.model
        .find(filter as never)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter as never),
    ]);
    return { items, page, limit, total };
  }

  async approve(id: string, approved: boolean): Promise<Review | null> {
    const doc = await this.model
      .findByIdAndUpdate(new Types.ObjectId(id), { $set: { isApproved: approved } }, { new: true })
      .lean();
    if (doc) await this.recompute(String(doc.productId));
    return doc;
  }

  async update(id: string, patch: Partial<Pick<Review, 'rating' | 'comment' | 'authorName' | 'isApproved'>>): Promise<Review | null> {
    const doc = await this.model
      .findByIdAndUpdate(new Types.ObjectId(id), { $set: patch }, { new: true })
      .lean();
    if (doc) await this.recompute(String(doc.productId));
    return doc;
  }

  async remove(id: string): Promise<Review | null> {
    const doc = await this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
    if (doc) await this.recompute(String(doc.productId));
    return doc;
  }

  /** Recompute ratingAvg and ratingCount for a product based on approved reviews */
  async recompute(productId: string): Promise<void> {
    const result = await this.model
      .aggregate([
        { $match: { productId: new Types.ObjectId(productId), isApproved: true } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .exec();
    const avg = result[0]?.avg ?? 0;
    const count = result[0]?.count ?? 0;
    await this.productModel.updateOne(
      { _id: new Types.ObjectId(productId) },
      { $set: { ratingAvg: Number(avg.toFixed(2)), ratingCount: count } },
    );
  }
}
