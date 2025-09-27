import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ManufacturerDocument = HydratedDocument<Manufacturer>;

@Schema({ timestamps: true })
export class Manufacturer {
  @Prop({
    type: { uk: { type: String, required: true, trim: true }, en: { type: String, trim: true } },
    required: true,
  })
  nameI18n!: { uk: string; en?: string };

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  countryIds!: Types.ObjectId[];

  @Prop()
  logoUrl?: string;

  @Prop()
  bannerUrl?: string;

  @Prop()
  website?: string;

  @Prop({ type: { uk: { type: String, trim: true }, en: { type: String, trim: true } } })
  descriptionI18n?: { uk?: string; en?: string };

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const ManufacturerSchema = SchemaFactory.createForClass(Manufacturer);
ManufacturerSchema.index({ slug: 1 }, { unique: true });
ManufacturerSchema.index({ isActive: 1, 'nameI18n.uk': 1 });
