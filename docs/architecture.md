# Architecture

Sundial is one Next.js application. It serves the guest-facing pages and the
JSON API from the same process, against one Postgres database.

```
browser ──▶ Next.js (App Router)
              ├── pages          src/app/**          React Server Components
              ├── API            src/app/api/**      Route Handlers
              ├── proxy          src/proxy.ts        request id on /api/*
              └── domain         src/server/**       rooms, availability, reservations
                                     │
                                     ▼
                                 Postgres 16 (Drizzle ORM)
```

## Layers

| Layer          | Location                            | Responsibility                                             |
| -------------- | ----------------------------------- | ---------------------------------------------------------- |
| Route Handlers | `src/app/api/**/route.ts`           | read the request, validate it with zod, shape the response |
| Domain         | `src/server/**`                     | the queries and the arithmetic behind each endpoint        |
| Data           | `src/db/schema.ts`, `src/lib/db.ts` | the tables and the Drizzle client                          |
| Observability  | `src/lib/observability/**`          | request id, timing, query count, the request log           |

Server-rendered pages call the domain modules directly. Client components call
the API over HTTP.

## Data model

| Table                         | Holds                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `rooms`                       | the catalogue; `gallery` is JSONB, prices are minor units   |
| `amenities`, `room_amenities` | the amenity vocabulary and its links to rooms               |
| `reviews`                     | guest reviews, one row per review, rating 1–5               |
| `booking_intents`             | a priced stay a guest has not confirmed yet, with an expiry |
| `reservations`                | a stay in force or cancelled, reachable by `reference`      |

`check_in` and `check_out` are calendar dates. A stay covers the nights from
its arrival date up to its departure date. Money is stored in minor units as
integers, never as floating point.

## Booking flow

1. `POST /api/reservations/quote` prices the stay and records a booking intent.
2. `POST /api/reservations` takes that intent, the guest details, and creates
   the reservation. Payment is taken at the property.
3. `GET /api/reservations/[reference]?email=` and
   `POST /api/reservations/[reference]/cancel` serve the guest afterwards.

## API surface

| Method | Route                                  |
| ------ | -------------------------------------- |
| GET    | `/api/health`                          |
| GET    | `/api/rooms`                           |
| GET    | `/api/rooms/[slug]`                    |
| POST   | `/api/availability/check`              |
| POST   | `/api/reservations/quote`              |
| POST   | `/api/reservations`                    |
| GET    | `/api/reservations/[reference]`        |
| POST   | `/api/reservations/[reference]/cancel` |

Error payloads share one shape:

```json
{ "error": { "code": "ROOM_UNAVAILABLE", "message": "…", "requestId": "…" } }
```
