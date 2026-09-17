import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { reservations } from '@/db/schema';
import { db } from '@/lib/db';
import { type StayRange } from './overlap';

export { nightsBetween, staysConflict, type StayRange } from './overlap';

function heldOver(roomIds: number[], stay: StayRange) {
  return and(
    inArray(reservations.roomId, roomIds),
    eq(reservations.status, 'confirmed'),
    lt(reservations.checkIn, stay.checkOut),
    gte(reservations.checkOut, stay.checkIn),
  );
}

/** How many reservations in force stand between a room and a requested stay. */
export async function countConflicts(roomId: number, stay: StayRange): Promise<number> {
  const [row] = await db
    .select({ conflicts: sql<number>`count(*)::int` })
    .from(reservations)
    .where(heldOver([roomId], stay));

  return row?.conflicts ?? 0;
}

/** The subset of the given rooms that is already held over the requested stay. */
export async function findHeldRoomIds(roomIds: number[], stay: StayRange): Promise<Set<number>> {
  if (roomIds.length === 0) return new Set();

  const rows = await db
    .selectDistinct({ roomId: reservations.roomId })
    .from(reservations)
    .where(heldOver(roomIds, stay));

  return new Set(rows.map((row) => row.roomId));
}
