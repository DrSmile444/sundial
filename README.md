# Sundial

A reservation platform for Sundial, a mid-century boutique hotel. Guests browse
the rooms, check availability for their dates, book a stay paid at the property,
and come back later to read or cancel it with their reference and email address.

## Stack

- Next.js 16 (App Router) and React 19, TypeScript in strict mode
- Tailwind CSS v4, design tokens in `src/app/globals.css`
- Postgres 16 with Drizzle ORM, migrations in `drizzle/`
- Vitest for unit tests, Playwright for journeys
- Structured request logs on disk; Sentry when a DSN is configured

## Quick start

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

<http://localhost:3000>

## Scripts

| Command             | Does                                        |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | dev server on :3000                         |
| `pnpm build`        | production build                            |
| `pnpm start`        | serve the production build                  |
| `pnpm lint`         | ESLint                                      |
| `pnpm typecheck`    | `tsc --noEmit`                              |
| `pnpm format:check` | Prettier                                    |
| `pnpm test`         | Vitest                                      |
| `pnpm e2e`          | Playwright                                  |
| `pnpm db:migrate`   | apply migrations                            |
| `pnpm db:seed`      | reseed the catalogue, reservations, reviews |

## Docs

- [Architecture](docs/architecture.md) — layers, data model, API surface
- [Development](docs/development.md) — environment, scripts, adding an endpoint
- [Observability](docs/observability.md) — request id, log fields, release, error tracking
- [Incident response](docs/incident-response.md) — symptom to root cause to record
- `openspec/` — proposals and specs for larger changes
