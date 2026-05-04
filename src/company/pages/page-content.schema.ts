import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PageContentDocument = HydratedDocument<PageContent>;

/** One document per page. key = 'about' | 'delivery' | 'contacts-page' */
@Schema({ timestamps: true })
export class PageContent {
  @Prop({ type: String, required: true, unique: true, index: true })
  key!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  data!: Record<string, unknown>;
}

export const PageContentSchema = SchemaFactory.createForClass(PageContent);
