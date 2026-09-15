#!/usr/bin/env bash
set -euo pipefail

# Local / EC2 Docker deploy for the Vanta / PropFund UI.
# Multiple envs can run on the same machine (ports + container names per slot).
#
# Usage:
#   ./scripts/deploy.sh dev
#   ./scripts/deploy.sh pvt
#   ./scripts/deploy.sh prod
#   ./scripts/deploy.sh pvt V3_APP_PORT=5611
#   npm run deploy:dev | deploy:pvt | deploy:prod
#   pnpm deploy:dev
#
# Build modes:
#   BUILD_MODE=host   (default on Node ≥22) — `next build` on the host (uses
#                     local .next/cache), then Docker only packages standalone.
#   BUILD_MODE=docker — full `next build` inside Docker (Node 22 + pnpm 11).
#                     Auto-selected when host Node is <22 (EC2 Node 18 cannot
#                     install this repo's pnpm 11 lockfile).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

load_env_file ".env"
load_env_file ".env.local"

normalize_deploy_env() {
  local raw="${1:-dev}"
  raw="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]')"
  case "$raw" in
    pvt|private) printf 'pvt' ;;
    prod|production) printf 'prod' ;;
    dev|development) printf 'dev' ;;
    *)
      echo "Unsupported env '$raw' (use: dev | pvt | prod)" >&2
      exit 1
      ;;
  esac
}

case "$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')" in
  dev|development|pvt|private|prod|production)
    DEPLOY_ENV="$(normalize_deploy_env "$1")"
    shift
    ;;
  "")
    if [[ -n "${DEPLOY_ENV:-}" ]]; then
      DEPLOY_ENV="$(normalize_deploy_env "$DEPLOY_ENV")"
    else
      DEPLOY_ENV="dev"
    fi
    ;;
  *=*)
    if [[ -n "${DEPLOY_ENV:-}" ]]; then
      DEPLOY_ENV="$(normalize_deploy_env "$DEPLOY_ENV")"
    else
      DEPLOY_ENV="dev"
    fi
    ;;
  *)
    echo "Unsupported env '${1}' (use: dev | pvt | prod)" >&2
    exit 1
    ;;
esac
export DEPLOY_ENV

SITE_URL_FROM_CLI=""
GATEWAY_FROM_CLI=""
VANTA_FROM_CLI=""
for arg in "$@"; do
  case "$arg" in
    *=*)
      key="${arg%%=*}"
      val="${arg#*=}"
      export "$key=$val"
      case "$key" in
        NEXT_PUBLIC_SITE_URL) SITE_URL_FROM_CLI="$val" ;;
        NEXT_PUBLIC_GATEWAY_URL) GATEWAY_FROM_CLI="$val" ;;
        VANTA_API_BASE_URL) VANTA_FROM_CLI="$val" ;;
      esac
      ;;
    *)
      echo "Ignoring unknown argument: $arg" >&2
      ;;
  esac
done

default_port_for_env() {
  case "$1" in
    dev) echo 5711 ;;
    pvt) echo 5611 ;;
    prod) echo 5411 ;;
    *) echo 5711 ;;
  esac
}

default_site_url_for_env() {
  case "$1" in
    dev) echo "https://dev.propfund.io" ;;
    pvt) echo "https://pvt.propfund.io" ;;
    prod) echo "https://propfund.io" ;;
    *) echo "https://dev.propfund.io" ;;
  esac
}

default_gateway_url_for_env() {
  echo "https://gate.propfund.io"
}

is_loopback_url() {
  case "${1:-}" in
    *localhost*|*127.0.0.1*) return 0 ;;
    *) return 1 ;;
  esac
}

DEFAULT_V3_APP_PORT="$(default_port_for_env "$DEPLOY_ENV")"
export V3_APP_PORT="${V3_APP_PORT:-$DEFAULT_V3_APP_PORT}"
export APP_PORT="${APP_PORT:-$V3_APP_PORT}"
export PORT="${PORT:-$V3_APP_PORT}"
# .env localhost is for `next dev` only — deploy bakes public hostnames.
if [[ -z "$SITE_URL_FROM_CLI" ]]; then
  export NEXT_PUBLIC_SITE_URL="$(default_site_url_for_env "$DEPLOY_ENV")"
fi
if [[ -z "$GATEWAY_FROM_CLI" ]] && { [[ -z "${NEXT_PUBLIC_GATEWAY_URL:-}" ]] || is_loopback_url "${NEXT_PUBLIC_GATEWAY_URL}"; }; then
  export NEXT_PUBLIC_GATEWAY_URL="$(default_gateway_url_for_env "$DEPLOY_ENV")"
fi
if [[ -z "$VANTA_FROM_CLI" ]] && { [[ -z "${VANTA_API_BASE_URL:-}" ]] || is_loopback_url "${VANTA_API_BASE_URL}"; }; then
  export VANTA_API_BASE_URL="${NEXT_PUBLIC_GATEWAY_URL%/}/van"
fi

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-propfund-${DEPLOY_ENV}}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 18)"
if [[ -z "${BUILD_MODE:-}" && "$NODE_MAJOR" -lt 22 ]]; then
  BUILD_MODE=docker
  echo "Node $(node -v) cannot install the pnpm 11 lockfile — using BUILD_MODE=docker"
fi
BUILD_MODE="$(printf '%s' "${BUILD_MODE:-host}" | tr '[:upper:]' '[:lower:]')"
case "$BUILD_MODE" in
  host|docker) ;;
  *)
    echo "Unsupported BUILD_MODE='$BUILD_MODE' (use: host | docker)" >&2
    exit 1
    ;;
esac

stage_host_standalone() {
  if [[ ! -f .next/standalone/server.js ]]; then
    echo "Host build did not produce .next/standalone/server.js (is output:'standalone' set?)" >&2
    exit 1
  fi
  if [[ ! -d .next/static ]]; then
    echo "Host build missing .next/static" >&2
    exit 1
  fi

  echo "Staging standalone output → .docker-dist/…"
  rm -rf .docker-dist
  mkdir -p .docker-dist/.next
  cp -a .next/standalone/. .docker-dist/
  cp -a .next/static .docker-dist/.next/static
  if [[ -d public ]]; then
    rm -rf .docker-dist/public
    cp -a public .docker-dist/public
  fi
}

pnpm_spec_for_node() {
  local major
  major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 18)"
  # pnpm 11 requires Node >= 22.13. Node 18 hosts (typical EC2) use pnpm 9.
  if [[ "$major" -ge 22 ]]; then
    echo "pnpm@11.16.0"
  else
    echo "pnpm@9.15.9"
  fi
}

host_pnpm() {
  local spec
  spec="$(pnpm_spec_for_node)"
  echo "Using ${spec} (Node $(node -v 2>/dev/null || echo unknown))"
  if command -v npx >/dev/null 2>&1; then
    npx --yes "$spec" "$@"
    return
  fi
  echo "Need npx to install deps (or set BUILD_MODE=docker)." >&2
  return 1
}

ensure_host_next() {
  if [[ -x node_modules/.bin/next ]] || [[ -f node_modules/next/dist/bin/next ]]; then
    return 0
  fi

  echo "Host next binary missing — installing deps…"
  if [[ -f pnpm-lock.yaml ]]; then
    if ! host_pnpm install --frozen-lockfile; then
      echo "Frozen lockfile rejected — retrying without --frozen-lockfile"
      host_pnpm install --no-frozen-lockfile
    fi
  else
    npm ci --no-audit --no-fund
  fi

  if [[ ! -x node_modules/.bin/next ]] && [[ ! -f node_modules/next/dist/bin/next ]]; then
    cat >&2 <<'EOF'
Host still has no `next` binary after install.

Fix:
  pnpm install
  # or skip host compile entirely:
  BUILD_MODE=docker ./scripts/deploy.sh pvt
EOF
    exit 1
  fi
}

run_host_build() {
  ensure_host_next

  echo "Building on host (reuses ./.next/cache)…"
  env -u CI \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS='--max-old-space-size=4096' \
    ./node_modules/.bin/next build

  stage_host_standalone
}

if [[ -z "${GATEWAY_WS_AUTH_SECRET:-}" ]]; then
  echo "Warning: GATEWAY_WS_AUTH_SECRET is unset — /api/gateway/ws-auth will fail." >&2
  echo "Set GATEWAY_WS_AUTH_SECRET in .env / .env.local (must match the gateway secret)." >&2
fi

echo "Building and starting propfund-${DEPLOY_ENV} (http://127.0.0.1:${V3_APP_PORT}/)…"
echo "  DEPLOY_ENV=${DEPLOY_ENV}"
echo "  container=propfund-${DEPLOY_ENV}"
echo "  project=${COMPOSE_PROJECT_NAME}"
echo "  PORT=${PORT}"
echo "  NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"
echo "  NEXT_PUBLIC_GATEWAY_URL=${NEXT_PUBLIC_GATEWAY_URL}"
echo "  VANTA_API_BASE_URL=${VANTA_API_BASE_URL}"
echo "  BUILD_MODE=${BUILD_MODE}"

if [[ "$BUILD_MODE" == "host" ]]; then
  echo "  note: host \`next build\` → package standalone in Docker (seconds)"
  run_host_build
  env -u CI docker compose -f docker-compose.yml -f docker-compose.prebuilt.yml \
    up -d --build --remove-orphans
else
  echo "  note: full \`next build\` inside Docker"
  env -u CI docker compose up -d --build --remove-orphans
fi

echo "Done. Open http://127.0.0.1:${V3_APP_PORT}/"
