/* eslint-disable no-console */
import 'dotenv/config';
import axios from 'axios';

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Fetch products from public API
  const productsRes = await axios.get(`${baseUrl}/products`, {
    params: { limit: 50 },
  });
  const products = productsRes.data?.items ?? [];
  if (!products.length) {
    console.log('No products found via /products. Run base seed first: npm run seed');
    return;
  }

  // Build some order payloads using available variants
  const picks = products
    .flatMap((p: any) => (p.variants || []).map((v: any) => ({ p, v })))
    .filter((x: any) => x.v?.isActive !== false)
    .slice(0, 5);

  if (picks.length < 2) {
    console.log('Not enough active variants to create demo orders. Add more products/variants.');
    return;
  }

  const orders = [
    {
      phone: '+380501234567',
      clientId: 'web-demo-001',
      items: [
        {
          productId: picks[0].p._id,
          sku: picks[0].v.sku,
          quantity: 1,
          price: picks[0].v.price, // server will recalc discounts
          title: picks[0].p.title,
          options: picks[0].v.options,
          manufacturerId: picks[0].v.manufacturerId,
          countryId: picks[0].v.countryId,
          unit: picks[0].v.unit,
        },
      ],
      deliveryFee: 0,
      name: 'Демо 1',
      comment: 'seed order 1',
    },
    {
      phone: '+380501234567',
      clientId: 'web-demo-001',
      items: [
        {
          productId: picks[1].p._id,
          sku: picks[1].v.sku,
          quantity: 2,
          price: picks[1].v.price,
          title: picks[1].p.title,
          options: picks[1].v.options,
          manufacturerId: picks[1].v.manufacturerId,
          countryId: picks[1].v.countryId,
          unit: picks[1].v.unit,
        },
        picks[2]
          ? {
              productId: picks[2].p._id,
              sku: picks[2].v.sku,
              quantity: 1,
              price: picks[2].v.price,
              title: picks[2].p.title,
              options: picks[2].v.options,
              manufacturerId: picks[2].v.manufacturerId,
              countryId: picks[2].v.countryId,
              unit: picks[2].v.unit,
            }
          : undefined,
      ].filter(Boolean),
      deliveryFee: 60,
      name: 'Демо 2',
      comment: 'seed order 2',
    },
    {
      phone: '+380671234567',
      clientId: 'web-demo-002',
      items: [
        {
          productId: picks[0].p._id,
          sku: picks[0].v.sku,
          quantity: 3,
          price: picks[0].v.price,
          title: picks[0].p.title,
          options: picks[0].v.options,
          manufacturerId: picks[0].v.manufacturerId,
          countryId: picks[0].v.countryId,
          unit: picks[0].v.unit,
        },
      ],
      deliveryFee: 40,
      name: 'Демо 3',
      comment: 'seed order 3',
    },
  ];

  for (const [idx, order] of orders.entries()) {
    try {
      const res = await axios.post(`${baseUrl}/orders`, order, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`#${idx + 1} OK:`, res.data?._id, 'total:', res.data?.total);
    } catch (err: any) {
      console.error(`#${idx + 1} FAIL:`, err?.response?.status, err?.response?.data || err);
    }
  }
}

main().catch((e) => {
  console.error('Seed orders error:', e);
  process.exit(1);
});
