import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Country, CountrySchema } from '../catalog/countries/country.schema';
import { Manufacturer, ManufacturerSchema } from '../catalog/manufacturers/manufacturer.schema';
import { Category, CategorySchema } from '../catalog/categories/category.schema';
import { Product, ProductSchema } from '../catalog/products/product.schema';
import { Order, OrderSchema } from '../orders/order.schema';
import { AdminCountriesController } from './countries.admin.controller';
import { AdminManufacturersController } from './manufacturers.admin.controller';
import { AdminCategoriesController } from './categories.admin.controller';
import { AdminProductsController } from './products.admin.controller';
import { AdminOrdersController } from './orders.admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema },
      { name: Manufacturer.name, schema: ManufacturerSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [
    AdminCountriesController,
    AdminManufacturersController,
    AdminCategoriesController,
    AdminProductsController,
    AdminOrdersController,
  ],
})
export class AdminModule {}
