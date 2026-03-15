import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromoCode, PromoCodeSchema } from './promo-code.schema';
import { PromoCodesService } from './promo-codes.service';
import { PromoCodesController } from './promo-codes.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: PromoCode.name, schema: PromoCodeSchema }])],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService, MongooseModule],
})
export class PromoCodesModule {}
