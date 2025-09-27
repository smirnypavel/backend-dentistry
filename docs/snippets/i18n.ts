// Tiny i18n helpers for the storefront
// Usage:
// import { pickI18n, productCard } from './i18n';

export type Lang = 'uk' | 'en';

export function pickI18n(i18n: { uk: string; en?: string } | undefined, lang: Lang): string {
  if (!i18n) return '';
  return (lang === 'en' ? i18n.en : i18n.uk) || i18n.uk || '';
}

export type ProductLike = {
  slug: string;
  titleI18n: { uk: string; en?: string };
  descriptionI18n?: { uk?: string; en?: string };
  images?: string[];
  priceMinFinal?: number;
  priceMaxFinal?: number;
};

export function productCard(p: ProductLike, lang: Lang) {
  return {
    href: `/p/${p.slug}`,
    title: pickI18n(p.titleI18n, lang),
    description: pickI18n(p.descriptionI18n as any, lang),
    image: (p.images && p.images[0]) || '',
    priceFrom: p.priceMinFinal,
    priceTo: p.priceMaxFinal,
  };
}

export type CategoryLike = {
  slug: string;
  nameI18n: { uk: string; en?: string };
  descriptionI18n?: { uk?: string; en?: string };
  imageUrl?: string | null;
};

export function categoryTile(c: CategoryLike, lang: Lang) {
  return {
    href: `/c/${c.slug}`,
    title: pickI18n(c.nameI18n, lang),
    description: pickI18n(c.descriptionI18n as any, lang),
    image: c.imageUrl || '',
  };
}

export type ManufacturerLike = {
  slug: string;
  nameI18n: { uk: string; en?: string };
  descriptionI18n?: { uk?: string; en?: string };
  logoUrl?: string | null;
  bannerUrl?: string | null;
};

export function manufacturerTile(m: ManufacturerLike, lang: Lang) {
  return {
    href: `/m/${m.slug}`,
    title: pickI18n(m.nameI18n, lang),
    description: pickI18n(m.descriptionI18n as any, lang),
    logo: m.logoUrl || '',
    banner: m.bannerUrl || '',
  };
}

export type CountryLike = {
  slug: string;
  code: string;
  nameI18n: { uk: string; en?: string };
  flagUrl?: string | null;
};

export function countryBadge(country: CountryLike, lang: Lang) {
  return {
    href: `/co/${country.slug}`,
    code: country.code,
    name: pickI18n(country.nameI18n, lang),
    flag: country.flagUrl || '',
  };
}
