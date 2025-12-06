# Настройка переменных окружения для фронтенда

## Для Docker (через nginx)

Создайте файл `frontend/.env`:

```bash
NEXT_PUBLIC_API_URL=/api
```

Или используйте значения по умолчанию (уже настроено в Dockerfile).

## Для локальной разработки (без Docker)

Создайте файл `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Примечание: `.env.local` имеет приоритет над `.env` и не коммитится в git.
