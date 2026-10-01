# Code formatters (this project)

Instantiates `.agents/core/rules/code-formatters.md` for this repo.

## State on 2026-10-01

| Package | Tool | State |
|---|---|---|
| backend | Prettier (`backend/.prettierrc`: single quotes, trailing commas) + ESLint (`backend/eslint.config.mjs`) | Configured, but most files do not follow it. `eslint` reports 619 errors, most of them Prettier formatting (tabs vs spaces, quotes). |
| frontend | ESLint | No config file. Removed in commit `7d0ea0a`. |
| shared | none | — |

## Rules

- **Do not run `pnpm --filter backend lint` or `pnpm --filter backend format`.** Both rewrite files (`lint` has `--fix`). On this code they reformat whole files, which breaks the surgical-change rule (core §5) and hides the real diff.
- **Match the style of the file you are editing**: its indentation (many files use tabs), its quote style, its semicolons.
- To check lint on only the files you changed, without changing them:
  `pnpm --filter backend exec eslint src/path/to/file.ts`
  Fix only problems on lines you wrote.
- Lint joins the test gate (`testing.md`) only after the code base is formatted in one separate commit. That needs the owner's go-ahead.
