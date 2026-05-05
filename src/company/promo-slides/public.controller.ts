import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { PromoSlide, PromoSlideDocument } from './promo-slide.schema';

@ApiTags('promo-slides')
@Controller('promo-slides')
export class PromoSlidesPublicController {
  constructor(
    @InjectModel(PromoSlide.name)
    private readonly model: Model<PromoSlideDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get active promo slides filtered by slot' })
  @ApiOkResponse({ description: 'Array of active promo slides sorted by sortOrder' })
  async getActive(@Query('slot') slot?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (slot) filter['slot'] = slot;
    return this.model
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
  }
}
