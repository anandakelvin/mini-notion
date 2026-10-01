---
title: Wiki schema
updated: 2026-10-01
sources:
  - wiki/SCHEMA.md
source_commit: e967f7f
confidence: high
---

# Wiki schema for this repo

> This file is the repo-specific constitution for the wiki. Edit freely.
> The wiki-maintainer skill (`.agents/core/skills/wiki-maintainer/SKILL.md`) reads this file before any operation and respects its overrides.

**Maintained documentation targets** (kept updated by wiki-maintainer):
- The living wiki under `wiki/`.
- Root `README.md` (kept aligned with `wiki/overview.md`, stack, quickstart, and documentation links).

**In scope for description:**
- Backend: Nest modules, controllers, gateway, services, guards, Prisma schema and migrations.
- Frontend: routes, hooks, stores, the editor and its real-time logic, Pages Functions.
- `shared/`: zod schemas and DTOs used by both sides.
- Deployment: `scripts/deploy.sh`, `Dockerfile`, env variables.

**Out of scope:**
- `node_modules/`, `dist/`, `.deploy/`, `backend/src/prisma/generated/`.
- `frontend/src/components/ui/` (shadcn copies), `frontend/src/routeTree.gen.ts` (generated).
- `.claude/skills/neon*` (vendored, see `skills-lock.json`), `.agents/`, `wiki/` itself.
- `*.lock`, `pnpm-lock.yaml`, binary assets.

## Directory layout

```
wiki/
├── SCHEMA.md           (this file)
├── index.md
├── log.md
├── overview.md
├── glossary.md
├── architecture/
│   ├── decisions.md    ADRs
│   ├── data-model.md
│   └── pitfalls.md     library and environment gotchas
└── modules/
    └── <one page per area>
```

## Page granularity

- **One module page per coherent area.** Split when a page passes ~200 lines.
- **One ADR per significant decision.** Significant = "someone would ask why we did it this way."
- **ADR format (`architecture/decisions.md`)**:
  - Header: `## ADR-XXX: Title` (3-digit zero-padded).
  - Bullets: `- **Status**: Proposed | Accepted | Deprecated | Superseded`, `- **Context**`, `- **Decision**`, `- **Consequences**`.
  - `---` between entries. No long option analyses.
  - **Pre-implementation extension**: when an ADR starts as `Status: Proposed` *before* code exists (core `AGENTS.md` §4), add three bullets between `Decision` and `Consequences`:
    - `- **Requirements**`: numbered, testable (FR-001, FR-002, ...).
    - `- **Success criteria**`: numbered, measurable (SC-001, ...).
    - `- **Assumptions**`: anything the user did not specify, filled with a reasonable default.
    Flip to `Accepted` once implemented and `pnpm review` passes. Keep the three bullets afterward.
- **Glossary entry for any domain term** a new developer would not know.

## Decay policy

- **Fast decay** (re-verify on any source change): `modules/*`, `architecture/data-model.md`, `overview.md`.
- **Slow decay** (re-verify on major restructure): `architecture/decisions.md`, `architecture/pitfalls.md`, `glossary.md`.
- Lint flags `modules/*` pages as `low` confidence if 5+ commits touched their `sources:` since `source_commit`.

## Redundant legacy docs

- `docs/architecture.md` — its two pitfalls are absorbed into [pitfalls](architecture/pitfalls.md). Proposed for retirement; **never delete automatically**.
- `backend/README.md`, `frontend/README.md` — unchanged framework boilerplate (Nest, Vite). Proposed for retirement.

## Style preferences

- Plain English. Short sentences.
- Mermaid for flows, data relationships and state. Tables for endpoints, events and env variables.
- Standard relative markdown links. No `[[wikilink]]`.
- Dates ISO 8601. Headings in sentence case.
- **Runtime-behavior claims must cite a mechanism.** "Updates live" must name the event, hook or call that does it, with a file. If no mechanism exists, describe the real behavior.

## Question-asking policy

- `/wiki-init`: ask once to confirm scope.
- `/wiki-ingest` with no path: ask what to ingest.
- `/wiki-sync`, `/wiki-lint`: do not ask.

## What this repo is about

mini-notion is a small Notion-style note app. A user signs up with email and password, creates notes, and edits each note in a block editor (paragraph, checklist, image, code). Edits save automatically and are pushed live over Socket.io to every other open window of the same note, with remote cursors and short "who did what" labels. It is a pnpm monorepo: NestJS + Prisma + Postgres backend, React + Vite + BlockNote frontend, and a shared zod package for request schemas.
