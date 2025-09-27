import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private readonly model: Model<CategoryDocument>) {}

  async findAllActive(): Promise<Category[]> {
    return this.model.find({ isActive: true }).sort({ sort: 1, 'nameI18n.uk': 1 }).lean();
  }
}
