import { z } from 'zod';
import { jsonResponse, parseBody } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { email } from '@/lib/schemas';
import { confirmReservation } from '@/server/reservations';

const confirmation = z.object({
  bookingIntentId: z.uuid(),
  guest: z.object({
    name: z.string().min(1),
    email,
    phone: z.string().min(3).optional(),
  }),
  specialRequests: z.string().max(500).optional(),
});

export const POST = withApi('/api/reservations', async (request) => {
  const body = await parseBody(confirmation, request);

  logFields({ bookingIntentId: body.bookingIntentId });

  const reservation = await confirmReservation(body);

  logFields({ reference: reservation.reference });

  return jsonResponse(reservation, 201);
});
