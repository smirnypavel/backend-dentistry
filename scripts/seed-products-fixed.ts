/* eslint-disable no-console */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { ProductSchema } from '../src/catalog/products/product.schema';

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'dentistry';
  if (!uri) throw new Error('MONGODB_URI is not set');

  const categoryIdStr = process.env.SEED_CATEGORY_ID || '68c54c1b77f127eed007155b';
  const countryIdStr = process.env.SEED_COUNTRY_ID || '68c554a36d639445f16f3e92';
  const manufacturerIdStr = process.env.SEED_MANUFACTURER_ID || '68c554a36d639445f16f3ea9';

  const categoryId = new Types.ObjectId(categoryIdStr);
  const countryId = new Types.ObjectId(countryIdStr);
  const manufacturerId = new Types.ObjectId(manufacturerIdStr);

  await mongoose.connect(uri, { dbName });
  const ProductModel = mongoose.model('Product', ProductSchema);

  const productsToCreate = 10;
  let created = 0;

  for (let i = 1; i <= productsToCreate; i++) {
    const slug = `seed-prod-${i}`;
    const exists = await ProductModel.findOne({ slug }).lean();
    if (exists) {
      console.log(`Skip existing product: ${slug}`);
      continue;
    }

    const title = `Демо продукт ${i}`;
    const basePrice = 300 + i * 10;

    await ProductModel.create({
      slug,
      titleI18n: { uk: title, en: `Demo product ${i}` },
      descriptionI18n: {
        uk: `Автогенерований демо продукт #${i}`,
        en: `Auto-generated demo product #${i}`,
      },
      categoryIds: [categoryId],
      tags: ['demo', i % 2 === 0 ? 'stock' : 'popular'],
      images: [],
      attributes: [{ key: 'purpose', value: 'demo' }],
      variants: [
        {
          sku: `SP-${i}-A2-2G`,
          manufacturerId,
          countryId,
          options: { shade: 'A2', size: '2g' },
          price: basePrice,
          unit: 'шт',
          images: [],
          barcode: `0000000${i}01`,
          isActive: true,
        },
        {
          sku: `SP-${i}-A3-4G`,
          manufacturerId,
          countryId,
          options: { shade: 'A3', size: '4g' },
          price: Math.round(basePrice * 1.2),
          unit: 'шт',
          images: [],
          barcode: `0000000${i}02`,
          isActive: true,
        },
      ],
      isActive: true,
    });
    created++;
    console.log(`Created product: ${slug}`);
  }

  console.log(`Done. Created: ${created} product(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed products error:', err);
  process.exit(1);
});
