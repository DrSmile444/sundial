# Observability

Every API request is answerable after the fact: what was asked, what was
answered, how long it took, which release served it, and which id ties the
browser, the log line and any error record together.

## Request id

`src/proxy.ts` runs on `/api/:path*`. It adopts a well-formed `x-request-id`
from the caller or generates one, puts it on the request headers the handler
sees, and returns it in the `x-request-id` response header. `withApi` reads it
back and holds it in an `AsyncLocalStorage` store for the life of the request.

To follow a guest report, ask for the `x-request-id` of the failing response —
the browser shows it under the response headers of the request in the network
panel — and search the log for it.

## The request log

`withApi` in `src/lib/observability/with-api.ts` writes exactly one JSON line
per API request, to standard output and appended to `logs/app.ndjson`. The
directory is created on demand and is git-ignored; rotation is a deployment
concern and is not handled in the application.

| Field        | Meaning                                                        |
| ------------ | -------------------------------------------------------------- |
| `ts`         | when the line was written, ISO 8601                            |
| `level`      | `info`, or `error` for a 5xx or an unhandled error             |
| `requestId`  | the correlation id, also in the `x-request-id` response header |
| `method`     | HTTP method                                                    |
| `route`      | the route pattern, for example `/api/rooms/[slug]`             |
| `status`     | response status                                                |
| `durationMs` | wall time of the handler                                       |
| `dbQueries`  | how many statements the Drizzle client ran for this request    |
| `release`    | the git commit the process was started from                    |
| `env`        | `development`, `test` or `production`                          |

Handlers add the identifiers they work with through `logFields({ … })`:
`roomSlug`, `checkIn`, `checkOut`, `guests`, `sort`, `resultCount`,
`conflicts`, `available`, `bookingIntentId`, `reference`. An error line also
carries `errorName`, `errorMessage` and `stack`.

`logFields` passes everything through `redact`, which drops any key naming a
guest or a credential, so a log line identifies a guest only by reservation
reference or booking intent id.

Reading the log:

```bash
tail -f logs/app.ndjson | jq .
jq -c 'select(.level == "error")' logs/app.ndjson
jq -c 'select(.route == "/api/rooms") | {ts, sort, durationMs, dbQueries}' logs/app.ndjson
```

## Query counting

`src/lib/db.ts` builds the Drizzle client with a logger that increments the
counter in the request store. `dbQueries` is therefore what the request really
ran, which makes a change in query volume visible per route.

## Release

`scripts/release.mjs` prints `git rev-parse --short HEAD`, and `pnpm dev` and
`pnpm build` put it in `NEXT_PUBLIC_RELEASE`. When git is unavailable the
release reads `unknown`. `src/lib/observability/release.ts` exposes it to the
log line, the error events and `GET /api/health`:

```json
{ "status": "ok", "release": "8990063", "database": "ok", "ts": "…" }
```

The health endpoint runs `select 1` and answers 503 with
`"database": "unavailable"` when the database cannot be reached.

## Error tracking

`@sentry/nextjs` is initialised in `sentry.server.config.ts`,
`sentry.edge.config.ts` and `src/instrumentation-client.ts`, with the DSN read
from `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`. With no DSN the SDK is inert:
nothing leaves the machine and the error still reaches `logs/app.ndjson` with
its stack. `withApi` tags every event with `requestId` and `route`; `release`
and `environment` come from the same values as the log line. Source maps are
uploaded during `pnpm build` only when `SENTRY_AUTH_TOKEN` is set.

## In the browser

Client components generate an `x-request-id` per call and send it, so a console
error and the server log line for the same interaction carry the same id.
