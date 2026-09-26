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

По умолчанию данные сохраняются в `localStorage`, backend не нужен. Чтобы работать против API:

```bash
npm run dev:api
```

Скрипт поднимает Vite в режиме `api`, который читает `.env.api`. Переменные не задаются
в командной строке, поэтому команда одинакова в bash, PowerShell и cmd.

`VITE_API_BASE_URL` должен быть абсолютным: в `vite.config.ts` нет прокси, поэтому
относительный `/api` ушёл бы на dev-сервер и вернул 404.

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

Затем запустите frontend командой `npm run dev:api`.
Swagger UI доступен по адресу `http://localhost:8000/api/docs`.

## Запуск под Windows (PowerShell)

Требуются Node.js 20+, Python 3.13+ и Docker Desktop (для PostgreSQL).
Всё выполняется в PowerShell, WSL не нужен.

Только интерфейс, на демо-данных в `localStorage`:

```powershell
cd C:\путь\к\EagleCode
npm install
npm run dev
```

Полный стек — в первом окне PowerShell поднимаем базу и API:

```powershell
cd C:\путь\к\EagleCode\backend
docker compose up -d db
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
Copy-Item .env.example .env        # замените DJANGO_SECRET_KEY на свой
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Во втором окне — frontend:

```powershell
cd C:\путь\к\EagleCode
npm run dev:api
```

Если `Activate.ps1` не запускается из-за политики выполнения, разрешите скрипты
для текущего пользователя: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

Без Docker Desktop поставьте PostgreSQL 16 для Windows и создайте базу `eaglecode`
с пользователем `eaglecode` и паролем `eaglecode` — значения по умолчанию из `.env.example`.

Демо-доступы после `seed_demo`: `athlete@eaglecode.ru` и `admin@eaglecode.ru`, пароль `demo123`.

## Модуль контестов (Кейс №2)

Организатор: `/admin/contests` — создание контеста, задания с тестами, публикация, старт, проверка решений, завершение.
Спортсмен: `/app/contests` — условия, редактор кода, вердикты, таблица; итог попадает в профиль и рейтинг.

Автопроверка Python-решений идёт в одноразовом Docker-контейнере без сети (нужен запущенный Docker Desktop):

```bash
docker build -t eaglecode-judge:py312 backend/judge
```

Без Docker поставьте `JUDGE_ENABLED=false` в `backend/.env` — решения уйдут на ручную проверку.
Порт Postgres в `backend/compose.yaml` — 5433 (5432 часто занят локальным Postgres).
