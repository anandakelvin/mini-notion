---
title: Auth
updated: 2026-10-01
sources:
  - backend/src/auth/auth.controller.ts
  - backend/src/auth/auth.service.ts
  - backend/src/auth/auth.module.ts
  - backend/src/auth/jwt-strategy.ts
  - backend/src/auth/constants.ts
  - backend/src/shared/decorator/user.decorator.ts
  - shared/dto/auth/body/login-body.schema.ts
  - shared/dto/auth/body/register-body.schema.ts
  - frontend/src/stores/auth.store.ts
  - frontend/src/components/forms/login.form.tsx
source_commit: e967f7f
confidence: high
---

# Auth

Email and password accounts. The session is a JWT in an HttpOnly cookie ([ADR-002](../architecture/decisions.md#adr-002-jwt-in-an-httponly-cookie-also-used-by-the-socket)).

## Endpoints

| Method | Path | Guard | Body | Result |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, password }` (password ≥ 6) | 201. 400 `Email already exists` on Prisma `P2002`. |
| POST | `/api/auth/login` | — | `{ email, password }` | 200 and sets cookie `access_token`. 401 on bad email or password. |
| GET | `/api/auth/check` | `JwtAuthGuard` | — | The user's email as plain text. 401 if no valid cookie. |
| POST | `/api/auth/logout` | `JwtAuthGuard` | — | Clears the cookie. |

## Details

- Passwords: `bcryptjs`, `genSalt()` default rounds.
- JWT payload: `{ email, sub: userId }`, expires in 1 hour. Cookie `maxAge` is also 1 hour.
- Cookie: `httpOnly`. In production (`NODE_ENV=production`): `sameSite: 'none'`, `secure: true`. Otherwise `sameSite: 'strict'`.
- `JwtStrategy.validate` returns `{ email, userId }`. Controllers get it with the `@ReqUser()` decorator (type `IReqUser`).
- Signing secret: `jwtConstants.secret` in `backend/src/auth/constants.ts`. **It is a fixed string in source code, not read from the environment.** `NoteGateway` uses the same constant.

## Frontend

- `useAuthStore` (zustand) calls `GET /api/auth/check` on app start. `authenticated` holds the email, or `null`.
- `__root.tsx` renders nothing while checking, then redirects to `/auth` if not logged in.
- `LoginForm` switches between login and register mode. After a successful register it switches back to login mode.
- `useFetch` resets the auth store on any 401, which sends the user back to `/auth`.
