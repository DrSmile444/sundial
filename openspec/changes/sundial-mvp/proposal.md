## Why

Sundial has a scaffold — Next.js, Drizzle, Postgres, test runners — and no product
behaviour. Guests cannot see a room, check whether it is free, or hold it. This
change delivers the first complete guest journey so the property can take
reservations, and it establishes the operational contract (request correlation,
structured logs, release identity) that every later change builds on.

## What Changes

Guests can browse the room catalogue, open a room, check availability for a date
range, book a stay paid at the property, and later look up or cancel that
reservation with its reference and email address.

- **New**: room catalogue with filtering and three sort orders (`recommended`,
  `price`, `top-rated`), each answering within the same response-time budget.
- **New**: a room detail page for every room in the catalogue, with gallery,
  description, amenities and a review summary.
- **New**: availability checking over a date range, where a stay that ends on a
  day and a stay that starts on the same day do not overlap.
- **New**: a two-step booking flow — a quote that records the guest's intent,
  then a confirmation that turns one intent into at most one reservation.
- **New**: reservation lookup and cancellation by reference plus email.
- **New**: an observability baseline — `x-request-id` on every API request, one
  structured JSON log line per request, a release identifier derived from the git
  commit, and error tracking that stays inert until a DSN is configured.
- **New**: operator documentation — architecture, observability, development and
  a response runbook.

## Capabilities

### New Capabilities

- `room-discovery`: the room list — filtering, sorting, and the response-time
  budget every sort shares.
- `room-details`: the per-room page and its API, rendering for every room the
  catalogue holds.
- `availability`: whether a room is free for a date range, including how the
  arrival and departure days are counted.
- `booking`: quote, guest details, and confirmation of a stay paid at the
  property, with one reservation per booking intent.
- `booking-management`: lookup and cancellation of an existing reservation by
  reference and email.
- `observability`: request correlation, structured request logs, release
  identity, error tracking and the absence of personal data in logs.

### Modified Capabilities

None. This is the first behavioural change in the repository.

## Non-goals

- Payment capture. Guests pay at the property; no payment provider is integrated.
- Guest accounts, authentication and saved profiles. A reservation is reached
  through its reference and the email used to make it.
- A dark theme. One light theme only.
- Multi-property, multi-currency and multi-language support.
- An admin or staff-facing surface. Reservations are read through the database.
- Email or SMS delivery. The confirmation reference is shown on screen.

## Impact

Pages: `/`, `/rooms`, `/rooms/[slug]`, `/book/[slug]`,
`/booking/[reference]/confirmed`, `/manage`, `/manage/[reference]`, `/about`,
plus the global error page and `not-found`.

API Route Handlers: `GET /api/health`, `GET /api/rooms`,
`GET /api/rooms/[slug]`, `POST /api/availability/check`,
`POST /api/reservations/quote`, `POST /api/reservations`,
`GET /api/reservations/[reference]`, `POST /api/reservations/[reference]/cancel`.

Code: `src/db/schema.ts` and `drizzle/` gain six tables (`rooms`, `amenities`,
`room_amenities`, `reviews`, `booking_intents`, `reservations`); `src/db/seed.ts`
gains catalogue and review data; `src/lib/observability/**` and `middleware.ts`
are new; `src/app/globals.css` gains the design tokens.

Dependencies: `@sentry/nextjs` is added. No other runtime dependency changes.

Documentation: `docs/architecture.md`, `docs/observability.md`,
`docs/development.md`, `docs/incident-response.md`.
