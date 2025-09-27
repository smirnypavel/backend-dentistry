import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { AdminGuard } from './admin.guard';
import { ContactCard, ContactCardDocument } from '../company/contacts/contact.schema';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class I18nAddressCreateDto {
  @IsString()
  uk!: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class I18nAddressUpdateDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class CreateContactCardDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nAddressCreateDto)
  addressI18n?: I18nAddressCreateDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  viber?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  telegram?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateContactCardDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nAddressUpdateDto)
  addressI18n?: I18nAddressUpdateDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  viber?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  telegram?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('admin:contacts')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/contacts')
export class AdminContactsController {
  constructor(@InjectModel(ContactCard.name) private readonly model: Model<ContactCardDocument>) {}

  @Get()
  @ApiOperation({ summary: 'List all contact cards (admin)' })
  @ApiOkResponse({
    description: 'All contact cards',
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
  list() {
    return this.model.find().sort({ sort: 1, createdAt: 1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact card by id' })
  @ApiOkResponse({ description: 'Contact card or null' })
  get(@Param('id') id: string) {
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create contact card' })
  @ApiOkResponse({ description: 'Created contact card' })
  create(@Body() dto: CreateContactCardDto) {
    return this.model.create({
      addressI18n: dto.addressI18n,
      phones: dto.phones ?? [],
      email: dto.email,
      viber: dto.viber ?? [],
      telegram: dto.telegram ?? [],
      sort: dto.sort ?? 0,
      isActive: dto.isActive ?? true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact card' })
  @ApiOkResponse({ description: 'Updated contact card or null' })
  update(@Param('id') id: string, @Body() dto: UpdateContactCardDto) {
    return this.model.findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true }).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact card' })
  @ApiOkResponse({ description: 'Deleted contact card or null' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
