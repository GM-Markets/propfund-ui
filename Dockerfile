# PropFund / vanta-starter — production Next.js image (standalone output).
# Build:  docker compose build
# Run:    docker compose up -d

ARG NODE_VERSION=22

# ── deps ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.16.0 --activate

# pnpm-workspace.yaml carries allowBuilds (sharp/esbuild/msw); required for
# pnpm 11+ or install fails with ERR_PNPM_IGNORED_BUILDS.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.16.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined at build time by Next.js.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:5400
ARG NEXT_PUBLIC_APP_NAME=PropFund
ARG NEXT_PUBLIC_PRIVY_APP_ID=
ARG NEXT_PUBLIC_PRIVY_CLIENT_ID=
ARG NEXT_PUBLIC_HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz/ws

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID \
    NEXT_PUBLIC_PRIVY_CLIENT_ID=$NEXT_PUBLIC_PRIVY_CLIENT_ID \
    NEXT_PUBLIC_HYPERLIQUID_WS_URL=$NEXT_PUBLIC_HYPERLIQUID_WS_URL

RUN pnpm build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
