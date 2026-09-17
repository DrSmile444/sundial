import * as Sentry from '@sentry/nextjs';

const REQUEST_ID_HEADER = 'x-request-id';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** An answer the API returned that the caller is expected to show the guest. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;

  constructor(status: number, code: string, message: string, requestId: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export type ApiResponse<T> = {
  data: T;
  requestId: string;
};

type ErrorPayload = {
  error?: { code?: string; message?: string; requestId?: string };
};

function withRequestId(init: RequestInit, requestId: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return { ...init, headers };
}

async function readResponse<T>(response: Response, sentRequestId: string): Promise<ApiResponse<T>> {
  const requestId = response.headers.get(REQUEST_ID_HEADER) ?? sentRequestId;
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const { error } = (payload ?? {}) as ErrorPayload;
    throw new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? 'The request could not be completed.',
      error?.requestId ?? requestId,
    );
  }

  return { data: payload as T, requestId };
}

/**
 * Calls the Sundial API from the browser. Every call carries its own request id,
 * which is tagged on Sentry and handed back so the caller can quote it.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const requestId = crypto.randomUUID();
  const response = await fetch(path, withRequestId(init, requestId));
  const result = await readResponse<T>(response, requestId);

  Sentry.getCurrentScope().setTag('requestId', result.requestId);

  return result;
}

/** Calls the same API from a server component, so the page view leaves a request log line. */
export async function serverFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const requestId = crypto.randomUUID();
  const response = await fetch(`${SITE_URL}${path}`, {
    cache: 'no-store',
    ...withRequestId(init, requestId),
  });

  return readResponse<T>(response, requestId);
}
