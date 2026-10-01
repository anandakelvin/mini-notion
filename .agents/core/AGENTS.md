# Workspace Rules & Enforcements (Portable Core)

> **Portable.** Nothing in this file assumes a language, framework, or agent tool. It's designed to be copied wholesale — along with the rest of `.agents/core/` — into a new project regardless of stack. Project-specific rules (formatters, test runners, tool-specific efficiency tips) live in `.agents/project/` instead, which is *not* meant to travel; write a new one per project. See `.agents/core/README.md`.

## 1. Mandatory Pre-Task Context Initialization (Entry Gate)

- **Scope check (do this first)**: is the task a single-file, mechanically-scoped change with no business-logic or schema impact — a rename, typo fix, exposing/renaming an existing field, a config value, formatting, a one-line copy change? If yes, the gate below is unnecessary ceremony — skip straight to the change.
  - Anything else — new fields/flows, business logic, migrations, anything touching more than one file, or anything you're not confident is trivial — goes through the full gate.
  - When unsure whether a change qualifies for the exemption, don't guess: run the full gate. A few thousand tokens of reading is cheap next to a wrong assumption shipped to production.
  - **When the exemption is invoked, say so.** State the one-line reason in your response before making the change (e.g. "Scope check: single-field rename, skipping full gate") — don't skip silently. This doesn't require approval and doesn't block anything; it just makes the call visible so a human reviewing the conversation can catch a wrong classification after the fact.
- **START OF TASK GATE** (for everything not exempted above): Before inspecting, opening, or editing any source code files outside `wiki/`:
  1. **MUST** view `.agents/core/skills/wiki-maintainer/SKILL.md` to activate the wiki maintainer capability.
  2. **MUST** read `wiki/index.md` and the relevant `wiki/modules/*.md` page(s) (or `wiki/architecture/`) to understand existing domain rules, schemas, and architectural patterns.
  3. **ONLY** fall back to reading raw source files if the wiki is silent, incomplete, or marked `confidence: low`.
  - Diving straight into source code without reading the relevant wiki documentation first — for a non-exempted change — is a strict protocol violation.

## 2. Mandatory Exploration & Discovery Journaling (Knowledge Capture)

- **RESEARCH & READ JOURNALING RULE**: If you read raw source files, investigate bugs, inspect database schema/configs, or reach domain/architectural conclusions because the wiki was silent, incomplete, or ambiguous:
  1. **MUST** journal the newly discovered architectural patterns, domain rules, API behaviors, data shapes, or bug findings directly into the appropriate `wiki/modules/*.md`, `wiki/architecture/`, or `wiki/glossary.md` page.
  2. **MUST** record the investigation entry in `wiki/log.md`.
  - Re-exploring source code without persisting the uncovered knowledge back to the wiki is prohibited. Future agent sessions must benefit from every research effort.

## 3. Mandatory Post-Task Wiki Sync (Completion Gate / Definition of Done)

- **COMPLETION GATE**: Before declaring ANY coding task complete or delivering the final summary to the user:
  - If any source code files (migrations, controllers, models, resources, configs, services, API routes, templates) were created, modified, or deleted outside `wiki/`:
    1. **MUST** update the corresponding `wiki/modules/*.md`, `wiki/architecture/`, `wiki/index.md`, or `wiki/overview.md` files to document structural and behavioral changes.
    2. **MUST** append a sync log entry to `wiki/log.md` detailing what was updated.
  - Declaring a coding task resolved without updating the wiki to reflect changes is a strict protocol failure.

## 4. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

For anything requiring the full §1 entry gate (i.e. not exempted by the §1 scope check — so anything touching business logic, schema, more than one file, or anything you're not confident is trivial):

1. **Mark ambiguity explicitly, capped.** State assumptions as `[NEEDS CLARIFICATION: specific question]` markers instead of silently picking one. Cap it at ~5 markers per pass — more than that means the task is too broad to clarify in one round; resolve the first 5 with the user, then reassess the rest.
   - Ask the user to resolve every marker before implementing. Don't guess past one.
   - If multiple interpretations exist, present them — don't pick silently.
   - If a simpler approach exists, say so. Push back when warranted.
2. **Write a short pre-implementation note** in `wiki/architecture/decisions.md`, `Status: Proposed`, using the ADR format's **pre-implementation extension** defined in `wiki/SCHEMA.md` (Requirements/Success criteria/Assumptions bullets — the canonical field list lives there, not here).
   - Fold resolved `[NEEDS CLARIFICATION]` markers from step 1 into Requirements or Assumptions once answered.
   - Flip `Status` to `Accepted` once the change is implemented and verified (§6). If abandoned or superseded, mark it so — never delete it (same supersession discipline as any other ADR).
3. **Cross-check against the wiki before writing code.** Compare the note from step 2 against the `wiki/modules/*.md` page(s) already read under §1, looking for contradictions — a wiki claim your plan would violate, or a plan detail the wiki already says is false. Read-only: report what you find, don't silently edit either side. Resolve any contradiction with the user before proceeding, not after.

For changes the §1 scope check exempts (single-file, mechanically-scoped), skip steps 1–3 — state the assumption inline, if any, and proceed.

## 5. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 6. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 7. Agent Efficiency & Quota Preservation

**Minimize wasted tool calls and tokens — quota and context are real constraints, not infinite.**

- **Context window tax**: avoid full-file reads, binary reads, or dumping huge logs when a targeted view suffices. Read only the line range you actually need from a large file.
- **Prefer purpose-built tools over generic ones** when both exist and cover the same need (a dedicated DB-inspection tool over raw SQL via a shell, a package-doc-search tool over guessing from memory, a URL-resolution helper over hand-constructing one) — check what's available before defaulting to the manual path.
- **No baseline runs**: don't run the full test suite (or other expensive verification) before starting a task just to establish a "before" state — verify the specific change, not the whole system, unless asked.
- **Target narrowly**: run only the test(s)/checks relevant to the change, not the whole suite. Use whatever fast/non-verbose output mode the test runner offers.
- **Know your environment's quirks**: some commands hang, error, or behave differently in this environment than in a normal terminal (interactive prompts, TTY allocation, etc.) — use the non-interactive/direct-invocation form once you know about a quirk, and record it (§2) so the next session doesn't rediscover it the hard way.
- **Reuse stateful context across subagents**: if spawning multiple subagents against the same stateful target (an authenticated browser session, a long-lived connection), reuse that context/session instead of re-establishing it each time.
- **Proactive failure diagnosis**: when a subagent or subprocess fails, have it surface logs/errors/relevant state immediately rather than requiring a follow-up round trip to ask "what happened."
- **Don't block on sleep**: never poll a long-running or background task in a sleep loop. Use whatever scheduling/background/notification mechanism the environment provides instead.
- **Pitfall journaling**: document non-obvious gotchas or environment quirks discovered while working, so they aren't rediscovered by a future session — overlaps with §2's journaling rule; same discipline, applied to operational/environmental gotchas specifically, not just domain knowledge.

This project's concrete tool names, test-runner commands, and formatter invocations that instantiate these principles live in `.agents/project/AGENTS.md` — read that too if it exists.
