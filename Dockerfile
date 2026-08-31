# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=11.24.0

# ---------- base ----------
FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
RUN npm install --global "pnpm@${PNPM_VERSION}" \
  && npm cache clean --force
WORKDIR /app

# ---------- stage 1: build the web client and the server bundle ----------
# pinned to the builder's native architecture: no JS tooling under QEMU for arm64
FROM --platform=$BUILDPLATFORM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
# vite build + esbuild server bundle only: typecheck runs separately (pnpm
# typecheck), not inside image builds
RUN pnpm --filter @psh/web exec vite build \
  && pnpm --filter @psh/server build

# ---------- stage 2: install production dependencies ----------
# also pinned to the builder's native architecture: pnpm/Node crash under QEMU
# (SIGILL on arm64), and the installed tree is architecture-independent because
# better-sqlite3 ships prebuilt bindings for every target (incl. linux-musl arm64)
FROM --platform=$BUILDPLATFORM base AS server-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --prod --frozen-lockfile --filter @psh/server...

# ---------- stage 3: production runtime ----------
# runs the compiled server bundle (tsx is dev-only); the bundle resolves the
# SPA at ../web/dist and migrations at drizzle relative to cwd (/app/apps/server)
FROM base AS runtime
LABEL org.opencontainers.image.title="psh" \
  org.opencontainers.image.description="Self-hosted pastebin-style snippet sharing service"

ENV NODE_ENV=production \
  PORT=3000 \
  DATABASE_PATH=/app/data/psh.db

# su-exec drops privileges in the entrypoint; apk is a plain C toolchain,
# safe to run per-arch (no Node/JS under QEMU)
RUN apk add --no-cache su-exec
COPY --chmod=0755 apps/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

COPY --from=server-deps /app/node_modules /app/node_modules
COPY --from=server-deps /app/apps/server/node_modules /app/apps/server/node_modules

COPY apps/server/package.json /app/apps/server/
COPY --from=builder /app/apps/server/dist /app/apps/server/dist
COPY apps/server/drizzle/ /app/apps/server/drizzle/
COPY --from=builder /app/apps/web/dist /app/apps/web/dist

RUN mkdir -p /app/data \
  && chown node:node /app/data

WORKDIR /app/apps/server
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO/dev/null "http://127.0.0.1:${PORT}/" || exit 1

# entrypoint starts as root, fixes /app/data ownership and drops to `node`;
# the exec chain keeps SIGTERM reaching the node process directly
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/index.js"]
