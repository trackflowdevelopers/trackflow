#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_DIR="$REPO_ROOT/infrastructure/docker"
ENV_FILE="$DOCKER_DIR/.env.production"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.production.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "XATO: $ENV_FILE topilmadi."
  echo "Avval .env.production.example asosida .env.production yarating."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

DOMAIN="${DOMAIN:-api.trackflow.uz}"
ACME_EMAIL="${ACME_EMAIL:-admin@trackflow.uz}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

cd "$REPO_ROOT"

echo "==> Git pull"
git fetch origin
git reset --hard origin/main

if [[ ! -f "$CERT_PATH" ]]; then
  echo "==> SSL sertifikat topilmadi. Host certbot orqali olamiz..."
  mkdir -p /var/www/certbot
  certbot certonly --webroot -w /var/www/certbot \
    --email "$ACME_EMAIL" \
    --agree-tos --no-eff-email \
    --non-interactive \
    -d "$DOMAIN"
  echo "==> Nginx reload"
  systemctl reload nginx
fi

cd "$DOCKER_DIR"

echo "==> Build & deploy"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build backend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "==> Migration"
sleep 5
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T -w /app backend \
  node node_modules/typeorm/cli.js migration:run -d apps/backend/dist/database/data-source.js || \
  echo "Eslatma: migration o'tmadi (birinchi ishga tushishda bo'sh DB bo'lishi mumkin — bu OK)"

echo "==> Holat"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo ""
echo "Deploy tugadi."
echo "  API:    https://$DOMAIN/api"
echo "  Docs:   https://$DOMAIN/api/docs"
echo "  Health: https://$DOMAIN/api/health"
