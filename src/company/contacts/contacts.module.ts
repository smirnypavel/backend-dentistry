import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactCard, ContactCardSchema } from './contact.schema';
import { ContactsPublicController } from './public.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ContactCard.name, schema: ContactCardSchema }])],
  controllers: [ContactsPublicController],
})
export class ContactsModule {}
