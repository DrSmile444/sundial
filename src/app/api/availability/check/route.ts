import { ApiError, errorResponse, jsonResponse, parseBody } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { stayRequest } from '@/lib/schemas';
import { countConflicts, nightsBetween } from '@/server/availability';
import { findRoomBySlug } from '@/server/rooms';

export const POST = withApi('/api/availability/check', async (request) => {
  const body = await parseBody(stayRequest, request);

  logFields({
    roomSlug: body.roomSlug,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    guests: body.guests,
  });

  const room = await findRoomBySlug(body.roomSlug);
  if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'No room matches that slug.');

  if (body.guests > room.capacity) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      `guests: the room takes at most ${String(room.capacity)} guests.`,
    );
  }

  const conflicts = await countConflicts(room.id, body);
  const available = conflicts === 0;

  logFields({ conflicts, available });

  return jsonResponse({
    available,
    conflicts,
    nights: nightsBetween(body.checkIn, body.checkOut),
    nightlyRateCents: room.nightlyRateCents,
  });
});
