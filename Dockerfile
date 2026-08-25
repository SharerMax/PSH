# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=11.21.0

# ---------- base ----------
FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
RUN npm install --global "pnpm@${PNPM_VERSION}" \
  && npm cache clean --force
WORKDIR /app

# ---------- stage 1: build the web client ----------
# pinned to the builder's native architecture: the output is static files,
# so no need to cross-compile JS tooling under QEMU for arm64
FROM --platform=$BUILDPLATFORM base AS web-builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
# vite build only: typecheck runs separately (pnpm typecheck), not inside image builds
RUN pnpm --filter @psh/web exec vite build

# ---------- stage 2: production runtime ----------
# keeps the workspace layout: app.ts resolves the SPA at ../../web/dist
# relative to the server sources, and migrations live in apps/server/drizzle
FROM base AS runtime
LABEL org.opencontainers.image.title="psh" \
  org.opencontainers.image.description="Self-hosted pastebin-style snippet sharing service"

ENV NODE_ENV=production \
  PORT=3000 \
  DATABASE_PATH=/app/data/psh.db

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json /app/
COPY packages/shared/package.json /app/packages/shared/
COPY apps/server/package.json /app/apps/server/
COPY apps/web/package.json /app/apps/web/
RUN pnpm install --prod --frozen-lockfile --filter @psh/server... \
  && mkdir -p /app/data \
  && chown node:node /app/data

COPY packages/shared/ /app/packages/shared/
COPY apps/server/ /app/apps/server/
COPY --from=web-builder /app/apps/web/dist /app/apps/web/dist

WORKDIR /app/apps/server
USER node
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO/dev/null "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", "--import", "tsx", "src/index.ts"]
