import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, lowercase: true })
  slug!: string;

  @Prop({
    type: { uk: { type: String, required: true, trim: true }, en: { type: String, trim: true } },
    required: true,
  })
  nameI18n!: { uk: string; en?: string };

  @Prop({ type: { uk: { type: String, trim: true }, en: { type: String, trim: true } } })
  descriptionI18n?: { uk?: string; en?: string };

  @Prop({ trim: true })
  imageUrl?: string;

  // Bento card size on the catalog landing page: large (2×2), wide (2×1), tall (1×2), normal (1×1)
  @Prop({ type: String, enum: ['large', 'wide', 'tall', 'normal'] })
  cardSize?: string;

  @Prop({ type: Number, default: 0 })
  sort?: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  /** Default recommended products for items in this category (fallback when a
   *  product has no own recommendations). */
  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  relatedProductIds?: Types.ObjectId[];

  /** Alternative recommendation source: a whole category. */
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  relatedCategoryId?: Types.ObjectId | null;

  /** Alternative recommendation source: a whole subcategory. */
  @Prop({ type: Types.ObjectId, ref: 'Subcategory', default: null })
  relatedSubcategoryId?: Types.ObjectId | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1, sort: 1 });
CategorySchema.index({ 'nameI18n.uk': 1 });
