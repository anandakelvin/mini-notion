---
title: Test gate
activation: always-on
---

# Test gate

## The bar for "done"

```bash
pnpm review
```

It runs, in order, and stops at the first failure:

1. `pnpm typecheck` — `tsc --noEmit` on the backend, `tsc -b` on the frontend (the frontend config has `noEmit: true`).
2. `pnpm test` — backend Jest unit tests, then backend Jest e2e tests.

A task that changed code is not done until `pnpm review` exits 0. Report the real result. If it fails, say so and show the output.

## Rules

- **Prove a fix by removing it and watching the right test fail.** A guard that no test can detect is not proven. Do not report it as working.
- **A bug fix gets a test that reproduces the bug**, when the code can be tested without the database (see `production-safety.md`).
- **Verify it yourself before saying it works.** Use a test, or run the backend and call it with `curl`. The owner is not the tester.
- **Run narrow while you work, run the full gate at the end.** While iterating:
  - one unit test file: `pnpm --filter backend exec jest src/note/note.service.spec.ts`
  - e2e only: `pnpm --filter backend test:e2e`
  - types only: `pnpm typecheck`

## Known gaps (2026-10-01)

- Test coverage is thin: unit tests for `AppController`, the JWT secret (`auth/constants.spec.ts`) and note access rules (`note/note.service.spec.ts`), and one e2e test (`GET /api`). Block storage in `NoteService` and all of `NoteGateway` have no test.
- The e2e test boots the full `AppModule`. `ConfigModule` loads `backend/.env`, which points at the **production** database. Prisma only connects on the first query, and the current e2e test makes no query. A new e2e test that touches notes or users **would write to production**. Read `production-safety.md` before adding one.
- The e2e test also needs `JWT_SECRET` (from `backend/.env`), because `JwtStrategy` reads it at startup. A CI job must set it.
- Lint is not in the gate. See `code-formatters.md`.
