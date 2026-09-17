import { errorResponse, jsonResponse } from '@/lib/http';
import { logFields } from '@/lib/observability/context';
import { withApi } from '@/lib/observability/with-api';
import { getRoomDetail } from '@/server/rooms';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  '/api/rooms/[slug]',
  async (_request, context: { params: Promise<{ slug: string }> }) => {
    const { slug } = await context.params;
    logFields({ roomSlug: slug });

    const room = await getRoomDetail(slug);
    if (!room) return errorResponse(404, 'ROOM_NOT_FOUND', 'No room matches that slug.');

    return jsonResponse({ room });
  },
);
