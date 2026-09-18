## 1. Regression tests (write first, watch them fail)

- [x] 1.1 Add a Vitest case to `src/server/rooms/mappers.test.ts` calling
      `toRoomDetail` with a `garden-casita`-shaped gallery row
      (`{primary, caption}`, no `images`) and asserting `images: []` and no
      thrown error. Run `pnpm test` and confirm this new case fails against
      the current `mappers.ts`.
- [x] 1.2 Add a Playwright case to `e2e/rooms.spec.ts` that navigates to
      `/rooms/garden-casita` and asserts the page responds with a visible
      room heading (`getByRole('heading', { name: 'Garden Casita', level: 1
    })`) and no error page. Run `pnpm e2e` (against the seeded database)
      and confirm this new case fails against the current
      `src/app/rooms/[slug]/page.tsx`.

## 2. Fix the mapper

- [x] 2.1 In `src/server/rooms/mappers.ts`, add `toImages(gallery: unknown):
    RoomImage[]`, returning `[]` unless `gallery` is an object with an
      array at `images`, and use it in `toRoomDetail` in place of the direct
      `gallery.images.map(toImage)` call.
- [x] 2.2 Run `pnpm test` and confirm the case from 1.1 now passes, along
      with the rest of `mappers.test.ts`.

## 3. Fix the detail page placeholder

- [x] 3.1 In `src/app/rooms/[slug]/page.tsx`, move the `bg-sand` lead-image
      container out from under the `{lead ? (...) : null}` guard so it
      always renders, keeping the `<Image>` element inside conditional on
      `lead`, matching the pattern already used in
      `src/components/rooms/RoomCard.tsx`.
- [x] 3.2 Run `pnpm e2e` and confirm the case from 1.2 now passes, along
      with the rest of `e2e/rooms.spec.ts`.

## 4. Verify

- [x] 4.1 Run `pnpm lint && pnpm typecheck && pnpm test` and confirm all
      pass.
- [x] 4.2 Run `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm
    build` and confirm all pass.
