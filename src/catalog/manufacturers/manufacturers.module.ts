import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Manufacturer, ManufacturerSchema } from './manufacturer.schema';
import { ManufacturersService } from './manufacturers.service';
import { ManufacturersController } from './manufacturers.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Manufacturer.name, schema: ManufacturerSchema }])],
  controllers: [ManufacturersController],
  providers: [ManufacturersService],
  exports: [ManufacturersService],
})
export class ManufacturersModule {}
