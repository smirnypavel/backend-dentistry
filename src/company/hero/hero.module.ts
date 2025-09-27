import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hero, HeroSchema } from './hero.schema';
import { HeroPublicController } from './public.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Hero.name, schema: HeroSchema }])],
  controllers: [HeroPublicController],
})
export class HeroModule {}
