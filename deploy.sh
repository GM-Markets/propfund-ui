#!/usr/bin/env bash
# Build the Propfund image, tear down any running stack, then start it.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: missing $ENV_FILE — copy .env.example to .env and fill in values." >&2
  exit 1
fi

echo "==> Building image..."
docker compose -f "$COMPOSE_FILE" build

echo "==> Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

echo "==> Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Status"
docker compose -f "$COMPOSE_FILE" ps

APP_PORT="$(grep -E '^APP_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)"
APP_PORT="${APP_PORT:-3000}"
echo "Deployed. App listening on http://localhost:${APP_PORT}"
