## Context

See proposal.md — Why. The repository holds a scaffold only: Next.js 16 with the
App Router, Tailwind v4, Drizzle with an empty schema, Postgres 16 in Docker
Compose on port 54329, Vitest, Playwright, ESLint, Prettier and git hooks. No
product tables, no routes beyond the default page, no logging.

Constraints that shape the approach:

- One process. The property is small; a second service would add deployment
  surface with nothing to gain.
- Local-first. The application must run fully on a laptop with Docker and no
  account with any hosted service. Anything hosted is an environment variable.
- Postgres is the only store. No cache, no queue, no search engine.
- TypeScript strict with `noUncheckedIndexedAccess` and `noImplicitOverride`.

## Goals / Non-Goals

**Goals:**

- One deployable unit that serves both the pages and the API from the same
  process, so that a request has one log line and one release identifier.
- A data model that expresses the catalogue, its reviews and the two-step
  booking flow without a migration in the next change.
- Correlation from the browser to the log line to the error record, available
  the moment the application starts, with no hosted account.
- A visual system specific enough that the pages do not need redesigning as they
  are added.

**Non-Goals:**

- Horizontal scaling, background workers and scheduled jobs.
- A design-token package or component library shared beyond this repository.
- Server-side rendering strategy beyond Next.js defaults; no custom caching
  layer in this change.

## Decisions

### D1. One Next.js application, Route Handlers as the API

The pages are React Server Components under `src/app/**`; the API is Route
Handlers under `src/app/api/**`. Server-rendered pages read the database through
the same query modules the handlers use, rather than calling their own HTTP API.
Client components call the API through an `apiFetch` helper.

Rationale: one process means one log stream, one release identifier and one
deploy. The API still exists as a real, separately testable surface, which the
browser and the end-to-end tests exercise.

Alternative: a separate backend service (Nest or Fastify) behind the Next.js
app. Rejected: two deploys, two log streams and a network hop for a product of
this size.

### D2. Drizzle over Postgres, SQL migrations checked in

Schema in `src/db/schema.ts`, migrations generated with `drizzle-kit generate`
into `drizzle/` and applied by `pnpm db:migrate`. Queries are written with the
Drizzle query builder; aggregate queries that Drizzle expresses awkwardly use
`sql` fragments rather than raw string concatenation.

Tables:

| Table             | Purpose                      | Notable columns                                                                                                                                                                          |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rooms`           | the catalogue                | `slug` unique, `name`, `summary`, `description`, `nightly_rate_cents`, `max_occupancy`, `gallery` JSONB, `published`                                                                     |
| `amenities`       | amenity vocabulary           | `slug` unique, `name`, `icon`                                                                                                                                                            |
| `room_amenities`  | join                         | `room_id`, `amenity_id`, primary key over both                                                                                                                                           |
| `reviews`         | guest reviews                | `room_id`, `rating` 1–5, `body`, `stayed_at`, `created_at`                                                                                                                               |
| `booking_intents` | a priced, unconfirmed intent | `id` uuid, `room_id`, `check_in`, `check_out`, `guests`, the price breakdown in minor units, `created_at`                                                                                |
| `reservations`    | a stay in force or cancelled | `reference` unique, `booking_intent_id`, `room_id`, `check_in`, `check_out`, `guests`, `guest_name`, `guest_email`, `guest_phone`, `status`, `total_cents`, `created_at`, `cancelled_at` |

`check_in` and `check_out` are `date`, not timestamps: a stay is counted in
nights in the property's local calendar, and a timestamp would invite a timezone
to change the answer. Money is stored in minor units as integers.

The `gallery` column is JSONB rather than a `room_images` table: the gallery is
always read and written whole with its room, is never queried across rooms, and
JSONB keeps the room a single row.

Alternative: Prisma. Rejected: the scaffold is already on Drizzle, and the
`sql` escape hatch is needed for the rating aggregate.

### D3. Availability computed from confirmed reservations

Availability for a room and a requested arrival and departure date is computed
by comparing the requested stay against the confirmed reservations held for that
room. Cancelled reservations take no part in the comparison. The behavioural
rule — how the two ends of a stay are counted, and which pairs of stays count as
conflicting — is stated in the availability spec and is not restated here.

The comparison lives in one module under `src/lib/availability/`, and the
availability endpoint, the room list when dates are supplied, and the
confirmation path all call it rather than expressing the comparison themselves.

Alternative: storing a stay as a Postgres date range and letting the database
answer the comparison. Kept in reserve: it is a natural later change, but it
complicates the Drizzle schema and the seed for no behavioural difference in
this one.

### D4. Two-step booking: quote, then confirm

Booking is two steps. `POST /api/reservations/quote` prices the stay for a room,
a date range and a guest count, and writes a `booking_intents` row that records
what was priced. `POST /api/reservations` takes that intent id plus the guest
details and creates the reservation from it. An intent that does not exist, or
that no longer prices an available stay, cannot produce a reservation.

Splitting the flow keeps the price the guest saw and the price the property
records the same value, and gives the confirmation a server-issued handle for
the guest's intent rather than a client-supplied one. How many reservations one
intent may produce, and what a repeated confirmation answers, are stated in the
booking spec.

On the client, the confirm control disables itself and shows progress for the
duration of the request, so a second activation sends nothing.

Alternative: a single endpoint that prices and books in one call. Rejected: the
guest would confirm a price they had not been shown, and the flow would have no
server-issued handle to identify one guest's booking attempt.

### D5. Observability without an account

- `middleware.ts` runs on `/api/:path*`. It adopts a well-formed inbound
  `x-request-id` or generates one, and sets it on the request and the response.
- `withApi(routeName, handler)` in `src/lib/observability/with-api.ts` wraps
  every Route Handler. It opens an `AsyncLocalStorage` store holding the request
  id, route, release and a counter; times the handler; catches and reports
  errors; and writes exactly one NDJSON line when the handler settles. Business
  identifiers are added by the handler through `addLogContext({ ... })`, which
  writes into the same store. The allowed keys are a fixed list, so guest name,
  email and phone cannot reach a log line.
- The database client counts queries into the store, so `dbQueries` is real
  rather than estimated.
- The log line goes to `process.stdout` and is appended to `logs/app.ndjson`
  through a single append stream opened once per process. `logs/` is
  git-ignored. The appender is best-effort: a filesystem failure is swallowed
  after one warning and never fails a request.
- `src/lib/observability/release.ts` reads `NEXT_PUBLIC_RELEASE`.
  `scripts/release.mjs` sets it from `git rev-parse --short HEAD` and runs ahead
  of `dev` and `build`; when git is unavailable the release reads `unknown`.
- `@sentry/nextjs` is initialised in the server, client and edge configs with
  `dsn: process.env.SENTRY_DSN`. An empty DSN leaves the SDK inert — it makes no
  network call — so no branch in product code depends on whether it is
  configured. `release` and `environment` are set from the same values as the
  log line; the request id and route are attached as tags from the
  `AsyncLocalStorage` store.
- The browser's `apiFetch` generates a request id per call, sends it, and sets
  it as a tag so a client-side error carries the same id as the server log line.

Rationale: the whole chain works on a laptop with no DSN, and turning on a DSN
later changes nothing but the environment.

Alternative: OpenTelemetry with a collector. Rejected for this change: it needs
a collector to be useful, and NDJSON on disk is directly readable.

### D6. Pages and API surface

Pages: `/` (hero, date and guest search, featured rooms, property story,
amenities), `/rooms` (filters, sort, cards), `/rooms/[slug]`, `/book/[slug]`,
`/booking/[reference]/confirmed`, `/manage`, `/manage/[reference]`, `/about`,
plus `error.tsx` and `not-found.tsx` in the same visual system.

API: `GET /api/health`, `GET /api/rooms`, `GET /api/rooms/[slug]`,
`POST /api/availability/check`, `POST /api/reservations/quote`,
`POST /api/reservations`, `GET /api/reservations/[reference]`,
`POST /api/reservations/[reference]/cancel`.

Reading a reservation needs the reference and the email that made it. The email
is sent as a query parameter on the read and in the body on the cancel; both
answer 404 for a mismatch, so a reference alone reveals nothing. Rate limiting
is out of scope for this change and is noted in Risks.

Requests are validated at the edge of every handler against a schema, and a
validation failure answers 400 with the offending field named. Error payloads
share one shape: `{ error: { code, message, requestId } }`.

### D7. Visual system: mid-century, one light theme

Tokens in `src/app/globals.css` as Tailwind v4 `@theme` variables: a warm
off-white ground, mustard, teal and burnt orange accents, a deep brown ink, a
geometric sans display face and a humanist body face through `next/font`,
generous spacing and a small radius scale. Boomerang and starburst motifs are
inline SVG React components, used as section ornaments.

One light theme only: a second theme doubles the review surface of every page
for no guest benefit at this stage.

### D8. Testing

Vitest covers the pure logic: the availability comparison, quote arithmetic,
reference generation, gallery normalisation and the log-line shape, including
that it holds no personal data. Playwright covers the journeys: the room list
loads and sorts, a room page opens, a booking completes and appears on the
manage page, and a cancellation frees the nights. End-to-end tests run against a
seeded database and use dates far enough ahead that the seed does not collide
with them.

## Risks / Trade-offs

- [The JSONB gallery has no database-level shape guarantee] → normalisation
  happens in one module at the read edge, which is covered by unit tests over
  every shape the seed writes, and the room page renders whatever it returns.
- [Availability is read at quote time and acted on at confirm time] → the
  confirmation path resolves the stay against the reservations held at that
  moment, so a room taken in between answers 409 rather than being held twice.
- [Rating aggregates over a large review table] → the average and count are
  computed in one grouped query, and `reviews.room_id` carries an index so the
  aggregate is answered from it; the response-time budget is asserted in the
  spec and measured in the end-to-end run.
- [Lookup by reference plus email can be probed] → both failure modes answer
  the same 404, references are long enough not to be guessable, and rate
  limiting is left to a later change and recorded here rather than half-built.
- [`logs/app.ndjson` grows without bound] → it is a development and local-
  operations artifact, git-ignored, and rotation is a deployment concern named
  in `docs/observability.md`.
- [Dates as calendar dates] → the property's local calendar is assumed
  throughout; a second property in another timezone would need a property
  timezone column, which the schema can take later.

## Migration Plan

The repository has no data and no deployment yet, so there is nothing to
migrate. Deployment is `pnpm db:migrate` followed by `pnpm db:seed` on an empty
database, then `pnpm build` and `pnpm start`. Rollback is `git revert` of the
change plus dropping the schema, since no environment holds data that matters
until the property starts taking real reservations.

## Open Questions

- Whether the property wants a deposit at the time of booking. The current
  answer is pay at property, and adding a deposit would be its own change with
  a payment provider behind it.
- Whether guests need a printable confirmation. The confirmation page is enough
  for this change; a PDF is additive and touches no spec here.
