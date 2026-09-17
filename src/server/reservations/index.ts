import { and, eq, sql } from 'drizzle-orm';
import { bookingIntents, reservations, rooms } from '@/db/schema';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { countConflicts } from '@/server/availability';
import { findRoomBySlug } from '@/server/rooms';
import { priceStay, type Quote } from './pricing';
import { generateReference } from './reference';

const INTENT_LIFETIME_MINUTES = 30;

export type QuoteRequest = {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type QuoteResult = Quote & { bookingIntentId: string };

export async function createQuote(request: QuoteRequest): Promise<QuoteResult> {
  const room = await findRoomBySlug(request.roomSlug);
  if (!room) throw new ApiError(404, 'ROOM_NOT_FOUND', 'No room matches that slug.');

  if (request.guests > room.capacity) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      `guests: the room takes at most ${String(room.capacity)} guests.`,
    );
  }

  const conflicts = await countConflicts(room.id, request);
  if (conflicts > 0) {
    throw new ApiError(409, 'ROOM_UNAVAILABLE', 'The room is not available for those dates.');
  }

  const quote = priceStay(room.nightlyRateCents, request.checkIn, request.checkOut);

  const expiresAt = new Date(Date.now() + INTENT_LIFETIME_MINUTES * 60 * 1000);

  const [intent] = await db
    .insert(bookingIntents)
    .values({
      roomId: room.id,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      guestCount: request.guests,
      nightlyRateCents: quote.nightlyRateCents,
      nights: quote.nights,
      subtotalCents: quote.subtotalCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      expiresAt,
    })
    .returning({ id: bookingIntents.id });

  if (!intent) throw new Error('The booking intent could not be recorded.');

  return { bookingIntentId: intent.id, ...quote };
}

export type ConfirmationRequest = {
  bookingIntentId: string;
  guest: { name: string; email: string; phone?: string };
  specialRequests?: string;
};

export type Confirmation = {
  reference: string;
  status: 'confirmed';
  checkIn: string;
  checkOut: string;
  roomSlug: string;
  totalCents: number;
};

export async function confirmReservation(request: ConfirmationRequest): Promise<Confirmation> {
  const [intent] = await db
    .select({
      id: bookingIntents.id,
      roomId: bookingIntents.roomId,
      roomSlug: rooms.slug,
      nightlyRateCents: rooms.nightlyRateCents,
      checkIn: bookingIntents.checkIn,
      checkOut: bookingIntents.checkOut,
      guestCount: bookingIntents.guestCount,
      expiresAt: bookingIntents.expiresAt,
    })
    .from(bookingIntents)
    .innerJoin(rooms, eq(rooms.id, bookingIntents.roomId))
    .where(eq(bookingIntents.id, request.bookingIntentId))
    .limit(1);

  if (!intent || intent.expiresAt.getTime() < Date.now()) {
    throw new ApiError(404, 'INTENT_NOT_FOUND', 'That booking has expired. Please price it again.');
  }

  logFields({ roomSlug: intent.roomSlug });

  const conflicts = await countConflicts(intent.roomId, intent);
  if (conflicts > 0) {
    throw new ApiError(409, 'ROOM_UNAVAILABLE', 'The room is no longer available for those dates.');
  }

  const quote = priceStay(intent.nightlyRateCents, intent.checkIn, intent.checkOut);
  const reference = generateReference();

  await db.insert(reservations).values({
    reference,
    bookingIntentId: intent.id,
    roomId: intent.roomId,
    guestName: request.guest.name,
    guestEmail: request.guest.email,
    guestPhone: request.guest.phone,
    specialRequests: request.specialRequests,
    checkIn: intent.checkIn,
    checkOut: intent.checkOut,
    guestCount: intent.guestCount,
    subtotalCents: quote.subtotalCents,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
  });

  return {
    reference,
    status: 'confirmed',
    checkIn: intent.checkIn,
    checkOut: intent.checkOut,
    roomSlug: intent.roomSlug,
    totalCents: quote.totalCents,
  };
}

export type ReservationView = {
  reference: string;
  status: 'confirmed' | 'cancelled';
  roomSlug: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  updatedAt: string;
};

async function findByReferenceAndEmail(
  reference: string,
  email: string,
): Promise<ReservationView | null> {
  const [row] = await db
    .select({
      reference: reservations.reference,
      status: reservations.status,
      roomSlug: rooms.slug,
      roomName: rooms.name,
      checkIn: reservations.checkIn,
      checkOut: reservations.checkOut,
      guests: reservations.guestCount,
      subtotalCents: reservations.subtotalCents,
      taxCents: reservations.taxCents,
      totalCents: reservations.totalCents,
      updatedAt: reservations.updatedAt,
    })
    .from(reservations)
    .innerJoin(rooms, eq(rooms.id, reservations.roomId))
    .where(
      and(
        eq(reservations.reference, reference),
        sql`lower(${reservations.guestEmail}) = lower(${email})`,
      ),
    )
    .limit(1);

  if (!row) return null;

  return { ...row, updatedAt: row.updatedAt.toISOString() };
}

const NOT_FOUND = new ApiError(
  404,
  'RESERVATION_NOT_FOUND',
  'No reservation matches that reference and email address.',
);

export async function readReservation(reference: string, email: string): Promise<ReservationView> {
  const reservation = await findByReferenceAndEmail(reference, email);
  if (!reservation) throw NOT_FOUND;

  return reservation;
}

export async function cancelReservation(
  reference: string,
  email: string,
): Promise<ReservationView> {
  const reservation = await findByReferenceAndEmail(reference, email);
  if (!reservation) throw NOT_FOUND;

  if (reservation.status === 'cancelled') return reservation;

  const today = new Date().toISOString().slice(0, 10);
  if (reservation.checkIn < today) {
    throw new ApiError(
      409,
      'CANCELLATION_CLOSED',
      'This stay can no longer be cancelled online. Please call the property on +1 760 555 0142.',
    );
  }

  const cancelledAt = new Date();

  await db
    .update(reservations)
    .set({ status: 'cancelled', updatedAt: cancelledAt })
    .where(eq(reservations.reference, reference));

  return { ...reservation, status: 'cancelled', updatedAt: cancelledAt.toISOString() };
}
