# `.agents/project/` — not portable

Everything under this directory is specific to **this** project: mini-notion, a pnpm monorepo with a NestJS 11 backend, a React 19 + Vite frontend, and a shared zod DTO package. The agent tool is Claude Code.

If you copy `.agents/core/` into a new project, do **not** copy this directory. Write a new `.agents/project/` that matches that project's real toolchain.

| File | What it holds |
|---|---|
| `AGENTS.md` | The concrete commands and tools for core §7 (agent efficiency) in this repo. |
| `testing.md` | The test gate: what "done" means, and how to prove a fix. |
| `code-formatters.md` | Why there is no formatter or lint step in the gate yet, and what to do instead. |
| `production-safety.md` | The local `.env` points at the production database. What agents must never run. |

## How this differs from the PHP projects it was ported from

The toolchain was checked on 2026-10-01 before these files were written:

- Tests are Jest (`backend/src/**/*.spec.ts`) and a Jest e2e config (`backend/test/jest-e2e.json`). The frontend has no tests.
- `pnpm --filter backend lint` runs `eslint --fix`. It changes files, and it reports 619 errors on the current code (mostly Prettier formatting). So lint is **not** part of the gate.
- The frontend has no ESLint config. `frontend/eslint.config.*` was removed in commit `7d0ea0a`, so `pnpm --filter frontend lint` fails before it checks anything.
