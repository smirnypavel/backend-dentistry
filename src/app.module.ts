import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { CategoriesModule } from './catalog/categories/categories.module';
import { CountriesModule } from './catalog/countries/countries.module';
import { ManufacturersModule } from './catalog/manufacturers/manufacturers.module';
import { ProductsModule } from './catalog/products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: Number(process.env.RATE_TTL_SEC ?? 60) * 1000,
          limit: Number(process.env.RATE_LIMIT ?? 60),
        },
        {
          name: 'orders',
          ttl: Number(process.env.ORDERS_RATE_TTL_SEC ?? 60) * 1000,
          limit: Number(process.env.ORDERS_RATE_LIMIT ?? 5),
        },
      ],
    }),
    DatabaseModule,
    CategoriesModule,
    CountriesModule,
    ManufacturersModule,
    ProductsModule,
    OrdersModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
