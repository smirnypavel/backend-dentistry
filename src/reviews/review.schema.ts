import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

export type ReviewSource = 'customer' | 'admin';

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true, sparse: true })
  customerId?: Types.ObjectId;

  @Prop({ trim: true })
  authorName?: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ trim: true })
  comment?: string;

  @Prop({ type: Boolean, default: false })
  isApproved!: boolean;

  @Prop({ type: String, enum: ['customer', 'admin'], default: 'customer' })
  source!: ReviewSource;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1, isApproved: 1 });
ReviewSchema.index({ customerId: 1, productId: 1 });
