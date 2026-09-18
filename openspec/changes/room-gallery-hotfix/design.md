## Context

See proposal.md - Why. The crash sits in one line:
`src/server/rooms/mappers.ts:71`, `gallery.images.map(toImage)`, called from
`toRoomDetail`, which trusts `row.gallery` to always be shaped
`{images: [...]}`. `garden-casita`'s stored gallery is `{primary, caption}`
instead, in both the local seed (`src/db/data/rooms.ts`) and the production
database — confirmed identical when compared directly. The list query
(`src/server/rooms/index.ts:44`) reads the same column through a Postgres
jsonb path expression, which already returns `null` instead of throwing on a
missing key, and `RoomCard` (`src/components/rooms/RoomCard.tsx:16`) already
renders a plain `bg-sand` box when there is no primary image. The detail
page (`src/app/rooms/[slug]/page.tsx:46,52`) does not have an equivalent
empty state today — it omits the entire lead-image container when there is
no lead image.

## Goals / Non-Goals

**Goals:**

- Stop `toRoomDetail` from throwing on any gallery shape that lacks a valid
  `images` array.
- Give the detail page's lead-image slot the same "no image yet" empty state
  the list card already has, instead of collapsing the slot away.
- Cover both with tests, including a Playwright case that reproduces the
  guest journey against `garden-casita`.

**Non-Goals:**

- Reading `gallery.primary`/`gallery.caption` as a photo. That legacy shape
  is of unknown origin and reproducing it as a real image risks showing a
  wrong or stale picture; treating it as "no images" is the safer default.
- Any data migration or seed change (see proposal.md - Non-goals).

## Decisions

**Defensive read over a schema/type change.** Add a narrow
`toImages(gallery: unknown): RoomImage[]` in `mappers.ts` that returns
`[]` for anything other than an object with an array at `images`, and use it
in place of the direct `gallery.images.map(...)` call. Considered adding
runtime validation (e.g., a schema library) for the `Gallery` type instead —
rejected as disproportionate for a single optional field on a JSON column
already narrowly consumed in one place.

**Reuse the existing empty-image pattern instead of a new placeholder
asset.** The list card's `bg-sand` box with no `<Image>` inside is already
the project's "no photo yet" convention. The fix moves the detail page's
lead container out from under the `{lead ? (...) : null}` guard so it always
renders, with the `<Image>` staying conditional inside it — matching
`RoomCard`'s structure. Considered adding a dedicated placeholder graphic
(a static asset with "photo coming soon" text) — rejected per the user's
choice: it adds a new asset and more markup for a state the app already
has a visual language for, and risks implying a photo is "on its way" for
data that may simply never get one.

**Playwright coverage runs against the seeded database, not a mock.** The
local seed (`pnpm db:seed`) already writes `garden-casita` with the same
malformed gallery shape as production, so the new e2e case needs no special
fixture — it opens `/rooms/garden-casita` against the normal seeded stack
and asserts a 200 render. This also means the case fails today (before the
fix) for the same reason the incident does, satisfying the runbook's
"write the failing test first" step.

## Risks / Trade-offs

- **The malformed `garden-casita` row stays in production.** →
  Accepted per proposal.md - Non-goals; the room shows the placeholder
  indefinitely until someone fixes the data separately.
- **A future room with a different unexpected gallery shape still shows no
  photos rather than a clear signal something is wrong with its data.** →
  Acceptable trade-off for a guest-facing page; server-side monitoring
  (Sentry) already surfaced this incident and would surface a recurrence if
  logging is added later, which is out of scope here.

## Migration Plan

No schema or data migration. Deploy is a normal code push: merge, let
Railway build and deploy `sundial-web`, then re-check Sentry issues
`SUNDIAL-4` and `SUNDIAL-5` stop recurring and mark them resolved once the
new release is confirmed live. Rollback is a normal revert of the commit;
nothing stateful changes.
