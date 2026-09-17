import { ApiError, jsonResponse } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { email } from '@/lib/schemas';
import { readReservation } from '@/server/reservations';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  '/api/reservations/[reference]',
  async (request, context: { params: Promise<{ reference: string }> }) => {
    const { reference } = await context.params;
    logFields({ reference });

    const supplied = new URL(request.url).searchParams.get('email');
    const parsed = email.safeParse(supplied);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'email: a valid email address is required.');
    }

    return jsonResponse({ reservation: await readReservation(reference, parsed.data) });
  },
);
