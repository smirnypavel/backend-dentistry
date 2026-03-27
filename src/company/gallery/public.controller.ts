import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { GalleryImage, GalleryImageDocument } from './gallery-image.schema';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryPublicController {
  constructor(
    @InjectModel(GalleryImage.name) private readonly model: Model<GalleryImageDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get active gallery images (sorted)' })
  @ApiOkResponse({ description: 'Active gallery images sorted by sort, createdAt' })
  async list() {
    return this.model
      .find({ isActive: true })
      .sort({ sort: 1, createdAt: 1 })
      .lean();
  }
}
