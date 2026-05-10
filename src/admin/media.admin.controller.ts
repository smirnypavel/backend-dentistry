/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { UploadsService } from './uploads.service';
import { IsString, MaxLength, MinLength } from 'class-validator';

class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  path!: string; // e.g. "products/braces"
}

class DeleteFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  path!: string;
}

@ApiTags('admin:media')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly uploads: UploadsService) {}

  /** List root folders or sub-folders of a given prefix */
  @Get('folders')
  @ApiOperation({ summary: 'List Cloudinary folders' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Parent folder path' })
  async listFolders(@Query('prefix') prefix?: string) {
    return this.uploads.listFolders(prefix);
  }

  /** List files in a folder */
  @Get('files')
  @ApiOperation({ summary: 'List files in a Cloudinary folder' })
  @ApiQuery({ name: 'folder', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  async listFiles(@Query('folder') folder?: string, @Query('cursor') cursor?: string) {
    return this.uploads.listFiles(folder, cursor);
  }

  /** Create a folder */
  @Post('folders')
  @ApiOperation({ summary: 'Create a Cloudinary folder' })
  async createFolder(@Body() dto: CreateFolderDto) {
    const path = String(dto.path ?? '').trim().replace(/\/+$/, '');
    if (!path) throw new BadRequestException('path is required');
    return this.uploads.createFolder(path);
  }

  /** Delete an empty folder */
  @Delete('folders')
  @ApiOperation({ summary: 'Delete a Cloudinary folder (must be empty)' })
  async deleteFolder(@Body() dto: DeleteFolderDto) {
    const path = String(dto.path ?? '').trim().replace(/\/+$/, '');
    if (!path) throw new BadRequestException('path is required');
    return this.uploads.deleteFolder(path);
  }
}
