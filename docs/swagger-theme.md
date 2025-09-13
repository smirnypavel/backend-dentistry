# Swagger UI — Переключение тёмных тем

Документация Swagger доступна по адресу `http://<host>:<port>/docs`. В репозитории есть несколько готовых тёмных тем, а также возможность подключить свою.

## Варианты тем

Доступные преднастроенные файлы (отдаются как статические ассеты по пути `/docs-assets/...`):

- `/docs-assets/swagger-dark.css` — дефолтная тёмная тема
- `/docs-assets/swagger-dark-monokai.css` — Monokai
- `/docs-assets/swagger-dark-dracula.css` — Dracula

## Как переключить тему

Есть два способа:

1. Через переменную окружения `SWAGGER_THEME`:

- Допустимые значения: `default`, `monokai`, `dracula`
- Пример запуска:

```bash
SWAGGER_THEME=dracula npm run start:dev
```

2. Явно указать URL/путь к CSS через `SWAGGER_CSS_URL`:

- Можно указать как абсолютный URL, так и путь, обслуживаемый приложением (например, `/docs-assets/...`).
- Пример:

```bash
SWAGGER_CSS_URL=/docs-assets/swagger-dark-monokai.css npm run start:dev
```

Если обе переменные заданы, приоритет у `SWAGGER_CSS_URL`.

## Своя тема

Поместите файл в каталог `public/` (он доступен по `/docs-assets/...`) и укажите путь через `SWAGGER_CSS_URL`, например:

```bash
SWAGGER_CSS_URL=/docs-assets/swagger-custom.css npm run start:dev
```
