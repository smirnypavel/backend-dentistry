import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subcategory, SubcategoryDocument } from './subcategory.schema';

@Injectable()
export class SubcategoriesService {
  constructor(@InjectModel(Subcategory.name) private readonly model: Model<SubcategoryDocument>) {}

  async findAllActive(): Promise<Subcategory[]> {
    return this.model.find({ isActive: true }).sort({ sort: 1, 'nameI18n.uk': 1 }).lean();
  }

  async findByCategoryId(categoryId: string): Promise<Subcategory[]> {
    const catId = new Types.ObjectId(categoryId);
    return this.model
      .find({ categoryId: catId, isActive: true })
      .sort({ sort: 1, 'nameI18n.uk': 1 })
      .lean();
  }
}
