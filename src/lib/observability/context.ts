import { AsyncLocalStorage } from 'node:async_hooks';

export type LogValue = string | number | boolean | null;

export type RequestStore = {
  requestId: string;
  route: string;
  startedAt: number;
  dbQueries: number;
  fields: Record<string, LogValue>;
};

const storage = new AsyncLocalStorage<RequestStore>();

export function runWithRequestStore<T>(store: RequestStore, run: () => T): T {
  return storage.run(store, run);
}

export function currentRequestStore(): RequestStore | undefined {
  return storage.getStore();
}

const PERSONAL_KEY = /email|phone|name|password|secret|token|authorization|card/i;

/**
 * Keeps guest identity and credentials out of the log stream. Callers may hand
 * whole objects to `logFields`; only the keys a log line may carry survive.
 */
export function redact(fields: Record<string, LogValue | undefined>): Record<string, LogValue> {
  const safe: Record<string, LogValue> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || PERSONAL_KEY.test(key)) continue;
    safe[key] = value;
  }

  return safe;
}

/** Adds business identifiers to the log line of the request being handled. */
export function logFields(fields: Record<string, LogValue | undefined>): void {
  const store = storage.getStore();
  if (!store) return;

  Object.assign(store.fields, redact(fields));
}

export function countQuery(): void {
  const store = storage.getStore();
  if (!store) return;

  store.dbQueries += 1;
}
