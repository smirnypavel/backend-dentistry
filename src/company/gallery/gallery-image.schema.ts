import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type GalleryImageDocument = HydratedDocument<GalleryImage>;

@Schema({ timestamps: true })
export class GalleryImage {
  _id!: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  imageUrl!: string;

  @Prop({ type: String, required: false, default: undefined })
  altI18n?: { uk?: string; en?: string };

  @Prop({ type: Number, default: 0 })
  sort!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const GalleryImageSchema = SchemaFactory.createForClass(GalleryImage);

// Add the altI18n as raw object
GalleryImageSchema.path('altI18n', {
  type: { uk: String, en: String },
  required: false,
  _id: false,
});
