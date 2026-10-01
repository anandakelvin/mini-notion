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

## Server environment

- Folder: `~/projects/mini-notion` on hashbang. Service: systemd user unit `mini-notion` (`Restart=always`), runs `node dist/backend/src/main.js` from that folder.
- The unit sets `NODE_ENV`, `PORT`, `FRONTEND_URL`.
- `~/projects/mini-notion/.env` (mode `600`) holds `DATABASE_URL` and `JWT_SECRET`, plus the same three as the unit. `ConfigModule` loads it because the service runs in that folder. `deploy.sh` does not copy or change it.
- To change a secret: edit that `.env` on the server, then `systemctl --user restart mini-notion` (with `XDG_RUNTIME_DIR=/run/user/$(id -u)`).

## `deploy.sh frontend`

`VITE_API_URL="" pnpm build` (same origin), then `npx wrangler pages deploy dist --project-name mini-notion --branch main`.

## Dockerfile

Added for Koyeb (commit `d34cea3`). **Unused**: Koyeb was dropped for the owner's own hashbang account ([ADR-014](../architecture/decisions.md#adr-014-backend-on-own-hashbang-account-not-koyeb)). Proposed for retirement in [SCHEMA](../SCHEMA.md#redundant-legacy-docs).
