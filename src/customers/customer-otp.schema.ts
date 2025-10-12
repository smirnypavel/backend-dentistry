import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerOtpReason = 'signup' | 'login' | 'reset';
export type CustomerOtpDocument = HydratedDocument<CustomerOtp>;

@Schema({ timestamps: true })
export class CustomerOtp {
  @Prop({ required: true, trim: true })
  requestId!: string;

  @Prop({ required: true, trim: true })
  phone!: string; // normalized E.164

  @Prop({ required: true, trim: true })
  clientId!: string;

  @Prop({ required: true })
  codeHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ required: true, enum: ['signup', 'login', 'reset'], default: 'login' })
  reason!: CustomerOtpReason;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const CustomerOtpSchema = SchemaFactory.createForClass(CustomerOtp);
CustomerOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CustomerOtpSchema.index({ phone: 1, reason: 1, requestId: 1 }, { unique: true });
CustomerOtpSchema.index({ phone: 1, reason: 1, createdAt: -1 });
