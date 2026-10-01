---
title: Wiki index
updated: 2026-10-01
sources:
  - wiki/
source_commit: e967f7f
confidence: high
---

# Wiki index

Start here. Pick the pages for your task. Read source code only when the wiki is silent or a page says `confidence: low`.

## Overview
- [overview](overview.md) — what the app is, repo layout, how the parts talk, env variables
- [glossary](glossary.md) — terms used in code and in this wiki

## Architecture
- [decisions](architecture/decisions.md) — ADR-001 to ADR-013: why things are the way they are
- [data model](architecture/data-model.md) — tables, and how the editor's block tree is stored
- [pitfalls](architecture/pitfalls.md) — library and server gotchas that already cost time

## Modules
- [auth](modules/auth.md) — register, login, JWT cookie, auth store
- [notes](modules/notes.md) — note REST endpoints, save flow, conflict check
- [realtime](modules/realtime.md) — Socket.io events, rooms, remote cursors, action labels
- [frontend](modules/frontend.md) — routes, data hooks, editor and auto-save
- [deployment](modules/deployment.md) — Cloudflare Pages, hashbang, Neon, deploy script

## Meta
- [SCHEMA](SCHEMA.md) — rules for this wiki: page format, ADR format, decay
- [log](log.md) — append-only history of wiki work and turns that changed code
