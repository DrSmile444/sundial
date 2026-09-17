## 1. Schema and migrations

- [ ] 1.1 Add `rooms`, `amenities` and `room_amenities` to `src/db/schema.ts` per design.md D2, with a unique `slug` on rooms and amenities and a composite primary key on the join table; verify `pnpm db:generate` produces a migration and `pnpm db:migrate` applies it on an empty database
- [ ] 1.2 Add `reviews` with an index on `room_id` and a 1-5 rating check; verify the generated migration creates both and `pnpm db:migrate` applies it
- [ ] 1.3 Add `booking_intents` and `reservations` per design.md D2, including the reservation reference, the link from a reservation to the intent it came from, and the reservation status; verify `pnpm db:generate` produces a migration, `pnpm db:migrate` applies it, and a reservation can be read back by its reference
- [ ] 1.4 Add the `Gallery` and `GalleryImage` types and the normalisation module that turns a stored gallery value into an ordered list of images with URL and alternative text; verify unit tests cover every gallery shape the seed writes and an empty gallery

## 2. Seed data

- [ ] 2.1 Seed the amenity vocabulary and 24 published rooms with mid-century names, summaries, long descriptions, nightly rates, occupancy and galleries; verify a second `pnpm db:seed` run leaves the same row counts
- [ ] 2.2 Seed guest reviews across the catalogue at a realistic volume; verify the review count and that `pnpm db:seed` completes in under two minutes on a laptop
- [ ] 2.3 Seed about 120 past and upcoming reservations with plausible guest details and a mix of statuses; verify no two seeded reservations for one room conflict under the availability spec

## 3. Observability

- [ ] 3.1 Add `middleware.ts` matching `/api/:path*` that adopts a well-formed inbound `x-request-id` or generates one and sets it on request and response; verify a request without the header receives a new id and a request with one receives it back unchanged
- [ ] 3.2 Add `src/lib/observability/release.ts` and `scripts/release.mjs`, and wire the script ahead of `dev` and `build`; verify the release value equals `git rev-parse --short HEAD` and falls back to `unknown` outside a git checkout
- [ ] 3.3 Add `withApi(routeName, handler)` with the `AsyncLocalStorage` store, timing, error capture and the NDJSON writer to stdout and `logs/app.ndjson`, plus `addLogContext` with its fixed key list; verify a unit test asserts one line per request with every field from the observability spec and none of the personal-data keys
- [ ] 3.4 Count database queries into the store from the Drizzle client; verify a handler issuing two queries logs `dbQueries: 2`
- [ ] 3.5 Add `@sentry/nextjs` with server, client and edge configuration reading `SENTRY_DSN`, tagging environment, release, request id and route; verify the application starts, serves requests and reports an error to the log with an empty DSN and makes no outbound call
- [ ] 3.6 Add `GET /api/health` returning status, release and database reachability; verify it answers 200 with the release when the database is up and 503 when it is down
- [ ] 3.7 Add `src/lib/api/fetch.ts` (`apiFetch`) that generates a request id per call, sends it as `x-request-id` and sets it as an error-tracking tag; verify a unit test asserts the header is present and unique per call

## 4. Domain logic

- [ ] 4.1 Add the availability module under `src/lib/availability/` that resolves a requested stay against a room's confirmed reservations per the availability spec; verify unit tests cover a scenario from each requirement in that spec
- [ ] 4.2 Add quote pricing (nightly rate by nights, taxes and fees, total) in minor units; verify unit tests cover a one-night and a multi-night stay and that no rounding error appears in the total
- [ ] 4.3 Add reservation reference generation; verify a unit test over many generated references finds no repeat and no ambiguous characters
- [ ] 4.4 Add the shared request-validation helpers and the error payload shape `{ error: { code, message, requestId } }`; verify a unit test asserts a validation failure names the offending field

## 5. API route handlers

- [ ] 5.1 Implement `GET /api/rooms` with guest-count, rate and amenity filters and the `recommended`, `price` and `top-rated` sorts, computing the rating aggregate in one grouped query; verify unit and end-to-end checks cover each sort and filter combination and an unknown sort answers 400
- [ ] 5.2 Make the room list honour arrival and departure dates when supplied, using the availability module; verify a room whose only reservation ends on the requested arrival date is included
- [ ] 5.3 Implement `GET /api/rooms/[slug]` returning the room with amenities, normalised gallery and review summary; verify it answers 200 for every slug the catalogue lists and 404 for an unknown slug
- [ ] 5.4 Implement `POST /api/availability/check`; verify it reports available for a range starting on an existing stay's departure date, unavailable for a shared night, and 400 for an inverted or same-day range
- [ ] 5.5 Implement `POST /api/reservations/quote` writing a `booking_intents` row and returning the intent id and price breakdown; verify a quote for an unavailable room answers 409 and writes no row
- [ ] 5.6 Implement confirm reservation (`POST /api/reservations`) per the booking spec; verify a scenario from each requirement in that spec, including the reference returned for a repeated confirmation of one intent
- [ ] 5.7 Implement `GET /api/reservations/[reference]` and `POST /api/reservations/[reference]/cancel` with reference-plus-email lookup; verify a wrong email and an unknown reference answer the same 404, a cancellation frees the nights, and a second cancellation keeps the original cancellation moment
- [ ] 5.8 Add the route-specific business identifiers to every handler through `addLogContext`; verify each route's log line carries the identifiers named in the observability spec and no personal data

## 6. Design system and pages

- [ ] 6.1 Define the design tokens in `src/app/globals.css`, load the display and body faces through `next/font`, and add the `Boomerang` and `Starburst` motif components; verify a tokens page renders every colour, face and radius
- [ ] 6.2 Build the shared layout, header, footer and room card; verify Playwright screenshots at 1440 and 390 widths show no horizontal overflow
- [ ] 6.3 Build `/` with the hero, date and guest search, featured rooms, property story, amenities and closing call to action; verify the search submits to `/rooms` with the chosen dates and guest count
- [ ] 6.4 Build `/rooms` with filters, the sort control and the card grid reading through `apiFetch`; verify changing the sort issues a new request with a fresh request id and re-renders in the returned order
- [ ] 6.5 Build `/rooms/[slug]` with gallery, description, amenities, review summary and the booking panel; verify every room in the catalogue renders and the booking control carries the chosen dates into `/book/[slug]`
- [ ] 6.6 Build `/book/[slug]` with dates, guest count, guest details, a live quote and a confirm control that disables itself and shows progress while the confirmation is in flight; verify a second activation sends no second request and a successful confirmation navigates to the confirmation page
- [ ] 6.7 Build `/booking/[reference]/confirmed` showing reference, room, dates, guests, total payable at the property and how to manage the reservation; verify it renders from a freshly created reservation
- [ ] 6.8 Build `/manage` and `/manage/[reference]` with the reference-plus-email form, the reservation view and the cancel control; verify a failed lookup keeps the entered reference and a cancellation shows the reservation as cancelled
- [ ] 6.9 Build `/about` with the property story; verify it renders in the same visual system
- [ ] 6.10 Add the global error page and `not-found` page in the same visual system; verify both render and the error page offers a way back to the catalogue

## 7. Documentation

- [ ] 7.1 Write `docs/architecture.md` covering the single-application shape, the data model and the request path; verify every table and route named in design.md D2 and D6 appears
- [ ] 7.2 Write `docs/observability.md` covering the request id, the log line fields, `logs/app.ndjson`, the release identifier and error-tracking configuration; verify a reader can find a request's log line from a response header using the document alone
- [ ] 7.3 Write `docs/development.md` covering Docker, migrate, seed, the dev server, the test commands and the environment variables; verify a clean checkout reaches a running seeded application by following it
- [ ] 7.4 Write `docs/incident-response.md` as a generic response runbook: symptom, evidence, reproduction, hypothesis, regression test, fix, verification, root-cause analysis, with the location of each kind of evidence in this system; verify it names the log file, the error-tracking configuration, the database command and the browser tooling
- [ ] 7.5 Update `README.md` with what the product is, the quick start and links to the four documents; verify the quick start works from a clean checkout

## 8. Tests and quality gate

- [ ] 8.1 Add end-to-end coverage of the room list, sorting and filtering; verify `pnpm e2e` passes against a seeded database
- [ ] 8.2 Add end-to-end coverage of the full booking journey from the catalogue to the confirmation page, then lookup and cancellation on `/manage`; verify `pnpm e2e` passes and the cancelled nights are available again
- [ ] 8.3 Add an end-to-end check that every room in the catalogue opens its detail page with status 200; verify it fails if any room's page errors
- [ ] 8.4 Measure each room-list sort in the end-to-end run and assert the shared response-time budget; verify the assertion fails when a sort exceeds the budget
- [ ] 8.5 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm e2e` and `pnpm build`; verify all five pass
