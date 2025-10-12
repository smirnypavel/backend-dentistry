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

Copy `.env.example` to `.env` and adjust as needed. Ключевые блоки:

- Базовые переменные: `PORT`, `MONGODB_URI`, `DB_NAME`, `ADMIN_API_KEY`, `CORS_ORIGINS`, `CORS_ALLOW_ALL`.
- Storefront JWT: `CUSTOMER_JWT_SECRET`, `CUSTOMER_JWT_EXPIRES_IN`, `CUSTOMER_JWT_ISSUER`, опционально `CUSTOMER_JWT_AUDIENCE`.
- Refresh токены (если нужны): `CUSTOMER_REFRESH_SECRET`, `CUSTOMER_REFRESH_EXPIRES_IN`.
- Нормализация телефонов: `CUSTOMER_PHONE_DEFAULT_COUNTRY` (например, `UA`).
- OTP и rate limit для SMS: блок `CUSTOMER_OTP_*`.
- SMS-провайдер: `SMS_PROVIDER` (`console`, `http`, `noop`, `twilio`) и дополнительные `SMS_API_URL`, `SMS_API_KEY`, `SMS_FROM`, `SMS_TIMEOUT_MS`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`.

Для локальной разработки достаточно оставить `SMS_PROVIDER=console` — коды будут логироваться в консоль.

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
