# Публичное API (витрина)

Этот документ описывает публичные эндпоинты для фронтенда витрины. Все ответы — `JSON`. API‑ключ не требуется.

## Идентификация клиента (без регистрации)

- Клиенты не регистрируются. Идентификация происходит по паре `phone` + `clientId`.
- `clientId` генерируется на фронтенде (например, UUID v4) один раз и сохраняется локально (localStorage/IndexedDB/secure cookie) и передаётся в запросах.
- `phone` принимается в любом читаемом формате (можно `+`, пробелы, дефисы); на бэкенде нормализуется к E.164.
- Пара `phone` + `clientId` используется в: `POST /orders` (создание заказа) и `GET /orders/history` (история заказов).

Пример генерации `clientId` на фронте:

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

---

## GET `/categories`

Список активных категорий (для меню/фильтров).

Ответ (пример):

```json
[
  {
    "_id": "665f00000000000000000001",
    "slug": "materials",
    "name": "Материалы",
    "description": "Расходные материалы",
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
    "name": "Украина",
    "slug": "ua",
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
    "name": "Dent UA",
    "slug": "dent-ua",
    "countryIds": ["665f00000000000000002001"],
    "isActive": true,
    "createdAt": "2025-09-10T12:00:00.000Z",
    "updatedAt": "2025-09-10T12:00:00.000Z"
  }
]
```

---

# Публичное API (витрина)

Этот документ описывает публичные эндпоинты для фронтенда витрины. Все ответы — `JSON`. API‑ключ не требуется.

## Идентификация клиента (без регистрации)

- Клиенты не регистрируются. Идентификация происходит по паре `phone` + `clientId`.
- `clientId` генерируется на фронтенде (например, UUID v4) один раз и сохраняется локально (localStorage/IndexedDB/secure cookie) и передаётся в запросах.
- `phone` принимается в любом читаемом формате (можно `+`, пробелы, дефисы); на бэкенде нормализуется к E.164.
- Пара `phone` + `clientId` используется в: `POST /orders` (создание заказа) и `GET /orders/history` (история заказов).

Пример генерации `clientId` на фронте:

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

---

## GET `/categories`

Список активных категорий (для меню/фильтров).

Ответ (пример):

```json
[
  {
    "_id": "665f00000000000000000001",
    "slug": "materials",
    "name": "Материалы",
    "description": "Расходные материалы",
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
    "name": "Украина",
    "slug": "ua",
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
    "name": "Dent UA",
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

- `q` string (опционально): полнотекстовый поиск по индексу MongoDB (title/description).
- `qLike` string (опционально): поиск подстрокой без учёта регистра по `title`, `slug`, `description`, `variants.sku`. Удобен для «живого» поиска при вводе.
- `category` string (ObjectId): фильтр по категории.
- `manufacturerId` string | string[]: один или несколько производителей.
- `countryId` string | string[]: одна или несколько стран.
- `tags` string | string[]: товары, содержащие любой из указанных тегов.
- `priceFrom` number: товары, у которых максимальная цена вариантов >= значению.
- `priceTo` number: товары, у которых минимальная цена вариантов <= значению.
- `options` JSON‑строка объекта: фильтр по опциям варианта, например `{ "size": "2g", "shade": "A2" }`.
- `opt.<key>=<value>`: альтернативная форма фильтра по опциям. Повторяйте ключ, чтобы сделать OR по значениям. Пример: `opt.size=2g&opt.size=4g&opt.shade=A2`.
- `sort` string: поля через запятую, префикс `-` — по убыванию. Примеры: `-createdAt`, `priceMinFinal,-title`.
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
      "title": "Композит универсальный",
      "description": "Универсальный светополимерный композит для пломбирования",
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
  "title": "Композит универсальный",
  "description": "Универсальный светополимерный композит для пломбирования",
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

## POST `/orders`

Создать заказ, идентифицированный по `phone` + `clientId`.

Идемпотентность:

- Необязательный заголовок `X-Idempotency-Key: <string>` гарантирует, что повторный идентичный запрос вернёт тот же заказ, не создавая дублей.

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

История заказов для пользователя, определяемого по `phone` + `clientId`.

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
