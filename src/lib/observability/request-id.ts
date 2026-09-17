export const REQUEST_ID_HEADER = 'x-request-id';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRequestId(value: string | null): value is string {
  return value !== null && UUID.test(value);
}
