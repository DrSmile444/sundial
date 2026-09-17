import { db } from './index';
import { reviews, rooms } from './schema';
import { firstNames, lastNames, reviewBodyTemplates, reviewTitleTemplates } from './data/names';
import { intBetween, mulberry32, pick, toDateString } from './rng';

const SEED = 20260918 + 2;
const TOTAL_REVIEWS = 200_000;
const BATCH_SIZE = 5_000;
const RANGE_START = new Date('2022-01-01T00:00:00Z');
const RANGE_END = new Date('2026-12-31T00:00:00Z');

// Weighted toward 4 and 5 stars, as real guest reviews tend to be.
const RATING_WEIGHTS: readonly [rating: number, weight: number][] = [
  [5, 50],
  [4, 30],
  [3, 12],
  [2, 5],
  [1, 3],
];

function pickRating(rng: () => number): number {
  const total = RATING_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [rating, weight] of RATING_WEIGHTS) {
    if (roll < weight) return rating;
    roll -= weight;
  }
  return 5;
}

function randomStayDate(rng: () => number): string {
  const totalDays = Math.round(
    (RANGE_END.getTime() - RANGE_START.getTime()) / (1000 * 60 * 60 * 24),
  );
  const offset = intBetween(rng, 0, totalDays);
  const date = new Date(RANGE_START);
  date.setUTCDate(date.getUTCDate() + offset);
  return toDateString(date);
}

export async function seedReviews(): Promise<{ inserted: number }> {
  const roomRows = await db.select({ id: rooms.id }).from(rooms);
  if (roomRows.length === 0) throw new Error('Rooms must be seeded before reviews.');

  const rng = mulberry32(SEED);
  let inserted = 0;

  while (inserted < TOTAL_REVIEWS) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL_REVIEWS - inserted);
    const batch = Array.from({ length: batchCount }, () => {
      const room = pick(rng, roomRows);
      const firstName = pick(rng, firstNames);
      const lastName = pick(rng, lastNames);
      return {
        roomId: room.id,
        guestName: `${firstName} ${lastName}`,
        rating: pickRating(rng),
        title: pick(rng, reviewTitleTemplates),
        body: pick(rng, reviewBodyTemplates),
        stayedOn: randomStayDate(rng),
      };
    });
    await db.insert(reviews).values(batch);
    inserted += batchCount;
  }

  return { inserted };
}

async function main() {
  const start = Date.now();
  const { inserted } = await seedReviews();
  console.log(
    `Seeded ${String(inserted)} reviews in ${((Date.now() - start) / 1000).toFixed(1)}s.`,
  );
  process.exit(0);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
