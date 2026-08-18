import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubcategoryDocument = HydratedDocument<Subcategory>;

@Schema({ timestamps: true })
export class Subcategory {
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

  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' })
  categoryId!: Types.ObjectId;

  // Optional parent subcategory — makes this a 3rd-level "підгрупа" (sub-subcategory).
  // Null/absent = top-level subcategory directly under the category.
  @Prop({ type: Types.ObjectId, ref: 'Subcategory', default: null })
  parentSubcategoryId?: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  sort?: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);
SubcategorySchema.index({ slug: 1 }, { unique: true });
SubcategorySchema.index({ categoryId: 1, isActive: 1, sort: 1 });
SubcategorySchema.index({ parentSubcategoryId: 1, isActive: 1, sort: 1 });
SubcategorySchema.index({ isActive: 1, sort: 1 });
SubcategorySchema.index({ 'nameI18n.uk': 1 });
