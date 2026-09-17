import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRequestId, REQUEST_ID_HEADER } from '@/lib/observability/request-id';

export function proxy(request: NextRequest) {
  const supplied = request.headers.get(REQUEST_ID_HEADER);
  const requestId = isRequestId(supplied) ? supplied : crypto.randomUUID();

  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
