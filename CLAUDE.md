# CLAUDE.md

mini-notion: a Notion-style note app with live sync. NestJS + Prisma + Postgres backend, React + Vite + BlockNote frontend, shared zod schemas. pnpm monorepo.

The rules live in `.agents/`. This file loads them and adds the two turn gates.

- `.agents/core/` is portable: no stack, no tool names. Ported from my other projects. Do not edit it for project-specific reasons.
- `.agents/project/` is for this stack only.

@.agents/core/AGENTS.md
@.agents/core/rules/wiki.md
@.agents/core/rules/code-formatters.md
@.agents/core/rules/conventional-commits.md
@.agents/project/AGENTS.md
@.agents/project/testing.md
@.agents/project/code-formatters.md
@.agents/project/production-safety.md

---

## PRE-TURN GATE — before your first tool call on a task

1. Read `.agents/core/skills/wiki-maintainer/SKILL.md`.
2. Read `wiki/index.md`, then the pages that cover the task. Always read `wiki/architecture/decisions.md` before changing how something works.
3. Read the last entries of `wiki/log.md` (`grep '^## \[' wiki/log.md | tail -5`) for what recent sessions did.
4. Only then open source files, and only where the wiki is silent or `confidence: low`.

The scope-check exemption in core `AGENTS.md` §1 applies (one file, mechanical change, no logic). When you use it, say so in one line.

If the wiki contradicts the code, the code is the truth. Fix the wiki page with a supersession note, as part of the same task.

## POST-TURN GATE — before your final answer

1. **Test gate.** If the turn changed code: `pnpm review` must exit 0. Report the real result. See `.agents/project/testing.md`.
2. **Write back** anything the next session needs and cannot get from the code:

   | Produced this turn | Goes in |
   |---|---|
   | A decision, and the option it rejected | `wiki/architecture/decisions.md` (new ADR) |
   | A new endpoint, event, table, route or env variable | the matching `wiki/modules/*.md` or `wiki/architecture/data-model.md` |
   | A gotcha found the hard way | `wiki/architecture/pitfalls.md` |
   | A new domain term | `wiki/glossary.md` |
   | What changed and why, in two lines | `wiki/log.md` — **always**, if code changed |

3. Update `updated`, `source_commit` and `confidence` in the frontmatter of every page you touched (`wiki/SCHEMA.md`).

Do not record what git already carries (file lists, the diff). Record the *why*, and facts that live outside the code.

---

## Claude Code notes

- **Wiki workflows are not slash commands here.** For "init / ingest / lint / sync the wiki", read the matching `.agents/core/workflows/wiki-*.md` and follow it.
- **`.claude/skills/neon*`** are vendored Neon skills (`skills-lock.json`). They are about Neon in general, not about this app.
