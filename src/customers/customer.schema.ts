import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, unique: true, trim: true })
  phone!: string; // normalized E.164

  @Prop({ default: false })
  isPhoneVerified!: boolean;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ default: false })
  marketingOptIn?: boolean;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;

  @Prop({ trim: true })
  passwordHash?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ email: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ lastLoginAt: -1 });
