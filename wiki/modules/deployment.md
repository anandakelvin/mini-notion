---
title: Deployment
updated: 2026-10-03
sources:
  - scripts/deploy.sh
  - frontend/functions/api/[[path]].ts
  - frontend/functions/socket.io/[[path]].ts
  - Dockerfile
  - backend/package.json
source_commit: 9e42de7
confidence: high
---

# Deployment

| Part | Host | How |
|---|---|---|
| Frontend | Cloudflare Pages, project `mini-notion` | `scripts/deploy.sh frontend` |
| Backend | OCI VM `kelvin-first-instance` (`ubuntu@168.110.208.75`), served at `https://mini-notion-api.kelvin.us.ci` ([ADR-016](../architecture/decisions.md#adr-016-backend-on-the-owners-oci-vm-not-hashbang)). Was hashbang until 2026-10-03. | `scripts/deploy.sh backend` |
| Database | Neon Postgres, branch `production` | migrations applied by the backend deploy |

The browser only talks to the Pages site; Pages Functions forward `/api/*` and `/socket.io/*` to the backend ([ADR-010](../architecture/decisions.md#adr-010-one-origin-through-cloudflare-pages-functions)).

## `deploy.sh backend`

1. `pnpm --filter backend build` → `backend/dist/` (entry `dist/backend/src/main.js`).
2. Build a production `node_modules` locally in `.deploy/backend/` with `npm install --omit=dev` ([ADR-009](../architecture/decisions.md#adr-009-pure-js-dependencies-only)).
3. `rsync` `dist/`, `node_modules/` and `package.json` to `ubuntu@168.110.208.75:mini-notion/` (key `~/.ssh/hashbang_key`).
4. `npx prisma migrate deploy` **from the local machine**, against `DATABASE_URL` in `backend/.env`.
5. `sudo systemctl restart mini-notion` on the VM.
6. Poll `GET /api/notes` for up to 30 s until it answers 401 (up, and wants a login).

## Server environment

- Folder: `/home/ubuntu/mini-notion` on the VM. Service: systemd system unit `/etc/systemd/system/mini-notion.service` (`User=ubuntu`, `Restart=always`, enabled at boot), runs `/usr/local/bin/node dist/backend/src/main.js` (Node 24.15) from that folder, port 8000.
- Public route: `cloudflared` on the VM (tunnel `kelvin-vm`, `/etc/cloudflared/config.yml`) sends `mini-notion-api.kelvin.us.ci` to `http://127.0.0.1:8000`. The VM opens no web ports.
- The unit sets `NODE_ENV`, `PORT`, `FRONTEND_URL` (`https://geeky1.de1.hashbang.sh`, copied as-is from the hashbang unit). These win over the `.env` values, so CORS allows that origin, not `mini-notion.pages.dev`. It works because the browser only talks to the Pages site (same origin).
- `/home/ubuntu/mini-notion/.env` (mode `600`) holds `DATABASE_URL` and `JWT_SECRET`, plus the same three as the unit. Copied from hashbang on 2026-10-03. `ConfigModule` loads it because the service runs in that folder. `deploy.sh` does not copy or change it.
- To change a secret: edit that `.env` on the VM, then `sudo systemctl restart mini-notion`.
- Logs: `sudo journalctl -u mini-notion`.
- Old hashbang setup (`~/projects/mini-notion`, user unit `mini-notion`): stopped and disabled 2026-10-03, files kept.

## `deploy.sh frontend`

`VITE_API_URL="" pnpm build` (same origin), then `npx wrangler pages deploy dist --project-name mini-notion --branch main`.

## Dockerfile

Added for Koyeb (commit `d34cea3`). **Unused**: Koyeb was dropped for the owner's own hashbang account ([ADR-014](../architecture/decisions.md#adr-014-backend-on-own-hashbang-account-not-koyeb)). Proposed for retirement in [SCHEMA](../SCHEMA.md#redundant-legacy-docs).
