import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private readonly model: Model<OrderDocument>) {}

  async create(dto: CreateOrderDto) {
    const items = dto.items.map((i) => ({
      productId: new Types.ObjectId(i.productId),
      sku: i.sku,
      quantity: i.quantity,
      price: i.price,
      title: i.title ?? '',
      options: i.options ?? {},
      manufacturerId: i.manufacturerId ? new Types.ObjectId(i.manufacturerId) : undefined,
      countryId: i.countryId ? new Types.ObjectId(i.countryId) : undefined,
      unit: i.unit,
    }));

    const itemsTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const deliveryFee = dto.deliveryFee ?? 0;
    const total = itemsTotal + deliveryFee;

    const order = await this.model.create({
      phone: dto.phone,
      clientId: dto.clientId,
      items,
      itemsTotal,
      deliveryFee,
      total,
      status: 'new',
      name: dto.name,
      comment: dto.comment,
    });
    return order.toObject();
  }

  async history(phone: string, clientId: string) {
    return this.model.find({ phone, clientId }).sort({ createdAt: -1 }).limit(50).lean();
  }
}
