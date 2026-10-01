---
title: Deployment
updated: 2026-10-01
sources:
  - scripts/deploy.sh
  - frontend/functions/api/[[path]].ts
  - frontend/functions/socket.io/[[path]].ts
  - Dockerfile
  - backend/package.json
source_commit: e967f7f
confidence: high
---

# Deployment

| Part | Host | How |
|---|---|---|
| Frontend | Cloudflare Pages, project `mini-notion` | `scripts/deploy.sh frontend` |
| Backend | hashbang (`ssh hb`), served at `https://geeky1.de1.hashbang.sh/mini-notion-backend` | `scripts/deploy.sh backend` |
| Database | Neon Postgres, branch `production` | migrations applied by the backend deploy |

The browser only talks to the Pages site; Pages Functions forward `/api/*` and `/socket.io/*` to the backend ([ADR-010](../architecture/decisions.md#adr-010-one-origin-through-cloudflare-pages-functions)).

## `deploy.sh backend`

1. `pnpm --filter backend build` → `backend/dist/` (entry `dist/backend/src/main.js`).
2. Build a production `node_modules` locally in `.deploy/backend/` with `npm install --omit=dev` ([ADR-009](../architecture/decisions.md#adr-009-pure-js-dependencies-only)).
3. `rsync` `dist/`, `node_modules/` and `package.json` to `hb:projects/mini-notion/`.
4. `npx prisma migrate deploy` **from the local machine**, against `DATABASE_URL` in `backend/.env`.
5. `systemctl --user restart mini-notion` on the server.
6. Poll `GET /api/notes` for up to 30 s until it answers 401 (up, and wants a login).

## `deploy.sh frontend`

`VITE_API_URL="" pnpm build` (same origin), then `npx wrangler pages deploy dist --project-name mini-notion --branch main`.

## Dockerfile

Added for Koyeb (commit `d34cea3`). Builds from the repo root because the backend imports `../shared`. `deploy.sh` does not use it.
