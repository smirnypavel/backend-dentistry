import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country, CountryDocument } from './country.schema';

@Injectable()
export class CountriesService {
  constructor(@InjectModel(Country.name) private readonly model: Model<CountryDocument>) {}

  async findAllActive(): Promise<Country[]> {
    return this.model.find({ isActive: true }).sort({ 'nameI18n.uk': 1 }).lean();
  }
}
