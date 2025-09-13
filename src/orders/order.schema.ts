import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export type OrderStatus = 'new' | 'processing' | 'done' | 'cancelled';

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
}

const OrderItemSnapshotSchema = SchemaFactory.createForClass(OrderItemSnapshot);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, trim: true })
  phone!: string; // normalized E.164

  @Prop({ required: true, trim: true })
  clientId!: string;

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
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ phone: 1, clientId: 1, createdAt: -1 });
