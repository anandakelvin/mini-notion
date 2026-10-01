# `.agents/core/` — portable

Everything under this directory is framework- and language-agnostic. It's designed to be copied wholesale into a new project, regardless of what that project is built in. This copy was ported from my other projects (Laravel/PHP) on 2026-10-01. Only project names were removed; the rules are unchanged.

To bootstrap a new project with this system:

1. Copy this entire `.agents/core/` directory into the new repo at the same relative path.
2. Write a fresh `.agents/project/` for the new project's actual stack (test runner, formatter/linter commands, agent-tool-specific tips). Verify the real toolchain first (`package.json`, lockfile, existing tests). Do not copy a sibling project's file and assume it still applies.
3. Bootstrap `wiki/` in the new repo (`wiki-maintainer` skill's `/wiki-init` operation — see `core/workflows/wiki-init.md`).
4. Wire up whatever memory-file convention the new project's agent tool expects (`CLAUDE.md`, `.cursorrules`, etc.) to import `core/AGENTS.md`, `core/rules/*.md`, and reference `core/skills/wiki-maintainer/SKILL.md` + `core/workflows/*.md` — see this repo's `CLAUDE.md` for the working example.

## Contents

- `AGENTS.md` — workspace rules §1–§7: entry gate, journaling, completion sync, think-before-coding/clarify-markers/ADR-lite, surgical changes, goal-driven execution, and agent-efficiency/quota-preservation *principles*. No stack or tool-name assumptions — §7's concrete tool names and commands are project-specific and belong in `.agents/project/`.
- `rules/wiki.md` — when to activate the wiki-maintainer skill and run its operations.
- `rules/code-formatters.md` — the *policy* for running formatters/linters before finalizing (commands belong in a project-side file).
- `rules/conventional-commits.md` — commit message convention, fully generic.
- `skills/wiki-maintainer/` — the living-wiki skill: init/ingest/lint/sync operations, the confidence/decay/supersession lifecycle model, quarterly log rotation policy.
- `workflows/` — the four wiki operations as slash-command workflows (`/wiki-init`, `/wiki-ingest`, `/wiki-lint`, `/wiki-sync`). For agent tools without native slash-command support, read the file directly and follow it on the matching trigger — see this repo's `CLAUDE.md` for how that's handled for Claude Code.

The original also has `rules/manuals.md` (keep end-user manuals in sync). It is left out here because this project has no end-user manuals.

## What's deliberately *not* here

Anything that names a specific language, framework, test runner, formatter, or agent-tool-specific tool. That content lives in `.agents/project/` in this repo.
