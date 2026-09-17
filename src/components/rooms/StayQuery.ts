export type StayQuery = {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

/** Carries the dates and guest count a guest already chose from one page to the next. */
export function stayQueryString(stay: StayQuery): string {
  const params = new URLSearchParams();

  if (stay.checkIn) params.set('checkIn', stay.checkIn);
  if (stay.checkOut) params.set('checkOut', stay.checkOut);
  if (stay.guests !== undefined) params.set('guests', String(stay.guests));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function readStayQuery(params: URLSearchParams): StayQuery {
  const guests = Number(params.get('guests'));

  return {
    checkIn: params.get('checkIn') ?? undefined,
    checkOut: params.get('checkOut') ?? undefined,
    guests: Number.isInteger(guests) && guests > 0 ? guests : undefined,
  };
}
