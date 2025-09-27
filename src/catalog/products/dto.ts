import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

function toArray<T>(value: undefined | null | T | T[]): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value as T];
}

export class FindProductsQueryDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Case-insensitive substring search by i18n title/description (uk/en), slug, or SKU. Escaped as literal.',
  })
  @IsOptional()
  @IsString()
  qLike?: string;

  @ApiPropertyOptional({ description: 'Category ID (ObjectId)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: [String], description: 'Manufacturer ID(s)' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    toArray<string>(value as string | string[] | null | undefined),
  )
  @IsArray()
  @IsString({ each: true })
  manufacturerId?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Country ID(s)' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    toArray<string>(value as string | string[] | null | undefined),
  )
  @IsArray()
  @IsString({ each: true })
  countryId?: string[];

  @ApiPropertyOptional({ description: 'Minimal price (inclusive)' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value as unknown as string)
      : undefined,
  )
  @IsNumber()
  priceFrom?: number;

  @ApiPropertyOptional({ description: 'Maximal price (inclusive)' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value as unknown as string)
      : undefined,
  )
  @IsNumber()
  priceTo?: number;

  @ApiPropertyOptional({ description: 'Variant options filter as JSON object, e.g. {"size":"M"}' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'object') return value as Record<string, string | number>;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as unknown as Record<string, string | number>;
      } catch {
        return undefined;
      }
    }
    return undefined;
  })
  @IsObject()
  options?: Record<string, string | number>;

  @ApiPropertyOptional({ type: [String], description: 'Tags to include (any of)' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    toArray<string>(value as string | string[] | null | undefined),
  )
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description:
      'Variant options filter map collected automatically from query params like opt.<key>=<value> (e.g. opt.size=2g&opt.shade=A2). Repeat params for OR conditions.',
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
  })
  @IsOptional()
  @Transform(({ obj }) => {
    const res: Record<string, string[]> = {};
    const source = (obj ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(source)) {
      if (!k.startsWith('opt.')) continue;
      const key = k.slice(4).trim();
      if (!key) continue;
      const values = Array.isArray(v) ? (v as unknown[]) : [v];
      const strs = values
        .filter((x) => x !== undefined && x !== null)
        .map((x) => String(x as unknown));
      if (!res[key]) res[key] = [];
      res[key].push(...strs);
    }
    return res;
  })
  opt?: Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Sort expression, e.g. -priceMin,titleI18n.uk',
    default: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
