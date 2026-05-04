import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PageContent, PageContentSchema } from './page-content.schema';
import { PagesService } from './pages.service';
import { PagesPublicController } from './public.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: PageContent.name, schema: PageContentSchema }])],
  controllers: [PagesPublicController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
