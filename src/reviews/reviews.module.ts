import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Review, ReviewSchema } from './review.schema';
import { Product, ProductSchema } from '../catalog/products/product.schema';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('CUSTOMER_JWT_SECRET') ?? '',
      }),
    }),
  ],
  providers: [ReviewsService],
  exports: [ReviewsService, JwtModule],
})
export class ReviewsModule {}
