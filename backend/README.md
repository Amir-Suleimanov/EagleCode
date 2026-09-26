# EagleCode API

## Локальный запуск

Требуются Python 3.13 и Docker с Compose.

```bash
docker compose up -d db
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

В production обязательны собственные secret key, hosts, CORS и PostgreSQL credentials.

## Проверки

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
ruff check .
pytest
python manage.py spectacular --file schema.yml --validate
```

Production WSGI-команда после применения миграций:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```
