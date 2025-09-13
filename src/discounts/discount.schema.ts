import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DiscountDocument = HydratedDocument<Discount>;

export type DiscountType = 'percent' | 'fixed';

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, enum: ['percent', 'fixed'], required: true })
  type!: DiscountType;

  @Prop({ type: Number, required: true, min: 0 })
  value!: number; // percent: 0..100, fixed: currency units

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  startsAt?: Date;

  @Prop({ type: Date })
  endsAt?: Date;

  @Prop({ type: Number, default: 0 })
  priority!: number; // higher applies later (if stacking) or wins (if non-stackable)

  @Prop({ type: Boolean, default: false })
  stackable!: boolean;

  // Targeting
  @Prop({ type: [Types.ObjectId], default: [] })
  productIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  categoryIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  manufacturerIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  countryIds!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

// Helpful indexes
DiscountSchema.index({ isActive: 1, startsAt: 1, endsAt: 1, priority: 1 });
DiscountSchema.index({ productIds: 1 });
DiscountSchema.index({ categoryIds: 1 });
DiscountSchema.index({ manufacturerIds: 1 });
DiscountSchema.index({ countryIds: 1 });
DiscountSchema.index({ tags: 1 });

export interface DiscountContext {
  price: number;
  productId: Types.ObjectId;
  categoryIds?: Types.ObjectId[];
  manufacturerId?: Types.ObjectId;
  countryId?: Types.ObjectId;
  tags?: string[];
}

export interface AppliedDiscountInfo {
  discountId: string;
  name: string;
  type: DiscountType;
  value: number;
  priceBefore: number;
  priceAfter: number;
}
