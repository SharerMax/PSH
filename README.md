# psh

A self-hosted Pastebin-style snippet sharing service. Monorepo managed with pnpm workspaces.

## Stack

| Layer   | Tech                                                                  |
| ------- | --------------------------------------------------------------------- |
| Web     | React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Base UI), react-router 8, shiki + modern-monaco editor |
| Server  | Node.js, Hono v4, @hono/node-server, zod v4                           |
| Storage | SQLite (better-sqlite3) + Drizzle ORM                                 |
| Shared  | `@psh/shared` — zod schemas & types consumed as TS source             |
| Lint    | ESLint flat config via @antfu/eslint-config (no Prettier)             |

## Features

- Create pastes with optional title, syntax language, expiry (`10min/1h/1d/7d/forever`), password and burn-after-read
- Password-protected pastes are stored AES-256-GCM encrypted (scrypt-derived key); passwords hashed with scrypt
- Burn-after-read pastes are deleted immediately after one successful read
- Lazy expiry on read plus a background sweep every 10 minutes
- Raw endpoint serving `text/plain`, single-process production deploy (server hosts the built web client)
- Viewer with shiki syntax highlighting, password dialog, copy/raw/download actions and expiry countdown

## Getting started

Requirements: Node.js >= 24, pnpm >= 11.

```sh
pnpm install

# development (server on :3000, web on :5173 with /api proxy)
pnpm dev

# lint & typecheck
pnpm lint
pnpm typecheck

# production: build the client, then serve it from the server process
pnpm build
pnpm start          # http://localhost:3000
```

## Docker

Multi-arch images (`linux/amd64`, `linux/arm64`) are published to GHCR automatically:
pushes to `main` produce the `main` tag, `v*` tags produce semver tags plus `latest`.
PRs only validate the build without pushing.

```sh
# recommended: docker compose (see compose.yaml)
docker compose up -d            # serves http://localhost:3000

# or plain docker
docker run -d -p 3000:3000 -v psh-data:/app/data ghcr.io/sharermax/psh:latest

# from source instead of pulling
docker compose up -d --build    # or: docker build -t psh .
```

Notes:

- The SQLite database lives in the `/app/data` volume — mount a named volume or host
  directory there to persist pastes across upgrades (host binds must be writable by uid 1000)
- Port/env overrides work the same as local runs (`PORT`, `DATABASE_PATH` defaults come
  baked into the image)
- The first published package is private on GHCR; flip it to public in the repo's
  Packages settings if you want anonymous pulls

## Configuration

| Variable       | Default       | Description                  |
| -------------- | ------------- | ---------------------------- |
| `PORT`         | `3000`        | Server port                  |
| `DATABASE_PATH`| `data/psh.db` | SQLite database file path    |

## API

| Method | Path                          | Description                                        |
| ------ | ----------------------------- | -------------------------------------------------- |
| POST   | `/api/pastes`                 | Create a paste → `{ id }`                          |
| GET    | `/api/pastes/:id/meta`        | Metadata (no content); `hasPassword` flag          |
| GET    | `/api/pastes/:id/content?password=` | Content JSON; wrong password → 401           |
| GET    | `/raw/:id?password=`          | Raw content as `text/plain; charset=utf-8`         |

Create body:

```jsonc
{
  "title": "optional title",
  "language": "typescript", // default plaintext
  "content": "...", // required, max 1 MB
  "expiresIn": "1h", // 10min | 1h | 1d | 7d | forever
  "password": "optional",
  "burnAfterRead": false
}
```

## Project layout

```
apps/
  server/   Hono api, drizzle schema/migrations, crypto & cleanup libs
  web/      React SPA (Vite), shadcn/ui components, pages
packages/
  shared/   zod schemas + shared types (TS source, no build step)
```

## Database migrations

Drizzle migrations live in `apps/server/drizzle` and run automatically at server startup.
After editing `apps/server/src/db/schema.ts`, regenerate with:

```sh
pnpm --filter @psh/server db:generate
```
