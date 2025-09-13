# Admin API Guide

Secure base: All admin endpoints require the header `x-api-key: <ADMIN_API_KEY>` and are prefixed with `/admin`.

- Base URL (local): `http://localhost:3000`
- Auth header: `x-api-key`
- Content-Type: `application/json`

Common responses

- 200 OK — successful read/update/delete
- 201 Created — successful creation
- 400 Bad Request — validation error или конфликт (например, дублирующийся SKU варианта)
- 401 Unauthorized — отсутствует заголовок `x-api-key`
- 403 Forbidden — неверный `x-api-key` или ключ администратора не сконфигурирован
- 404 Not Found — ресурс не найден (актуально для эндпоинтов вариантов товара и PATCH товара)

Auth errors (примеры):

```
// 401 Missing key
{
  "statusCode": 401,
  "message": "Missing x-api-key",
  "error": "Unauthorized"
}

// 403 Admin key not configured
{
  "statusCode": 403,
  "message": "Admin API key is not configured",
  "error": "Forbidden"
}

// 403 Invalid key
{
  "statusCode": 403,
  "message": "Invalid admin API key",
  "error": "Forbidden"
}
```

---

## Products

Base: `/admin/products`

Product shape (simplified)

```
{
  _id: string,
  slug: string,
  title: string,
  description?: string,
  categoryIds: string[],
  tags?: string[],
  images?: string[],
  attributes?: Array<{ key: string; value: string|number|boolean }>,
  variants: Array<ProductVariant>,
  manufacturerIds: string[],
  countryIds: string[],
  priceMin: number,
  priceMax: number,
  optionsSummary?: Record<string, Array<string|number>>,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}
```

Variant shape

```
{
  _id: string,
  sku: string,
  manufacturerId: string,
  countryId?: string,
  options: Record<string, string|number>,
  price: number,
  unit?: string,
  images?: string[],
  barcode?: string,
  isActive: boolean,
  variantKey?: string
}
```

### List products

GET `/admin/products`

Query params:

- `q?: string` — full-text search by title/description
- `sort?: string` — e.g. `-createdAt,title`
- `page?: number` — default 1
- `limit?: number` — default 20, max 50

Responses:

- 200 OK

```
{
  "items": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "slug": "universal-composite",
      "title": "Композит универсальный",
      "description": "Описание...",
      "categoryIds": [],
      "tags": ["popular"],
      "images": [],
      "attributes": [{"key":"purpose","value":"restoration"}],
      "variants": [
        {
          "_id": "665f0000000000000000a001",
          "sku": "UC-1",
          "manufacturerId": "665f00000000000000001001",
          "countryId": "665f00000000000000002001",
          "options": {"shade":"A2","size":"2g"},
          "price": 350,
          "unit": "шт",
          "images": [],
          "barcode": "482000000001",
          "isActive": true,
          "variantKey": "..."
        }
      ],
      "manufacturerIds": [],
      "countryIds": [],
      "priceMin": 350,
      "priceMax": 480,
      "optionsSummary": {"shade":["A2"]},
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

Example:

```bash
curl -H "x-api-key: $ADMIN_API_KEY" \
  "http://localhost:3000/admin/products?q=comp&sort=-createdAt&page=1&limit=20"
```

### Get product

GET `/admin/products/:id`

```bash
curl -H "x-api-key: $ADMIN_API_KEY" \
  http://localhost:3000/admin/products/665f1a2b3c4d5e6f7a8b9c0d
```

Responses:

- 200 OK — документ продукта или `null`, если не найден

```
{
  "_id": "665f1a2b3c4d5e6f7a8b9c0d",
  "slug": "universal-composite",
  "title": "Композит универсальный",
  "description": "Описание...",
  "categoryIds": [],
  "tags": ["popular"],
  "images": [],
  "attributes": [{"key":"purpose","value":"restoration"}],
  "variants": [...],
  "manufacturerIds": [],
  "countryIds": [],
  "priceMin": 350,
  "priceMax": 480,
  "optionsSummary": {"shade":["A2"]},
  "isActive": true,
  "createdAt": "2025-09-10T12:00:00.000Z",
  "updatedAt": "2025-09-10T12:00:00.000Z"
}
```

### Create product

POST `/admin/products`

Body:

```
{
  "slug": "universal-composite",           // если пустой — будет сгенерирован из title
  "title": "Композит универсальный",
  "description": "Описание",
  "categoryIds": ["<catId>"] ,
  "tags": ["popular"],
  "images": ["https://.../1.jpg"],
  "attributes": [{"key": "purpose", "value": "restoration"}],
  "variants": [
    {
      "sku": "UC-A2-2G",
      "manufacturerId": "<manufacturerId>",
      "countryId": "<countryId>",
      "options": { "shade": "A2", "size": "2g" },
      "price": 350,
      "unit": "шт",
      "images": [],
      "barcode": "482...",
      "isActive": true
    }
  ],
  "isActive": true
}
```

Notes:

- `slug` нормализуется и делается уникальным; если пустой — генерируется из `title`.
- `variants[*].options` приводится к `string|number`.

Responses:

- 201 Created — созданный продукт

```
{ /* Product */ }
```

```bash
curl -X POST -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"slug":"","title":"Композит","variants":[{"sku":"UC-A2-2G","manufacturerId":"<mid>","price":350}]}' \
  http://localhost:3000/admin/products
```

### Update product

PATCH `/admin/products/:id`

Body (любые поля опциональны):

```
{
  "slug": "new-slug",   // будет нормализован и станет уникальным; если пустой — regen из title
  "title": "Новое имя",
  "description": "...",
  "categoryIds": ["<catId>"],
  "tags": ["sale"],
  "images": ["https://.../2.jpg"],
  "attributes": [{"key": "purpose", "value": "restoration"}],
  "variants": [ ... полная замена массива ... ],
  "isActive": true
}
```

```bash
curl -X PATCH -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Композит PRO","slug":""}' \
  http://localhost:3000/admin/products/<productId>
```

Responses:

- 200 OK — обновлённый продукт
- 404 Not Found — если продукт не найден

```
{ /* Product */ }
```

### Delete product

DELETE `/admin/products/:id`

```bash
curl -X DELETE -H "x-api-key: $ADMIN_API_KEY" \
  http://localhost:3000/admin/products/<productId>
```

Responses:

- 200 OK — удалённый документ или `null`, если не найден

```
{ /* Product | null */ }
```

### Add variant

POST `/admin/products/:id/variants`

Body:

```
{
  "sku": "UC-A3-2G",
  "manufacturerId": "<manufacturerId>",
  "countryId": "<countryId>",
  "options": { "shade": "A3", "size": "2g" },
  "price": 360,
  "unit": "шт",
  "images": [],
  "barcode": "482...",
  "isActive": true
}
```

Errors:

- 404 — product not found
- 400 — variant with this SKU already exists

Responses:

- 200 OK — обновлённый продукт с пересчитанными агрегатами

```
{ /* Product */ }
```

```bash
curl -X POST -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"sku":"UC-A3-2G","manufacturerId":"<mid>","price":360}' \
  http://localhost:3000/admin/products/<productId>/variants
```

### Update variant

PATCH `/admin/products/:id/variants/:variantId`

Body (любые поля):

```
{ "price": 380, "options": {"size":"3g"}, "isActive": true }
```

Errors:

- 404 — product/variant not found
- 400 — variant with this SKU already exists (если меняется sku)

Responses:

- 200 OK — обновлённый продукт с пересчитанными агрегатами

```
{ /* Product */ }
```

```bash
curl -X PATCH -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"price":380}' \
  http://localhost:3000/admin/products/<productId>/variants/<variantId>
```

### Delete variant

DELETE `/admin/products/:id/variants/:variantId`

Errors:

- 404 — product/variant not found

Responses:

- 200 OK — обновлённый продукт

```
{ /* Product */ }
```

```bash
curl -X DELETE -H "x-api-key: $ADMIN_API_KEY" \
  http://localhost:3000/admin/products/<productId>/variants/<variantId>
```

---

## Orders

Base: `/admin/orders`

### List orders

GET `/admin/orders`

Query params:

- `status?: new|processing|done|cancelled`
- `phone?: string` — нормализованный телефон (E.164)
- `clientId?: string`
- `createdFrom?: ISO string` — inclusive lower bound
- `createdTo?: ISO string` — inclusive upper bound
- `sort?: string` — e.g. `-createdAt`
- `page?: number` — default 1
- `limit?: number` — default 20 (max 100)

Responses:

- 200 OK

```
{
  "items": [
    {
      "_id": "666600000000000000000001",
      "phone": "+380971112233",
      "clientId": "abc-123",
      "items": [
        {
          "productId": "665f1a2b3c4d5e6f7a8b9c0d",
          "sku": "UC-1",
          "quantity": 2,
          "price": 350,
          "title": "Композит универсальный",
          "options": {"shade":"A2"},
          "manufacturerId": "665f00000000000000001001",
          "countryId": "665f00000000000000002001",
          "unit": "шт"
        }
      ],
      "itemsTotal": 700,
      "deliveryFee": 0,
      "total": 700,
      "status": "new",
      "createdAt": "2025-09-10T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

```bash
curl -H "x-api-key: $ADMIN_API_KEY" \
  "http://localhost:3000/admin/orders?status=new&sort=-createdAt&page=1&limit=20"
```

### Get order

GET `/admin/orders/:id`

```bash
curl -H "x-api-key: $ADMIN_API_KEY" \
  http://localhost:3000/admin/orders/<orderId>
```

Responses:

- 200 OK — документ заказа или `null`, если не найден

```
{ /* Order | null */ }
```

### Update order status

PATCH `/admin/orders/:id/status`

Body:

```
{ "status": "processing" } // one of: new|processing|done|cancelled
```

```bash
curl -X PATCH -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"status":"processing"}' \
  http://localhost:3000/admin/orders/<orderId>/status
```

Responses:

- 200 OK — обновлённый заказ или `null`, если не найден

```
{ /* Order | null */ }
```

---

## Countries

Base: `/admin/countries`

- GET `/admin/countries` — список
  - 200 OK — `Country[]`
  - Пример ответа:
  ```
  [
    {
      "_id": "6666000000000000000000a1",
      "code": "UA",
      "name": "Ukraine",
      "slug": "ukraine",
      "isActive": true,
      "createdAt": "2025-09-10T12:00:00.000Z",
      "updatedAt": "2025-09-10T12:00:00.000Z"
    }
  ]
  ```
- GET `/admin/countries/:id` — получить по id
  - 200 OK — `Country | null`
- POST `/admin/countries` — создать
  - Body: `{ code: string; name: string; slug: string; isActive?: boolean }`
  - 201 Created — созданный `Country`
- PATCH `/admin/countries/:id` — обновить
  - Body: частичное обновление тех же полей
  - 200 OK — обновлённый `Country` или `null`
- DELETE `/admin/countries/:id` — удалить
  - 200 OK — удалённый `Country` или `null`

Примеры:

```bash
curl -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/admin/countries

curl -X POST -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"code":"DE","name":"Germany","slug":"germany"}' \
  http://localhost:3000/admin/countries
```

---

## Manufacturers

Base: `/admin/manufacturers`

- GET `/admin/manufacturers` — список
  - 200 OK — `Manufacturer[]`
- GET `/admin/manufacturers/:id` — получить по id
  - 200 OK — `Manufacturer | null`
- POST `/admin/manufacturers` — создать
  - Body: `{ name: string; slug: string; countryIds?: string[]; logoUrl?: string; bannerUrl?: string; website?: string; description?: string; isActive?: boolean }`
  - 201 Created — созданный `Manufacturer`
- PATCH `/admin/manufacturers/:id` — обновить (можно менять `countryIds`)
  - 200 OK — обновлённый `Manufacturer` или `null`
- DELETE `/admin/manufacturers/:id` — удалить
  - 200 OK — удалённый `Manufacturer` или `null`

```bash
curl -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/admin/manufacturers

curl -X POST -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"3M","slug":"3m","countryIds":[]}' \
  http://localhost:3000/admin/manufacturers
```

---

## Categories

Base: `/admin/categories`

- GET `/admin/categories` — список (сортировка по `sort`, затем `name`)
  - 200 OK — `Category[]`
- GET `/admin/categories/:id` — получить по id
  - 200 OK — `Category | null`
- POST `/admin/categories` — создать
  - Body: `{ slug: string; name: string; description?: string; sort?: number; isActive?: boolean }`
  - 201 Created — созданная `Category`
- PATCH `/admin/categories/:id` — обновить
  - 200 OK — обновлённая `Category` или `null`
- DELETE `/admin/categories/:id` — удалить
  - 200 OK — удалённая `Category` или `null`

```bash
curl -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/admin/categories

curl -X POST -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"slug":"composites","name":"Композиты"}' \
  http://localhost:3000/admin/categories
```

---

## Notes for frontend implementation

- Всегда отправляйте `x-api-key` для всех эндпоинтов `/admin/*`.
- В товарах любые изменения массива `variants` в PATCH приводят к полному пересчёту агрегатов — не нужно вручную пересчитывать `priceMin/Max`, `optionsSummary`, `manufacturerIds`, `countryIds`.
- Для добавления/редактирования одного варианта используйте специальные эндпоинты `/variants` — это удобнее и безопаснее, чем править весь массив.
- `phone` в заказах фильтруется по нормализованному виду (E.164). Если на фронте номера в свободном формате — приведите к `+XXXXXXXXXXX`.
- Ошибки 400 для варианта товара означают конфликт SKU в рамках одного товара.
- В `GET /:id` и `PATCH/DELETE` для стран/производителей/категорий и заказов — при отсутствии сущности возвращается `null` (исключения не бросаются). Для PATCH товара и эндпоинтов вариантов — возвращается 404.

---

# Приложение: Общие схемы типов (JSON Schema)

Ниже указаны точные JSON Schema для основных сущностей админки. Эти схемы соответствуют текущим Mongoose-схемам и формам ответов.

Важно:

- Все `_id`, `categoryIds`, `manufacturerIds`, `countryIds` — строки формата ObjectId.
- `createdAt`/`updatedAt` — ISO строки дат.
- Для краткости примеры `additionalProperties` чаще указаны как `false` (можно снять, если на фронте нужен более гибкий приём структур).

## Schema: ProductVariant

```json
{
  "$id": "#/components/schemas/ProductVariant",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "_id": { "type": "string" },
    "sku": { "type": "string" },
    "manufacturerId": { "type": "string" },
    "countryId": { "type": ["string", "null"] },
    "options": {
      "type": "object",
      "additionalProperties": { "type": ["string", "number"] },
      "default": {}
    },
    "price": { "type": "number" },
    "unit": { "type": ["string", "null"] },
    "images": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "barcode": { "type": ["string", "null"] },
    "isActive": { "type": "boolean", "default": true },
    "variantKey": { "type": ["string", "null"] }
  },
  "required": ["sku", "manufacturerId", "price", "isActive"]
}
```

## Schema: Product

```json
{
  "$id": "#/components/schemas/Product",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "_id": { "type": "string" },
    "slug": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": ["string", "null"] },
    "categoryIds": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "images": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "attributes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "key": { "type": "string" },
          "value": { "type": ["string", "number", "boolean"] }
        },
        "required": ["key", "value"]
      },
      "default": []
    },
    "variants": {
      "type": "array",
      "items": { "$ref": "#/components/schemas/ProductVariant" },
      "default": []
    },
    "manufacturerIds": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "countryIds": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "priceMin": { "type": "number", "default": 0 },
    "priceMax": { "type": "number", "default": 0 },
    "optionsSummary": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "type": ["string", "number"] }
      },
      "default": {}
    },
    "isActive": { "type": "boolean", "default": true },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "updatedAt": { "type": ["string", "null"], "format": "date-time" }
  },
  "required": ["slug", "title", "variants", "isActive"]
}
```

## Schema: OrderItemSnapshot

```json
{
  "$id": "#/components/schemas/OrderItemSnapshot",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "productId": { "type": "string" },
    "sku": { "type": "string" },
    "quantity": { "type": "number", "minimum": 1 },
    "price": { "type": "number" },
    "title": { "type": "string" },
    "options": {
      "type": "object",
      "additionalProperties": { "type": ["string", "number"] },
      "default": {}
    },
    "manufacturerId": { "type": ["string", "null"] },
    "countryId": { "type": ["string", "null"] },
    "unit": { "type": ["string", "null"] }
  },
  "required": ["productId", "sku", "quantity", "price", "title"]
}
```

## Schema: Order

```json
{
  "$id": "#/components/schemas/Order",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "_id": { "type": "string" },
    "phone": { "type": "string" },
    "clientId": { "type": "string" },
    "items": {
      "type": "array",
      "items": { "$ref": "#/components/schemas/OrderItemSnapshot" },
      "default": []
    },
    "itemsTotal": { "type": "number" },
    "deliveryFee": { "type": "number", "default": 0 },
    "total": { "type": "number" },
    "status": { "type": "string", "enum": ["new", "processing", "done", "cancelled"] },
    "name": { "type": ["string", "null"] },
    "comment": { "type": ["string", "null"] },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "updatedAt": { "type": ["string", "null"], "format": "date-time" }
  },
  "required": ["phone", "clientId", "items", "itemsTotal", "total", "status"]
}
```

## Schema: Country

```json
{
  "$id": "#/components/schemas/Country",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "_id": { "type": "string" },
    "code": { "type": "string" },
    "name": { "type": "string" },
    "slug": { "type": "string" },
    "isActive": { "type": "boolean", "default": true },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "updatedAt": { "type": ["string", "null"], "format": "date-time" }
  },
  "required": ["code", "name", "slug", "isActive"]
}
```

## Schema: Manufacturer

```json
{
  "$id": "#/components/schemas/Manufacturer",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "_id": { "type": "string" },
    "name": { "type": "string" },
    "slug": { "type": "string" },
    "countryIds": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "logoUrl": { "type": ["string", "null"] },
    "bannerUrl": { "type": ["string", "null"] },
    "website": { "type": ["string", "null"] },
    "description": { "type": ["string", "null"] },
    "isActive": { "type": "boolean", "default": true },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "updatedAt": { "type": ["string", "null"], "format": "date-time" }
  },
  "required": ["name", "slug", "countryIds", "isActive"]
}
```

## Schema: Category

```json
{
  "$id": "#/components/schemas/Category",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "_id": { "type": "string" },
    "slug": { "type": "string" },
    "name": { "type": "string" },
    "description": { "type": ["string", "null"] },
    "sort": { "type": ["number", "null"], "default": 0 },
    "isActive": { "type": "boolean", "default": true },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "updatedAt": { "type": ["string", "null"], "format": "date-time" }
  },
  "required": ["slug", "name", "isActive"]
}
```
