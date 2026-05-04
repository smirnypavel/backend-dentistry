import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { PagesService } from '../company/pages/pages.service';

@ApiTags('admin:pages')
@ApiBearerAuth()
@ApiSecurity('admin')
@UseGuards(AdminGuard)
@Controller('admin/pages')
export class AdminPagesController {
  constructor(private readonly service: PagesService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Get page content by key' })
  getByKey(@Param('key') key: string) {
    return this.service.getByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Replace page content by key' })
  @ApiBody({ schema: { type: 'object' } })
  upsertByKey(@Param('key') key: string, @Body() body: Record<string, unknown>) {
    return this.service.upsertByKey(key, body);
  }
}
