import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromoSlide, PromoSlideSchema } from './promo-slide.schema';
import { PromoSlidesPublicController } from './public.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PromoSlide.name, schema: PromoSlideSchema },
    ]),
  ],
  controllers: [PromoSlidesPublicController],
})
export class PromoSlidesModule {}
