import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CountryDocument = HydratedDocument<Country>;

@Schema({ timestamps: true })
export class Country {
  @Prop({ required: true, trim: true, uppercase: true })
  code!: string; // ISO code, e.g., US, UA, JP

  @Prop({
    type: { uk: { type: String, required: true, trim: true }, en: { type: String, trim: true } },
    required: true,
  })
  nameI18n!: { uk: string; en?: string };

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop()
  flagUrl?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
CountrySchema.index({ code: 1 }, { unique: true });
CountrySchema.index({ slug: 1 }, { unique: true });
CountrySchema.index({ isActive: 1, 'nameI18n.uk': 1 });
