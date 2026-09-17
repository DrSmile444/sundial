# Development

## Prerequisites

- Node 22 or later, pnpm 10, Docker.

## First run

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The application serves on <http://localhost:3000>. The seed writes 24 rooms,
about 120 reservations and 200,000 reviews, and takes well under two minutes.

## Environment

| Variable                 | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `DATABASE_URL`           | Postgres connection string; the compose service listens on 54329 |
| `SENTRY_DSN`             | server-side error tracking; empty leaves the SDK inert           |
| `NEXT_PUBLIC_SENTRY_DSN` | browser-side error tracking; empty leaves the SDK inert          |
| `SENTRY_AUTH_TOKEN`      | set to upload source maps during `pnpm build`                    |
| `NEXT_PUBLIC_RELEASE`    | release identifier; `pnpm dev` and `pnpm build` set it from git  |

## Scripts

| Command             | Does                                         |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | dev server with the release identifier set   |
| `pnpm build`        | production build                             |
| `pnpm lint`         | ESLint                                       |
| `pnpm typecheck`    | `tsc --noEmit`                               |
| `pnpm format:check` | Prettier                                     |
| `pnpm test`         | Vitest                                       |
| `pnpm e2e`          | Playwright                                   |
| `pnpm db:generate`  | generate a migration from `src/db/schema.ts` |
| `pnpm db:migrate`   | apply migrations                             |
| `pnpm db:seed`      | reseed from scratch                          |

## Database access

```bash
docker compose exec db psql -U sundial
```

## Quality gates

`lint`, `typecheck`, `test`, `e2e` and `build` all pass before a change is done.

## Adding an endpoint

1. Put the queries and the arithmetic in a module under `src/server/`.
2. Add `src/app/api/<route>/route.ts` and wrap the handler in
   `withApi('<route pattern>', …)`.
3. Validate the request with a zod schema; `parseBody` and `parseQuery` in
   `src/lib/http.ts` answer 400 with the offending field named.
4. Call `logFields({ … })` with the identifiers the route works with, so the
   request log line can be searched by them. See [observability.md](observability.md).
5. Cover the arithmetic with a Vitest test and the journey with Playwright.
