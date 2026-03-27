/* eslint-disable no-console */
import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import path from 'node:path';
import sharp from 'sharp';
import os from 'node:os';
import fs from 'node:fs';
import { GalleryImageSchema } from '../src/company/gallery/gallery-image.schema';

const IMAGES = [
  { file: 'about1.jpg', alt: { uk: 'ORTHOSTORE офіс', en: 'ORTHOSTORE office' } },
  { file: 'about2.jpg', alt: { uk: 'ORTHOSTORE команда', en: 'ORTHOSTORE team' } },
];

const IMAGES_DIR = path.resolve(__dirname, '../../orthodent-pro/public/images/about');

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'dentistry';
  if (!uri) throw new Error('MONGODB_URI is not set');

  // Configure Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are required');
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  await mongoose.connect(uri, { dbName });
  const GalleryModel = mongoose.model('GalleryImage', GalleryImageSchema);

  const count = await GalleryModel.countDocuments();
  if (count > 0) {
    console.log(`Gallery already has ${count} images, skipping.`);
    await mongoose.disconnect();
    return;
  }

  console.log('Uploading gallery images to Cloudinary...');

  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    const filePath = path.join(IMAGES_DIR, img.file);

    console.log(`  Uploading ${img.file}...`);

    // Compress to fit Cloudinary 10MB limit
    const tmpPath = path.join(os.tmpdir(), `gallery-${i}.jpg`);
    await sharp(filePath)
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(tmpPath);

    const result = await cloudinary.uploader.upload(tmpPath, {
      folder: 'gallery',
      public_id: `about-${i + 1}`,
      overwrite: true,
    });

    await GalleryModel.create({
      imageUrl: result.secure_url || result.url,
      altI18n: img.alt,
      sort: i,
      isActive: true,
    });

    console.log(`  ✓ ${img.file} → ${result.secure_url}`);
    fs.unlinkSync(tmpPath);
  }

  console.log(`Seeded ${IMAGES.length} gallery images.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed gallery error:', err);
  process.exit(1);
});
