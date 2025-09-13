import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ManufacturerDocument = HydratedDocument<Manufacturer>;

@Schema({ timestamps: true })
export class Manufacturer {
  @Prop({ required: true, trim: true })
  name!: string;

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

  @Prop()
  description?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const ManufacturerSchema = SchemaFactory.createForClass(Manufacturer);
ManufacturerSchema.index({ slug: 1 }, { unique: true });
ManufacturerSchema.index({ isActive: 1, name: 1 });
