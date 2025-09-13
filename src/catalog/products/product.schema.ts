import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: true, timestamps: false })
export class ProductVariant {
  @Prop({ required: true, trim: true })
  sku!: string;

  @Prop({ type: Types.ObjectId, required: true })
  manufacturerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  countryId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  options!: Record<string, string | number>;

  @Prop({ type: Number, required: true })
  price!: number;

  @Prop({ trim: true })
  unit?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ trim: true })
  barcode?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ trim: true })
  variantKey?: string;
}

const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  categoryIds!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: [{ key: { type: String }, value: MongooseSchema.Types.Mixed }], default: [] })
  attributes?: { key: string; value: string | number | boolean }[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants!: ProductVariant[];

  // Denormalized for filters
  @Prop({ type: [Types.ObjectId], default: [] })
  manufacturerIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  countryIds!: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  priceMin!: number;

  @Prop({ type: Number, default: 0 })
  priceMax!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  optionsSummary?: Record<string, Array<string | number>>;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
// Text search
ProductSchema.index({ title: 'text', description: 'text' });
// Filters
ProductSchema.index({ categoryIds: 1, isActive: 1 });
ProductSchema.index({ manufacturerIds: 1 });
ProductSchema.index({ countryIds: 1 });
ProductSchema.index({ priceMin: 1, priceMax: 1 });
// Nested for variants
ProductSchema.index({ 'variants.manufacturerId': 1 });
ProductSchema.index({ 'variants.countryId': 1 });
ProductSchema.index({ 'variants.price': 1 });
// Note: specific options indexes (e.g., size) can be added later per usage

// Helpers to compute aggregates
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr.filter((v) => v !== undefined && v !== null)));
}

ProductSchema.pre<HydratedDocument<Product>>('save', function (next) {
  const activeVariants = (this.variants ?? []).filter((v) => v.isActive !== false);

  // variantKey
  for (const v of activeVariants) {
    const opt = v.options || {};
    const optEntries = Object.entries(opt).sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0));
    const optStr = optEntries.map(([k, val]) => `${k}=${val}`).join('|');
    const man = (v.manufacturerId as unknown as Types.ObjectId | undefined)?.toString?.() ?? '';
    const ctry = (v.countryId as unknown as Types.ObjectId | undefined)?.toString?.() ?? '';
    v.variantKey = `${man}:${ctry}:${optStr}`;
  }

  // Aggregates
  const manufacturerIds = unique(
    activeVariants.map((v) => v.manufacturerId).filter((id): id is Types.ObjectId => !!id),
  );
  const countryIds = unique(
    activeVariants.map((v) => v.countryId).filter((id): id is Types.ObjectId => !!id),
  );
  (this as unknown as HydratedDocument<Product>).manufacturerIds = manufacturerIds;
  (this as unknown as HydratedDocument<Product>).countryIds = countryIds;

  const prices = activeVariants
    .map((v) => v.price)
    .filter((p): p is number => typeof p === 'number');
  (this as unknown as HydratedDocument<Product>).priceMin = prices.length ? Math.min(...prices) : 0;
  (this as unknown as HydratedDocument<Product>).priceMax = prices.length ? Math.max(...prices) : 0;

  const summary: Record<string, Array<string | number>> = {};
  for (const v of activeVariants) {
    const opt = v.options || {};
    for (const [k, val] of Object.entries(opt)) {
      if (!summary[k]) summary[k] = [];
      if (!summary[k].includes(val as never)) summary[k].push(val as never);
    }
  }
  (this as unknown as HydratedDocument<Product>).optionsSummary = summary;

  next();
});
