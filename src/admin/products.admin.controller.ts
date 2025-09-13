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
import { HydratedDocument, Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductVariant } from '../catalog/products/product.schema';
import { AdminGuard } from './admin.guard';
import { Type } from 'class-transformer';
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
    const { q, page = 1, limit = 20 } = query;
    const sortSpec = parseSort(query.sort) ?? { createdAt: -1 };
    const filter: Record<string, unknown> = {};
    if (q) filter.$text = { $search: q };
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
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
}
