/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import {
  ApiConsumes,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';
import type { Express } from 'express';
import { IsOptional, IsString, MaxLength } from 'class-validator';

class UploadImageBodyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string; // e.g., products/, categories/, manufacturers/
}

function isMulterFile(x: unknown): x is Express.Multer.File {
  return typeof x === 'object' && x !== null && 'buffer' in x && 'originalname' in x;
}

class UploadImageResponseDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/<cloud>/image/upload/v1690000000/abc.jpg' })
  url!: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/<cloud>/image/upload/v1690000000/abc.jpg',
    nullable: true,
  })
  secure_url?: string;

  @ApiProperty({ example: 'products/abc' })
  public_id!: string;

  @ApiProperty({ example: 1024, nullable: true })
  width?: number;

  @ApiProperty({ example: 768, nullable: true })
  height?: number;

  @ApiProperty({ example: 'jpg', nullable: true })
  format?: string;
}

@ApiTags('admin:uploads')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@Controller('admin/uploads')
export class AdminUploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'products' },
      },
      required: ['file'],
    },
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOkResponse({ type: UploadImageResponseDto })
  async uploadImage(@UploadedFile() file: unknown, @Body() body?: UploadImageBodyDto) {
    if (!isMulterFile(file)) throw new BadRequestException('File is required');
    const f = file; // narrowed by type guard
    const buffer: Buffer | undefined = (f.buffer as unknown as Buffer) ?? undefined;
    const originalname: string = String(f.originalname);
    if (!buffer) throw new BadRequestException('File is required');
    const folder = body?.folder ? String(body.folder).replace(/\/+$/g, '') : undefined;
    const res = await this.uploads.uploadBuffer(buffer, originalname, folder);
    return res; // { url, secure_url, public_id, width, height, format }
  }
}
