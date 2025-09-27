import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { AdminGuard } from './admin.guard';
import { Hero, HeroDocument } from '../company/hero/hero.schema';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class I18nTextOptionalDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class CtaDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextOptionalDto)
  labelI18n?: I18nTextOptionalDto;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  external?: boolean;
}

class CreateHeroDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextOptionalDto)
  titleI18n?: I18nTextOptionalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextOptionalDto)
  subtitleI18n?: I18nTextOptionalDto;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageUrlMobile?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CtaDto)
  cta?: CtaDto;

  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

class UpdateHeroDto extends CreateHeroDto {}

@ApiTags('admin:hero')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/hero')
export class AdminHeroController {
  constructor(@InjectModel(Hero.name) private readonly model: Model<HeroDocument>) {}

  @Get()
  @ApiOperation({ summary: 'Get current hero (if any)' })
  @ApiOkResponse({ description: 'Returns the latest hero or null' })
  async get() {
    return this.model.findOne().sort({ updatedAt: -1, _id: -1 }).lean();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hero by id' })
  @ApiOkResponse({ description: 'Hero or null' })
  async getById(@Param('id') id: string) {
    return this.model.findById(new Types.ObjectId(id)).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create hero block' })
  @ApiOkResponse({ description: 'Created hero' })
  async create(@Body() dto: CreateHeroDto) {
    // If creating an active hero, deactivate others
    if (dto.isActive) {
      await this.model.updateMany({ isActive: true }, { $set: { isActive: false } });
    }
    return this.model.create({
      titleI18n: dto.titleI18n,
      subtitleI18n: dto.subtitleI18n,
      imageUrl: dto.imageUrl,
      imageUrlMobile: dto.imageUrlMobile,
      videoUrl: dto.videoUrl,
      cta: dto.cta ? { external: false, ...dto.cta } : undefined,
      theme: dto.theme ?? 'light',
      isActive: dto.isActive ?? false,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hero block' })
  @ApiOkResponse({ description: 'Updated hero or null' })
  async update(@Param('id') id: string, @Body() dto: UpdateHeroDto) {
    const objectId = new Types.ObjectId(id);
    if (dto.isActive === true) {
      // Activate this hero and deactivate others
      await this.model.updateMany({ _id: { $ne: objectId } }, { $set: { isActive: false } });
    }
    return this.model.findByIdAndUpdate(objectId, dto, { new: true }).lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hero block' })
  @ApiOkResponse({ description: 'Deleted hero or null' })
  async remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }
}
