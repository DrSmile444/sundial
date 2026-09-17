# Incident response

A runbook for taking a guest-visible symptom to a root cause, a fix and a
written record. Work top to bottom; each step narrows the search.

## Where evidence lives in this system

| Evidence       | Where                                  | How to read it                                         |
| -------------- | -------------------------------------- | ------------------------------------------------------ |
| Request log    | `logs/app.ndjson`, and standard output | `jq` over the file; one JSON line per API request      |
| Error tracking | Sentry, when `SENTRY_DSN` is set       | search by the `requestId` tag, or by release           |
| Database       | Postgres in `docker compose`           | `docker compose exec db psql -U sundial`               |
| Browser        | the running site, Playwright MCP       | drive the page, read the network panel and the console |
| Release        | `GET /api/health`                      | the commit the running process was built from          |

The fields of a log line are listed in [observability.md](observability.md).

## 1. Write down the symptom

One sentence in the guest's words: what they did, what they saw, what they
expected. Add the time window, the room or reference involved, and the
`x-request-id` from the response headers if anyone captured it.

## 2. Pin the release and the window

```bash
curl -s localhost:3000/api/health | jq .
```

Note the `release`. Everything you read next is about that build.

## 3. Search the request log

```bash
# every failed request in the window
jq -c 'select(.level == "error")' logs/app.ndjson | tail -20

# one route, with its timings and query counts
jq -c 'select(.route == "/api/rooms") | {ts, requestId, status, durationMs, dbQueries}' logs/app.ndjson

# a business identifier the guest gave you
jq -c 'select(.roomSlug == "apollo-loft")' logs/app.ndjson | tail -20
jq -c 'select(.reference == "SD-XXXXXX")' logs/app.ndjson
```

A wrong answer with status 200 leaves no error line. Compare the line for the
request the guest made against a line for a request that behaved, field by
field: `status`, `durationMs`, `dbQueries` and the identifiers of the route.

## 4. Correlate on the request id

Take the `requestId` from the line and pull everything carrying it:

```bash
jq -c 'select(.requestId == "…")' logs/app.ndjson
```

With error tracking configured, the same id is a tag on the event, so the stack
trace, the release and the log line meet on one value.

## 5. Read the data the request read

```bash
docker compose exec db psql -U sundial
```

```sql
select * from rooms where slug = '…';
select * from reservations where reference = '…';
select * from reservations where room_id = … order by check_in;
select * from booking_intents where id = '…';
```

State matters as much as code: the same handler behaves differently on
different rows.

## 6. Reproduce it

Reproduce in the browser against a seeded database, following the guest's
steps. Playwright MCP is configured in `.mcp.json`, so an agent can drive the
page, read the network panel and collect the `x-request-id` of each call.
Re-run the seed first when the data has drifted:

```bash
pnpm db:seed
```

A symptom you cannot reproduce is a symptom you cannot prove you fixed.

## 7. State a falsifiable hypothesis

Write one sentence of the form: _if X is the cause, then Y is true in the
evidence._ Then go and check Y. Keep the sentence specific enough that the
evidence can say no — "the price is recomputed from the room's current
rate rather than from the quoted one" can be refused; "something about the
price" cannot.

## 8. Write the failing test first

Add a Vitest case for the arithmetic or the comparison, or a Playwright case
for the journey. Run it and watch it fail for the reason your hypothesis
predicts. A test that passes before the fix is testing something else.

## 9. Make the smallest fix

Change the one thing the evidence points at. Leave the rest of the file as it
is; anything else you noticed goes in the summary, not in the diff.

## 10. Run the gates and verify

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm build
```

Then re-run the reproduction from step 6 and confirm the symptom is gone and
the log line now reads as it should.

## 11. Write the record

Add `docs/rca/<date>-<slug>.md`, for example
`docs/rca/2026-04-02-manage-page-timeouts.md`:

```markdown
# <short title>

**Date:** YYYY-MM-DD · **Release:** <short hash> · **Author:** <name>

## Impact

Who was affected, how many, over what window, in guest terms.

## Timeline

| Time (UTC) | Event                                |
| ---------- | ------------------------------------ |
| …          | first affected request (`requestId`) |
| …          | reported                             |
| …          | reproduced                           |
| …          | fix deployed                         |

## Detection

How it surfaced: a guest report, an error event, a metric. How long it had
been happening before anyone saw it.

## Root cause

The code path and the data that met it. Cite the file and the line, and the
evidence: log line, error event, rows.

## Contributing factors

What let it reach production and what let it stay unnoticed.

## Fix

What changed, and the regression test that now fails without it.

## Prevention

The follow-up work, each item small enough to be done. Note anything that
belongs in this runbook or in the specs under `openspec/`.
```

Link the record from the pull request that carries the fix.
