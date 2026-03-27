/* eslint-disable no-console */
/**
 * Seed script — creates real categories, subcategories, manufacturers, countries
 * and 2 products per category based on actual orthostore.com.ua catalog.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-real-products.ts
 */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { CategorySchema } from '../src/catalog/categories/category.schema';
import { SubcategorySchema } from '../src/catalog/subcategories/subcategory.schema';
import { CountrySchema } from '../src/catalog/countries/country.schema';
import { ManufacturerSchema } from '../src/catalog/manufacturers/manufacturer.schema';
import { ProductSchema } from '../src/catalog/products/product.schema';

/* ─── Image helper ─── */
const IMG = (path: string) =>
  `https://orthostore.com.ua/image/cache/catalog/${path}-500x500.jpg`;

/* ─── Data ─── */

const COUNTRIES_DATA = [
  { code: 'UA', slug: 'ua', nameI18n: { uk: 'Україна', en: 'Ukraine' } },
  { code: 'IT', slug: 'it', nameI18n: { uk: 'Італія', en: 'Italy' } },
  { code: 'US', slug: 'us', nameI18n: { uk: 'США', en: 'USA' } },
  { code: 'KR', slug: 'kr', nameI18n: { uk: 'Південна Корея', en: 'South Korea' } },
  { code: 'TW', slug: 'tw', nameI18n: { uk: 'Тайвань', en: 'Taiwan' } },
  { code: 'CN', slug: 'cn', nameI18n: { uk: 'Китай', en: 'China' } },
  { code: 'AU', slug: 'au', nameI18n: { uk: 'Австралія', en: 'Australia' } },
  { code: 'BR', slug: 'br', nameI18n: { uk: 'Бразилія', en: 'Brazil' } },
];

const MANUFACTURERS_DATA = [
  { slug: 'id-logical', nameI18n: { uk: 'ID-Logical', en: 'ID-Logical' }, country: 'IT' },
  { slug: 'ormco', nameI18n: { uk: 'ORMCO', en: 'ORMCO' }, country: 'US' },
  { slug: 'lancer', nameI18n: { uk: 'LANCER Orthodontics', en: 'LANCER Orthodontics' }, country: 'US' },
  { slug: 'mico-one', nameI18n: { uk: 'MICO ONE', en: 'MICO ONE' }, country: 'TW' },
  { slug: 'speed-dental', nameI18n: { uk: 'Speed Dental', en: 'Speed Dental' }, country: 'TW' },
  { slug: 'imd', nameI18n: { uk: 'IMD', en: 'IMD' }, country: 'CN' },
  { slug: 'hubit', nameI18n: { uk: 'HUBIT', en: 'HUBIT' }, country: 'KR' },
  { slug: 'orthostore', nameI18n: { uk: 'ORTHOSTORE', en: 'ORTHOSTORE' }, country: 'UA' },
  { slug: 'mrc', nameI18n: { uk: 'MRC', en: 'MRC' }, country: 'AU' },
  { slug: 'bisco', nameI18n: { uk: 'BISCO', en: 'BISCO' }, country: 'US' },
  { slug: 'biodinamica', nameI18n: { uk: 'Biodinamica', en: 'Biodinamica' }, country: 'BR' },
  { slug: '3b', nameI18n: { uk: '3B', en: '3B' }, country: 'IT' },
  { slug: 'ortho-direct', nameI18n: { uk: 'ORTHO-DIRECT', en: 'ORTHO-DIRECT' }, country: 'US' },
  { slug: 'opro', nameI18n: { uk: 'OPRO', en: 'OPRO' }, country: 'UA' },
];

const CATEGORIES_DATA = [
  {
    slug: 'brekety',
    nameI18n: { uk: 'Брекети', en: 'Brackets' },
    descriptionI18n: { uk: 'Брекет-системи всіх типів', en: 'All types of bracket systems' },
    sort: 1,
    subcategories: [
      { slug: 'samolihuyuchi', nameI18n: { uk: 'Самолігуючі брекети', en: 'Self-ligating brackets' }, sort: 1 },
      { slug: 'estetychni', nameI18n: { uk: 'Естетичні брекети', en: 'Aesthetic brackets' }, sort: 2 },
      { slug: 'metalevi', nameI18n: { uk: 'Металеві брекети', en: 'Metal brackets' }, sort: 3 },
      { slug: 'lihaturni', nameI18n: { uk: 'Лігатурні брекети', en: 'Ligature brackets' }, sort: 4 },
    ],
  },
  {
    slug: 'shchichni-molyarni',
    nameI18n: { uk: 'Щічні трубки та молярні кільця', en: 'Buccal tubes and molar bands' },
    descriptionI18n: { uk: 'Щічні трубки для фіксації дуг та молярні кільця', en: 'Buccal tubes and molar bands' },
    sort: 2,
  },
  {
    slug: 'atachments',
    nameI18n: { uk: 'Атачменти', en: 'Attachments' },
    descriptionI18n: { uk: 'Стопори, кнопки, накусочні майданчики, пружини, лігатури', en: 'Stops, buttons, bite ramps, springs, ligatures' },
    sort: 3,
    subcategories: [
      { slug: 'stopory', nameI18n: { uk: 'Стопори', en: 'Stops' }, sort: 1 },
      { slug: 'knopky', nameI18n: { uk: 'Кнопки', en: 'Buttons' }, sort: 2 },
      { slug: 'nakusochni', nameI18n: { uk: 'Накусочні майданчики', en: 'Bite ramps' }, sort: 3 },
      { slug: 'pruzhyny', nameI18n: { uk: 'Пружини', en: 'Springs' }, sort: 4 },
      { slug: 'metalevi-lihatury', nameI18n: { uk: 'Металеві лігатури', en: 'Metal ligatures' }, sort: 5 },
    ],
  },
  {
    slug: 'duhy',
    nameI18n: { uk: 'Дуги', en: 'Archwires' },
    descriptionI18n: { uk: 'Ортодонтичні дуги для брекетів', en: 'Orthodontic archwires for brackets' },
    sort: 4,
  },
  {
    slug: 'elastychni',
    nameI18n: { uk: 'Еластичні матеріали', en: 'Elastic materials' },
    descriptionI18n: { uk: 'Ланцюжки, тяги, сепараційні кільця', en: 'Chains, elastics, separators' },
    sort: 5,
  },
  {
    slug: 'fiksatsiini',
    nameI18n: { uk: 'Фіксаційні матеріали', en: 'Bonding materials' },
    descriptionI18n: { uk: 'Адгезиви, бонди, протруювання', en: 'Adhesives, bonds, etchants' },
    sort: 6,
  },
  {
    slug: 'retraktory',
    nameI18n: { uk: 'Ретрактори', en: 'Retractors' },
    descriptionI18n: { uk: 'Ортодонтичні ретрактори та роторозширювачі', en: 'Orthodontic retractors and cheek expanders' },
    sort: 7,
  },
  {
    slug: 'dzerkala-foto',
    nameI18n: { uk: 'Дзеркала та фотоконтрастери', en: 'Mirrors and photo contrasters' },
    descriptionI18n: { uk: 'Дзеркала для фотографії та фотоконтрастери', en: 'Photography mirrors and contrasters' },
    sort: 8,
  },
  {
    slug: 'zovnishnorotovi',
    nameI18n: { uk: 'Зовнішньоротові пристосування', en: 'Extra-oral appliances' },
    descriptionI18n: { uk: 'Лицьові маски та дуги', en: 'Face masks and face bows' },
    sort: 9,
  },
  {
    slug: 'treynera-myobreysy',
    nameI18n: { uk: 'Трейнера та миобрейси', en: 'Trainers and Myobrace' },
    descriptionI18n: { uk: 'Міофункціональні апарати MRC', en: 'Myofunctional appliances MRC' },
    sort: 10,
  },
  {
    slug: 'materialy-tehnikiv',
    nameI18n: { uk: 'Матеріали для техніків', en: 'Lab technician materials' },
    descriptionI18n: { uk: 'Гвинти, пластини для кап та елайнерів', en: 'Screws, plates for aligners' },
    sort: 11,
    subcategories: [
      { slug: 'hvynty', nameI18n: { uk: 'Гвинти', en: 'Screws' }, sort: 1 },
      { slug: 'hvynty-mse', nameI18n: { uk: 'Гвинти MSE', en: 'MSE Screws' }, sort: 2 },
      { slug: 'plastyny-retentsiyni', nameI18n: { uk: 'Пластини для ретенційних кап', en: 'Retainer plates' }, sort: 3 },
      { slug: 'plastyny-elayneriv', nameI18n: { uk: 'Пластини для елайнерів', en: 'Aligner plates' }, sort: 4 },
      { slug: 'plastmassa', nameI18n: { uk: 'Пластмасса', en: 'Acrylic' }, sort: 5 },
      { slug: 'vidbytkovi', nameI18n: { uk: 'Відбиткові ложки', en: 'Impression trays' }, sort: 6 },
    ],
  },
  {
    slug: 'separatsiyni-instrumenty',
    nameI18n: { uk: 'Сепараційні інструменти', en: 'Separation instruments' },
    descriptionI18n: { uk: 'Сепараційні диски та штрипси', en: 'Separation discs and strips' },
    sort: 12,
  },
  {
    slug: 'aksesuari',
    nameI18n: { uk: 'Аксесуари', en: 'Accessories' },
    descriptionI18n: { uk: 'Віск, контейнери, маски, окуляри', en: 'Wax, containers, masks, glasses' },
    sort: 13,
  },
  {
    slug: 'instrumenty',
    nameI18n: { uk: 'Інструменти', en: 'Instruments' },
    descriptionI18n: { uk: 'Ортодонтичний інструмент', en: 'Orthodontic instruments' },
    sort: 14,
    subcategories: [
      { slug: 'instrumenty-orthostore', nameI18n: { uk: 'ORTHOSTORE', en: 'ORTHOSTORE' }, sort: 1 },
      { slug: 'instrumenty-le-med', nameI18n: { uk: 'LE MED', en: 'LE MED' }, sort: 2 },
    ],
  },
  {
    slug: 'propysy-breketiv',
    nameI18n: { uk: 'Прописи брекетів', en: 'Bracket prescriptions' },
    descriptionI18n: { uk: 'Систематизовані прописи для ортодонтів', en: 'Systematized prescriptions for orthodontists' },
    sort: 15,
  },
  {
    slug: 'mikroimplanty',
    nameI18n: { uk: 'Мікроімпланти', en: 'Micro-implants' },
    descriptionI18n: { uk: 'Ортодонтичні мікроімпланти (мініскрю)', en: 'Orthodontic micro-implants (mini-screws)' },
    sort: 16,
  },
  {
    slug: 'mini-plastyny',
    nameI18n: { uk: 'Міні пластини', en: 'Mini plates' },
    descriptionI18n: { uk: 'Міні пластини для ортодонтії та щелепно-лицьової хірургії', en: 'Mini plates for orthodontics and maxillofacial surgery' },
    sort: 17,
    subcategories: [
      { slug: 'mini-plastyny-mini', nameI18n: { uk: 'Міні пластини', en: 'Mini plates' }, sort: 1 },
      { slug: 'shchelepno-lytsova', nameI18n: { uk: 'Щелепно-лицьова хірургія', en: 'Maxillofacial surgery' }, sort: 2 },
    ],
  },
];

/* ─── Products per category (2 per category) ─── */
interface ProductDef {
  slug: string;
  titleI18n: { uk: string; en?: string };
  descriptionI18n?: { uk?: string; en?: string };
  category: string; // category slug
  tags: string[];
  images: string[];
  attributes: { key: string; value: string }[];
  variants: {
    sku: string;
    manufacturer: string; // manufacturer slug
    country: string; // country code
    options: Record<string, string>;
    price: number;
    unit: string;
    images: string[];
  }[];
}

const PRODUCTS: ProductDef[] = [
  // ═══════════════════ БРЕКЕТИ ═══════════════════
  {
    slug: 'id-logical-id-all-roth',
    titleI18n: { uk: 'Самолігуючі металеві брекети ID-Logical ID-ALL ROTH', en: 'Self-ligating metal brackets ID-Logical ID-ALL ROTH' },
    descriptionI18n: { uk: 'Самолігуючі металеві брекети з прописом ROTH .022. Набір 20 шт.', en: 'Self-ligating metal brackets ROTH .022. Set of 20 pcs.' },
    category: 'brekety',
    tags: ['самолігуючі', 'металеві', 'roth'],
    images: [IMG('id-logical__votermarki_-_yes/samoligiruyushchie_metallicheskie_brekety_id-logical_id-all_roth_022_nabor_725-400')],
    attributes: [{ key: 'Пропис', value: 'ROTH' }, { key: 'Розмір пазу', value: '.022' }],
    variants: [
      { sku: 'IDL-ALL-R-SET', manufacturer: 'id-logical', country: 'IT', options: { variant: 'Повний набір (20шт)', size: '0.22' }, price: 6500, unit: 'набір', images: [] },
      { sku: 'IDL-ALL-R-UPP', manufacturer: 'id-logical', country: 'IT', options: { variant: 'Верхня щелепа', size: '0.22' }, price: 3500, unit: 'набір', images: [] },
    ],
  },
  {
    slug: 'ormco-damon-q2-st-set',
    titleI18n: { uk: 'Самолігуючі металеві брекети ORMCO DAMON Q 2 (S.T) набір', en: 'Self-ligating metal brackets ORMCO DAMON Q 2 (S.T) set' },
    descriptionI18n: { uk: 'Самолігуючі металеві брекети Damon Q 2 покоління з технологією SpinTek.', en: 'Self-ligating metal brackets Damon Q 2 generation with SpinTek technology.' },
    category: 'brekety',
    tags: ['самолігуючі', 'металеві', 'damon', 'ormco'],
    images: [IMG('ormco_votermarki_-_yes/q2')],
    attributes: [{ key: 'Покоління', value: 'Damon Q 2' }, { key: 'Технологія', value: 'SpinTek' }],
    variants: [
      { sku: 'ORM-DQ2-ST-SET', manufacturer: 'ormco', country: 'US', options: { variant: 'Повний набір', size: '0.22' }, price: 9200, unit: 'набір', images: [] },
      { sku: 'ORM-DQ2-ST-SH', manufacturer: 'ormco', country: 'US', options: { variant: 'Шт.', size: '0.22' }, price: 600, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ЩІЧНІ ТРУБКИ ═══════════════════
  {
    slug: 'ormco-buccal-tube-bondable',
    titleI18n: { uk: 'Щічна трубка ORMCO бондувальна', en: 'ORMCO bondable buccal tube' },
    descriptionI18n: { uk: 'Щічна трубка для бондажу на моляри, нікелева сталь.', en: 'Bondable buccal tube for molars, nickel steel.' },
    category: 'shchichni-molyarni',
    tags: ['трубка', 'молярна', 'ormco'],
    images: [IMG('china_votermarki_-_yes/1shchechnye-trubki-imd-na-malyary-siamy-roth-022---022-150')],
    attributes: [{ key: 'Тип', value: 'бондувальна' }],
    variants: [
      { sku: 'ORM-BT-U', manufacturer: 'ormco', country: 'US', options: { variant: 'Верхня щелепа' }, price: 350, unit: 'шт', images: [] },
      { sku: 'ORM-BT-L', manufacturer: 'ormco', country: 'US', options: { variant: 'Нижня щелепа' }, price: 350, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'lancer-molar-band',
    titleI18n: { uk: 'Молярне кільце LANCER з трубкою', en: 'LANCER molar band with tube' },
    descriptionI18n: { uk: 'Молярне кільце з припаяною щічною трубкою для первих молярів.', en: 'Molar band with welded buccal tube for first molars.' },
    category: 'shchichni-molyarni',
    tags: ['кільце', 'молярне', 'lancer'],
    images: [IMG('china_votermarki_-_yes/1china---koljco-na-molyar-6-e-chistoe')],
    attributes: [{ key: 'Тип', value: 'кільце з трубкою' }],
    variants: [
      { sku: 'LAN-MB-U', manufacturer: 'lancer', country: 'US', options: { variant: 'Верхня щелепа' }, price: 180, unit: 'шт', images: [] },
      { sku: 'LAN-MB-L', manufacturer: 'lancer', country: 'US', options: { variant: 'Нижня щелепа' }, price: 180, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ АТАЧМЕНТИ ═══════════════════
  {
    slug: 'ormco-kobayashi-hook',
    titleI18n: { uk: 'Гачок Кобаяші ORMCO', en: 'ORMCO Kobayashi hook' },
    descriptionI18n: { uk: 'Металеві гачки Кобаяші для кріплення еластиків.', en: 'Metal Kobayashi hooks for elastic attachment.' },
    category: 'atachments',
    tags: ['гачок', 'лігатура', 'ormco'],
    images: [IMG('china_votermarki_-_yes/kryuchok_dlya_elastikov_art100-21_2')],
    attributes: [{ key: 'Матеріал', value: 'нержавіюча сталь' }],
    variants: [
      { sku: 'ORM-KH-S', manufacturer: 'ormco', country: 'US', options: { variant: 'Short' }, price: 150, unit: 'уп', images: [] },
      { sku: 'ORM-KH-L', manufacturer: 'ormco', country: 'US', options: { variant: 'Long' }, price: 150, unit: 'уп', images: [] },
    ],
  },
  {
    slug: 'imd-open-coil-spring',
    titleI18n: { uk: 'Пружина IMD відкрита Ni-Ti', en: 'IMD open coil spring Ni-Ti' },
    descriptionI18n: { uk: 'Нікель-титанова відкрита ортодонтична пружина для розширення проміжків.', en: 'Nickel-titanium open orthodontic spring for space opening.' },
    category: 'atachments',
    tags: ['пружина', 'ni-ti', 'imd'],
    images: [IMG('china_votermarki_-_yes/1pruzhina-ni-ti-distaliziruyushchaya-0')],
    attributes: [{ key: 'Матеріал', value: 'Ni-Ti' }, { key: 'Тип', value: 'відкрита' }],
    variants: [
      { sku: 'IMD-OCS-010', manufacturer: 'imd', country: 'CN', options: { size: '0.010x0.030' }, price: 80, unit: 'шт', images: [] },
      { sku: 'IMD-OCS-012', manufacturer: 'imd', country: 'CN', options: { size: '0.012x0.030' }, price: 80, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ДУГИ ═══════════════════
  {
    slug: 'ormco-damon-copper-niti-round',
    titleI18n: { uk: 'Дуга ORMCO Damon Copper Ni-Ti кругла', en: 'ORMCO Damon Copper Ni-Ti round archwire' },
    descriptionI18n: { uk: 'Мідно-нікель-титанова термоактивна кругла дуга Damon для ефективного рівняння зубів.', en: 'Copper nickel-titanium thermo-active round Damon archwire for effective leveling.' },
    category: 'duhy',
    tags: ['дуга', 'copper-niti', 'damon', 'ormco', 'кругла'],
    images: [IMG('ormco_votermarki_-_yes/duga_ormco_damon_cuniti_kruglaya_205-1909')],
    attributes: [{ key: 'Матеріал', value: 'Copper Ni-Ti' }, { key: 'Форма', value: 'кругла' }],
    variants: [
      { sku: 'ORM-DCN-R-014U', manufacturer: 'ormco', country: 'US', options: { size: '0.014', jaw: 'Верхня щелепа' }, price: 230, unit: 'шт', images: [] },
      { sku: 'ORM-DCN-R-016L', manufacturer: 'ormco', country: 'US', options: { size: '0.016', jaw: 'Нижня щелепа' }, price: 230, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'id-logical-niti-tf-rect',
    titleI18n: { uk: 'Дуга ID-Logical Ni-Ti TF прямокутна', en: 'ID-Logical Ni-Ti TF rectangular archwire' },
    descriptionI18n: { uk: 'Нікель-титанова прямокутна дуга з покриттям Tooth-Finish для естетичності.', en: 'Nickel-titanium rectangular archwire with Tooth-Finish coating for aesthetics.' },
    category: 'duhy',
    tags: ['дуга', 'ni-ti', 'id-logical', 'прямокутна', 'tf'],
    images: [IMG('lancer_votermarki_-_yes/duga_lancer_velocity_ni-ti_s_pokrytiem_tf_pryamougoljnaya_53tu-1616')],
    attributes: [{ key: 'Матеріал', value: 'Ni-Ti' }, { key: 'Покриття', value: 'Tooth-Finish (TF)' }, { key: 'Форма', value: 'прямокутна' }],
    variants: [
      { sku: 'IDL-NITF-R-1625U', manufacturer: 'id-logical', country: 'IT', options: { size: '16x22', jaw: 'Верхня щелепа' }, price: 65, unit: 'шт', images: [] },
      { sku: 'IDL-NITF-R-1925L', manufacturer: 'id-logical', country: 'IT', options: { size: '19x25', jaw: 'Нижня щелепа' }, price: 65, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ЕЛАСТИЧНІ МАТЕРІАЛИ ═══════════════════
  {
    slug: 'lancer-elastic-chain',
    titleI18n: { uk: 'Еластична ланцюжок LANCER', en: 'LANCER elastic chain' },
    descriptionI18n: { uk: 'Еластичний ланцюжок для закриття проміжків між зубами. Котушка 4.5 м.', en: 'Elastic chain for closing gaps between teeth. 4.5m spool.' },
    category: 'elastychni',
    tags: ['ланцюжок', 'еластичний', 'lancer'],
    images: [IMG('lancer_votermarki_-_yes/elasticheskajacepochkalancerx-shortprozrachnaja467-701%2B467-731%2B467-761')],
    attributes: [{ key: 'Довжина', value: '4.5 м' }],
    variants: [
      { sku: 'LAN-EC-SHORT', manufacturer: 'lancer', country: 'US', options: { step: 'Короткий крок' }, price: 600, unit: 'котушка', images: [] },
      { sku: 'LAN-EC-MEDIUM', manufacturer: 'lancer', country: 'US', options: { step: 'Середній крок' }, price: 600, unit: 'котушка', images: [] },
    ],
  },
  {
    slug: 'ormco-intermax-elastics',
    titleI18n: { uk: 'Еластики ORMCO міжщелепні', en: 'ORMCO intermaxillary elastics' },
    descriptionI18n: { uk: 'Латексні міжщелепні еластики для корекції прикусу. 100 шт в упаковці.', en: 'Latex intermaxillary elastics for bite correction. 100 pcs per pack.' },
    category: 'elastychni',
    tags: ['еластики', 'тяги', 'ormco', 'міжщелепні'],
    images: [IMG('ormco_votermarki_-_yes/elastiki-mezhchelyustnye-ormco_1')],
    attributes: [{ key: 'Кількість', value: '100 шт' }, { key: 'Матеріал', value: 'латекс' }],
    variants: [
      { sku: 'ORM-EL-1/4-35', manufacturer: 'ormco', country: 'US', options: { size: '1/4"', force: '3.5 oz' }, price: 70, unit: 'уп', images: [] },
      { sku: 'ORM-EL-3/16-6', manufacturer: 'ormco', country: 'US', options: { size: '3/16"', force: '6 oz' }, price: 70, unit: 'уп', images: [] },
    ],
  },

  // ═══════════════════ ФІКСАЦІЙНІ МАТЕРІАЛИ ═══════════════════
  {
    slug: 'ormco-enlight-syringe',
    titleI18n: { uk: 'Адгезив ORMCO Enlight (шприц 4 гр)', en: 'ORMCO Enlight adhesive (4g syringe)' },
    descriptionI18n: { uk: 'Світлополімерний адгезив для фіксації металевих та керамічних брекетів. Шприц 4 г.', en: 'Light-cure adhesive for bonding metal and ceramic brackets. 4g syringe.' },
    category: 'fiksatsiini',
    tags: ['адгезив', 'enlight', 'ormco', 'фіксація'],
    images: [IMG('ormco_votermarki_-_yes/adgeziv-ormco-enlight-shpric-4-gr-740-0195')],
    attributes: [{ key: 'Об\'єм', value: '4 г' }, { key: 'Тип', value: 'світлополімерний' }],
    variants: [
      { sku: 'ORM-ENL-4G', manufacturer: 'ormco', country: 'US', options: {}, price: 1800, unit: 'шприц', images: [] },
    ],
  },
  {
    slug: 'ormco-ortho-solo-bond',
    titleI18n: { uk: 'Бонд ORMCO ORTHO SOLO (5 мл)', en: 'ORMCO ORTHO SOLO bond (5ml)' },
    descriptionI18n: { uk: 'Універсальний праймер/бонд для прямого та непрямого бондажу. Флакон 5 мл.', en: 'Universal primer/bond for direct and indirect bonding. 5ml bottle.' },
    category: 'fiksatsiini',
    tags: ['бонд', 'праймер', 'ortho-solo', 'ormco'],
    images: [IMG('ormco_votermarki_-_yes/bond-ormco-ortho-solo-5ml-740-0271')],
    attributes: [{ key: 'Об\'єм', value: '5 мл' }],
    variants: [
      { sku: 'ORM-OS-5ML', manufacturer: 'ormco', country: 'US', options: {}, price: 1800, unit: 'фл', images: [] },
    ],
  },

  // ═══════════════════ РЕТРАКТОРИ ═══════════════════
  {
    slug: 'retraktor-imd-plastik',
    titleI18n: { uk: 'Ретрактор IMD пластик', en: 'IMD plastic retractor' },
    descriptionI18n: { uk: 'Пластиковий одноразовий ретрактор для щік та губ. Доступний у трьох розмірах.', en: 'Disposable plastic cheek and lip retractor. Available in three sizes.' },
    category: 'retraktory',
    tags: ['ретрактор', 'пластик', 'imd'],
    images: [IMG('china_votermarki_-_yes/retraktor-100-69-100-70-100-71')],
    attributes: [{ key: 'Матеріал', value: 'пластик' }, { key: 'Тип', value: 'одноразовий' }],
    variants: [
      { sku: 'IMD-RET-PL-S', manufacturer: 'imd', country: 'CN', options: { size: 'Small' }, price: 70, unit: 'шт', images: [] },
      { sku: 'IMD-RET-PL-M', manufacturer: 'imd', country: 'CN', options: { size: 'Medium' }, price: 70, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'retraktor-os-columbia',
    titleI18n: { uk: 'Ретрактор OS Columbia', en: 'OS Columbia retractor' },
    descriptionI18n: { uk: 'Металевий ретрактор Columbia з ергономічною ручкою для зручного догляду.', en: 'Metal Columbia retractor with ergonomic handle.' },
    category: 'retraktory',
    tags: ['ретрактор', 'метал', 'orthostore'],
    images: [IMG('china_votermarki_-_yes/retraktor_shchechnyy_vch_100-205')],
    attributes: [{ key: 'Матеріал', value: 'нержавіюча сталь' }],
    variants: [
      { sku: 'OS-RET-COL', manufacturer: 'orthostore', country: 'UA', options: {}, price: 600, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ДЗЕРКАЛА ═══════════════════
  {
    slug: 'photo-mirror-occlusal',
    titleI18n: { uk: 'Фотодзеркало оклюзійне', en: 'Occlusal photo mirror' },
    descriptionI18n: { uk: 'Дзеркало для внутрішньоротової дентальної фотографії. Оклюзійне (верхнє).', en: 'Mirror for intraoral dental photography. Occlusal (upper).' },
    category: 'dzerkala-foto',
    tags: ['дзеркало', 'фото', 'оклюзійне'],
    images: [IMG('instrument_os_votermarki_-_yes/zerkalo_os_dlya_foto_f-2a')],
    attributes: [{ key: 'Тип', value: 'оклюзійне' }],
    variants: [
      { sku: 'OS-PM-OCC-AD', manufacturer: 'orthostore', country: 'UA', options: { size: 'Adults' }, price: 950, unit: 'шт', images: [] },
      { sku: 'OS-PM-OCC-KD', manufacturer: 'orthostore', country: 'UA', options: { size: 'Kids' }, price: 850, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'photo-contraster-black',
    titleI18n: { uk: 'Фотоконтрастер чорний', en: 'Black photo contraster' },
    descriptionI18n: { uk: 'Чорний фотоконтрастер для покращення контрасту фотографії зубів.', en: 'Black photo contraster for improved dental photography contrast.' },
    category: 'dzerkala-foto',
    tags: ['контрастер', 'фото', 'чорний'],
    images: [IMG('instrument_os_votermarki_-_yes/zerkalo_os_dlya_foto_f-2c')],
    attributes: [{ key: 'Колір', value: 'чорний' }],
    variants: [
      { sku: 'OS-PC-BL', manufacturer: 'orthostore', country: 'UA', options: {}, price: 450, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ЗОВНІШНЬОРОТОВІ ═══════════════════
  {
    slug: 'face-mask-universal',
    titleI18n: { uk: 'Лицьова маска ортодонтична універсальна', en: 'Universal orthodontic face mask' },
    descriptionI18n: { uk: 'Лицьова маска для корекції прикусу III класу. Регульований каркас.', en: 'Face mask for Class III malocclusion correction. Adjustable frame.' },
    category: 'zovnishnorotovi',
    tags: ['маска', 'лицьова', 'III клас'],
    images: [IMG('china_votermarki_-_yes/licevaya_maska_imd_odnoosnaya_100-29_100-29')],
    attributes: [{ key: 'Тип', value: 'III клас' }],
    variants: [
      { sku: 'OS-FM-UNI', manufacturer: 'orthostore', country: 'UA', options: {}, price: 2800, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'lancer-face-bow',
    titleI18n: { uk: 'Лицьова дуга LANCER', en: 'LANCER face bow' },
    descriptionI18n: { uk: 'Лицьова дуга для дистального переміщення молярів. Внутрішня дуга + зовнішня.', en: 'Face bow for distal molar movement. Inner bow + outer bow.' },
    category: 'zovnishnorotovi',
    tags: ['дуга', 'лицьова', 'lancer'],
    images: [IMG('china_votermarki_-_yes/licevaya_duga_simetrichnaya__100-28')],
    attributes: [{ key: 'Тип', value: 'лицьова дуга' }],
    variants: [
      { sku: 'LAN-FB', manufacturer: 'lancer', country: 'US', options: {}, price: 850, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ТРЕЙНЕРА ═══════════════════
  {
    slug: 'mrc-myobrace-t4k',
    titleI18n: { uk: 'Трейнер MRC T4K для дітей', en: 'MRC Trainer T4K for children' },
    descriptionI18n: { uk: 'Преортодонтичний трейнер для корекції прикусу у дітей 6-10 років. М\'який.', en: 'Pre-orthodontic trainer for bite correction in children 6-10 years. Soft.' },
    category: 'treynera-myobreysy',
    tags: ['трейнер', 'mrc', 't4k', 'діти'],
    images: [IMG('MRC-%20YES/mrc---sistema-myobrace-t1')],
    attributes: [{ key: 'Вік', value: '6-10 років' }, { key: 'Жорсткість', value: 'м\'який' }],
    variants: [
      { sku: 'MRC-T4K-SOFT', manufacturer: 'mrc', country: 'AU', options: { phase: 'Phase 1 (м\'який)' }, price: 3200, unit: 'шт', images: [] },
      { sku: 'MRC-T4K-HARD', manufacturer: 'mrc', country: 'AU', options: { phase: 'Phase 2 (жорсткий)' }, price: 3200, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'mrc-myobrace-a1',
    titleI18n: { uk: 'Myobrace A1 для дорослих', en: 'Myobrace A1 for adults' },
    descriptionI18n: { uk: 'Міофункціональний апарат для дорослих. Без розміру — універсальний.', en: 'Myofunctional appliance for adults. Universal size.' },
    category: 'treynera-myobreysy',
    tags: ['myobrace', 'mrc', 'дорослі', 'a1'],
    images: [IMG('MRC-%20YES/mrc---sistema-myobrace-t2')],
    attributes: [{ key: 'Вік', value: 'дорослі' }],
    variants: [
      { sku: 'MRC-A1', manufacturer: 'mrc', country: 'AU', options: {}, price: 4500, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ МАТЕРІАЛИ ДЛЯ ТЕХНІКІВ ═══════════════════
  {
    slug: 'ortho-screw-expansion',
    titleI18n: { uk: 'Гвинт ортодонтичний для розширення', en: 'Orthodontic expansion screw' },
    descriptionI18n: { uk: 'Ортодонтичний гвинт для розширення верхньої щелепи. Нержавіюча сталь.', en: 'Orthodontic expansion screw for upper jaw. Stainless steel.' },
    category: 'materialy-tehnikiv',
    tags: ['гвинт', 'розширення', 'техніки'],
    images: [IMG('china_votermarki_-_yes/2020_jul15_ortostore6028')],
    attributes: [{ key: 'Тип', value: 'розширюючий' }],
    variants: [
      { sku: 'OS-SCR-EXP-S', manufacturer: 'orthostore', country: 'UA', options: { size: 'Стандарт (10 мм)' }, price: 250, unit: 'шт', images: [] },
      { sku: 'OS-SCR-EXP-L', manufacturer: 'orthostore', country: 'UA', options: { size: 'Збільшений (12 мм)' }, price: 280, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'plastyna-dlya-elayneriv',
    titleI18n: { uk: 'Пластина для елайнерів 1.0 мм', en: 'Aligner plate 1.0mm' },
    descriptionI18n: { uk: 'Прозора пластина для штампування елайнерів та кап. Товщина 1.0 мм.', en: 'Clear plate for stamping aligners and retainers. 1.0mm thickness.' },
    category: 'materialy-tehnikiv',
    tags: ['пластина', 'елайнери', 'капи'],
    images: [IMG('china_votermarki_-_yes/1apparat-vakuumformer-100-06')],
    attributes: [{ key: 'Товщина', value: '1.0 мм' }, { key: 'Матеріал', value: 'PETG' }],
    variants: [
      { sku: 'OS-PL-AL-1MM-R', manufacturer: 'orthostore', country: 'UA', options: { shape: 'Кругла (125 мм)' }, price: 45, unit: 'шт', images: [] },
      { sku: 'OS-PL-AL-1MM-S', manufacturer: 'orthostore', country: 'UA', options: { shape: 'Квадратна (130×130 мм)' }, price: 50, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ СЕПАРАЦІЙНІ ІНСТРУМЕНТИ ═══════════════════
  {
    slug: 'separation-disc-ss',
    titleI18n: { uk: 'Сепараційний диск сталевий', en: 'Steel separation disc' },
    descriptionI18n: { uk: 'Сепараційний диск з нержавіючої сталі для зняття надлишків матеріалу.', en: 'Stainless steel separation disc for material excess removal.' },
    category: 'separatsiyni-instrumenty',
    tags: ['сепарація', 'диск', 'сталь'],
    images: [IMG('speed_dental_votermarki_-_yes/shchup_tolienomer_dlya_separacii_100-128')],
    attributes: [{ key: 'Матеріал', value: 'нержавіюча сталь' }],
    variants: [
      { sku: 'OS-SD-SS-19', manufacturer: 'orthostore', country: 'UA', options: { diameter: '19 мм' }, price: 35, unit: 'шт', images: [] },
      { sku: 'OS-SD-SS-22', manufacturer: 'orthostore', country: 'UA', options: { diameter: '22 мм' }, price: 40, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'imd-ipr-strip',
    titleI18n: { uk: 'IPR штрипса IMD', en: 'IMD IPR strip' },
    descriptionI18n: { uk: 'Металева штрипса для інтерпроксимальної редукції (IPR). Комплект 10 шт.', en: 'Metal strip for interproximal reduction (IPR). Set of 10 pcs.' },
    category: 'separatsiyni-instrumenty',
    tags: ['штрипса', 'ipr', 'imd'],
    images: [IMG('china_votermarki_-_yes/separacionnye_koljca_imd_modulj_s_70sht_100-79')],
    attributes: [{ key: 'Кількість', value: '10 шт' }],
    variants: [
      { sku: 'IMD-IPR-S', manufacturer: 'imd', country: 'CN', options: { width: 'Вузька (2 мм)' }, price: 120, unit: 'компл', images: [] },
      { sku: 'IMD-IPR-M', manufacturer: 'imd', country: 'CN', options: { width: 'Середня (4 мм)' }, price: 120, unit: 'компл', images: [] },
    ],
  },

  // ═══════════════════ АКСЕСУАРИ ═══════════════════
  {
    slug: 'orthobox-lancer',
    titleI18n: { uk: 'ORTHOBOX LANCER для зберігання і стерилізації інструменту', en: 'ORTHOBOX LANCER for instrument storage and sterilization' },
    descriptionI18n: { uk: 'Контейнер для зберігання та стерилізації ортодонтичного інструменту.', en: 'Container for storage and sterilization of orthodontic instruments.' },
    category: 'aksesuari',
    tags: ['контейнер', 'стерилізація', 'lancer'],
    images: [IMG('lancer_votermarki_-_yes/orthobox-dlya-hraneniya-i-sterilizacii-instrumenta-art-626-323')],
    attributes: [{ key: 'Призначення', value: 'зберігання і стерилізація' }],
    variants: [
      { sku: 'LAN-BOX', manufacturer: 'lancer', country: 'US', options: {}, price: 7500, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'wax-ortho-patient',
    titleI18n: { uk: 'Ортодонтичний віск для брекетів', en: 'Orthodontic wax for brackets' },
    descriptionI18n: { uk: 'Захисний віск для пацієнтів з брекетами. Гіпоалергенний, без смаку.', en: 'Protective wax for patients with braces. Hypoallergenic, flavorless.' },
    category: 'aksesuari',
    tags: ['віск', 'брекети', 'захист'],
    images: [IMG('china_votermarki_-_yes/1vosk-ortodonticheskij-100-11')],
    attributes: [{ key: 'Тип', value: 'захисний' }],
    variants: [
      { sku: 'IMD-WAX-CL', manufacturer: 'imd', country: 'CN', options: { flavor: 'без смаку' }, price: 30, unit: 'шт', images: [] },
      { sku: 'IMD-WAX-MT', manufacturer: 'imd', country: 'CN', options: { flavor: 'м\'ята' }, price: 35, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ІНСТРУМЕНТИ ═══════════════════
  {
    slug: 'os-distal-end-cutter',
    titleI18n: { uk: 'Дистальний кусачки ORTHOSTORE', en: 'ORTHOSTORE distal end cutter' },
    descriptionI18n: { uk: 'Кусачки для дистального обрізання дуг. Утримують обрізаний кінець.', en: 'Distal end cutter for archwires. Holds the cut end.' },
    category: 'instrumenty',
    tags: ['кусачки', 'дистальний', 'orthostore'],
    images: [IMG('instrument_os_votermarki_-_yes/1000')],
    attributes: [{ key: 'Тип', value: 'дистальний кусачки' }],
    variants: [
      { sku: 'OS-DEC', manufacturer: 'orthostore', country: 'UA', options: {}, price: 1200, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'os-bracket-remover',
    titleI18n: { uk: 'Зніматель брекетів ORTHOSTORE', en: 'ORTHOSTORE bracket remover' },
    descriptionI18n: { uk: 'Щипці для безпечного зняття брекетів з емалі зуба.', en: 'Pliers for safe bracket debonding from tooth enamel.' },
    category: 'instrumenty',
    tags: ['зніматель', 'брекети', 'orthostore'],
    images: [IMG('instrument_os_votermarki_-_yes/1001')],
    attributes: [{ key: 'Тип', value: 'зніматель' }],
    variants: [
      { sku: 'OS-BR', manufacturer: 'orthostore', country: 'UA', options: {}, price: 1500, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ ПРОПИСИ БРЕКЕТІВ ═══════════════════
  {
    slug: 'prescription-roth-022',
    titleI18n: { uk: 'Пропис ROTH .022 (каталог)', en: 'ROTH .022 Prescription (catalog)' },
    descriptionI18n: { uk: 'Комплект прописів ROTH з розміром паза .022 для систематизації роботи ортодонта.', en: 'ROTH prescription set with .022 slot size for orthodontist workflow organization.' },
    category: 'propysy-breketiv',
    tags: ['пропис', 'roth', '.022'],
    images: [IMG('id-logical__votermarki_-_yes/metallicheskie_brekety_id-logical_bracanic_roth_0.22_nabor_725-700')],
    attributes: [{ key: 'Пропис', value: 'ROTH' }, { key: 'Паз', value: '.022' }],
    variants: [
      { sku: 'PR-ROTH-022', manufacturer: 'id-logical', country: 'IT', options: {}, price: 350, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'prescription-mbt-022',
    titleI18n: { uk: 'Пропис MBT .022 (каталог)', en: 'MBT .022 Prescription (catalog)' },
    descriptionI18n: { uk: 'Комплект прописів MBT з розміром паза .022.', en: 'MBT prescription set with .022 slot size.' },
    category: 'propysy-breketiv',
    tags: ['пропис', 'mbt', '.022'],
    images: [IMG('id-logical__votermarki_-_yes/metallicheskie_brekety_id-logical_bracanic_low_profile_roth_022_nabor_725-600')],
    attributes: [{ key: 'Пропис', value: 'MBT' }, { key: 'Паз', value: '.022' }],
    variants: [
      { sku: 'PR-MBT-022', manufacturer: 'id-logical', country: 'IT', options: {}, price: 350, unit: 'шт', images: [] },
    ],
  },

  // ═══════════════════ МІКРОІМПЛАНТИ ═══════════════════
  {
    slug: 'microimplant-1-6x8',
    titleI18n: { uk: 'Мікроімплант ортодонтичний 1.6×8 мм', en: 'Orthodontic micro-implant 1.6×8mm' },
    descriptionI18n: { uk: 'Ортодонтичний мініскрю для тимчасової скелетної опори. Титан.', en: 'Orthodontic mini-screw for temporary skeletal anchorage. Titanium.' },
    category: 'mikroimplanty',
    tags: ['мікроімплант', 'мініскрю', 'титан'],
    images: [IMG('china_votermarki_-_yes/2020_jul15_ortostore6208')],
    attributes: [{ key: 'Матеріал', value: 'Ti6Al4V' }, { key: 'Діаметр', value: '1.6 мм' }, { key: 'Довжина', value: '8 мм' }],
    variants: [
      { sku: 'OS-MI-16-8', manufacturer: 'orthostore', country: 'UA', options: { size: '1.6×8 мм' }, price: 750, unit: 'шт', images: [] },
      { sku: 'OS-MI-16-10', manufacturer: 'orthostore', country: 'UA', options: { size: '1.6×10 мм' }, price: 750, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'microimplant-driver-kit',
    titleI18n: { uk: 'Набір для встановлення мікроімплантів', en: 'Micro-implant driver kit' },
    descriptionI18n: { uk: 'Набір інструментів для встановлення ортодонтичних мікроімплантів. Ключ + відвертка.', en: 'Instrument kit for orthodontic mini-screw placement. Wrench + screwdriver.' },
    category: 'mikroimplanty',
    tags: ['набір', 'мікроімплант', 'інструмент'],
    images: [IMG('MICO%20ONE/2020_jul15_ortostore6082')],
    attributes: [{ key: 'Комплектація', value: 'ключ + відвертка' }],
    variants: [
      { sku: 'OS-MI-KIT', manufacturer: 'orthostore', country: 'UA', options: {}, price: 2500, unit: 'набір', images: [] },
    ],
  },

  // ═══════════════════ МІНІ ПЛАСТИНИ ═══════════════════
  {
    slug: 'mini-plate-y-type',
    titleI18n: { uk: 'Міні пластина Y-типу', en: 'Y-type mini plate' },
    descriptionI18n: { uk: 'Міні пластина Y-типу для ортодонтичної скелетної опори. Титан.', en: 'Y-type mini plate for orthodontic skeletal anchorage. Titanium.' },
    category: 'mini-plastyny',
    tags: ['міні-пластина', 'y-тип', 'титан'],
    images: [IMG('china_votermarki_-_yes/2020_Jul15_Ortostore6111')],
    attributes: [{ key: 'Тип', value: 'Y' }, { key: 'Матеріал', value: 'Ti6Al4V' }],
    variants: [
      { sku: 'OS-MP-Y-L', manufacturer: 'orthostore', country: 'UA', options: { side: 'Ліва' }, price: 3500, unit: 'шт', images: [] },
      { sku: 'OS-MP-Y-R', manufacturer: 'orthostore', country: 'UA', options: { side: 'Права' }, price: 3500, unit: 'шт', images: [] },
    ],
  },
  {
    slug: 'mini-plate-t-type',
    titleI18n: { uk: 'Міні пластина T-типу', en: 'T-type mini plate' },
    descriptionI18n: { uk: 'Міні пластина T-типу для щелепно-лицьової хірургії. Титан.', en: 'T-type mini plate for maxillofacial surgery. Titanium.' },
    category: 'mini-plastyny',
    tags: ['міні-пластина', 't-тип', 'титан', 'хірургія'],
    images: [IMG('china_votermarki_-_yes/2020_jul15_ortostore6021')],
    attributes: [{ key: 'Тип', value: 'T' }, { key: 'Матеріал', value: 'Ti6Al4V' }],
    variants: [
      { sku: 'OS-MP-T-4H', manufacturer: 'orthostore', country: 'UA', options: { holes: '4 отвори' }, price: 3800, unit: 'шт', images: [] },
      { sku: 'OS-MP-T-6H', manufacturer: 'orthostore', country: 'UA', options: { holes: '6 отворів' }, price: 4200, unit: 'шт', images: [] },
    ],
  },
];

/* ─── Main ─── */
async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'dentistry';
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName });
  console.log(`Connected to ${dbName}`);

  const CategoryModel = mongoose.model('Category', CategorySchema);
  const SubcategoryModel = mongoose.model('Subcategory', SubcategorySchema);
  const CountryModel = mongoose.model('Country', CountrySchema);
  const ManufacturerModel = mongoose.model('Manufacturer', ManufacturerSchema);
  const ProductModel = mongoose.model('Product', ProductSchema);

  // ── 1. Countries ──
  for (const c of COUNTRIES_DATA) {
    await CountryModel.updateOne(
      { code: c.code },
      { $setOnInsert: c },
      { upsert: true },
    );
  }
  console.log(`✔ Countries: ${COUNTRIES_DATA.length}`);

  // ── 2. Manufacturers ──
  for (const m of MANUFACTURERS_DATA) {
    const country = await CountryModel.findOne({ code: m.country }).lean();
    await ManufacturerModel.updateOne(
      { slug: m.slug },
      {
        $setOnInsert: {
          slug: m.slug,
          nameI18n: m.nameI18n,
          countryIds: country ? [country._id] : [],
          isActive: true,
        },
      },
      { upsert: true },
    );
  }
  console.log(`✔ Manufacturers: ${MANUFACTURERS_DATA.length}`);

  // ── 3. Categories + Subcategories ──
  const catMap = new Map<string, Types.ObjectId>();
  for (const cat of CATEGORIES_DATA) {
    const res = await CategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      {
        $setOnInsert: {
          slug: cat.slug,
          nameI18n: cat.nameI18n,
          descriptionI18n: cat.descriptionI18n,
          sort: cat.sort,
          isActive: true,
        },
      },
      { upsert: true, new: true, lean: true },
    );
    catMap.set(cat.slug, res!._id as Types.ObjectId);

    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        await SubcategoryModel.updateOne(
          { slug: sub.slug },
          {
            $setOnInsert: {
              slug: sub.slug,
              nameI18n: sub.nameI18n,
              categoryId: res!._id,
              sort: sub.sort,
              isActive: true,
            },
          },
          { upsert: true },
        );
      }
    }
  }
  console.log(`✔ Categories: ${CATEGORIES_DATA.length}`);

  // ── 4. Products (upsert — delete old, create new) ──
  let created = 0;
  for (const p of PRODUCTS) {
    await ProductModel.deleteOne({ slug: p.slug });

    const categoryId = catMap.get(p.category);
    if (!categoryId) {
      console.warn(`⚠ Category "${p.category}" not found for product "${p.slug}"`);
      continue;
    }

    const variants: Array<{
      sku: string;
      manufacturerId: Types.ObjectId;
      countryId?: Types.ObjectId;
      options: Record<string, string>;
      price: number;
      unit: string;
      images: string[];
      isActive: boolean;
    }> = [];
    for (const v of p.variants) {
      const mfr = await ManufacturerModel.findOne({ slug: v.manufacturer }).lean();
      const cty = await CountryModel.findOne({ code: v.country }).lean();
      if (!mfr) {
        console.warn(`⚠ Manufacturer "${v.manufacturer}" not found for variant ${v.sku}`);
        continue;
      }
      variants.push({
        sku: v.sku,
        manufacturerId: mfr._id,
        countryId: cty?._id,
        options: v.options,
        price: v.price,
        unit: v.unit,
        images: v.images,
        isActive: true,
      });
    }

    const prices = variants.map((v) => v.price);
    await ProductModel.create({
      slug: p.slug,
      titleI18n: p.titleI18n,
      descriptionI18n: p.descriptionI18n,
      categoryIds: [categoryId],
      tags: p.tags,
      images: p.images,
      attributes: p.attributes,
      variants,
      manufacturerIds: [...new Set(variants.map((v) => v.manufacturerId))],
      countryIds: [...new Set(variants.filter((v) => v.countryId).map((v) => v.countryId!))],
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      isActive: true,
    });
    created++;
  }

  console.log(`\n✔ Products created: ${created}`);
  console.log('✔ Seed complete!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
