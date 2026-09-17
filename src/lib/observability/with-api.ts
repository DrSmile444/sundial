import { randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import type { NextRequest } from 'next/server';
import { ApiError } from '../http';
import { runWithRequestStore, type RequestStore } from './context';
import { isRequestId, REQUEST_ID_HEADER } from './request-id';
import { writeRequestLog } from './logger';

export type RouteHandler<C> = (request: NextRequest, context: C) => Promise<Response>;

function requestIdOf(request: NextRequest): string {
  const supplied = request.headers.get(REQUEST_ID_HEADER);
  return isRequestId(supplied) ? supplied : randomUUID();
}

/**
 * Wraps a Route Handler so that every request it serves is correlated, timed
 * and written to the request log exactly once.
 */
export function withApi<C>(route: string, handler: RouteHandler<C>): RouteHandler<C> {
  return async (request, context) => {
    const store: RequestStore = {
      requestId: requestIdOf(request),
      route,
      startedAt: Date.now(),
      dbQueries: 0,
      fields: {},
    };

    return runWithRequestStore(store, async () =>
      Sentry.withScope(async (scope) => {
        scope.setTag('requestId', store.requestId);
        scope.setTag('route', route);

        try {
          const response = await handler(request, context);
          response.headers.set(REQUEST_ID_HEADER, store.requestId);
          writeRequestLog({ store, method: request.method, status: response.status });
          return response;
        } catch (caught) {
          if (caught instanceof ApiError) {
            const response = Response.json(
              { error: { code: caught.code, message: caught.message, requestId: store.requestId } },
              { status: caught.status },
            );
            response.headers.set(REQUEST_ID_HEADER, store.requestId);
            writeRequestLog({ store, method: request.method, status: caught.status });
            return response;
          }

          Sentry.captureException(caught);
          writeRequestLog({ store, method: request.method, status: 500, error: caught });

          const response = Response.json(
            { error: { code: 'INTERNAL_ERROR', requestId: store.requestId } },
            { status: 500 },
          );
          response.headers.set(REQUEST_ID_HEADER, store.requestId);
          return response;
        }
      }),
    );
  };
}
