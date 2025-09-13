import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): MongooseModuleOptions => {
        const uri = config.get<string>('MONGODB_URI');
        const dbName = config.get<string>('DB_NAME', 'dentistry');
        if (!uri) {
          throw new Error(
            'MONGODB_URI is not set. Provide your MongoDB connection string (e.g., MongoDB Atlas) in .env',
          );
        }
        return {
          uri,
          dbName,
          serverSelectionTimeoutMS: 5000,
          autoIndex: true,
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
