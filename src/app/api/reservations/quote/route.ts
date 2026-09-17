import { jsonResponse, parseBody } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { stayRequest } from '@/lib/schemas';
import { createQuote } from '@/server/reservations';

export const POST = withApi('/api/reservations/quote', async (request) => {
  const body = await parseBody(stayRequest, request);

  logFields({
    roomSlug: body.roomSlug,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    guests: body.guests,
  });

  const quote = await createQuote(body);

  logFields({ bookingIntentId: quote.bookingIntentId });

  return jsonResponse(quote);
});
