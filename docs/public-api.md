# Public API (Storefront)

This document describes the public endpoints for the storefront consumers. All responses are JSON. No API key is required.

## GET `/products`

List products with filters, sorting, and pagination. Only active products are returned.

Query params:

- `q` string (optional): full-text search.
- `category` string (ObjectId): filter by category.
- `manufacturerId` string | string[]: one or multiple manufacturer IDs.
- `countryId` string | string[]: one or multiple country IDs.
- `tags` string | string[]: include products having any of specified tags.
- `priceFrom` number: include products whose max variant price is >= this value.
- `priceTo` number: include products whose min variant price is <= this value.
- `options` JSON object string: variant options filter e.g. `{ "size": "2g", "shade": "A2" }`.
- `opt.<key>=<value>`: alternative way to filter by variant options. Repeat to OR values. Examples: `opt.size=2g&opt.size=4g&opt.shade=A2`.
- `sort` string: comma-separated fields, prefix with `-` for descending. Examples: `-createdAt`, `priceMinFinal,-title`.
- `page` number (default 1)
- `limit` number (default 20, max 50)

Examples:

- `GET /products?q=композит&sort=-createdAt&page=1&limit=20`
- `GET /products?category=665f00000000000000000001&manufacturerId=665f00000000000000001001&countryId=665f00000000000000002001`
- `GET /products?tags=popular&tags=stock`
- `GET /products?options={"size":"2g","shade":"A2"}`
- `GET /products?opt.size=2g&opt.size=4g&opt.shade=A2`

Response shape:

````
{
  items: [
    {
      _id, slug, title, description,
      categoryIds: string[], tags: string[], images: string[], attributes: [{ key, value }],
      variants: [
        { _id, sku, manufacturerId, countryId, options: Record<string, string|number>,
          price, priceOriginal, priceFinal, discountsApplied: [ { discountId, name, type, value, priceBefore, priceAfter } ],
          unit, images, barcode, isActive, variantKey }
      ],
      manufacturerIds: string[], countryIds: string[],
      priceMin, priceMax, priceMinFinal, priceMaxFinal,
      optionsSummary: Record<string, string[]>,
      ```
      ## POST `/orders`

      Create an order identified by `phone` + `clientId`. Throttled leniently in non-production.

      Request body example:

      ```
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

      Response example:

      ```
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

      Notes:

      - Phone is normalized to E.164 on input; pass free-form `+`, spaces, dashes ok.
      - Pricing in orders is a snapshot; discounts are already reflected in final product responses, but order items store the selected price.

      ## GET `/orders/history`

      Get order history for a user identified by `phone` + `clientId`.

      Query params:

      - `phone` string (required)
      - `clientId` string (required)

      Response example:

      ```
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

      Notes

      - Sorting accepts any stored field (e.g., `title`, `priceMinFinal`, `createdAt`). If a field is not indexed, large datasets may sort slower.
      - Variant options via `opt.*` support numeric or string equality (e.g., `opt.size=2` matches `2` and `"2"`).
      - Price filtering uses `priceMin/priceMax` computed from variants.
  ],
  page, limit, total
}
````

Notes:

- Sorting accepts any stored field (e.g., `title`, `priceMinFinal`, `createdAt`). If a field is not indexed, large datasets may sort slower.
- Variant options via `opt.*` support numeric or string equality, e.g., `opt.size=2` matches numeric `2` and string `"2"`.
- Price filtering uses product-level `priceMin`/`priceMax` fields computed from variants.

## GET `/products/:idOrSlug`

Fetch a single product by Mongo ObjectId or by slug.

Response includes variants with `priceOriginal`, `priceFinal`, and `discountsApplied` based on current active discounts.
