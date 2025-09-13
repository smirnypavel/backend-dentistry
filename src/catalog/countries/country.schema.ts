import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CountryDocument = HydratedDocument<Country>;

@Schema({ timestamps: true })
export class Country {
  @Prop({ required: true, trim: true, uppercase: true })
  code!: string; // ISO code, e.g., US, UA, JP

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
CountrySchema.index({ code: 1 }, { unique: true });
CountrySchema.index({ slug: 1 }, { unique: true });
CountrySchema.index({ isActive: 1, name: 1 });
