---
title: Architecture decisions
updated: 2026-10-01
sources:
  - backend/src/auth/auth.controller.ts
  - backend/src/auth/jwt-strategy.ts
  - backend/src/auth/constants.ts
  - backend/src/note/note.service.ts
  - backend/src/note/note.gateway.ts
  - backend/prisma/schema.prisma
  - frontend/src/routes/notes/$noteId.tsx
  - frontend/functions/api/[[path]].ts
  - shared/dto/note/body/update-note-body.schema.ts
  - scripts/deploy.sh
source_commit: e967f7f
confidence: medium
---

# Architecture decisions

ADR-001 to ADR-011 were written on 2026-10-01, after the fact, from the code and commit messages. Where a commit message gives no reason, the Context says what the code does and does not guess a motive. Format: [SCHEMA](../SCHEMA.md#page-granularity).

---

## ADR-001: pnpm monorepo with a shared schema package

- **Status**: Accepted
- **Context**: Backend and frontend both validate the same request bodies (login, register, note create and update).
- **Decision**: One pnpm workspace (`backend`, `frontend`, `shared`). Each body is a zod schema in `shared/dto/**/<name>.schema.ts`. The Nest DTO class that wraps it (`createZodDto`) lives in a separate `<name>.dto.ts` (commit `c1dd6f2`).
- **Consequences**: The frontend imports only `*.schema.ts`, so it does not pull in `nestjs-zod`. One change to a schema updates both sides. Every package resolves `shared/*` through its own alias config (tsconfig, Vite, Jest), so a new package needs the same alias.

---

## ADR-002: JWT in an HttpOnly cookie, also used by the socket

- **Status**: Accepted
- **Context**: The REST API and the Socket.io gateway both need to know the user.
- **Decision**: `POST /api/auth/login` sets the JWT as an `access_token` HttpOnly cookie (1 hour). `JwtStrategy` reads it from the cookie, not from an `Authorization` header. `NoteGateway.handleConnection` parses the same cookie from the handshake headers and verifies it.
- **Consequences**: Frontend JavaScript never sees the token. The cookie must reach the backend from the frontend's site, which shapes hosting ([ADR-010](#adr-010-one-origin-through-cloudflare-pages-functions)). In production the cookie is `sameSite: none; secure`.

---

## ADR-003: Store blocks as rows, rewrite on every save

- **Status**: Accepted
- **Context**: BlockNote produces a tree of blocks. The note must be stored in a relational database.
- **Decision**: Each block is one `Block` row with `parent_id` and `order_index`. Its BlockNote `id`, `props` and `content` are kept as a JSON string. On every save, all blocks of the note are deleted and inserted again in one transaction (commit `a458936`).
- **Consequences**: Simple and always consistent with the client. Cost grows with note size on every keystroke batch (auto-save is debounced to 1 s). Block row ids change on every save, so nothing may reference a block by row id.

---

## ADR-004: Optimistic concurrency on `updated_at`

- **Status**: Accepted
- **Context**: Two windows can save the same note at nearly the same time.
- **Decision**: The client sends the `updatedAt` it last saw. `NoteService.updateNote` compares it with the stored `updated_at`; if they differ by more than 1000 ms it throws `409 Conflict`. The frontend shows a toast asking the user to refresh.
- **Consequences**: No silent overwrite. No merge either: the losing window must reload. The 1 s tolerance means two saves within 1 s of each other are not detected.

---

## ADR-005: Live sync with Socket.io rooms and the Nest event emitter

- **Status**: Accepted
- **Context**: Open windows of a note must see each other's changes without reloading.
- **Decision**: After a save, `NoteService` emits `note.<id>.updated` on the Nest event emitter. `NoteGateway` listens with `@OnEvent('note.*.updated')` and sends `note_updated` with the full note to room `note_<id>`. Cursor positions go through the gateway directly (`cursor_move`). (Commits `a97b7fd`, `156d703`, `5391649`.)
- **Consequences**: Sync is whole-note replace, not operational transform or CRDT. The service does not depend on the gateway. Requires `wildcard: true` ([pitfalls](pitfalls.md#nestjs-event-emitter-wildcards-are-off-by-default)). One backend process only: the emitter and rooms are in memory.

---

## ADR-006: A note is only visible to its owner, also over the socket

- **Status**: Superseded by [ADR-015](#adr-015-any-logged-in-user-can-open-and-edit-a-note-by-its-url)
- **Context**: Commit `384dd71` (2026-06-18) removed the owner checks from note open, update and socket join, **on purpose** (confirmed by the owner, 2026-10-01): any logged-in user with the note URL could edit it live with others. List and delete stayed owner-only. Commit `3b9500c` (2026-09-27) put the checks back, treating the change as a bug. That reversal was not the owner's decision.
- **Decision**: Every note query filters by `user_id`. `join_note` calls `getNoteById(noteId, userId)` before joining the room.
- **Consequences**: Live sync is between windows and devices of the **same account**. There is no sharing between users.

---

## ADR-007: SQLite for local development

- **Status**: Superseded by [ADR-008](#adr-008-postgres-on-neon)
- **Context**: Commit `466610f` (2026-06-17) switched the database to SQLite with the Prisma `better-sqlite3` adapter.
- **Decision**: SQLite file database.
- **Consequences**: Replaced by Postgres on 2026-09-27, in the commit that prepared the app for deploy (`4b33e29`).

---

## ADR-008: Postgres on Neon

- **Status**: Accepted
- **Context**: The app was prepared for deploy (commit `4b33e29`).
- **Decision**: Prisma with `@prisma/adapter-pg`, connecting to Neon Postgres via `DATABASE_URL`. The init migration was recreated for Postgres.
- **Consequences**: There is only one Neon branch in use, named `production`, and the local `backend/.env` points at it. See `.agents/project/production-safety.md`.

---

## ADR-009: Pure-JS dependencies only

- **Status**: Accepted
- **Context**: The backend host (hashbang) has a 512 MiB memory limit and cannot run `npm install` (commit `693f642`).
- **Decision**: `deploy.sh` builds production `node_modules` locally and copies it over. All dependencies must be pure JS: `bcrypt` was swapped for `bcryptjs`, SQLite packages were removed.
- **Consequences**: A native module (anything with a build step) breaks the deploy. Check before adding a dependency.

---

## ADR-010: One origin through Cloudflare Pages Functions

- **Status**: Accepted
- **Context**: Frontend (Cloudflare Pages) and backend (hashbang) are on different sites. The auth cookie must be first-party (commit `9722f9b`).
- **Decision**: All backend routes live under `/api`. Pages Functions in `frontend/functions/api/[[path]].ts` and `frontend/functions/socket.io/[[path]].ts` forward to `https://geeky1.de1.hashbang.sh/mini-notion-backend`. The production frontend is built with `VITE_API_URL=""` (same origin).
- **Consequences**: The browser only talks to the Pages site. The backend URL is written in two Function files.

---

## ADR-011: Editor limited to four block types

- **Status**: Accepted
- **Context**: Commit `253a132`.
- **Decision**: The BlockNote schema has only `paragraph`, `checkListItem`, `image`, `codeBlock`. The slash menu is filtered to the same four.
- **Consequences**: The backend type mapping (`saveBlocks` / `reconstructBlocks`) only needs to know these. A new block type must be added in the schema, the slash-menu filter, and checked against that mapping.

---

## ADR-012: Living wiki, written rules and turn gates for agent work

- **Status**: Accepted
- **Context**: Most code in this repo is written with an AI agent. Each session starts with no memory of the last one, and the agent can claim success it did not check.
- **Decision**: Port the agent system used in my other projects: a portable rule set (`.agents/core/`), project rules for this stack (`.agents/project/`), this wiki as the shared memory, a pre-turn gate (read the wiki first) and a post-turn gate (write back, log, run `pnpm review`), all wired through `CLAUDE.md`.
- **Requirements**:
  - FR-001: An agent session reads `wiki/index.md` and the relevant pages before reading source.
  - FR-002: A turn that changed code updates the affected wiki pages and adds a `wiki/log.md` entry.
  - FR-003: `pnpm review` is the single command for "done", and it fails on a type error or failing test.
- **Success criteria**:
  - SC-001: `pnpm review` exits 0 on the current code and non-zero with a deliberate type error (checked 2026-10-01).
  - SC-002: Every wiki page has `sources:` and `source_commit` frontmatter.
- **Assumptions**: Lint is left out of the gate until the code is formatted once (619 backend errors, no frontend config).
- **Consequences**: More files to keep current. The wiki can drift; `/wiki-lint` and the confidence field are the check against that.

---

## ADR-013: JWT secret from the environment, required at startup

- **Status**: Accepted
- **Context**: The JWT signing secret was a fixed string in `backend/src/auth/constants.ts` (NestJS docs placeholder). The repo is going public, so anyone could sign a valid `access_token` cookie for the live app.
- **Decision**: Read it from `JWT_SECRET`. `jwtConstants.secret` is a getter that throws `JWT_SECRET is not set` if it is missing. `JwtModule` uses `registerAsync`, because `ConfigModule` loads `.env` only after `auth.module.ts` is imported. Rejected: an empty or default fallback value — the app would run with a guessable key.
- **Consequences**: Every environment (local `backend/.env`, the hashbang server `.env`) must set `JWT_SECRET`, or the backend does not start. Changing it logs everyone out. The old string stays in git history and must never be used again. Covered by `backend/src/auth/constants.spec.ts`.

---

## ADR-014: Backend on own hashbang account, not Koyeb

- **Status**: Accepted
- **Context**: A Dockerfile for Koyeb was added on 2026-09-27 (commit `d34cea3`). The same day, the deploy moved to hashbang (commits `693f642`, `e967f7f`).
- **Decision**: The backend runs only on the owner's own hashbang account, as a systemd user service (confirmed by the owner, 2026-10-01). Koyeb is not used. The owner did not give a reason, so none is recorded here.
- **Consequences**: The `Dockerfile` is unused. Server limits shape the build ([ADR-009](#adr-009-pure-js-dependencies-only)). Server secrets live in `~/projects/mini-notion/.env` ([deployment](../modules/deployment.md#server-environment)).

---

## ADR-015: Any logged-in user can open and edit a note by its URL

- **Status**: Accepted
- **Context**: The owner's original design (`384dd71`): live collaboration between different accounts, by sharing the note URL. `3b9500c` reversed it by mistake ([ADR-006](#adr-006-a-note-is-only-visible-to-its-owner-also-over-the-socket)). Recruiters need to test collaboration with two accounts.
- **Decision**: Opening a note (`GET /api/notes/:id`), saving it (`PUT`) and joining its socket room (`join_note`) only require a login, not ownership. Listing (`GET /api/notes`) and deleting (`DELETE`) stay owner-only. Rejected: a per-note share switch or invites — both need a migration, and the owner already tested and wanted this simpler behavior.
- **Requirements**:
  - FR-001: A logged-in user who is not the owner can open a note by id.
  - FR-002: That user can save the note; `last_edited_by` becomes their email, and the room receives `note_updated`.
  - FR-003: That user can join the note's socket room.
  - FR-004: The note list shows only the caller's own notes.
  - FR-005: Only the owner can delete a note; others get 404.
  - FR-006: Not logged in still gets 401 (REST) or a disconnect (socket).
- **Success criteria**:
  - SC-001: Unit tests on `NoteService` cover FR-001, FR-002, FR-004 and FR-005, and fail if the owner filter comes back on open or save.
  - SC-002: `pnpm review` exits 0.
- **Assumptions**: The conflict check (ADR-004) is enough protection against two users overwriting each other. Note ids stay sequential, so a logged-in user can open any note by guessing a number; the owner accepts this (2026-10-01).
- **Consequences**: Real multi-user collaboration with different emails and cursor colors. No privacy between accounts for a note whose id is known.
