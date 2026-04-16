import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PromoSlideDocument = HydratedDocument<PromoSlide>;

@Schema({ _id: false })
export class PromoSlideFeature {
  @Prop({ required: true, trim: true })
  text!: string;

  @Prop({ trim: true })
  href?: string;
}

export const PromoSlideFeatureSchema = SchemaFactory.createForClass(PromoSlideFeature);

@Schema({ timestamps: true })
export class PromoSlide {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  price?: string;

  @Prop({ trim: true })
  oldPrice?: string;

  @Prop({ trim: true })
  badge?: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ trim: true, default: 'from-yellow-300 to-yellow-400' })
  color?: string;

  @Prop({ type: [PromoSlideFeatureSchema], default: [] })
  features!: PromoSlideFeature[];

  @Prop({ trim: true })
  linkUrl?: string;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const PromoSlideSchema = SchemaFactory.createForClass(PromoSlide);
PromoSlideSchema.index({ isActive: 1, sortOrder: 1 });
