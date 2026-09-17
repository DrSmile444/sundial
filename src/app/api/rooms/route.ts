import { z } from 'zod';
import { ApiError, jsonResponse, parseQuery } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { isoDate } from '@/lib/schemas';
import { listRooms, ROOM_SORTS } from '@/server/rooms';

export const dynamic = 'force-dynamic';

const roomListQuery = z.object({
  checkIn: isoDate.optional(),
  checkOut: isoDate.optional(),
  guests: z.coerce.number().int().min(1).max(12).optional(),
  amenities: z.string().optional(),
  maxRate: z.coerce.number().int().positive().optional(),
  sort: z.enum(ROOM_SORTS).default('recommended'),
});

export const GET = withApi('/api/rooms', async (request) => {
  const query = parseQuery(roomListQuery, new URL(request.url));

  if ((query.checkIn === undefined) !== (query.checkOut === undefined)) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'checkIn and checkOut: supply both dates or neither.',
    );
  }

  if (query.checkIn !== undefined && query.checkOut !== undefined) {
    if (query.checkOut <= query.checkIn) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'checkOut: must be later than the arrival date.');
    }
  }

  const stay =
    query.checkIn !== undefined && query.checkOut !== undefined
      ? { checkIn: query.checkIn, checkOut: query.checkOut }
      : undefined;

  const rooms = await listRooms({
    sort: query.sort,
    guests: query.guests,
    amenities: query.amenities?.split(',').filter(Boolean),
    maxRateCents: query.maxRate,
    stay,
  });

  logFields({
    sort: query.sort,
    guests: query.guests,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    resultCount: rooms.length,
  });

  return jsonResponse({ rooms });
});
