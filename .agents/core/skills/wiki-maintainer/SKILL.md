---
name: wiki-maintainer
description: Knowledge for maintaining a living, LLM-owned wiki of a codebase — the architecture, operations, and lifecycle model that keeps wiki/ in sync with source code. Load this whenever working with files under wiki/ or running any /wiki-* workflow.
---

# Wiki Maintainer

This skill teaches you how to maintain a **living wiki of a codebase**: a set of human-readable markdown pages under `<repo>/wiki/` that explains the project's architecture, modules, decisions, and domain language, and stays current as the code changes.

You (the agent) own the wiki. The human reads it. Your job is to write it, keep it consistent, and surface drift.

This is an adaptation of the "LLM Wiki" pattern (Karpathy, 2026) for source code. The original pattern assumes immutable documents. Code is not immutable — that difference drives everything below.

---

## The three layers

1. **Raw sources** — the source code itself (code files, migrations, configs, etc. outside `wiki/`). You read from these but never modify them as part of wiki work.
2. **The wiki & root README** — `<repo>/wiki/` and root `<repo>/README.md`. You own and maintain these documentation targets. You create, update, and align pages and root README content here.
3. **The schema** — `<repo>/wiki/SCHEMA.md`. The repo-specific conventions: what pages exist, what format, what to flag. Read this before any wiki operation. If it's missing, fall back to the defaults defined below.

---

## The wiki directory structure (default)

```
wiki/
├── SCHEMA.md       # This repo's conventions (read first)
├── index.md        # Catalog: every page, one-line summary, organized by category
├── log.md          # Append-only timeline: ingests, lints, syncs, decisions
├── overview.md     # One-page orientation: what is this project, how is it laid out
├── architecture/
│   ├── decisions.md    # ADRs — significant design choices and their rationale
│   └── data-model.md   # Core data shapes, schemas, storage
├── modules/        # One page per major module/area (routes, services, components, etc.)
├── glossary.md     # Domain terms and their meanings in this project
```

SCHEMA.md can override this structure per repo. Always respect the repo's SCHEMA.md over the defaults here.

---

## Page conventions

Every wiki page MUST have YAML frontmatter:

```yaml
---
title: Short descriptive title
updated: 2026-04-14          # ISO date of last update
sources:                      # Files this page describes
  - src/routes/nodes.ts
  - src/middleware/auth.ts
source_commit: abc123         # Latest git commit hash when page was written (if git available)
confidence: high              # high | medium | low
---
```

Prefer markdown tables, Mermaid diagrams, and standard relative markdown links for cross-references (e.g. `[overview](overview.md)`, `[decisions](architecture/decisions.md)`). Do not use `[[wikilink]]` syntax — stick to standard markdown for portability and so links remain clickable in any renderer. Keep pages focused — one page, one concept.

### ADR Format (`architecture/decisions.md`)
ADRs in `architecture/decisions.md` must follow the concise, structured bullet format:

```markdown
## ADR-XXX: Title

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: Concise context and problem statement.
- **Decision**: Concise decision made.
- **Consequences**: Concise consequences and trade-offs.
```

Always use 3-digit zero-padded numbers (`ADR-001`, `ADR-002`), concise bullet points for `Status`, `Context`, `Decision`, `Consequences`, and horizontal rules (`---`) separating entries. Avoid verbose sub-headers or long inline proposals inside `decisions.md`.

---

## The four operations

### 1. Ingest (`/wiki-ingest [path]`)
Analyze source files and write/update wiki pages describing them. A single ingest may touch 5–15 wiki pages because one source file typically affects the module page, overview, glossary, architecture notes, and index.

### 2. Sync (`/wiki-sync`)
Incremental update from recent diffs (`git diff`, recently modified files). Runs frequently — after tasks, on command. Cheaper than full ingest because it only re-reads what changed.

### 3. Lint (`/wiki-lint`)
Health check. Scan the wiki for:
- **Staleness**: pages whose `source_commit` or `updated` is behind current file state
- **Drift**: claims in the wiki that no longer match the code (e.g. a page says Phase 2 is in progress but all features show as complete in the module page)
- **Orphans**: pages with no inbound links from index.md or other pages
- **Gaps**: code symbols/modules that exist but have no wiki page (e.g. new `src/foo/` directory not mentioned anywhere)
- **Contradictions**: pages that disagree with each other
- **Redundant legacy docs**: root-level docs like `CONTEXT_MAP.md`, `PROJECT_STATUS.md`, `BUILD.md` that the wiki now supersedes — *propose* deletion, never auto-delete
- **Stale frontmatter**: `updated` date more than 30 days old on pages whose sources have changed

Lint produces a **report**, not silent edits. The human decides which issues to fix.

### 4. Init (`/wiki-init`)
Bootstrap `wiki/` in a repo that doesn't have one yet. Copies the default schema, analyzes the repo top-down, writes the initial pages, and records the bootstrap in log.md.

---

## The lifecycle model (the key twist for code)

Claims in the wiki have a **half-life tied to the stability of the files they describe**. Code mutates; wiki claims must decay.

Three mechanisms:

### Confidence
Every page has a `confidence` field (`high` / `medium` / `low`). The default thresholds (SCHEMA.md may override per repo):

- **high**: written directly from current code, **0 commits** have touched the `sources:` files since `source_commit`.
- **medium**: **1–4 commits** have touched the `sources:` files since `source_commit`, OR the page contains some claims extrapolated beyond what the code directly shows.
- **low**: **5+ commits** have touched the `sources:` files since `source_commit`, OR the page contains claims you could not verify.

When running `/wiki-sync` or `/wiki-lint`, recompute and adjust confidence based on `git log` showing changes to the `sources:` files since `source_commit`.

### Supersession (not deletion)
When new code contradicts an old claim, do not silently rewrite. Write the corrected claim and add a note like:

```markdown
> **Superseded 2026-04-14**: previously said "uses SHA-1 hashing" — replaced in commit abc123 with SHA-256. See [log](../log.md#2026-04-14).
```

This gives the wiki a visible history of its own understanding — a git-for-knowledge layer on top of git-for-code.

### Decay (gentle, not automatic deletion)
Pages that haven't been re-verified in a long time and whose sources have changed get their confidence lowered and are flagged by lint. They are never auto-deleted. The human decides whether to refresh, merge, or retire them.

---

## log.md conventions

Append-only. Every entry starts with a consistent prefix so it's greppable:

```markdown
## [2026-04-14] ingest | added src/routes/search.ts
Summary of what was added/changed across the wiki in this operation.

## [2026-04-14] lint | 3 stale pages, 1 orphan, 2 gaps
Summary of the lint report.

## [2026-04-14] sync | post-task update
Affected pages: modules/routes.md, overview.md.
```

This makes `grep '^## \[' wiki/log.md | tail -10` a useful command for seeing recent activity.

### Rotation

Archive by calendar quarter — keep the current quarter's entries in `wiki/log.md`, move completed quarters to `wiki/log/YYYY-QN.md` when appending an entry from a new quarter.

**Never blind-cut.** Rotation is a read-then-move operation, not a text-move operation — a plain cut-and-paste is a protocol violation, not a shortcut. Before archiving a quarter's entries:

1. **MUST** read every entry being archived, not just move it unread.
2. **MUST** check each one for a durable fact (a gotcha, a rationale, a decision) not already captured in a module page or ADR — promote it there first if found.
3. **MUST** check each one against later entries — including ones staying in `log.md` — for contradictions about the same code or behavior. If found, don't silently move it: annotate it in place with a supersession-style correction note first (see "Supersession" above), the same way any wiki claim is corrected rather than deleted.
4. Only once 1–3 are done: move the entries to `wiki/log/YYYY-QN.md`, and replace them in `log.md` with a one-line archive pointer (`> Archived entries: [2026-Q2](log/2026-q2.md)`).

If a task needs history older than what's in `log.md`, check the archive index at the top before concluding something was never done or decided.

---

## index.md conventions

A navigable catalog. Organize by category, not chronologically. Keep each entry to one line. Example:

```markdown
# Wiki Index

## Overview
- [overview](overview.md) — what this project is and how it's laid out

## Architecture
- [decisions](architecture/decisions.md) — design choices (ADRs)
- [data model](architecture/data-model.md) — core data shapes and storage

## Modules
- [routes](modules/routes.md) — HTTP route handlers
- [services](modules/services.md) — business logic layer
- [middleware](modules/middleware.md) — auth, logging, rate-limit
```

Update index.md on every ingest that adds or removes pages.

---

## Style rules (non-negotiable)

1. **Do not invent**. If you cannot verify a claim from code or docs, do not write it. Omission is better than fabrication.
2. **Always cite sources** in frontmatter `sources:` — the specific files a page is based on.
3. **Prefer Mermaid over prose** for relationships, flows, state machines.
4. **Keep pages short** — if a page is over ~200 lines, split it.
5. **Write for two readers**: a human browsing, and a future agent session loading context. Both should find the page useful.
6. **Never modify source code files outside documentation** during wiki operations. Documentation maintained by `wiki-maintainer` includes `<repo>/wiki/` and root `README.md`. If you think a source code file needs fixing, *note it in the lint report*, don't fix it.
7. **Propose deletions, never execute them silently.** The human owns that decision.
8. **Touch index.md whenever you add/remove/rename a page.**
9. **Touch log.md at the end of every operation** with a one-line summary.
10. **Respect SCHEMA.md overrides** — repo-specific conventions win over defaults in this skill.

---

## Interaction model

- `/wiki-init` — new repo setup. Walk through the codebase top-down, ask the human to confirm the scope, write initial pages.
- `/wiki-ingest [path]` — deliberate deep-dive. Path is optional; if omitted, ask the user what to ingest before proceeding.
- `/wiki-sync` — fast, automatic-feeling. Runs after tasks without ceremony. Reports only what changed.
- `/wiki-lint` — produces a report. Human reviews. If they say "apply the fixes," do them as a follow-up pass.

When in doubt about scope, ask once, then proceed.
