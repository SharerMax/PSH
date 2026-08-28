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

- Anonymous or logged-in usage — accounts are only needed for owner features
- User accounts: username/password registration, DB-backed sessions (HttpOnly cookie, 30 days)
- Create pastes with optional title, syntax language, expiry (`10min/1h/1d/7d/forever`), password and burn-after-read
- Optional custom link (4–32 chars, letters/digits/dots/dashes/underscores); otherwise an 8-char random link is generated
- Password-protected pastes are stored AES-256-GCM encrypted (scrypt-derived key); passwords hashed with scrypt
- Burn-after-read pastes are deleted immediately after one successful read
- Lazy expiry on read plus a background sweep every 10 minutes
- Owners can edit paste content within its lifetime while keeping the link unchanged
- "My pastes" list with view counts, and per-paste statistics: total views, last access
  (time, IP, country/region), a world map distribution and a paginated access-records
  table with country / IP / date-range filters
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

Multi-arch images (`linux/amd64`, `linux/arm64`) are published to GHCR when a `v*`
tag is pushed: the tag produces semver tags (`X.Y.Z`, `X.Y`) plus `latest`. Regular
pushes do not build images; runs can also be triggered manually from the Actions tab
(`workflow_dispatch`, tagged `sha-<ref>`).

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

Local dev/test config lives in `apps/server/.env` (gitignored, see `.env.example`); the
server's `dev`/`start` scripts load it via `--env-file-if-exists`. All variables also
work as plain environment variables (e.g. in Docker):

| Variable        | Default       | Description                              |
| --------------- | ------------- | ---------------------------------------- |
| `PORT`          | `3000`        | Server port                              |
| `DATABASE_PATH` | `data/psh.db` | SQLite database file path                |
| `MMDB_PATH`     | —             | Path to a MaxMind `.mmdb` file. When set, view statistics record country/region (private IPs resolve to `LOCAL`). When unset, geo stats are disabled and the UI hides country data. |

## API

Every paste has an integer `id` (internal, used by owner routes) and a public `link`
string (used in all sharing URLs). Paste routes are split explicitly: `/link/:link`
resolves by link, `/id/:id` by integer id.

| Method | Path                                  | Description                                        |
| ------ | ------------------------------------- | -------------------------------------------------- |
| POST   | `/api/pastes`                         | Create a paste → `{ link }`                        |
| GET    | `/api/pastes/link/:link/meta`         | Metadata by link (no content); `hasPassword` flag  |
| GET    | `/api/pastes/id/:id/meta`             | Metadata by integer id                             |
| GET    | `/api/pastes/link/:link/content?password=` | Content JSON by link; wrong password → 401    |
| GET    | `/api/pastes/id/:id/content?password=` | Content JSON by integer id                        |
| GET    | `/raw/link/:link?password=`           | Raw content by link as `text/plain; charset=utf-8` |
| GET    | `/raw/id/:id?password=`               | Raw content by integer id                          |
| PATCH  | `/api/pastes/link/:link`              | Owner: edit by link (title/language/content)       |
| PATCH  | `/api/pastes/id/:id`                  | Owner: edit by integer id                          |
| POST   | `/api/auth/register`                  | Create account (username + password)               |
| POST   | `/api/auth/login`                     | Log in → sets session cookie                       |
| POST   | `/api/auth/logout`                    | Destroy current session                            |
| GET    | `/api/auth/me`                        | Current user (`401` when anonymous)                |
| GET    | `/api/mine`                           | Owner: list own pastes (`{ id, link, … }` items with view counts) |
| GET    | `/api/mine/:id/stats`                 | Owner: aggregate stats by integer id (views, last access, by country) |
| GET    | `/api/mine/:id/views`                 | Owner: paginated access records (`page`, `pageSize`, `country`, `ip`, `from`, `to`) |

Create body:

```jsonc
{
  "title": "optional title",
  "language": "typescript", // default plaintext
  "content": "...", // required, max 1 MB
  "expiresIn": "1h", // 10min | 1h | 1d | 7d | forever
  "password": "optional",
  "burnAfterRead": false,
  "link": "my-custom-link" // optional, 4-32 chars, unique; 409 when taken
}
```

## Project layout

```
apps/
  server/   Hono api (routes → controllers → services → repositories), auth & sessions, geoip, drizzle schema/migrations, crypto & cleanup libs
  web/      React SPA (Vite), shadcn/ui components, pages (viewer, editor, my pastes, stats)
packages/
  shared/   zod schemas + shared types (TS source, no build step)
```

## Database migrations

Drizzle migrations live in `apps/server/drizzle` and run automatically at server startup.
After editing `apps/server/src/db/schema.ts`, regenerate with:

```sh
pnpm --filter @psh/server db:generate
```

## Credits

- Statistics world map geometry: [svg-maps/world](https://github.com/VictorCazanave/svg-maps),
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
