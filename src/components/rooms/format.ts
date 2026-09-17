const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const MONEY_WITH_CENTS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const STAY_DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatRate(cents: number): string {
  return MONEY.format(cents / 100);
}

export function formatTotal(cents: number): string {
  return MONEY_WITH_CENTS.format(cents / 100);
}

export function formatStayDate(isoDate: string): string {
  return STAY_DATE.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatRating(average: number | null): string {
  return average === null ? 'Not yet reviewed' : average.toFixed(1);
}

export function formatGuests(guests: number): string {
  return guests === 1 ? '1 guest' : `${String(guests)} guests`;
}

export function amenityLabel(slug: string): string {
  return slug
    .split('-')
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}
