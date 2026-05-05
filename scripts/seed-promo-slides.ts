/* eslint-disable no-console */
import 'dotenv/config';
import mongoose from 'mongoose';
import { PromoSlideSchema } from '../src/company/promo-slides/promo-slide.schema';

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'dentistry';
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName });
  const PromoSlideModel = mongoose.model('PromoSlide', PromoSlideSchema);

  const existing = await PromoSlideModel.countDocuments();
  if (existing > 0) {
    console.log(`Promo slides already exist (${existing}). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  await PromoSlideModel.insertMany([
    {
      title: 'Металеві брекети Damon Q2',
      description: 'Сучасна самолігуюча система з низьким тертям для швидкого та комфортного лікування',
      price: '12 500 ₴',
      oldPrice: '15 000 ₴',
      badge: 'Хіт продажів',
      imageUrl: 'https://placehold.co/600x400/e0f2fe/0284c7?text=Damon+Q2',
      color: 'from-blue-400 to-blue-600',
      linkUrl: '/catalog',
      sortOrder: 1,
      isActive: true,
      features: [],
    },
    {
      title: 'Керамічні брекети In-Ovation C',
      description: 'Прозора естетична система, майже непомітна на зубах',
      price: '18 900 ₴',
      oldPrice: '22 000 ₴',
      badge: 'Акція -15%',
      imageUrl: 'https://placehold.co/600x400/fef9c3/ca8a04?text=In-Ovation+C',
      color: 'from-yellow-300 to-yellow-500',
      linkUrl: '/catalog',
      sortOrder: 2,
      isActive: true,
      features: [],
    },
    {
      title: 'Сапфірові брекети Radiance Plus',
      description: 'Монокристалічний сапфір — максимальна естетика та міцність',
      price: '24 500 ₴',
      oldPrice: '28 000 ₴',
      badge: 'Преміум',
      imageUrl: 'https://placehold.co/600x400/f0fdf4/16a34a?text=Radiance+Plus',
      color: 'from-emerald-400 to-emerald-600',
      linkUrl: '/catalog',
      sortOrder: 3,
      isActive: true,
      features: [],
    },
    {
      title: 'Елайнери Invisalign Teen',
      description: 'Знімна прозора система вирівнювання без брекетів — ідеально для підлітків',
      price: '32 000 ₴',
      badge: 'Новинка',
      imageUrl: 'https://placehold.co/600x400/fdf2f8/a21caf?text=Invisalign+Teen',
      color: 'from-purple-400 to-purple-600',
      linkUrl: '/catalog',
      sortOrder: 4,
      isActive: true,
      features: [],
    },
    {
      title: 'Ретейнер Hawley (верхній)',
      description: 'Знімний ретейнер для підтримання результату після зняття брекетів',
      price: '2 800 ₴',
      badge: 'Необхідний',
      imageUrl: 'https://placehold.co/600x400/fff7ed/c2410c?text=Retainer',
      color: 'from-orange-300 to-orange-500',
      linkUrl: '/catalog',
      sortOrder: 5,
      isActive: true,
      features: [],
    },
    {
      title: 'Комплексна консультація + фото',
      description: 'Повна діагностика з панорамним знімком і складанням плану лікування',
      price: '900 ₴',
      oldPrice: '1 500 ₴',
      badge: 'Знижка -40%',
      imageUrl: 'https://placehold.co/600x400/f0f9ff/0369a1?text=Consultation',
      color: 'from-cyan-400 to-cyan-600',
      linkUrl: '/catalog',
      sortOrder: 6,
      isActive: true,
      features: [],
    },
  ]);

  console.log('✅ Seeded 6 promo slides');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
