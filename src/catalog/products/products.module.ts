import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DiscountsModule } from '../../discounts/discounts.module';
import { ReviewsModule } from '../../reviews/reviews.module';
import { CustomersModule } from '../../customers/customers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    DiscountsModule,
    ReviewsModule,
    CustomersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
