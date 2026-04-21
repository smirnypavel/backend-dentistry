import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromoCodeDocument = HydratedDocument<PromoCode>;

export type PromoCodeType = 'percent' | 'fixed';

@Schema({ timestamps: true })
export class PromoCode {
  @Prop({ required: true, trim: true, uppercase: true, unique: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, enum: ['percent', 'fixed'], required: true })
  type!: PromoCodeType;

  @Prop({ type: Number, required: true, min: 0 })
  value!: number; // percent: 0..100, fixed: currency units

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number, default: null })
  usageLimit?: number | null; // null = unlimited

  @Prop({ type: Number, default: 0 })
  usageCount!: number;

  @Prop({ type: Date })
  startsAt?: Date;

  @Prop({ type: Date })
  endsAt?: Date;

  // Targeting: which products the promo code applies to
  // If both allowed arrays are empty => applies to all products
  @Prop({ type: [Types.ObjectId], default: [] })
  allowedProductIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  allowedCategoryIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  allowedSubcategoryIds!: Types.ObjectId[];

  // Exclusions: these products/categories are always excluded
  @Prop({ type: [Types.ObjectId], default: [] })
  excludedProductIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  excludedCategoryIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  excludedSubcategoryIds!: Types.ObjectId[];
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);

PromoCodeSchema.index({ code: 1 }, { unique: true });
PromoCodeSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });
PromoCodeSchema.index({ name: 1 });
