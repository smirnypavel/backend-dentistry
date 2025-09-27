import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ContactCardDocument = HydratedDocument<ContactCard>;

@Schema({ _id: false, versionKey: false })
class I18nText {
  @Prop({ type: String, required: false, default: undefined })
  uk?: string;

  @Prop({ type: String, required: false, default: undefined })
  en?: string;
}

@Schema({ timestamps: true })
export class ContactCard {
  _id!: MongooseSchema.Types.ObjectId;

  @Prop({ type: I18nText, required: false })
  addressI18n?: I18nText;

  @Prop({ type: [String], default: [] })
  phones!: string[];

  @Prop({ type: String, required: false, default: undefined })
  email?: string;

  @Prop({ type: [String], default: [] })
  viber!: string[];

  @Prop({ type: [String], default: [] })
  telegram!: string[];

  @Prop({ type: Number, default: 0 })
  sort!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const ContactCardSchema = SchemaFactory.createForClass(ContactCard);
