import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

function normalizePhone(input: unknown): string {
  const s = String(input ?? '')
    .replace(/[\s()-]/g, '')
    .replace(/^00/, '+');
  if (s.startsWith('+')) return s;
  // naive E.164 fallback: assume local without +, keep digits only
  const digits = s.replace(/[^0-9]/g, '');
  return digits ? `+${digits}` : '';
}

export class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ description: 'Snapshot title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Variant options snapshot' })
  @IsOptional()
  options?: Record<string, string | number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Phone in E.164 (normalized on input)' })
  @Transform(({ value }: TransformFnParams) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Client identifier from frontend' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class GetHistoryQueryDto {
  @ApiProperty({ description: 'Phone in E.164 (normalized on input)' })
  @Transform(({ value }: TransformFnParams) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Client identifier from frontend' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;
}
