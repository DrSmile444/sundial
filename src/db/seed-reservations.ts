import { sql } from 'drizzle-orm';
import { db } from './index';
import { bookingIntents, reservations, rooms } from './schema';
import { roomDefs } from './data/rooms';
import { emailFor, firstNames, lastNames } from './data/names';
import { addDays, daysBetween, intBetween, mulberry32, pick, toDateString } from './rng';

const SEED = 20260918;
const RANGE_START = new Date('2025-01-01T00:00:00Z');
const RANGE_END = new Date('2026-12-31T00:00:00Z');
const OTHER_RESERVATION_COUNT = 119;
const TAX_RATE = 0.12;
const REFERENCE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export type BaselineRow = {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guestName: string;
  guestEmail: string;
  status: 'confirmed' | 'cancelled';
};

function generateReference(rng: () => number, used: Set<string>): string {
  let reference: string;
  do {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += pick(rng, REFERENCE_ALPHABET.split(''));
    }
    reference = `SD-${code}`;
  } while (used.has(reference));
  used.add(reference);
  return reference;
}

export function generateBaseline(): BaselineRow[] {
  const rng = mulberry32(SEED);
  const rows: BaselineRow[] = [];
  const confirmedIntervals = new Map<string, { start: Date; end: Date }[]>();
  for (const room of roomDefs) confirmedIntervals.set(room.slug, []);

  // Exclusion window around the fixed Atomic Suite reservation: no other
  // confirmed stay is generated for that room in this range.
  confirmedIntervals.get('atomic-suite')?.push({
    start: new Date('2026-10-15T00:00:00Z'),
    end: new Date('2026-11-05T00:00:00Z'),
  });

  rows.push({
    roomSlug: 'atomic-suite',
    checkIn: '2026-10-20',
    checkOut: '2026-10-23',
    guestCount: 2,
    guestName: 'Harold Whitfield',
    guestEmail: 'harold.whitfield@example.com',
    status: 'confirmed',
  });

  const totalDays = daysBetween(RANGE_START, RANGE_END);
  let attempts = 0;
  const maxAttempts = OTHER_RESERVATION_COUNT * 20;
  while (rows.length < OTHER_RESERVATION_COUNT + 1 && attempts < maxAttempts) {
    attempts++;
    const room = pick(rng, roomDefs);
    const offset = intBetween(rng, 0, totalDays - 7);
    const nights = intBetween(rng, 1, 7);
    const checkIn = addDays(RANGE_START, offset);
    const checkOut = addDays(checkIn, nights);
    const wantsConfirmed = rng() < 0.85;

    const existing = confirmedIntervals.get(room.slug) ?? [];
    const overlapsExisting = existing.some(
      (interval) => checkIn < interval.end && checkOut > interval.start,
    );
    const status: 'confirmed' | 'cancelled' =
      wantsConfirmed && !overlapsExisting ? 'confirmed' : 'cancelled';
    if (status === 'confirmed') existing.push({ start: checkIn, end: checkOut });

    const firstName = pick(rng, firstNames);
    const lastName = pick(rng, lastNames);
    rows.push({
      roomSlug: room.slug,
      checkIn: toDateString(checkIn),
      checkOut: toDateString(checkOut),
      guestCount: intBetween(rng, 1, Math.min(room.capacity, 4)),
      guestName: `${firstName} ${lastName}`,
      guestEmail: emailFor(firstName, lastName, rows.length),
      status,
    });
  }

  return rows;
}

export async function seedReservations(): Promise<{ inserted: number }> {
  await db.execute(sql`TRUNCATE TABLE reservations, booking_intents RESTART IDENTITY CASCADE`);

  const roomRows = await db.select({ id: rooms.id, slug: rooms.slug }).from(rooms);
  const roomIdBySlug = new Map(roomRows.map((row) => [row.slug, row.id]));
  const roomRateBySlug = new Map(roomDefs.map((room) => [room.slug, room.nightlyRateCents]));

  const baseline = generateBaseline();
  const referenceRng = mulberry32(SEED + 1);
  const usedReferences = new Set<string>();

  for (const row of baseline) {
    const roomId = roomIdBySlug.get(row.roomSlug);
    const nightlyRateCents = roomRateBySlug.get(row.roomSlug);
    if (roomId === undefined || nightlyRateCents === undefined) {
      throw new Error(`Unknown room slug in baseline data: ${row.roomSlug}`);
    }

    const nights = daysBetween(new Date(row.checkIn), new Date(row.checkOut));
    const subtotalCents = nightlyRateCents * nights;
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalCents = subtotalCents + taxCents;

    const [intent] = await db
      .insert(bookingIntents)
      .values({
        roomId,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        guestCount: row.guestCount,
        nightlyRateCents,
        nights,
        subtotalCents,
        taxCents,
        totalCents,
        expiresAt: addDays(new Date(row.checkIn), -1),
      })
      .returning({ id: bookingIntents.id });

    if (!intent) throw new Error('Failed to insert booking intent');

    await db.insert(reservations).values({
      reference: generateReference(referenceRng, usedReferences),
      bookingIntentId: intent.id,
      roomId,
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      guestCount: row.guestCount,
      subtotalCents,
      taxCents,
      totalCents,
      status: row.status,
    });
  }

  return { inserted: baseline.length };
}

async function main() {
  const { inserted } = await seedReservations();
  console.log(`Seeded ${String(inserted)} reservations.`);
  process.exit(0);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
