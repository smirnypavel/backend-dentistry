/* eslint-disable no-console */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { CategorySchema } from '../src/catalog/categories/category.schema';
import { CountrySchema } from '../src/catalog/countries/country.schema';
import { ManufacturerSchema } from '../src/catalog/manufacturers/manufacturer.schema';
import { ProductSchema } from '../src/catalog/products/product.schema';

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'dentistry';
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName });
  const CategoryModel = mongoose.model('Category', CategorySchema);
  const CountryModel = mongoose.model('Country', CountrySchema);
  const ManufacturerModel = mongoose.model('Manufacturer', ManufacturerSchema);
  const ProductModel = mongoose.model('Product', ProductSchema);

  const count = await CategoryModel.countDocuments();
  if (count === 0) {
    await CategoryModel.insertMany([
      {
        slug: 'materials',
        nameI18n: { uk: 'Матеріали', en: 'Materials' },
        descriptionI18n: { uk: 'Витратні матеріали', en: 'Consumables' },
        sort: 1,
      },
      {
        slug: 'tools',
        nameI18n: { uk: 'Інструменти', en: 'Tools' },
        descriptionI18n: { uk: 'Інструменти та пристосування', en: 'Tools and accessories' },
        sort: 2,
      },
    ]);
    console.log('Seeded categories.');
  } else {
    console.log('Categories already present, skipping.');
  }

  // Countries
  const countriesCount = await CountryModel.countDocuments();
  if (countriesCount === 0) {
    await CountryModel.insertMany([
      { code: 'UA', nameI18n: { uk: 'Україна', en: 'Ukraine' }, slug: 'ua' },
      { code: 'PL', nameI18n: { uk: 'Польща', en: 'Poland' }, slug: 'pl' },
      { code: 'DE', nameI18n: { uk: 'Німеччина', en: 'Germany' }, slug: 'de' },
    ]);
    console.log('Seeded countries.');
  } else {
    console.log('Countries already present, skipping.');
  }

  // Manufacturers
  const manufacturersCount = await ManufacturerModel.countDocuments();
  if (manufacturersCount === 0) {
    const ua = await CountryModel.findOne({ code: 'UA' }).lean();
    const pl = await CountryModel.findOne({ code: 'PL' }).lean();
    const de = await CountryModel.findOne({ code: 'DE' }).lean();

    await ManufacturerModel.insertMany([
      {
        slug: 'dent-ua',
        nameI18n: { uk: 'Dent UA', en: 'Dent UA' },
        countryIds: [ua?._id].filter(Boolean),
      },
      {
        slug: 'stoma-pl',
        nameI18n: { uk: 'Stoma PL', en: 'Stoma PL' },
        countryIds: [pl?._id].filter(Boolean),
      },
      {
        slug: 'med-de',
        nameI18n: { uk: 'Med DE', en: 'Med DE' },
        countryIds: [de?._id].filter(Boolean),
      },
    ]);
    console.log('Seeded manufacturers.');
  } else {
    console.log('Manufacturers already present, skipping.');
  }

  // Demo product with variants
  const productsCount = await ProductModel.countDocuments();
  if (productsCount === 0) {
    const category = await CategoryModel.findOne({ slug: 'materials' }).lean();
    const dentUa = await ManufacturerModel.findOne({ slug: 'dent-ua' }).lean();
    const stomaPl = await ManufacturerModel.findOne({ slug: 'stoma-pl' }).lean();
    const medDe = await ManufacturerModel.findOne({ slug: 'med-de' }).lean();
    const ua = await CountryModel.findOne({ code: 'UA' }).lean();
    const pl = await CountryModel.findOne({ code: 'PL' }).lean();
    const de = await CountryModel.findOne({ code: 'DE' }).lean();

    const categoryIds = category ? [category._id as Types.ObjectId] : [];

    await ProductModel.create({
      slug: 'universal-composite',
      titleI18n: { uk: 'Композит універсальний', en: 'Universal composite' },
      descriptionI18n: {
        uk: 'Універсальний світлополімерний композит для пломбування',
        en: 'Universal light-cure composite for fillings',
      },
      categoryIds,
      tags: ['popular', 'stock'],
      images: [],
      attributes: [{ key: 'purpose', value: 'restoration' }],
      variants: [
        {
          sku: 'UC-1',
          manufacturerId: dentUa?._id,
          countryId: ua?._id,
          options: { shade: 'A2', size: '2g' },
          price: 350,
          unit: 'шт',
          images: [],
          barcode: '482000000001',
          isActive: true,
        },
        {
          sku: 'UC-2',
          manufacturerId: stomaPl?._id,
          countryId: pl?._id,
          options: { shade: 'A3', size: '4g' },
          price: 420,
          unit: 'шт',
          images: [],
          barcode: '590000000002',
          isActive: true,
        },
        {
          sku: 'UC-3',
          manufacturerId: medDe?._id,
          countryId: de?._id,
          options: { shade: 'B2', size: '4g' },
          price: 480,
          unit: 'шт',
          images: [],
          barcode: '400000000003',
          isActive: true,
        },
      ],
      isActive: true,
    });
    console.log('Seeded demo product with variants.');
  } else {
    console.log('Products already present, skipping.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
