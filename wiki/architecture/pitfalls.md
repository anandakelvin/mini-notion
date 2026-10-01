---
title: Pitfalls
updated: 2026-10-01
sources:
  - docs/architecture.md
  - backend/src/app/app.module.ts
  - frontend/src/routes/notes/$noteId.tsx
  - scripts/deploy.sh
source_commit: e967f7f
confidence: high
---

# Pitfalls

Gotchas that already cost time. Read before touching the area.

## NestJS event emitter: wildcards are off by default

- **Symptom**: `@OnEvent('note.*.updated')` never fires for `note.123.updated`.
- **Cause**: `EventEmitterModule.forRoot()` disables wildcard matching.
- **Fix in place**: `EventEmitterModule.forRoot({ wildcard: true })` in `app.module.ts` (commit `5391649`).

## BlockNote `replaceBlocks` fires `onChange`

- **Symptom**: every window that received a live update saved the same content back to the server one second later.
- **Cause**: applying remote content with `editor.replaceBlocks` triggers the editor's `onChange`, which starts the auto-save.
- **Fix in place**: `isApplyingRemoteRef` is set around `replaceBlocks`, and `handleEditorChange` returns early while it is true (`$noteId.tsx`, commit `435c625`).

## The hashbang server cannot build `node_modules`

- **Cause**: the server has a 512 MiB memory limit, too small for `npm install`.
- **Fix in place**: `deploy.sh` builds a production `node_modules` locally in `.deploy/backend/` and copies it with `rsync`. This only works because every dependency is pure JS. A native dependency (like `bcrypt`) breaks the deploy. See [ADR-009](decisions.md#adr-009-pure-js-dependencies-only).

## Prisma 7 SQLite adapter wants a config object

> **Superseded 2026-09-27**: the app moved from SQLite to Postgres in commit `4b33e29` and the SQLite packages were removed in `693f642`. Kept for history.

- **Symptom**: `TypeError: Cannot read properties of undefined (reading 'replace')` in `createBetterSQLite3Client`.
- **Cause**: `PrismaBetterSqlite3` takes `{ url }`, not a `better-sqlite3` client instance.
