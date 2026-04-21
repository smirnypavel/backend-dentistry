import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdminGuard } from './admin.guard';
import { ReviewsService } from '../reviews/reviews.service';

class AdminCreateReviewDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  comment?: string;
}

class AdminUpdateReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;
}

class ListReviewsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsEnum(['true', 'false'])
  isApproved?: 'true' | 'false';
}

@ApiTags('admin')
@ApiBearerAuth()
@ApiSecurity('admin')
@UseGuards(AdminGuard)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews' })
  listAll(@Query() query: ListReviewsQueryDto) {
    const isApproved =
      query.isApproved === undefined
        ? undefined
        : query.isApproved === 'true';
    return this.reviewsService.listAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      isApproved,
    });
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Admin adds a review directly (auto-approved)' })
  @ApiBody({ type: AdminCreateReviewDto })
  async create(@Body() body: AdminCreateReviewDto) {
    return this.reviewsService.create({
      productId: body.productId,
      authorName: body.authorName || 'Адміністратор',
      rating: body.rating,
      comment: body.comment,
      isApproved: true,
      source: 'admin',
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review (approve, edit)' })
  @ApiBody({ type: AdminUpdateReviewDto })
  async update(@Param('id') id: string, @Body() body: AdminUpdateReviewDto) {
    const updated = await this.reviewsService.update(id, body);
    if (!updated) throw new NotFoundException('Review not found');
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review' })
  async remove(@Param('id') id: string) {
    const removed = await this.reviewsService.remove(id);
    if (!removed) throw new NotFoundException('Review not found');
    return { deleted: true };
  }
}
