import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleryImage, GalleryImageSchema } from './gallery-image.schema';
import { GalleryPublicController } from './public.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: GalleryImage.name, schema: GalleryImageSchema }])],
  controllers: [GalleryPublicController],
})
export class GalleryModule {}
