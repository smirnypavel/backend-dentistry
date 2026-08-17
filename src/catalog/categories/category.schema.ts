import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1, sort: 1 });
CategorySchema.index({ 'nameI18n.uk': 1 });
