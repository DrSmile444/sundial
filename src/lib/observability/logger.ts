import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs';
import path from 'node:path';
import { ENVIRONMENT, RELEASE } from './release';
import type { LogValue, RequestStore } from './context';

const LOG_DIRECTORY = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIRECTORY, 'app.ndjson');

let stream: WriteStream | null = null;
let streamFailed = false;

function logStream(): WriteStream | null {
  if (streamFailed) return null;
  if (stream) return stream;

  try {
    mkdirSync(LOG_DIRECTORY, { recursive: true });
    stream = createWriteStream(LOG_FILE, { flags: 'a' });
    stream.on('error', (error: Error) => {
      streamFailed = true;
      stream = null;
      console.warn(`sundial: request log file unavailable (${error.message})`);
    });
    return stream;
  } catch (error) {
    streamFailed = true;
    console.warn(
      `sundial: request log file unavailable (${error instanceof Error ? error.message : 'unknown'})`,
    );
    return null;
  }
}

export type RequestLogInput = {
  store: RequestStore;
  method: string;
  status: number;
  error?: unknown;
};

export function writeRequestLog({ store, method, status, error }: RequestLogInput): void {
  const line: Record<string, LogValue> = {
    ts: new Date().toISOString(),
    level: error || status >= 500 ? 'error' : 'info',
    requestId: store.requestId,
    method,
    route: store.route,
    status,
    durationMs: Date.now() - store.startedAt,
    dbQueries: store.dbQueries,
    release: RELEASE,
    env: ENVIRONMENT,
    ...store.fields,
  };

  if (error instanceof Error) {
    line.errorName = error.name;
    line.errorMessage = error.message;
    line.stack = error.stack ?? null;
  } else if (error !== undefined) {
    line.errorName = 'UnknownError';
    line.errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
  }

  const serialised = JSON.stringify(line);

  process.stdout.write(`${serialised}\n`);
  logStream()?.write(`${serialised}\n`);
}
