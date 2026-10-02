---
title: Glossary
updated: 2026-10-03
sources:
  - backend/prisma/schema.prisma
  - backend/src/note/note.gateway.ts
  - frontend/src/routes/notes/$noteId.tsx
source_commit: 9e42de7
confidence: high
---

# Glossary

| Term | Meaning here |
|---|---|
| **Note** | A titled page owned by one user. Table `Note`. |
| **Block** | One editor element (paragraph, checklist item, image, code). In the editor: a BlockNote block. In the database: one `Block` row. See [data model](architecture/data-model.md). |
| **Room** | A Socket.io room named `note_<id>`. Every window with that note open joins it. |
| **Live update** | The `note_updated` socket event: the full saved note, sent to the room after every save. |
| **Echo** | The `note_updated` a window receives for its own save. Skipped with `isLocalSaveRef`. |
| **Remote cursor** | Another window's caret, drawn with that user's email and color. |
| **Action label** | The short tag (`checked`, `added image block`, …) shown next to a block another window changed. Called `actionTooltips` in code. |
| **Conflict (409)** | A save rejected because the note changed since this window last saw it. See [ADR-004](architecture/decisions.md#adr-004-optimistic-concurrency-on-updated_at). |
| **`last_edited_by`** | Email of whoever saved the note last. |
| **hashbang** | The shell host (`ssh hb`) where the backend ran until 2026-10-03. |
| **OCI VM** | The owner's Oracle Cloud VM `kelvin-first-instance` (`ubuntu@168.110.208.75`), where the backend runs since 2026-10-03. |
| **Pages Functions** | Cloudflare code in `frontend/functions/` that proxies `/api` and `/socket.io`. |
| **Test gate** | `pnpm review`: type checks and tests. The bar for "done". See `.agents/project/testing.md`. |
| **Pre-turn / post-turn gate** | What an agent must read before work, and write back before it finishes. See `CLAUDE.md`. |
