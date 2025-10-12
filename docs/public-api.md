# Публичное API (витрина)

Этот документ описывает публичные эндпоинты для фронтенда витрины. Все ответы — `JSON`. API‑ключ не требуется.

Сопутствующие артефакты для фронтенда:

- JSON Schemas (минимальный набор для витрины): `docs/public-schemas.json`
- TypeScript типы (легковесные): `docs/snippets/public-types.d.ts`

## i18n в витрине (uk/en)

- В ответах приходят локализованные поля в виде объектов `*I18n`:
  - Товары: `titleI18n`, `descriptionI18n`
  - Категории: `nameI18n`, `descriptionI18n`
  - Производители: `nameI18n`, `descriptionI18n`
  - Страны: `nameI18n`
- Правило выбора на фронте: сначала `*.I18n[lang]`, если пусто — используйте `*.I18n.uk` (uk всегда заполнен). Пример:

```ts
function pickI18n(i18n: { uk: string; en?: string } | undefined, lang: 'uk' | 'en'): string {
  if (!i18n) return '';
  return (lang === 'en' ? i18n.en : i18n.uk) || i18n.uk || '';
}
```

- Поиск/сортировка: сервер сортирует по полям `*.uk` (например, `titleI18n.uk`, `nameI18n.uk`), а `qLike` ищет по `uk/en`.
- Слаг (`slug`) не локализуется.

### Мини‑примеры UI‑мэппинга (карточка товара)

```ts
// См. готовые хелперы в docs/snippets/i18n.ts
type Lang = 'uk' | 'en';

type ProductCard = {
  href: string;
  title: string;
  description: string;
  image: string;
  priceFrom?: number;
  priceTo?: number;
};

function toProductCard(p: any, lang: Lang): ProductCard {
  const title = pickI18n(p.titleI18n, lang);
  const description = pickI18n(p.descriptionI18n, lang);
  const image = p.images?.[0] ?? '';
  return {
    href: `/p/${p.slug}`,
    title,
    description,
    image,
    priceFrom: p.priceMinFinal,
    priceTo: p.priceMaxFinal,
  };
}

// Пример использования (uk)
const cardUk = toProductCard(product, 'uk');
// Пример использования (en)
const cardEn = toProductCard(product, 'en');
```

Мини‑мэппинг для категорий, производителей и стран (см. также helpers в `docs/snippets/i18n.ts`):

```ts
// Category tile
function toCategoryTile(c: any, lang: 'uk' | 'en') {
  return {
    href: `/c/${c.slug}`,
    title: pickI18n(c.nameI18n, lang),
    description: pickI18n(c.descriptionI18n, lang),
    image: c.imageUrl ?? '',
  };
}

// Manufacturer tile
function toManufacturerTile(m: any, lang: 'uk' | 'en') {
  return {
    href: `/m/${m.slug}`,
    title: pickI18n(m.nameI18n, lang),
    description: pickI18n(m.descriptionI18n, lang),
    logo: m.logoUrl ?? '',
    banner: m.bannerUrl ?? '',
  };
}

// Country badge
function toCountryBadge(co: any, lang: 'uk' | 'en') {
  return {
    href: `/co/${co.slug}`,
    code: co.code,
    name: pickI18n(co.nameI18n, lang),
    flag: co.flagUrl ?? '',
  };
}
```

## Идентификация и авторизация покупателей

Поддерживаются два режима:

1. **Гостевой** — по паре `phone` + `clientId`. Совместим со старым поведением.
2. **Авторизованный** — через подтверждение телефона по SMS и выдачу JWT.

`clientId` генерируется на фронтенде (например, UUID v4), сохраняется локально (localStorage/IndexedDB/secure cookie) и передаётся в запросах даже после авторизации. Это помогает связать заказы, созданные в гостевом режиме, с профилем покупателя.

`phone` принимается в любом читаемом формате (можно `+`, пробелы, дефисы); сервер нормализует его до E.164.

### Гостевой режим

- Используется для быстрой покупки без входа.
- Эндпоинты: `POST /orders`, `GET /orders/history`.
- На фронте по-прежнему сохраняем `clientId` (см. пример кода ниже).

```ts
// JS/TS (один раз при первом входе)
import { v4 as uuid } from 'uuid';
const clientId =
  localStorage.getItem('clientId') ??
  (() => {
    const id = uuid();
    localStorage.setItem('clientId', id);
    return id;
  })();
```

### Авторизованный режим

- Стартуем с `POST /auth/request-code` — отправляем код на телефон (учитываются rate limits).
- Затем `POST /auth/verify-code` — валидируем код. При успехе:
  - Возвращаются токены (`accessToken`, опционально `refreshToken`).
  - Возвращается объект покупателя.
  - Все гостевые заказы с той же парой `phone + clientId` привязываются к учётке.
- Авторизованные запросы отправляют заголовок `Authorization: Bearer <accessToken>`.
- Заказы, созданные в авторизованном контексте (`POST /orders` с валидным `Bearer`), автоматически получают `customerId` и не требуют передачи `phone`/`clientId` в ответах.

`accessToken` действует по умолчанию 15 минут (значение настраивается через `CUSTOMER_JWT_EXPIRES_IN`). Если настроен refresh flow (`CUSTOMER_REFRESH_SECRET`), фронт может хранить `refreshToken` и обновлять пары через планируемый `/auth/refresh`.

## POST `/auth/request-code`

Запросить SMS-код для входа/регистрации покупателя.

- Rate limit учитывает телефон, `clientId` и IP.
- Повторные запросы раньше `resendDelaySec` вернут ошибку 429.

Тело запроса (пример):

```json
{
  "phone": "+380501234567",
  "clientId": "web-abc-123",
  "reason": "login"
}
```

Ответ 200:

```json
{
  "requestId": "7c4f9f50-2b2f-4b64-8a1c-a7fb2a92d3ac",
  "resendDelaySec": 30,
  "expiresInSec": 300
}
```

Ошибки: 400 (невалидный телефон), 429 (слишком часто), 500 (ошибка SMS-провайдера).

## POST `/auth/verify-code`

Подтвердить SMS-код и получить токены.

Тело запроса (пример):

```json
{
  "phone": "+380501234567",
  "clientId": "web-abc-123",
  "requestId": "7c4f9f50-2b2f-4b64-8a1c-a7fb2a92d3ac",
  "code": "1234",
  "name": "Іван",
  "marketingOptIn": true
}
```

Ответ 200:

```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresInSec": 900,
    "tokenType": "bearer",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshTokenExpiresInSec": 2592000
  },
  "customer": {
    "id": "66bb00000000000000000001",
    "phone": "+380501234567",
    "name": "Іван",
    "isPhoneVerified": true,
    "createdAt": "2025-10-11T08:00:00.000Z",
    "updatedAt": "2025-10-11T08:00:00.000Z",
    "lastLoginAt": "2025-10-11T08:05:23.000Z"
  }
}
```

Дополнительно: все невыполненные заказы с этой парой `phone + clientId` будут привязаны к покупателю.

Ошибки: 401 (неверный/просроченный код, другой `clientId`), 410 (код истёк), 429 (превышено количество попыток), 500 (внутренние ошибки).

## GET `/me`

Возвращает профиль текущего авторизованного покупателя.

- Заголовок: `Authorization: Bearer <accessToken>`.
- Ответ — тот же `customer`, что и в `/auth/verify-code`.

## GET `/me/orders`

Пагинированный список заказов текущего покупателя.

- Заголовок: `Authorization: Bearer <accessToken>`.
- Квери: `page` (>=1, по умолчанию 1), `limit` (1..100, по умолчанию 20).
- Возвращает заказы, привязанные к `customerId`, отсортированные по `createdAt desc`.

Ответ 200 (пример):

```json
{
  "items": [
    {
      "_id": "666000000000000000000001",
      "customerId": "66bb00000000000000000001",
      "phone": "+380501234567",
      "clientId": "web-abc-123",
      "items": [
        {
          "productId": "665f1a2b3c4d5e6f7a8b9c0d",
          "sku": "UC-1",
          "quantity": 2,
          "price": 350,
          "title": "Композит універсальний"
        }
      ],
      "itemsTotal": 700,
      "deliveryFee": 60,
      "total": 760,
      "status": "new",
      "name": "Іван",
      "createdAt": "2025-09-13T12:00:00.000Z",
      "updatedAt": "2025-09-13T12:00:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "hasNextPage": true
}
```

---

## GET `/categories`

Список активных категорий (для меню/фильтров).

Ответ (пример):

```json
[
  {
    "_id": "665f00000000000000000001",
    "slug": "materials",
    "nameI18n": { "uk": "Матеріали", "en": "Materials" },
    "descriptionI18n": { "uk": "Витратні матеріали", "en": "Consumables" },
    "sort": 1,
    "isActive": true,
    "createdAt": "2025-09-10T12:00:00.000Z",
    "updatedAt": "2025-09-10T12:00:00.000Z"
  }
]
```

## GET `/countries`

Список активных стран.

Ответ (пример):

```json
[
  {
    "_id": "665f00000000000000002001",
    "code": "UA",
    "nameI18n": { "uk": "Україна", "en": "Ukraine" },
    "slug": "ukraine",
    "isActive": true,
    "createdAt": "2025-09-10T12:00:00.000Z",
    "updatedAt": "2025-09-10T12:00:00.000Z"
  }
]
```

## GET `/manufacturers`

Список активных производителей.

Ответ (пример):

```json
[
  {
    "_id": "665f00000000000000001001",
    "nameI18n": { "uk": "Dent UA", "en": "Dent UA" },
    "descriptionI18n": { "uk": null, "en": null },
    "slug": "dent-ua",
    "countryIds": ["665f00000000000000002001"],
    "isActive": true,
    "createdAt": "2025-09-10T12:00:00.000Z",
    "updatedAt": "2025-09-10T12:00:00.000Z"
  }
]
```

---

## GET `/products`

Список товаров с фильтрами, сортировкой и пагинацией. Возвращаются только активные товары.

Параметры запроса:

- `q` string (опционально): полнотекстовый поиск по индексу MongoDB (i18n поля title/description).
- `qLike` string (опционально): поиск подстрокой без учёта регистра по `titleI18n.uk/en`, `slug`, `descriptionI18n.uk/en`, `variants.sku`. Удобен для «живого» поиска при вводе.
- `category` string (ObjectId): фильтр по категории.
- `manufacturerId` string | string[]: один или несколько производителей.
- `countryId` string | string[]: одна или несколько стран.
- `tags` string | string[]: товары, содержащие любой из указанных тегов.
- `priceFrom` number: товары, у которых максимальная цена вариантов >= значению.
- `priceTo` number: товары, у которых минимальная цена вариантов <= значению.
- `options` JSON‑строка объекта: фильтр по опциям варианта, например `{ "size": "2g", "shade": "A2" }`.
- `opt.<key>=<value>`: альтернативная форма фильтра по опциям. Повторяйте ключ, чтобы сделать OR по значениям. Пример: `opt.size=2g&opt.size=4g&opt.shade=A2`.
- `sort` string: поля через запятую, префикс `-` — по убыванию. Примеры: `-createdAt`, `priceMinFinal,-titleI18n.uk`.
- `page` number (по умолчанию 1)
- `limit` number (по умолчанию 20, максимум 50)

Примеры:

- `GET /products?q=композит&sort=-createdAt&page=1&limit=20`
- `GET /products?qLike=comp`
- `GET /products?q=композит&qLike=UC-`
- `GET /products?category=665f00000000000000000001&manufacturerId=665f00000000000000001001&countryId=665f00000000000000002001`
- `GET /products?tags=popular&tags=stock`
- `GET /products?options={"size":"2g","shade":"A2"}`
- `GET /products?opt.size=2g&opt.size=4g&opt.shade=A2`

Ответ (пример):

```json
{
  "items": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "slug": "universal-composite",
      "titleI18n": { "uk": "Композит універсальний", "en": "Universal composite" },
      "descriptionI18n": { "uk": "Опис...", "en": "Description..." },
      "categoryIds": ["665f00000000000000000001"],
      "tags": ["popular", "stock"],
      "images": [],
      "attributes": [{ "key": "purpose", "value": "restoration" }],
      "variants": [
        {
          "_id": "665f0000000000000000a001",
          "sku": "UC-1",
          "manufacturerId": "665f00000000000000001001",
          "countryId": "665f00000000000000002001",
          "options": { "shade": "A2", "size": "2g" },
          "price": 350,
          "priceOriginal": 350,
          "priceFinal": 315,
          "discountsApplied": [
            {
              "discountId": "6677000000000000000000d1",
              "name": "Осенняя распродажа",
              "type": "percent",
              "value": 10,
              "priceBefore": 350,
              "priceAfter": 315
            }
          ],
          "unit": "шт",
          "images": [],
          "barcode": "482000000001",
          "isActive": true,
          "variantKey": "665f...1001:665f...2001:shade=A2|size=2g"
        }
      ],
      "manufacturerIds": ["665f00000000000000001001"],
      "countryIds": ["665f00000000000000002001"],
      "priceMin": 350,
      "priceMax": 480,
      "priceMinFinal": 315,
      "priceMaxFinal": 432,
      "optionsSummary": { "shade": ["A2", "A3"], "size": ["2g", "4g"] },
      "isActive": true,
      "createdAt": "2025-09-10T12:00:00.000Z",
      "updatedAt": "2025-09-10T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Заметки:

- Сортировка допускает любые поля (например, `title`, `priceMinFinal`, `createdAt`). Без индекса на больших данных сортировка может быть медленнее.
- Опции через `opt.*` поддерживают как числовые, так и строковые значения (например, `opt.size=2` совпадёт и с `2`, и с `"2"`).
- Фильтрация по цене использует агрегированные поля `priceMin/priceMax` из вариантов.
- `q` и `qLike` можно комбинировать (логическое AND). Используйте `q` для релевантности по полнотекстовому индексу и `qLike` для мгновенных частичных совпадений (title/slug/description/SKU). На очень больших выборках `qLike` может работать медленнее из-за regex.

---

## GET `/products/:idOrSlug`

Получить один товар по ObjectId или по `slug`.

Ответ содержит варианты с полями `priceOriginal`, `priceFinal` и `discountsApplied` (по активным скидкам на момент запроса).

Пример ответа:

```json
{
  "_id": "665f1a2b3c4d5e6f7a8b9c0d",
  "slug": "universal-composite",
  "titleI18n": { "uk": "Композит універсальний", "en": "Universal composite" },
  "descriptionI18n": { "uk": "Опис...", "en": "Description..." },
  "categoryIds": ["665f00000000000000000001"],
  "tags": ["popular", "stock"],
  "images": [],
  "attributes": [{ "key": "purpose", "value": "restoration" }],
  "variants": [
    {
      "_id": "665f0000000000000000a001",
      "sku": "UC-1",
      "manufacturerId": "665f00000000000000001001",
      "countryId": "665f00000000000000002001",
      "options": { "shade": "A2", "size": "2g" },
      "price": 350,
      "priceOriginal": 350,
      "priceFinal": 315,
      "discountsApplied": [
        {
          "discountId": "6677000000000000000000d1",
          "name": "Осенняя распродажа",
          "type": "percent",
          "value": 10,
          "priceBefore": 350,
          "priceAfter": 315
        }
      ],
      "unit": "шт",
      "images": [],
      "barcode": "482000000001",
      "isActive": true,
      "variantKey": "665f...1001:665f...2001:shade=A2|size=2g"
    }
  ],
  "manufacturerIds": ["665f00000000000000001001", "665f00000000000000001002"],
  "countryIds": ["665f00000000000000002001", "665f00000000000000002002"],
  "priceMin": 350,
  "priceMax": 480,
  "priceMinFinal": 315,
  "priceMaxFinal": 432,
  "optionsSummary": { "shade": ["A2", "A3", "B2"], "size": ["2g", "4g"] },
  "isActive": true,
  "createdAt": "2025-09-10T12:00:00.000Z",
  "updatedAt": "2025-09-10T12:00:00.000Z"
}
```

---

## GET `/contacts`

Список карточек контактов для витрины.

- По умолчанию: только активные, отсортированы по `sort`, затем `createdAt`.
- Квери: `includeInactive=true` — вернуть все (для предпросмотра/превью).

Ответ (пример):

```json
[
  {
    "_id": "66aa00000000000000000001",
    "addressI18n": { "uk": "м. Київ, вул. Хрещатик, 1", "en": "Kyiv, Khreshchatyk St, 1" },
    "phones": ["+380501234567", "+380971112233"],
    "email": "info@example.com",
    "viber": ["+380501234567", "+380671112233"],
    "telegram": ["@dentistry_store"],
    "sort": 1,
    "isActive": true,
    "createdAt": "2025-09-27T12:00:00.000Z",
    "updatedAt": "2025-09-27T12:00:00.000Z"
  }
]
```

Примечания:

- Используйте `pickI18n(addressI18n, lang)` для адреса.
- Куда выводить — зависит от дизайна: страница «О компании», футер, виджеты.

Подробнее: `docs/company-contacts.md`.

## GET `/hero`

- Возвращает активный геро-блок или `null`, если активного нет.
- В админке может быть несколько черновиков, но активен максимум один. При отсутствии активного фронт может показать дефолтный герой.

Ответ 200 (пример, когда герой есть):

```json
{
  "_id": "664f1c5af2...",
  "titleI18n": { "uk": "Стоматологія, якій довіряють", "en": "Dentistry you trust" },
  "subtitleI18n": { "uk": "Здоров'я зубів — наша турбота" },
  "imageUrl": "https://cdn.example.com/assets/hero-desktop.jpg",
  "imageUrlMobile": "https://cdn.example.com/assets/hero-mobile.jpg",
  "videoUrl": null,
  "cta": {
    "labelI18n": { "uk": "Перейти в каталог", "en": "Go to catalog" },
    "url": "/catalog",
    "external": false
  },
  "theme": "light",
  "isActive": true,
  "createdAt": "2024-06-01T10:00:00.000Z",
  "updatedAt": "2024-06-01T10:00:00.000Z"
}
```

Ответ 200 (когда героя нет):

```json
null
```

Примечания:

- Поля `titleI18n`/`subtitleI18n`/`cta.labelI18n` — опциональные, фронт сам выбирает язык (uk обязателен, en опционален, фолбек на сервере не делается).
- Если и изображения, и видео отсутствуют — можно отрендерить текстовый герой или дефолт.
- Схема ответа см. в `docs/public-schemas.json#/$defs/Hero`.

## POST `/orders`

Создать заказ.

- Без `Authorization` — используется гостевой режим (`phone` + `clientId`).
- С `Authorization: Bearer <accessToken>` — заказ привязывается к покупателю (`customerId`), а `phone`/`clientId` остаются как контакт и аналитика.

Идемпотентность:

- Необязательный заголовок `X-Idempotency-Key: <string>` гарантирует, что повторный идентичный запрос вернёт тот же заказ, не создавая дублей.
- Для авторизованных пользователей ключ привязывается к `customerId`, для гостей — к `clientId`.

Тело запроса (пример):

```json
{
  "phone": "+380501234567",
  "clientId": "web-abc-123",
  "items": [
    {
      "productId": "665f1a2b3c4d5e6f7a8b9c0d",
      "sku": "UC-1",
      "quantity": 2,
      "price": 350,
      "title": "Композит универсальный",
      "options": { "shade": "A2", "size": "2g" },
      "manufacturerId": "665f00000000000000001001",
      "countryId": "665f00000000000000002001",
      "unit": "шт"
    }
  ],
  "deliveryFee": 60,
  "name": "Иван",
  "comment": "Позвоните перед доставкой"
}
```

Ответ (пример):

```json
{
  "_id": "666000000000000000000001",
  "phone": "+380501234567",
  "clientId": "web-abc-123",
  "items": [
    {
      "productId": "665f1a2b3c4d5e6f7a8b9c0d",
      "sku": "UC-1",
      "quantity": 2,
      "price": 350,
      "title": "Композит универсальный",
      "options": { "shade": "A2", "size": "2g" },
      "manufacturerId": "665f00000000000000001001",
      "countryId": "665f00000000000000002001",
      "unit": "шт"
    }
  ],
  "itemsTotal": 700,
  "deliveryFee": 60,
  "total": 760,
  "status": "new",
  "name": "Иван",
  "comment": "Позвоните перед доставкой",
  "createdAt": "2025-09-13T12:00:00.000Z",
  "updatedAt": "2025-09-13T12:00:00.000Z"
}
```

Заметки:

- Номер телефона нормализуется к формату E.164; можно передавать `+`, пробелы и дефисы — это допустимо.
- При повторении значения `X-Idempotency-Key` вы получите тот же заказ, что и при первом успешном запросе.
- Цены в заказе — это снимок на момент оформления; скидки уже учтены в `priceFinal` в ответах каталога, но позиции заказа хранят выбранную цену.

---

## GET `/orders/history`

Гостевая история заказов по `phone` + `clientId`.

- Используйте до тех пор, пока пользователь не авторизовался через SMS.
- После авторизации рекомендуется переходить на `GET /me/orders` (тот же формат, но с JWT и пагинацией).

Параметры запроса:

- `phone` string (обязательно)
- `clientId` string (обязательно)

Ответ (пример):

```json
[
  {
    "_id": "666000000000000000000001",
    "phone": "+380501234567",
    "clientId": "web-abc-123",
    "items": [
      {
        "productId": "665f1a2b3c4d5e6f7a8b9c0d",
        "sku": "UC-1",
        "quantity": 2,
        "price": 350,
        "title": "Композит универсальный",
        "options": { "shade": "A2", "size": "2g" },
        "manufacturerId": "665f00000000000000001001",
        "countryId": "665f00000000000000002001",
        "unit": "шт"
      }
    ],
    "itemsTotal": 700,
    "deliveryFee": 60,
    "total": 760,
    "status": "new",
    "name": "Иван",
    "comment": "Позвоните перед доставкой",
    "createdAt": "2025-09-13T12:00:00.000Z",
    "updatedAt": "2025-09-13T12:00:00.000Z"
  }
]
```

---

## Ошибки

Все ошибки имеют единый формат:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "path": "/orders",
  "requestId": "abc123",
  "timestamp": "2025-09-13T12:00:00.000Z"
}
```

Иногда присутствует поле `details` с дополнительным контекстом. Можно передать свой заголовок `X-Request-Id` для трассировки запроса end‑to‑end.
