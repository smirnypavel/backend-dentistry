// Lightweight public-facing TypeScript types for the storefront
// Generated manually to align with docs/public-schemas.json

export type Lang = 'uk' | 'en';

export type I18nText = { uk: string; en?: string };

export interface AppliedDiscountInfo {
  discountId: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  priceBefore: number;
  priceAfter: number;
}

export interface ProductVariant {
  _id?: string;
  sku: string;
  manufacturerId: string;
  countryId?: string | null;
  options?: Record<string, string | number>;
  price: number;
  unit?: string | null;
  images?: string[];
  barcode?: string | null;
  isActive: boolean;
  variantKey?: string | null;
}

export interface ProductVariantWithDiscounts extends ProductVariant {
  priceOriginal: number;
  priceFinal: number;
  discountsApplied: AppliedDiscountInfo[];
}

export interface Product {
  _id?: string;
  slug: string;
  titleI18n: I18nText;
  descriptionI18n?: I18nText;
  categoryIds: string[];
  tags: string[];
  images: string[];
  attributes: { key: string; value: string | number | boolean }[];
  variants: ProductVariant[];
  manufacturerIds: string[];
  countryIds: string[];
  priceMin: number;
  priceMax: number;
  optionsSummary: Record<string, Array<string | number>>;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductWithDiscounts extends Product {
  variants: ProductVariantWithDiscounts[];
  priceMinFinal: number;
  priceMaxFinal: number;
}

export interface Category {
  _id?: string;
  slug: string;
  nameI18n: I18nText;
  descriptionI18n?: I18nText;
  imageUrl?: string | null;
  sort?: number | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Manufacturer {
  _id?: string;
  nameI18n: I18nText;
  slug: string;
  countryIds: string[];
  logoUrl?: string | null;
  bannerUrl?: string | null;
  website?: string | null;
  descriptionI18n?: I18nText;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Country {
  _id?: string;
  code: string;
  nameI18n: I18nText;
  slug: string;
  flagUrl?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrderItemSnapshot {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
  priceOriginal: number;
  title: string;
  options?: Record<string, string | number>;
  manufacturerId?: string | null;
  countryId?: string | null;
  unit?: string | null;
  discountsApplied: AppliedDiscountInfo[];
}

export type OrderStatus = 'new' | 'processing' | 'done' | 'cancelled';

export interface Order {
  _id?: string;
  phone: string;
  clientId: string;
  items: OrderItemSnapshot[];
  itemsTotal: number;
  deliveryFee?: number;
  total: number;
  status: OrderStatus;
  name?: string | null;
  comment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateOrderItem {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
  title?: string | null;
  options?: Record<string, string | number>;
  manufacturerId?: string | null;
  countryId?: string | null;
  unit?: string | null;
}

export interface CreateOrderRequest {
  phone: string;
  clientId: string;
  items: CreateOrderItem[];
  deliveryFee?: number;
  name?: string;
  comment?: string;
}

export interface ProductListResponse {
  items: ProductWithDiscounts[];
  page: number;
  limit: number;
  total: number;
}

// i18n helper
export declare function pickI18n(i18n: I18nText | undefined, lang: Lang): string;
