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
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { DiscountsModule } from './discounts/discounts.module';
import { ContactsModule } from './company/contacts/contacts.module';
import { HeroModule } from './company/hero/hero.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl:
            process.env.NODE_ENV === 'production'
              ? Number(process.env.RATE_TTL_SEC ?? 60) * 1000
              : Number(process.env.RATE_TTL_SEC ?? 1) * 1000,
          limit:
            process.env.NODE_ENV === 'production'
              ? Number(process.env.RATE_LIMIT ?? 60)
              : Number(process.env.RATE_LIMIT ?? 10000),
        },
        {
          name: 'orders',
          ttl:
            process.env.NODE_ENV === 'production'
              ? Number(process.env.ORDERS_RATE_TTL_SEC ?? 60) * 1000
              : Number(process.env.ORDERS_RATE_TTL_SEC ?? 1) * 1000,
          limit:
            process.env.NODE_ENV === 'production'
              ? Number(process.env.ORDERS_RATE_LIMIT ?? 5)
              : Number(process.env.ORDERS_RATE_LIMIT ?? 1000),
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
    AdminAuthModule,
    DiscountsModule,
    ContactsModule,
    HeroModule,
  ],
  controllers: [HealthController],
  providers: [
    // In production enable rate limiting globally; in dev it's disabled for convenience
    ...(process.env.NODE_ENV === 'production'
      ? ([
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ] as const)
      : ([] as const)),
  ],
})
export class AppModule {}
