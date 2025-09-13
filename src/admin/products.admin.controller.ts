import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductVariant } from '../catalog/products/product.schema';
import { AdminGuard } from './admin.guard';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

type Mixed = string | number | boolean | null;

class ProductVariantDto {
  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty({ description: 'Manufacturer ObjectId' })
  @IsString()
  manufacturerId!: string;

  @ApiPropertyOptional({ description: 'Country ObjectId' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Variant options as key-value' })
  @IsOptional()
  options?: Record<string, Mixed>;

  @ApiProperty()
  @IsNumber()
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class CreateVariantDto {
  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty({ description: 'Manufacturer ObjectId' })
  @IsString()
  manufacturerId!: string;

  @ApiPropertyOptional({ description: 'Country ObjectId' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ description: 'Variant options' })
  @IsOptional()
  options?: Record<string, Mixed>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Manufacturer ObjectId' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Country ObjectId' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Unit price' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Variant options' })
  @IsOptional()
  options?: Record<string, Mixed>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class BulkVariantTargetDto {
  @ApiProperty({ description: 'Product ObjectId' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Variant ObjectId (preferred)' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Variant SKU (fallback if variantId is not provided)' })
  @IsOptional()
  @IsString()
  sku?: string;
}

class BulkVariantPatchDto {
  @ApiPropertyOptional({ description: 'New price for variant' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Set variant active state' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Unit label (e.g., шт)' })
  @IsOptional()
  @IsString()
  unit?: string;
}

class BulkUpdateVariantsDto {
  @ApiProperty({ type: [BulkVariantTargetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkVariantTargetDto)
  targets!: BulkVariantTargetDto[];

  @ApiProperty({ type: BulkVariantPatchDto })
  @ValidateNested()
  @Type(() => BulkVariantPatchDto)
  patch!: BulkVariantPatchDto;
}

class BulkProductIdsDto {
  @ApiProperty({ type: [String], description: 'Product ObjectIds' })
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}

class BulkProductActiveDto extends BulkProductIdsDto {
  @ApiProperty({ description: 'Set product isActive' })
  @IsBoolean()
  isActive!: boolean;
}

class BulkTagsDto extends BulkProductIdsDto {
  @ApiProperty({ type: [String], description: 'Tags to add/remove' })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

class BulkCategoriesDto extends BulkProductIdsDto {
  @ApiProperty({ type: [String], description: 'Category ObjectIds to add/remove' })
  @IsArray()
  @IsString({ each: true })
  categoryIds!: string[];
}

class AdjustPriceDto {
  @ApiPropertyOptional({ description: 'Percent change, e.g. 10 for +10%, -5 for -5%' })
  @IsOptional()
  @IsNumber()
  percent?: number;

  @ApiPropertyOptional({ description: 'Delta change (absolute), e.g. 25 to +25, -50 to -50' })
  @IsOptional()
  @IsNumber()
  delta?: number;
}

class BulkAdjustVariantPricesDto {
  @ApiProperty({ type: [BulkVariantTargetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkVariantTargetDto)
  targets!: BulkVariantTargetDto[];

  @ApiProperty({ type: AdjustPriceDto })
  @ValidateNested()
  @Type(() => AdjustPriceDto)
  patch!: AdjustPriceDto;
}

class ProductAttributeDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] })
  value!: Mixed;
}

class CreateProductDto {
  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [ProductAttributeDto] })
  @IsOptional()
  attributes?: { key: string; value: Mixed }[];

  @ApiProperty({ type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [ProductAttributeDto] })
  @IsOptional()
  attributes?: { key: string; value: Mixed }[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

function toObjectId(id?: string): Types.ObjectId | undefined {
  if (!id) return undefined;
  return new Types.ObjectId(id);
}

function mapDtoToDoc(dto: CreateProductDto | UpdateProductDto): Partial<Product> {
  const mapped: Partial<Product> = {};
  if ('slug' in dto && dto.slug !== undefined) mapped.slug = dto.slug as never;
  if ('title' in dto && dto.title !== undefined) mapped.title = dto.title as never;
  if ('description' in dto && dto.description !== undefined)
    mapped.description = dto.description as never;
  if ('categoryIds' in dto && dto.categoryIds !== undefined)
    mapped.categoryIds = (dto.categoryIds ?? []).map((id) => new Types.ObjectId(id));
  if ('tags' in dto && dto.tags !== undefined) mapped.tags = dto.tags as never;
  if ('images' in dto && dto.images !== undefined) mapped.images = dto.images as never;
  if ('attributes' in dto && dto.attributes !== undefined)
    mapped.attributes = dto.attributes as never;
  if ('isActive' in dto && dto.isActive !== undefined) mapped.isActive = dto.isActive as never;

  if ('variants' in dto && dto.variants !== undefined) {
    mapped.variants = (dto.variants ?? []).map((v) => ({
      sku: v.sku,
      manufacturerId: toObjectId(v.manufacturerId)!,
      countryId: toObjectId(v.countryId),
      options: v.options ?? {},
      price: v.price,
      unit: v.unit,
      images: v.images ?? [],
      barcode: v.barcode,
      isActive: v.isActive ?? true,
    })) as never;
  }
  return mapped;
}

function normalizeVariantOptions(obj?: Record<string, Mixed>): Record<string, string | number> {
  const res: Record<string, string | number> = {};
  const entries = Object.entries(obj ?? {});
  for (const [k, v] of entries) {
    if (typeof v === 'string' || typeof v === 'number') res[k] = v;
    else if (typeof v === 'boolean') res[k] = v ? 'true' : 'false';
    else if (v === null) res[k] = '';
  }
  return res;
}

class AdminListProductsQueryDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Case-insensitive substring search (title, slug, description, variants.sku). Useful for live search/autocomplete.',
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
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  manufacturerId?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Country ID(s)' })
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  countryId?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Tags (any of)' })
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Active state filter' })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort expression, e.g. -createdAt,title' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Variant options filter map. Built automatically from query params like opt.<key>=<value> (e.g. opt.size=2g&opt.shade=A2). Values can be repeated to form OR conditions.',
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
}

class AdminAutocompleteQueryDto {
  @ApiPropertyOptional({ description: 'Full-text search query (uses Mongo text index)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Case-insensitive substring search (title, slug, description, variants.sku). Recommended for live typeahead.',
  })
  @IsOptional()
  @IsString()
  qLike?: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}

function parseSort(sort?: string): Record<string, 1 | -1> | undefined {
  if (!sort) return undefined;
  const result: Record<string, 1 | -1> = {};
  for (const part of sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (part.startsWith('-')) result[part.slice(1)] = -1;
    else result[part] = 1;
  }
  return Object.keys(result).length ? result : undefined;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Basic transliteration for Russian letters to ASCII approximations
function transliterate(input: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };
  return input
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      const rep = map[lower];
      return rep !== undefined ? rep : ch;
    })
    .join('');
}

function slugify(text: string): string {
  const ascii = transliterate(text);
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueSlug(model: Model<ProductDocument>, base: string): Promise<string> {
  const candidate = base || 'item';
  // if base is empty, fallback to 'item'
  let suffix = 1;
  // try base, then base-2, base-3, ...
  // Note: using exists() for efficiency
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // avoid trailing hyphen before adding suffix
    const normalized = candidate.replace(/-+$/g, '');
    const probe = suffix === 1 ? normalized : `${normalized}-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await model.exists({ slug: probe });
    if (!exists) return probe;
    suffix += 1;
  }
}

async function ensureUniqueSlugExcludingId(
  model: Model<ProductDocument>,
  base: string,
  excludeId: Types.ObjectId,
): Promise<string> {
  const candidate = base || 'item';
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const normalized = candidate.replace(/-+$/g, '');
    const probe = suffix === 1 ? normalized : `${normalized}-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await model.exists({ slug: probe, _id: { $ne: excludeId } });
    if (!exists) return probe;
    suffix += 1;
  }
}

@ApiTags('admin:products')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@Controller('admin/products')
@ApiExtraModels(
  ProductVariantDto,
  ProductAttributeDto,
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
)
export class AdminProductsController {
  constructor(@InjectModel(Product.name) private readonly model: Model<ProductDocument>) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete products (minimal fields for typeahead)' })
  @ApiOkResponse({
    description: 'Array of lightweight matches',
    schema: {
      example: [
        {
          _id: '665f1a2b3c4d5e6f7a8b9c0d',
          title: 'Композит универсальный',
          slug: 'kompozit-universalnyj',
          priceMin: 350,
          priceMax: 480,
          matchedSkus: ['UC-1', 'UC-2'],
        },
      ],
    },
  })
  async autocomplete(@Query() query: AdminAutocompleteQueryDto) {
    const { q, qLike } = query;
    let { limit = 10 } = query;
    if (!Number.isFinite(limit) || limit <= 0) limit = 10;
    if (limit > 20) limit = 20;

    const filter: Record<string, unknown> = {};
    const andClauses: Record<string, unknown>[] = [];
    if (q) filter.$text = { $search: q };
    let rx: RegExp | undefined;
    if (qLike && qLike.trim()) {
      rx = new RegExp(escapeRegex(qLike.trim()), 'i');
      andClauses.push({
        $or: [{ title: rx }, { slug: rx }, { description: rx }, { 'variants.sku': rx }],
      });
    }
    const finalFilter = andClauses.length ? { $and: [filter, ...andClauses] } : filter;

    // Project minimal fields only
    const projection = {
      title: 1,
      slug: 1,
      priceMin: 1,
      priceMax: 1,
      variants: 1,
    } as const;

    type AutocompleteLean = {
      _id: Types.ObjectId;
      title: string;
      slug: string;
      priceMin: number;
      priceMax: number;
      variants?: Array<{ sku?: string }>;
    };

    const items = (await this.model
      .find(finalFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(projection)
      .lean()
      .exec()) as AutocompleteLean[];

    // Map to minimal shape and compute matched SKUs if qLike is provided
    const result = items.map((p: AutocompleteLean) => {
      const matchedSkus: string[] = [];
      const allSkus: string[] = (p.variants ?? []).map((v) => v.sku ?? '').filter((s) => s !== '');
      if (rx) {
        for (const s of allSkus) {
          if (rx.test(s)) matchedSkus.push(s);
          if (matchedSkus.length >= 5) break;
        }
      } else {
        matchedSkus.push(...allSkus.slice(0, 3));
      }
      return {
        _id: p._id,
        title: p.title,
        slug: p.slug,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        matchedSkus,
      };
    });

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List products (paginated)' })
  @ApiOkResponse({
    description: 'Paginated products list',
    schema: {
      example: {
        items: [
          {
            _id: '665f1a2b3c4d5e6f7a8b9c0d',
            slug: 'universal-composite',
            title: 'Композит универсальный',
            priceMin: 350,
            priceMax: 480,
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      },
    },
  })
  async findAll(@Query() query: AdminListProductsQueryDto) {
    const { q, qLike, page = 1, limit = 20 } = query;
    const sortSpec = parseSort(query.sort) ?? { createdAt: -1 };
    const filter: Record<string, unknown> = {};
    const andClauses: Record<string, unknown>[] = [];
    if (q) filter.$text = { $search: q };
    if (qLike && qLike.trim()) {
      const rx = new RegExp(escapeRegex(qLike.trim()), 'i');
      andClauses.push({
        $or: [{ title: rx }, { slug: rx }, { description: rx }, { 'variants.sku': rx }],
      });
    }
    if (query.isActive !== undefined) filter.isActive = !!query.isActive;
    if (query.category) filter.categoryIds = new Types.ObjectId(query.category);
    if (query.manufacturerId?.length)
      filter.manufacturerIds = { $in: query.manufacturerId.map((id) => new Types.ObjectId(id)) };
    if (query.countryId?.length)
      filter.countryIds = { $in: query.countryId.map((id) => new Types.ObjectId(id)) };
    if (query.tags?.length) filter.tags = { $in: query.tags };

    // Variant options filters collected into query.opt
    const optionPairs: Record<string, string[]> = query.opt ?? {};
    if (Object.keys(optionPairs).length) {
      const elem: Record<string, unknown> = {};
      for (const [optKey, rawVals] of Object.entries(optionPairs)) {
        // Build flexible matcher allowing numeric equality both as string and number
        const candidates = new Set<unknown>();
        for (const raw of rawVals) {
          const s = String(raw);
          candidates.add(s);
          const num = Number(s);
          if (Number.isFinite(num) && s.trim() !== '' && String(num) === s) {
            candidates.add(num);
          }
        }
        const arr = Array.from(candidates);
        elem[`options.${optKey}`] = arr.length > 1 ? { $in: arr } : arr[0];
      }
      filter.variants = { $elemMatch: elem };
    }

    const finalFilter = andClauses.length ? { $and: [filter, ...andClauses] } : filter;
    const [items, total] = await Promise.all([
      this.model
        .find(finalFilter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(finalFilter),
    ]);
    return { items, page, limit, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiOkResponse({
    description: 'Product document',
    schema: {
      example: {
        _id: '665f1a2b3c4d5e6f7a8b9c0d',
        slug: 'universal-composite',
        title: 'Композит универсальный',
        description: 'Описание...',
        categoryIds: [],
        tags: ['popular'],
        images: [],
        attributes: [{ key: 'purpose', value: 'restoration' }],
        variants: [
          {
            _id: '665f0000000000000000a001',
            sku: 'UC-1',
            manufacturerId: '665f00000000000000001001',
            countryId: '665f00000000000000002001',
            options: { shade: 'A2', size: '2g' },
            price: 350,
            unit: 'шт',
            images: [],
            barcode: '482000000001',
            isActive: true,
            variantKey: '...',
          },
        ],
        manufacturerIds: [],
        countryIds: [],
        priceMin: 350,
        priceMax: 480,
        optionsSummary: { shade: ['A2'] },
        isActive: true,
        createdAt: '2025-09-10T12:00:00.000Z',
        updatedAt: '2025-09-10T12:00:00.000Z',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.model.findById(id).lean();
  }

  @Post()
  @ApiOperation({ summary: 'Create product (recomputes aggregates)' })
  @ApiOkResponse({ description: 'Created product' })
  @ApiBody({ type: CreateProductDto })
  async create(@Body() dto: CreateProductDto) {
    const patch = mapDtoToDoc(dto);
    // Auto-generate slug if missing, ensure uniqueness
    let desiredSlug = (dto.slug ?? '').trim();
    if (!desiredSlug) {
      desiredSlug = slugify(dto.title ?? '');
    } else {
      desiredSlug = slugify(desiredSlug);
    }
    patch.slug = await ensureUniqueSlug(this.model, desiredSlug);

    const doc = new this.model(patch);
    await (doc as HydratedDocument<Product>).save();
    return doc.toObject();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product (recomputes aggregates)' })
  @ApiOkResponse({ description: 'Updated product' })
  @ApiBody({ type: UpdateProductDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const doc = await this.model.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('Product not found');
    const patch = mapDtoToDoc(dto);
    // Update slug if explicitly provided; keep stable otherwise
    if (dto.slug !== undefined) {
      const desired = slugify((dto.slug ?? '').trim() || doc.title || '');
      if (desired && desired !== doc.slug) {
        patch.slug = await ensureUniqueSlugExcludingId(this.model, desired, doc._id);
      } else if (!desired) {
        // empty slug provided → regenerate from title
        const regen = slugify(doc.title || '');
        patch.slug = await ensureUniqueSlugExcludingId(this.model, regen, doc._id);
      }
    }
    Object.assign(doc, patch);
    await (doc as HydratedDocument<Product>).save();
    return doc.toObject();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiOkResponse({ description: 'Deleted product' })
  remove(@Param('id') id: string) {
    return this.model.findByIdAndDelete(new Types.ObjectId(id)).lean();
  }

  // ---- Variants management ----

  @Post(':id/variants')
  @ApiOperation({ summary: 'Add product variant' })
  @ApiBody({ type: CreateVariantDto })
  @ApiOkResponse({ description: 'Updated product with new aggregates' })
  async addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    const doc = await this.model.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('Product not found');
    // check duplicate SKU within the same product
    const hasSku = doc.variants.some((v) => v.sku === dto.sku);
    if (hasSku) throw new BadRequestException('Variant with this SKU already exists');
    const variant: ProductVariant = {
      sku: dto.sku,
      manufacturerId: toObjectId(dto.manufacturerId)!,
      countryId: toObjectId(dto.countryId),
      options: normalizeVariantOptions(dto.options),
      price: dto.price,
      unit: dto.unit,
      images: dto.images ?? [],
      barcode: dto.barcode,
      isActive: dto.isActive ?? true,
    } as unknown as ProductVariant;
    doc.variants.push(variant);
    await (doc as HydratedDocument<Product>).save();
    return doc.toObject();
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update product variant' })
  @ApiBody({ type: UpdateVariantDto })
  @ApiOkResponse({ description: 'Updated product with recalculated aggregates' })
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    const doc = await this.model.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('Product not found');
    const idx = doc.variants.findIndex(
      (x) => String((x as unknown as { _id?: Types.ObjectId })._id) === String(variantId),
    );
    if (idx < 0) throw new NotFoundException('Variant not found');
    const v = doc.variants[idx];
    // duplicate SKU check if sku is being updated
    if (dto.sku !== undefined) {
      const conflict = doc.variants.some((x, i) => i !== idx && x.sku === dto.sku);
      if (conflict) throw new BadRequestException('Variant with this SKU already exists');
    }
    if (dto.sku !== undefined) v.sku = dto.sku;
    if (dto.manufacturerId !== undefined) v.manufacturerId = toObjectId(dto.manufacturerId)!;
    if (dto.countryId !== undefined) v.countryId = toObjectId(dto.countryId);
    if (dto.options !== undefined) v.options = normalizeVariantOptions(dto.options);
    if (dto.price !== undefined) v.price = dto.price;
    if (dto.unit !== undefined) v.unit = dto.unit;
    if (dto.images !== undefined) v.images = dto.images ?? [];
    if (dto.barcode !== undefined) v.barcode = dto.barcode;
    if (dto.isActive !== undefined) v.isActive = dto.isActive;
    await (doc as HydratedDocument<Product>).save();
    return doc.toObject();
  }

  @Delete(':id/variants/:variantId')
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiOkResponse({ description: 'Updated product after variant removal' })
  async removeVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
    const doc = await this.model.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('Product not found');
    doc.variants = doc.variants.filter(
      (x) => String((x as unknown as { _id?: Types.ObjectId })._id) !== String(variantId),
    );
    const removed = doc.isModified('variants');
    if (!removed) throw new NotFoundException('Variant not found');
    await (doc as HydratedDocument<Product>).save();
    return doc.toObject();
  }

  @Patch('bulk/variants')
  @ApiOperation({ summary: 'Bulk update product variants (price/isActive/unit)' })
  @ApiBody({ type: BulkUpdateVariantsDto })
  @ApiOkResponse({
    description:
      'Result of bulk updates: per-target status. Aggregates are recalculated for each affected product.',
  })
  async bulkUpdateVariants(@Body() body: BulkUpdateVariantsDto) {
    const results: Array<{
      productId: string;
      variantId?: string;
      sku?: string;
      status: 'ok' | 'not-found' | 'skipped';
      reason?: string;
    }> = [];

    if (!body.patch || Object.keys(body.patch).length === 0) {
      return { updated: 0, results: [], message: 'Empty patch — nothing to do' };
    }

    const byProduct = new Map<string, BulkVariantTargetDto[]>();
    for (const t of body.targets ?? []) {
      if (!t?.productId) continue;
      const list = byProduct.get(t.productId) ?? [];
      list.push(t);
      byProduct.set(t.productId, list);
    }

    let updatedCount = 0;
    for (const [productId, targets] of byProduct.entries()) {
      const doc = await this.model.findById(new Types.ObjectId(productId));
      if (!doc) {
        for (const t of targets) {
          results.push({ productId, variantId: t.variantId, sku: t.sku, status: 'not-found' });
        }
        continue;
      }

      let touched = false;
      for (const t of targets) {
        const idx = t.variantId
          ? doc.variants.findIndex(
              (x) => String((x as unknown as { _id?: Types.ObjectId })._id) === String(t.variantId),
            )
          : t.sku
            ? doc.variants.findIndex((x) => x.sku === t.sku)
            : -1;
        if (idx < 0) {
          results.push({ productId, variantId: t.variantId, sku: t.sku, status: 'not-found' });
          continue;
        }
        const v = doc.variants[idx];
        if (body.patch.price !== undefined) v.price = body.patch.price;
        if (body.patch.isActive !== undefined) v.isActive = body.patch.isActive;
        if (body.patch.unit !== undefined) v.unit = body.patch.unit;
        touched = true;
        updatedCount += 1;
        const vId = String((v as unknown as { _id?: Types.ObjectId })._id ?? '');
        results.push({
          productId,
          variantId: vId,
          sku: v.sku,
          status: 'ok',
        });
      }

      if (touched) {
        await (doc as HydratedDocument<Product>).save();
      }
    }

    return { updated: updatedCount, results };
  }

  // ---- Bulk operations on products ----

  @Patch('bulk/active')
  @ApiOperation({ summary: 'Bulk toggle products active state' })
  @ApiBody({ type: BulkProductActiveDto })
  @ApiOkResponse({ description: 'Number of products updated' })
  async bulkToggleActive(@Body() body: BulkProductActiveDto) {
    const ids = (body.productIds ?? []).filter(Boolean).map((id) => new Types.ObjectId(id));
    if (!ids.length) return { matched: 0, modified: 0 };
    const res = await this.model.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: !!body.isActive } },
    );
    // Mongoose returns different result shapes depending on version; normalize
    const matched =
      (res as unknown as { matchedCount?: number; n?: number }).matchedCount ??
      (res as unknown as { n?: number }).n ??
      0;
    const modified =
      (res as unknown as { modifiedCount?: number; nModified?: number }).modifiedCount ??
      (res as unknown as { nModified?: number }).nModified ??
      0;
    return { matched, modified };
  }

  @Patch('bulk/tags/add')
  @ApiOperation({ summary: 'Bulk add tags to products' })
  @ApiBody({ type: BulkTagsDto })
  @ApiOkResponse({ description: 'Number of products updated' })
  async bulkAddTags(@Body() body: BulkTagsDto) {
    const ids = (body.productIds ?? []).filter(Boolean).map((id) => new Types.ObjectId(id));
    const tags = Array.from(
      new Set((body.tags ?? []).filter((t) => typeof t === 'string' && t.trim() !== '')),
    );
    if (!ids.length || !tags.length) return { matched: 0, modified: 0 };
    const res = await this.model.updateMany(
      { _id: { $in: ids } },
      { $addToSet: { tags: { $each: tags } } },
    );
    const matched =
      (res as unknown as { matchedCount?: number; n?: number }).matchedCount ??
      (res as unknown as { n?: number }).n ??
      0;
    const modified =
      (res as unknown as { modifiedCount?: number; nModified?: number }).modifiedCount ??
      (res as unknown as { nModified?: number }).nModified ??
      0;
    return { matched, modified };
  }

  @Patch('bulk/tags/remove')
  @ApiOperation({ summary: 'Bulk remove tags from products' })
  @ApiBody({ type: BulkTagsDto })
  @ApiOkResponse({ description: 'Number of products updated' })
  async bulkRemoveTags(@Body() body: BulkTagsDto) {
    const ids = (body.productIds ?? []).filter(Boolean).map((id) => new Types.ObjectId(id));
    const tags = Array.from(
      new Set((body.tags ?? []).filter((t) => typeof t === 'string' && t.trim() !== '')),
    );
    if (!ids.length || !tags.length) return { matched: 0, modified: 0 };
    const res = await this.model.updateMany(
      { _id: { $in: ids } },
      { $pull: { tags: { $in: tags } } },
    );
    const matched =
      (res as unknown as { matchedCount?: number; n?: number }).matchedCount ??
      (res as unknown as { n?: number }).n ??
      0;
    const modified =
      (res as unknown as { modifiedCount?: number; nModified?: number }).modifiedCount ??
      (res as unknown as { nModified?: number }).nModified ??
      0;
    return { matched, modified };
  }

  @Patch('bulk/categories/add')
  @ApiOperation({ summary: 'Bulk add categories to products' })
  @ApiBody({ type: BulkCategoriesDto })
  @ApiOkResponse({ description: 'Number of products updated' })
  async bulkAddCategories(@Body() body: BulkCategoriesDto) {
    const ids = (body.productIds ?? []).filter(Boolean).map((id) => new Types.ObjectId(id));
    const cats = Array.from(
      new Set((body.categoryIds ?? []).filter((t) => typeof t === 'string' && t.trim() !== '')),
    ).map((id) => new Types.ObjectId(id));
    if (!ids.length || !cats.length) return { matched: 0, modified: 0 };
    const res = await this.model.updateMany(
      { _id: { $in: ids } },
      { $addToSet: { categoryIds: { $each: cats } } },
    );
    const matched =
      (res as unknown as { matchedCount?: number; n?: number }).matchedCount ??
      (res as unknown as { n?: number }).n ??
      0;
    const modified =
      (res as unknown as { modifiedCount?: number; nModified?: number }).modifiedCount ??
      (res as unknown as { nModified?: number }).nModified ??
      0;
    return { matched, modified };
  }

  @Patch('bulk/categories/remove')
  @ApiOperation({ summary: 'Bulk remove categories from products' })
  @ApiBody({ type: BulkCategoriesDto })
  @ApiOkResponse({ description: 'Number of products updated' })
  async bulkRemoveCategories(@Body() body: BulkCategoriesDto) {
    const ids = (body.productIds ?? []).filter(Boolean).map((id) => new Types.ObjectId(id));
    const cats = Array.from(
      new Set((body.categoryIds ?? []).filter((t) => typeof t === 'string' && t.trim() !== '')),
    ).map((id) => new Types.ObjectId(id));
    if (!ids.length || !cats.length) return { matched: 0, modified: 0 };
    const res = await this.model.updateMany(
      { _id: { $in: ids } },
      { $pull: { categoryIds: { $in: cats } } },
    );
    const matched =
      (res as unknown as { matchedCount?: number; n?: number }).matchedCount ??
      (res as unknown as { n?: number }).n ??
      0;
    const modified =
      (res as unknown as { modifiedCount?: number; nModified?: number }).modifiedCount ??
      (res as unknown as { nModified?: number }).nModified ??
      0;
    return { matched, modified };
  }

  @Patch('bulk/variants/adjust-price')
  @ApiOperation({ summary: 'Bulk adjust variant prices by percent or delta' })
  @ApiBody({ type: BulkAdjustVariantPricesDto })
  @ApiOkResponse({
    description: 'Per-target results; aggregates recalculated for affected products',
  })
  async bulkAdjustVariantPrices(@Body() body: BulkAdjustVariantPricesDto) {
    const results: Array<{
      productId: string;
      variantId?: string;
      sku?: string;
      status: 'ok' | 'not-found' | 'skipped';
      reason?: string;
      oldPrice?: number;
      newPrice?: number;
    }> = [];

    const { patch } = body;
    if (!patch || (patch.percent === undefined && patch.delta === undefined)) {
      return { updated: 0, results: [], message: 'Empty patch — provide percent or delta' };
    }

    const byProduct = new Map<string, BulkVariantTargetDto[]>();
    for (const t of body.targets ?? []) {
      if (!t?.productId) continue;
      const list = byProduct.get(t.productId) ?? [];
      list.push(t);
      byProduct.set(t.productId, list);
    }

    let updatedCount = 0;
    for (const [productId, targets] of byProduct.entries()) {
      const doc = await this.model.findById(new Types.ObjectId(productId));
      if (!doc) {
        for (const t of targets)
          results.push({ productId, variantId: t.variantId, sku: t.sku, status: 'not-found' });
        continue;
      }

      let touched = false;
      for (const t of targets) {
        const idx = t.variantId
          ? doc.variants.findIndex(
              (x) => String((x as unknown as { _id?: Types.ObjectId })._id) === String(t.variantId),
            )
          : t.sku
            ? doc.variants.findIndex((x) => x.sku === t.sku)
            : -1;
        if (idx < 0) {
          results.push({ productId, variantId: t.variantId, sku: t.sku, status: 'not-found' });
          continue;
        }
        const v = doc.variants[idx];
        const oldPrice = v.price ?? 0;
        let newPrice = oldPrice;
        if (patch.percent !== undefined)
          newPrice = Math.round((oldPrice * (100 + patch.percent)) / 100);
        if (patch.delta !== undefined) newPrice = newPrice + patch.delta;
        if (newPrice < 0) newPrice = 0;
        if (newPrice === oldPrice) {
          const vid = String((v as unknown as { _id?: Types.ObjectId })._id ?? '');
          results.push({
            productId,
            variantId: vid,
            sku: v.sku,
            status: 'skipped',
            reason: 'no-change',
            oldPrice,
            newPrice,
          });
          continue;
        }
        v.price = newPrice;
        touched = true;
        updatedCount += 1;
        {
          const vid = String((v as unknown as { _id?: Types.ObjectId })._id ?? '');
          results.push({
            productId,
            variantId: vid,
            sku: v.sku,
            status: 'ok',
            oldPrice,
            newPrice,
          });
        }
      }

      if (touched) {
        await (doc as HydratedDocument<Product>).save();
      }
    }

    return { updated: updatedCount, results };
  }

  // ---- Clone product ----

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone product (creates a copy with unique slug)' })
  @ApiOkResponse({ description: 'Cloned product' })
  async clone(
    @Param('id') id: string,
    @Body() body?: { skuSuffix?: string; titlePrefix?: string },
  ) {
    const doc = await this.model.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('Product not found');

    // Prepare new slug
    const baseSlug = slugify(doc.slug || doc.title || 'item');
    const newSlug = await ensureUniqueSlug(this.model, baseSlug);

    const skuSuffix = (body?.skuSuffix ?? '').trim();
    const titlePrefix = (body?.titlePrefix ?? '').trim();

    const cloned = new this.model({
      slug: newSlug,
      title: titlePrefix ? `${titlePrefix} ${doc.title}` : doc.title,
      description: doc.description,
      categoryIds: [...(doc.categoryIds ?? [])],
      tags: [...(doc.tags ?? [])],
      images: [...(doc.images ?? [])],
      attributes: [...(doc.attributes ?? [])],
      variants: (doc.variants ?? []).map((v) => ({
        sku: skuSuffix ? `${v.sku}${skuSuffix}` : v.sku,
        manufacturerId: v.manufacturerId,
        countryId: v.countryId,
        options: { ...(v.options ?? {}) },
        price: v.price,
        unit: v.unit,
        images: [...(v.images ?? [])],
        barcode: v.barcode,
        isActive: v.isActive !== false,
      })),
      isActive: doc.isActive !== false,
    } as unknown as Product);

    await (cloned as HydratedDocument<Product>).save();
    return cloned.toObject();
  }

  // ---- Export products ----
  @Get('export')
  @ApiOperation({ summary: 'Export products (JSON)' })
  @ApiOkResponse({ description: 'Array of products (lean JSON)' })
  async exportAll() {
    const items = await this.model.find({}).lean();
    return items;
  }
}
