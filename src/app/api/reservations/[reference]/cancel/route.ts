import { z } from 'zod';
import { jsonResponse, parseBody } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { email } from '@/lib/schemas';
import { cancelReservation } from '@/server/reservations';

const cancellation = z.object({ email });

export const POST = withApi(
  '/api/reservations/[reference]/cancel',
  async (request, context: { params: Promise<{ reference: string }> }) => {
    const { reference } = await context.params;
    logFields({ reference });

    const body = await parseBody(cancellation, request);

    return jsonResponse({ reservation: await cancelReservation(reference, body.email) });
  },
);
