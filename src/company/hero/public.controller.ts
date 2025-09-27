import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { Hero, HeroDocument } from './hero.schema';

@ApiTags('hero')
@Controller('hero')
export class HeroPublicController {
  constructor(@InjectModel(Hero.name) private readonly model: Model<HeroDocument>) {}

  @Get()
  @ApiOperation({ summary: 'Get active hero block for homepage' })
  @ApiOkResponse({
    description: 'Active hero block or null',
    schema: {
      example: {
        _id: '66bb00000000000000000001',
        titleI18n: { uk: 'Стоматология, которой доверяют', en: 'Dentistry you trust' },
        subtitleI18n: { uk: 'Здоровье зубов — наша забота' },
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/hero-desktop.jpg',
        imageUrlMobile: 'https://res.cloudinary.com/demo/image/upload/hero-mobile.jpg',
        videoUrl: null,
        cta: {
          labelI18n: { uk: 'Перейти в каталог', en: 'Go to catalog' },
          url: '/catalog',
          external: false,
        },
        theme: 'light',
        isActive: true,
        createdAt: '2025-09-27T12:00:00.000Z',
        updatedAt: '2025-09-27T12:00:00.000Z',
      },
    },
  })
  async getActive() {
    return this.model.findOne({ isActive: true }).sort({ updatedAt: -1, _id: -1 }).lean();
  }
}
