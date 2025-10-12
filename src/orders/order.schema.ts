import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Customer } from '../customers/customer.schema';

export type OrderDocument = HydratedDocument<Order>;

export type OrderStatus = 'new' | 'processing' | 'done' | 'cancelled';

@Schema({ _id: false, timestamps: false })
export class AppliedDiscountSnapshot {
  @Prop({ required: true })
  discountId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['percent', 'fixed'] })
  type!: 'percent' | 'fixed';

  @Prop({ required: true })
  value!: number;

  @Prop({ required: true })
  priceBefore!: number;

  @Prop({ required: true })
  priceAfter!: number;
}

const AppliedDiscountSnapshotSchema = SchemaFactory.createForClass(AppliedDiscountSnapshot);

@Schema({ _id: false, timestamps: false })
export class OrderItemSnapshot {
  @Prop({ type: Types.ObjectId, required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sku!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true })
  price!: number; // unit price at time of order

  @Prop({ required: true })
  priceOriginal!: number; // original unit price before discounts

  @Prop({ required: true, trim: true })
  title!: string; // product title snapshot

  @Prop({ type: Object, default: {} })
  options?: Record<string, string | number>;

  @Prop({ type: Types.ObjectId })
  manufacturerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  countryId?: Types.ObjectId;

  @Prop({ trim: true })
  unit?: string;

  @Prop({ type: [AppliedDiscountSnapshotSchema], default: [] })
  discountsApplied?: AppliedDiscountSnapshot[];
}

const OrderItemSnapshotSchema = SchemaFactory.createForClass(OrderItemSnapshot);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, trim: true })
  phone!: string; // normalized E.164

  @Prop({ required: true, trim: true })
  clientId!: string;

  @Prop({ type: Types.ObjectId, ref: Customer.name, index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: [OrderItemSnapshotSchema], default: [] })
  items!: OrderItemSnapshot[];

  @Prop({ required: true })
  itemsTotal!: number;

  @Prop({ default: 0 })
  deliveryFee?: number;

  @Prop({ required: true })
  total!: number;

  @Prop({ default: 'new' })
  status!: OrderStatus;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  comment?: string;

  // Idempotency support
  @Prop({ trim: true })
  idempotencyKey?: string;

  @Prop({ trim: true })
  idempotencyKeyHash?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ phone: 1, clientId: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
// For dashboard date-range queries
OrderSchema.index({ createdAt: -1 });
// Unique idempotency per (clientId + hash) to avoid duplicates
OrderSchema.index({ clientId: 1, idempotencyKeyHash: 1 }, { unique: true, sparse: true });
OrderSchema.index({ customerId: 1, idempotencyKeyHash: 1 }, { unique: true, sparse: true });
