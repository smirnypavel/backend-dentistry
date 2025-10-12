# План интеграции покупательской авторизации для витрины

## 1. Цели и ограничения

- Добавить регистрацию/логин покупателей через SMS, сохранив текущую работу гостевого оформления заказа.
- Привязать новые и существующие (по `phone + clientId`) заказы к объекту покупателя без миграций (база пока пустая).
- Обеспечить возможность просмотра истории заказов после авторизации.
- Подготовить базу для будущего расширения (личный кабинет, адреса, админ-аналитика).

## 2. Модели и инфраструктура

- Создать модуль `customers`:
  - `Customer`:
    - `phone` (строка, нормализованный E.164, уникальный индекс).
    - `isPhoneVerified` (boolean, по умолчанию `false`).
    - `name` (опционально).
    - `email?`, `marketingOptIn?`, `metadata?`, `createdAt`, `updatedAt`, `lastLoginAt` (timestamps через mongoose).
  - `CustomerOtp`:
    - `phone`, `clientId`, `codeHash`, `expiresAt`, `attempts`, `reason` (`signup|login|reset`), `createdAt`.
    - Индексы: TTL по `expiresAt`, уникальность по активной связке `(phone, reason, expiresAt>now)`.
- Интеграция с SMS-шлюзом:
  - Интерфейс `SmsSender` + адаптеры: `RealSmsSender` (для прод), `ConsoleSmsSender` (dev/test).
  - Переменные окружения: `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_FROM`, тестовый режим (отключение реальных SMS).

## 3. Публичные API (витрина)

- `POST /auth/request-code`
  - Вход: `{ phone, clientId }`.
  - Действия: нормализация телефона, проверка rate limit (по телефону, IP, clientId), генерация 4–6 цифр, хэш, запись в `CustomerOtp`, отправка SMS.
  - Ответ: `{ requestId, resendDelaySec, expiresInSec }`.
- `POST /auth/verify-code`
  - Вход: `{ phone, code, requestId, clientId, name? }`.
  - Проверка OTP, инкремент попыток, при успехе `CustomerService.upsertByPhone` (устанавливаем `isPhoneVerified=true`, `name`, `lastLoginAt`).
  - Привязка «гостевых» заказов: `OrdersService.attachByPhoneAndClientId(customerId, phone, clientId)`.
  - Ответ: `{ accessToken, refreshToken?, customer }` (минимальные поля: `_id`, `phone`, `name`).
- `POST /auth/refresh` (при наличии refresh-механизма) и `POST /auth/logout` (инвалидировать refresh-токен) — можно добавить во второй итерации.
- `GET /me`
  - Возвращает профиль покупателя и агрегированную информацию (например, количество заказов).
- `GET /me/orders`
  - Пагинация, сортировка по `createdAt desc`, возвращает заказы текущего покупателя.
- Обновить существующий `POST /orders`:
  - Если пользователь авторизован (JWT), игнорировать входной `clientId`, использовать `customerId`.
  - Сохранять `clientId` как поле для аналитики (по-прежнему требуется для гостей).
- Обновить `GET /orders/history`:
  - При авторизации возвращать заказы по `customerId` (без `phone`/`clientId`).
  - Сохранить старый запрос для гостей, пометив его как устаревающий.

## 4. Сервисный слой

- `CustomerService`
  - Методы: `normalizePhone`, `findByPhone`, `upsertVerified`, `attachGuestOrders`.
- `CustomerAuthService`
  - Генерация/верификация OTP (взаимодействие с `CustomerOtp`), создание JWT (использовать отдельный `JwtModule.register` с другим секретом/экспирацией).
  - Утилиты для rate limiting (можно применить встроенный `ThrottlerModule` + кастомные ключи).
- `OrdersService`
  - Добавить метод `attachByPhoneAndClientId` (используется после верификации).
  - Обновить `create` и `history` для работы с `customerId`.

## 5. Настройка безопасности

- JWT для покупателей: отдельные переменные `CUSTOMER_JWT_SECRET`, `CUSTOMER_JWT_EXPIRES_IN`, опционально `CUSTOMER_REFRESH_SECRET`.
- Throttling:
  - SMS: макс N попыток за час (конфиг через `.env`).
  - Verify: ограничение на проверки в минуту.
- Логирование: события запроса/подтверждения кода, ошибки провайдера, превышения лимитов.

## 6. Изменения в схеме заказа

- В `Order`:
  - Добавить `customerId?: Types.ObjectId` и индекс `{ customerId: 1, createdAt: -1 }`.
  - В ответах API возвращать объект `customer?: { _id, phone, name? }` (по JWT контексту или `null`).
- Idempotency: использовать `customerId || clientId` при построении хэша, чтобы авторизованный пользователь мог повторно отправить заказ.

## 7. Документация и контракты

- Обновить `docs/public-api.md`: новые секции `/auth/request-code`, `/auth/verify-code`, `/me`, `/me/orders`, обновлённые `/orders`, `/orders/history`.
- Добавить JSON Schemas + TS-типы (`docs/snippets`) для новых ответов.
- README: требования к SMS, настройка `.env`, описание тестового режима.

## 8. Фронтенд задачи (витрина)

- UI/flow: форма входа (телефон, ввод кода, таймер), ручка resend, отображение ошибок.
- Хранение токенов: авторизованный статус, обработка 401 → возврат на ввод кода.
- Личный раздел: страница «Мои заказы» (список + детали), кнопка выхода.
- Гостевой fallback: если пользователь не авторизован, использовать старую форму `phone + clientId` (до полной миграции).

## 9. Тестирование

- Unit: сервисы `CustomerService`, `CustomerAuthService`, генерация/проверка OTP, связь заказов.
- E2E: happy path (запрос → верификация → создание заказа), повторное использование кода, истечение срока, неверный код, превышение лимита.
- Нагрузочные проверки для SMS-энтрипоинтов (чтобы не заблокировать шлюз).

## 10. Развёртывание и включение

- Добавить новые env-переменные в шаблон `.env.example`.
- Настроить секреты в CI/CD.
- Проверить дополнительные индексы (телефон, customerId).
- Настроить алёрты по ошибкам отправки SMS и превышению лимитов.
- После стабилизации — можно удалить гостевой `GET /orders/history` и обновить админку.
