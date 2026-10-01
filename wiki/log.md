---
title: Log
updated: 2026-10-01
sources:
  - wiki/
source_commit: e967f7f
confidence: high
---

# Log

Append-only. Newest at the bottom. `grep '^## \[' wiki/log.md | tail -10` shows recent activity.

## [2026-10-01] init | bootstrapped wiki, agent rules and gates
- Scope: whole repo except vendored and generated code (see [SCHEMA](SCHEMA.md)).
- Pages created: 12 — overview, glossary, index, SCHEMA, log, architecture/{decisions, data-model, pitfalls}, modules/{auth, notes, realtime, frontend, deployment}.
- ADRs: 001–011 written after the fact from code and commit messages; 012 records this setup.
- Also added: `.agents/core/` (ported), `.agents/project/`, `CLAUDE.md`, root `README.md`, root `pnpm review` script.
- Findings while reading the code:
  - JWT signing secret is a fixed string in `backend/src/auth/constants.ts`.
  - `backend/.env` points at the Neon `production` branch; there is no dev database.
  - Lint is not usable as a gate: 619 backend errors, frontend ESLint config removed in `7d0ea0a`.
  - `user_left` is broadcast to all sockets, not only the note's room.
- Proposed for retirement: `docs/architecture.md` (absorbed into pitfalls), `backend/README.md` and `frontend/README.md` (framework boilerplate).
- Verified: `pnpm review` exits 0; with a deliberate type error it exits 1.
- Follow-up: run `/wiki-lint` after the next few code changes.

## [2026-10-01] change | JWT secret moved from source code to `JWT_SECRET`
- Why: the repo is going public, and the old fixed secret would let anyone sign a valid login cookie.
- Pages updated: modules/auth.md (supersession note), overview.md (env table). Root README run steps.
- Local `backend/.env` got a random `JWT_SECRET`. The server still needs one before the next backend deploy, or the backend will not start.
- Verified locally: token signed with the old string → 401, with the new secret → 200; empty `JWT_SECRET` → startup error; `pnpm review` exit 0.
- History scan of all commits: the old JWT string was the only committed secret. No connection string was ever committed.

## [2026-10-01] gate | applied CLAUDE.md to the JWT change
- Added ADR-013 and `backend/src/auth/constants.spec.ts`, which the post-turn gate and `testing.md` require but the previous turn left out.
- Proof: the spec passes with the fix and fails 2/2 with the old fixed string put back.
