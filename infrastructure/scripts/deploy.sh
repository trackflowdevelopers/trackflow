#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_DIR="$REPO_ROOT/infrastructure/docker"
NGINX_DIR="$REPO_ROOT/infrastructure/nginx"
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

cd "$REPO_ROOT"

echo "==> Git pull"
git fetch origin
git reset --hard origin/main

cd "$DOCKER_DIR"

CERT_PATH="/var/lib/docker/volumes/docker_letsencrypt_certs/_data/live/$DOMAIN/fullchain.pem"

if [[ ! -f "$CERT_PATH" ]]; then
  echo "==> SSL sertifikat topilmadi. Bootstrap rejimida ishga tushaman..."

  # 1) Bootstrap nginx config (faqat HTTP) bilan vaqtinchalik ko'taramiz
  cp "$NGINX_DIR/nginx.bootstrap.conf" "$NGINX_DIR/nginx.production.conf.bak"
  trap 'mv -f "$NGINX_DIR/nginx.production.conf.bak" "$NGINX_DIR/nginx.production.conf" 2>/dev/null || true' EXIT

  PROD_CONF="$NGINX_DIR/nginx.production.conf"
  BOOTSTRAP_CONF="$NGINX_DIR/nginx.bootstrap.conf"
  cp "$PROD_CONF" "$PROD_CONF.real"
  cp "$BOOTSTRAP_CONF" "$PROD_CONF"

  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d nginx

  echo "==> Certbot orqali sertifikat olamiz: $DOMAIN"
  docker run --rm \
    -v docker_letsencrypt_certs:/etc/letsencrypt \
    -v docker_certbot_webroot:/var/www/certbot \
    certbot/certbot certonly \
      --webroot -w /var/www/certbot \
      --email "$ACME_EMAIL" \
      --agree-tos --no-eff-email \
      --non-interactive \
      -d "$DOMAIN"

  cp "$PROD_CONF.real" "$PROD_CONF"
  rm -f "$PROD_CONF.real" "$NGINX_DIR/nginx.production.conf.bak"
  trap - EXIT
fi

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
