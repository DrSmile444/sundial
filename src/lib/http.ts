import { z } from 'zod';
import { currentRequestStore } from './observability/context';

/** An answer the client is expected to read: a bad request, a missing or taken resource. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function currentRequestId(): string {
  return currentRequestStore()?.requestId ?? '';
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function errorResponse(status: number, code: string, message: string): Response {
  return jsonResponse({ error: { code, message, requestId: currentRequestId() } }, status);
}

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'The request could not be read.';

  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

export function parseQuery<T>(schema: z.ZodType<T>, url: URL): T {
  const result = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', firstIssueMessage(result.error));
  }

  return result.data;
}

export async function parseBody<T>(schema: z.ZodType<T>, request: Request): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, 'VALIDATION_ERROR', 'The request body is not valid JSON.');
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', firstIssueMessage(result.error));
  }

  return result.data;
}
