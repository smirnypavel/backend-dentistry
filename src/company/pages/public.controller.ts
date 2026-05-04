import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';

@ApiTags('pages')
@Controller('pages')
export class PagesPublicController {
  constructor(private readonly service: PagesService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Get page content by key (about | delivery | contacts-page)' })
  getByKey(@Param('key') key: string) {
    return this.service.getByKey(key);
  }
}
