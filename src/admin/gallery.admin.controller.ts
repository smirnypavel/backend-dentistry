import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { AdminGuard } from './admin.guard';
import {
  GalleryImage,
  GalleryImageDocument,
} from '../company/gallery/gallery-image.schema';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class I18nAltDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class CreateGalleryImageDto {
  @IsString()
  imageUrl!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nAltDto)
  altI18n?: I18nAltDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

class UpdateGalleryImageDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nAltDto)
  altI18n?: I18nAltDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

@ApiTags('admin:gallery')
@UseGuards(AdminGuard)
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@Controller('admin/gallery')
export class AdminGalleryController {
  constructor(
    @InjectModel(GalleryImage.name)
    private readonly model: Model<GalleryImageDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all gallery images (admin sees all)' })
  @ApiOkResponse({ description: 'All gallery images sorted by sort, createdAt' })
  async list() {
    return this.model.find().sort({ sort: 1, createdAt: 1 }).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Add gallery image' })
  @ApiOkResponse({ description: 'Created gallery image' })
  async create(@Body() dto: CreateGalleryImageDto) {
    // Auto-assign sort = max + 1 if not specified
    if (dto.sort === undefined || dto.sort === null) {
      const last = await this.model.findOne().sort({ sort: -1 }).lean();
      dto.sort = last ? (last.sort ?? 0) + 1 : 0;
    }
    return this.model.create({
      imageUrl: dto.imageUrl,
      altI18n: dto.altI18n,
      sort: dto.sort,
      isActive: dto.isActive ?? true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update gallery image' })
  @ApiOkResponse({ description: 'Updated gallery image or null' })
  async update(@Param('id') id: string, @Body() dto: UpdateGalleryImageDto) {
    return this.model
      .findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true })
      .lean();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete gallery image' })
  @ApiOkResponse({ description: 'Deleted gallery image or null' })
  async remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder gallery images by array of IDs' })
  @ApiOkResponse({ description: 'Updated sort order' })
  async reorder(@Body() dto: ReorderDto) {
    const ops = dto.ids.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { sort: index } },
      },
    }));
    if (ops.length > 0) {
      await this.model.bulkWrite(ops);
    }
    return this.model.find().sort({ sort: 1, createdAt: 1 }).lean();
  }
}
