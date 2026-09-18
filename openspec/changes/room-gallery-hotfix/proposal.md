## Why

The room detail page 500s for any room whose stored `gallery` JSON lacks an
`images` array — confirmed live in production (Sentry `SUNDIAL-4`,
`SUNDIAL-5`; Railway `sundial-web`; Supabase `sundial-main`) for
`garden-casita`, whose `gallery` is `{primary, caption}` instead of
`{images: [...]}`. Guests hitting `/rooms/garden-casita` see an error page
instead of the room. This needs a fix now, ahead of the broader `sundial-mvp`
change (0/46 tasks done) that will eventually touch the same page.

## What Changes

- The room detail page renders for a room regardless of the shape of that
  room's stored `gallery` data: a gallery missing a valid `images` array is
  treated as zero images, not an error.
- The room detail page's lead-image slot always reserves its placeholder
  block (the same sand-colored empty state `RoomCard` already uses when a
  room has no image), instead of omitting the slot entirely when there is no
  lead image.
- Regression coverage: a Vitest case for the mapper against a
  `garden-casita`-shaped gallery, and a Playwright end-to-end case that opens
  `/rooms/garden-casita` and asserts a 200 render with the placeholder shown,
  no error page.

## Non-goals

- Fixing the malformed `garden-casita` row itself. The stored data stays as
  it is; this change only stops it from crashing the page. Follow-up data
  cleanup, if wanted, is separate work.
- Any other gap the broader `room-details` spec in `sundial-mvp` describes
  (booking panel, reviews, amenities, etc.). This change covers only the
  gallery-normalization slice of that spec, ahead of the rest of that change.
- Changing how `RoomCard` (the room list card) shows a missing image — it
  already degrades correctly today.

## Capabilities

### New Capabilities

- `room-details`: the detail page and API for a single room render
  regardless of the historical shape of that room's stored gallery data,
  showing a placeholder in place of a missing image. Main `openspec/specs/`
  has no capabilities yet (project is pre-MVP), so this is authored as new
  here. It overlaps by design with the `room-details` delta spec already
  drafted (not yet implemented) in the open `sundial-mvp` change, which
  states the same "renders whatever the shape of gallery data" requirement
  more broadly. Reconcile the two `room-details` deltas when `sundial-mvp` is
  archived, so the capability ends up defined once.

### Modified Capabilities

- None.

## Impact

- `src/server/rooms/mappers.ts` — `toRoomDetail` gains a defensive
  `gallery.images` read; no longer throws on a malformed gallery.
- `src/app/rooms/[slug]/page.tsx` — lead-image slot always renders its
  placeholder container.
- `src/server/rooms/mappers.test.ts` — new regression case.
- `e2e/` — new Playwright case for the `garden-casita` journey.
- No database migration, no change to `src/db/schema.ts` or seed data.
- No change to `GET /api/rooms` (list) or `RoomCard` — the list's SQL path
  already degrades to `primaryImage: null` without erroring.
