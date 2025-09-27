import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type HeroDocument = HydratedDocument<Hero>;

@Schema({ _id: false, versionKey: false })
class I18nTextOptional {
  @Prop({ type: String, required: false, default: undefined })
  uk?: string;

  @Prop({ type: String, required: false, default: undefined })
  en?: string;
}

@Schema({ _id: false, versionKey: false })
class CtaLink {
  @Prop({ type: I18nTextOptional, required: false })
  labelI18n?: I18nTextOptional;

  @Prop({ type: String, required: false, default: undefined })
  url?: string;

  @Prop({ type: Boolean, default: false })
  external!: boolean;
}

@Schema({ timestamps: true })
export class Hero {
  _id!: MongooseSchema.Types.ObjectId;

  // Main title and subtitle (optional i18n)
  @Prop({ type: I18nTextOptional, required: false })
  titleI18n?: I18nTextOptional;

  @Prop({ type: I18nTextOptional, required: false })
  subtitleI18n?: I18nTextOptional;

  // Media
  @Prop({ type: String, required: false, default: undefined })
  imageUrl?: string; // Desktop image

  @Prop({ type: String, required: false, default: undefined })
  imageUrlMobile?: string; // Mobile image

  @Prop({ type: String, required: false, default: undefined })
  videoUrl?: string; // Optional video

  // CTA
  @Prop({ type: CtaLink, required: false })
  cta?: CtaLink;

  // Presentation
  @Prop({ type: String, enum: ['light', 'dark'], default: 'light' })
  theme!: 'light' | 'dark';

  @Prop({ type: Boolean, default: false })
  isActive!: boolean; // Enable/disable hero: when false, public GET returns null
}

export const HeroSchema = SchemaFactory.createForClass(Hero);
