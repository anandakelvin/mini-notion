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
