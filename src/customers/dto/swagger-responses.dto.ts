import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDto } from './customer.dto';

/* ── Auth tokens ─────────────────────────────────── */

export class AuthTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken!: string;

  @ApiProperty({ example: 900, description: 'Access token TTL in seconds (15 min)' })
  accessTokenExpiresInSec!: number;

  @ApiProperty({ example: 'bearer' })
  tokenType!: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  refreshToken?: string;

  @ApiPropertyOptional({
    example: 2592000,
    description: 'Refresh token TTL in seconds (30 days)',
  })
  refreshTokenExpiresInSec?: number;
}

/* ── Register / Login result ─────────────────────── */

export class AuthResultDto {
  @ApiProperty({ type: CustomerDto })
  customer!: CustomerDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}

/* ── Simple message ──────────────────────────────── */

export class MessageResponseDto {
  @ApiProperty({ example: 'Якщо email існує, лист з інструкціями буде надіслано' })
  message!: string;
}

/* ── Discount snapshot (inside order item) ───────── */

class AppliedDiscountSnapshotDto {
  @ApiProperty({ example: 'disc001' }) discountId!: string;
  @ApiProperty({ example: 'Знижка 10%' }) name!: string;
  @ApiProperty({ enum: ['percent', 'fixed'], example: 'percent' }) type!: string;
  @ApiProperty({ example: 10 }) value!: number;
  @ApiProperty({ example: 400 }) priceBefore!: number;
  @ApiProperty({ example: 360 }) priceAfter!: number;
}

/* ── Order item snapshot ─────────────────────────── */

class OrderItemSnapshotDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' }) productId!: string;
  @ApiProperty({ example: 'UC-1' }) sku!: string;
  @ApiProperty({ example: 2 }) quantity!: number;
  @ApiProperty({ example: 360, description: 'Unit price (after discounts)' }) price!: number;
  @ApiProperty({ example: 400, description: 'Original unit price before discounts' }) priceOriginal!: number;
  @ApiProperty({ example: 'Композит універсальний' }) title!: string;
  @ApiPropertyOptional({ example: { shade: 'A2' } }) options?: Record<string, string | number>;
  @ApiPropertyOptional({ example: '665f00000000000000000001' }) manufacturerId?: string;
  @ApiPropertyOptional({ example: '665f00000000000000000002' }) countryId?: string;
  @ApiPropertyOptional({ example: 'шт' }) unit?: string;
  @ApiPropertyOptional({ example: 'https://example.com/img.jpg', description: 'Product image URL snapshot' }) image?: string;
  @ApiPropertyOptional({ type: [AppliedDiscountSnapshotDto] }) discountsApplied?: AppliedDiscountSnapshotDto[];
}

/* ── Single order ────────────────────────────────── */

export class OrderResponseDto {
  @ApiProperty({ example: '666600000000000000000001' }) _id!: string;
  @ApiProperty({ example: '+380971112233' }) phone!: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' }) clientId!: string;
  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c001' }) customerId?: string;
  @ApiProperty({ type: [OrderItemSnapshotDto] }) items!: OrderItemSnapshotDto[];
  @ApiProperty({ example: 720 }) itemsTotal!: number;
  @ApiProperty({ example: 0 }) deliveryFee!: number;
  @ApiProperty({ example: 720 }) total!: number;
  @ApiProperty({ enum: ['new', 'processing', 'done', 'cancelled'], example: 'new' }) status!: string;
  @ApiPropertyOptional({ example: 'Іван' }) name?: string;
  @ApiPropertyOptional({ example: 'Зателефонуйте перед доставкою' }) comment?: string;
  @ApiProperty({ example: '2026-02-19T12:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2026-02-19T12:00:00.000Z' }) updatedAt!: string;
}

/* ── Paginated orders response (GET /me/orders) ─── */

export class CustomerOrdersPageDto {
  @ApiProperty({ type: [OrderResponseDto] }) items!: OrderResponseDto[];
  @ApiProperty({ example: 1 }) total!: number;
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: false }) hasNextPage!: boolean;
}
