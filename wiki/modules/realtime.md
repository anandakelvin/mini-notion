---
title: Realtime
updated: 2026-10-01
sources:
  - backend/src/note/note.gateway.ts
  - backend/src/note/note.service.ts
  - backend/src/app/app.module.ts
  - frontend/src/routes/notes/$noteId.tsx
source_commit: e967f7f
confidence: high
---

# Realtime

Live sync between open windows of the same note, over Socket.io ([ADR-005](../architecture/decisions.md#adr-005-live-sync-with-socketio-rooms-and-the-nest-event-emitter)). Only windows of the same account can join a note's room ([ADR-006](../architecture/decisions.md#adr-006-a-note-is-only-visible-to-its-owner-also-over-the-socket)).

## Connection

`NoteGateway.handleConnection` reads the `access_token` cookie from the handshake headers and verifies it. No cookie or a bad token: the socket is disconnected. Otherwise `client.data.user = { userId, email }`.

## Events

| Event | Direction | Payload | What happens |
|---|---|---|---|
| `join_note` | client → server | `{ noteId }` | Checks ownership with `getNoteById`, then joins room `note_<id>`. On failure emits `error`. |
| `cursor_move` | client → server | `{ noteId, pos, isTitle? }` | Sent to the rest of the room with the sender's email and a color. |
| `cursor_move` | server → client | `{ email, pos, color, isTitle? }` | Draws a remote cursor in the title or the editor. |
| `note_updated` | server → client | full note with `content` | Sent to room `note_<id>` after every save (from `@OnEvent('note.*.updated')`). |
| `user_left` | server → client | `{ email }` | Sent to **all** connected clients (`server.emit`), not only the room. Removes that cursor. |
| `error` | server → client | `{ message }` | Shown as a toast. |

`cursor_move` from the server does not check that the sender joined the room; it uses `client.to('note_<id>')` with the `noteId` the client sent.

Cursor color: a hash of the email picks one of 10 colors. The same function exists in `note.gateway.ts` and `$noteId.tsx`.

## Client side (`$noteId.tsx`)

- **Own save echo**: `isLocalSaveRef` is set before a save. The next `note_updated` is then treated as our own echo: only `lastSavedAtRef` is updated.
- **Applying a remote update**: compares checklists and images before and after, shows a label next to each changed block (`checked`, `unchecked`, `added image block`, `embedded image`) for 2.5 s or 4 s, updates the title, and calls `replaceBlocks` only if the JSON differs. `isApplyingRemoteRef` stops this from starting an auto-save ([pitfalls](../architecture/pitfalls.md#blocknote-replaceblocks-fires-onchange)).
- **Remote cursors in the editor**: a TipTap extension (`CollaborativeCursor`) draws ProseMirror widget decorations from `cursorsRef`. A no-op transaction is dispatched to redraw.
- **Remote cursors in the title**: measured with a hidden `<span>` that copies the title font.
- **Label position**: `ChecklistTooltips` recomputes positions every 200 ms with `setInterval`, and on resize.
