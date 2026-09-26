FROM python:3.12-slim

# The judge starts sibling containers through the host's Docker socket, so only the CLI is needed.
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml ./
COPY apps ./apps
COPY common ./common
COPY config ./config
COPY manage.py ./
RUN pip install --no-cache-dir .

EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 60"]
