import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { ContactCard, ContactCardDocument } from './contact.schema';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsPublicController {
  constructor(@InjectModel(ContactCard.name) private readonly model: Model<ContactCardDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List active contact cards (for storefront)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    schema: { type: 'string', enum: ['true', 'false'] },
  })
  @ApiOkResponse({
    description: 'Active contact cards list',
    schema: {
      example: [
        {
          _id: '66aa00000000000000000001',
          addressI18n: { uk: 'м. Київ, вул. Хрещатик, 1', en: 'Kyiv, Khreshchatyk St, 1' },
          phones: ['+380501234567', '+380971112233'],
          email: 'info@example.com',
          viber: ['+380501234567', '+380671112233'],
          telegram: ['@dentistry_store', '@dent_support'],
          sort: 1,
          isActive: true,
          createdAt: '2025-09-27T12:00:00.000Z',
          updatedAt: '2025-09-27T12:00:00.000Z',
        },
      ],
    },
  })
  list(@Query('includeInactive') includeInactive?: string) {
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    return this.model.find(filter).sort({ sort: 1, createdAt: 1 }).lean();
  }
}
