import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manufacturer, ManufacturerDocument } from './manufacturer.schema';

@Injectable()
export class ManufacturersService {
  constructor(
    @InjectModel(Manufacturer.name)
    private readonly model: Model<ManufacturerDocument>,
  ) {}

  async findAllActive(): Promise<Manufacturer[]> {
    return this.model.find({ isActive: true }).sort({ name: 1 }).lean();
  }
}
