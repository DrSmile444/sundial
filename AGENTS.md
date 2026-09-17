<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sundial

A mid-century boutique hotel reservation platform. Guests discover rooms,
check availability, book a stay (pay at property), and manage an existing
reservation by reference and email.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5 (strict,
  `noUncheckedIndexedAccess`, `noImplicitOverride`)
- Tailwind CSS v4, design tokens in `src/app/globals.css`
- Postgres 16 via Docker Compose (container `sundial-db`, port 54329),
  Drizzle ORM, migrations in `drizzle/`, schema in `src/db/schema.ts`
- Route Handlers under `src/app/api/**` serve the API; there is no separate
  backend process
- Sentry (`@sentry/nextjs`) for error tracking, inert when `SENTRY_DSN` is
  empty
- Vitest for unit tests, Playwright for end-to-end tests

## Commands

| Command                             | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                          | start the dev server on :3000                                 |
| `pnpm build`                        | production build                                              |
| `pnpm lint`                         | ESLint                                                        |
| `pnpm typecheck`                    | `tsc --noEmit`                                                |
| `pnpm format` / `pnpm format:check` | Prettier                                                      |
| `pnpm test`                         | Vitest unit tests                                             |
| `pnpm e2e`                          | Playwright end-to-end tests (starts `pnpm dev` automatically) |
| `pnpm db:generate`                  | generate a Drizzle migration from the schema                  |
| `pnpm db:migrate`                   | apply migrations                                              |
| `pnpm db:seed`                      | seed the database                                             |
| `docker compose up -d`              | start Postgres                                                |

## Quality gates

A change is not done until all of these pass: `lint`, `typecheck`, `test`,
`e2e`, `build`.

## Workflow

This repository uses OpenSpec for larger or multi-step changes. Proposals,
designs, specs and tasks live under `openspec/`. Use `/opsx:propose` to start
a change, `/opsx:apply` to implement it, `/opsx:archive` once it is complete,
and the `openspec-verify-change` skill before committing.

Every requirement in a spec carries at least one acceptance scenario written
as an explicit Given / When / Then block. Commit messages follow
Conventional Commits.

## Scope discipline

Change only what the task asks for. Leave behaviour outside the task's
scope as it is, and mention it in your summary instead of fixing it in
passing.
