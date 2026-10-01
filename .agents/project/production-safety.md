---
title: Production safety
activation: always-on
---

# Production safety

## The fact

`backend/.env` (git-ignored) sets `DATABASE_URL` to the Neon branch named `production`. There is no separate local or staging database today. Anything that runs from `backend/` with the default env talks to **live data**:

- `pnpm --filter backend start:dev`
- any Jest test that makes a Prisma query (`ConfigModule` loads `backend/.env`)
- every `npx prisma ...` command (`backend/prisma.config.ts` imports `dotenv/config`)

## Never run (agents)

- `prisma migrate dev`, `prisma migrate reset`, `prisma db push`, `prisma db seed`
- SQL that writes (`INSERT`, `UPDATE`, `DELETE`, DDL) against `DATABASE_URL`, by any tool, including the Neon MCP
- `scripts/deploy.sh` — it runs `prisma migrate deploy` against production and restarts the live server. Only when the owner asks for a deploy in that session.

Read-only queries (`SELECT`) to find a bug are allowed.

## Schema changes

1. Edit `backend/prisma/schema.prisma`.
2. Stop and ask the owner how to create the migration file. There is no safe way yet:
   - `prisma migrate dev` applies to production.
   - `prisma migrate diff --from-migrations ...` is read-only, but needs `datasource.shadowDatabaseUrl` in `prisma.config.ts`, and none is set (checked 2026-10-01).
3. The owner applies it, through `scripts/deploy.sh backend`.

## Tests that need a database

Do not point them at production. Ask the owner first. The usual way with Neon is a throwaway branch (Neon MCP `create_branch`) and a test-only `DATABASE_URL`.
