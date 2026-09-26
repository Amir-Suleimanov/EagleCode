# EagleCode Sport

React MVP спортивной платформы рейтинга и развития жителей Дагестана, перенесённый из макетов `cyber.zip`.

## Запуск

```bash
npm install
npm run dev
```

Демо-пользователь: `athlete@eaglecode.ru / demo123`  
Демо-администратор: `admin@eaglecode.ru / demo123`

## Проверки

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e -- --project=desktop
```

По умолчанию данные сохраняются в `localStorage`. Для подключения backend:

```env
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=/api
```

Контракт транспорта описан в `src/services/DataClient.ts`, HTTP-маршруты — в `src/services/HttpDataClient.ts`.

## Django REST backend

Backend расположен в `backend/`. Быстрый запуск:

```bash
cd backend
docker compose up -d db
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Затем запустите frontend с `VITE_DATA_SOURCE=api` и `VITE_API_BASE_URL=http://localhost:8000/api`.
Swagger UI доступен по адресу `http://localhost:8000/api/docs`.
