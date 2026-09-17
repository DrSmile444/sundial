import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jsonResponse } from '@/lib/http';
import { RELEASE } from '@/lib/observability/release';
import { withApi } from '@/lib/observability/with-api';

export const dynamic = 'force-dynamic';

export const GET = withApi('/api/health', async () => {
  let database: 'ok' | 'unavailable' = 'ok';

  try {
    await db.execute(sql`select 1`);
  } catch {
    database = 'unavailable';
  }

  return jsonResponse(
    {
      status: database === 'ok' ? 'ok' : 'degraded',
      release: RELEASE,
      database,
      ts: new Date().toISOString(),
    },
    database === 'ok' ? 200 : 503,
  );
});
