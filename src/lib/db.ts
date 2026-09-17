import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';
import { countQuery } from './observability/context';

const globalForDb = globalThis as unknown as {
  sundialPool?: Pool;
};

const pool =
  globalForDb.sundialPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sundialPool = pool;
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema,
  logger: {
    logQuery: () => {
      countQuery();
    },
  },
});
