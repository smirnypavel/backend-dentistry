import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminGuard } from './admin.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { Country, CountrySchema } from '../catalog/countries/country.schema';
import { Manufacturer, ManufacturerSchema } from '../catalog/manufacturers/manufacturer.schema';
import { Category, CategorySchema } from '../catalog/categories/category.schema';
import { Product, ProductSchema } from '../catalog/products/product.schema';
import { Order, OrderSchema } from '../orders/order.schema';
import { Discount, DiscountSchema } from '../discounts/discount.schema';
import { AdminCountriesController } from './countries.admin.controller';
import { AdminManufacturersController } from './manufacturers.admin.controller';
import { AdminCategoriesController } from './categories.admin.controller';
import { AdminProductsController } from './products.admin.controller';
import { AdminOrdersController } from './orders.admin.controller';
import { AdminUploadsController } from './uploads.admin.controller';
import { UploadsService } from './uploads.service';
import { AdminDiscountsController } from './discounts.admin.controller';
import { AdminDashboardController } from './dashboard.admin.controller';

@Module({
  imports: [
    AdminAuthModule,
    MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema },
      { name: Manufacturer.name, schema: ManufacturerSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Discount.name, schema: DiscountSchema },
    ]),
  ],
  controllers: [
    AdminCountriesController,
    AdminManufacturersController,
    AdminCategoriesController,
    AdminProductsController,
    AdminOrdersController,
    AdminUploadsController,
    AdminDiscountsController,
    AdminDashboardController,
  ],
  providers: [UploadsService, AdminGuard],
})
export class AdminModule {}
