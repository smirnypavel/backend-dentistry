# Dentistry Shop Backend (NestJS + MongoDB)

Backend API for a dentistry e-commerce: public catalog, order submission, and admin API protected by `x-api-key`.

## Quick start

1. Install dependencies

```bash
npm install
```

2. Start MongoDB (Docker)

```bash
docker compose up -d mongo
```

3. Run in dev mode

```bash
npm run start:dev
```

API will be available at `http://localhost:3000`.

- Health: `GET /health`
- Swagger: `http://localhost:3000/docs`

## Environment

Copy `.env.example` to `.env` and adjust as needed:

- `PORT` – API port
- `MONGODB_URI` – Mongo connection string
- `DB_NAME` – DB name
- `ADMIN_API_KEY` – admin API key for `x-api-key` guard
- `CORS_ORIGINS` – comma-separated list of allowed origins
  - If you deploy frontend/admin to Vercel preview URLs before you have a domain, set `CORS_ALLOW_ALL=true` temporarily to allow all origins.

## Docker

To run API in Docker along with MongoDB:

```bash
docker compose up -d
```

## Scripts

- `npm run start:dev` – dev server with ts-node-dev
- `npm run build` – compile TypeScript
- `npm start` – run compiled server
- `npm run lint` – lint TS sources
- `npm run format` – format with Prettier

## Next

- Add Mongoose and database module
- Implement catalog and order endpoints
- Add admin API with x-api-key
