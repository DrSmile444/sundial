import { nightsBetween } from '@/server/availability/overlap';

export const CURRENCY = 'USD';

export const TAX_RATE = 0.12;

export type Quote = {
  nightlyRateCents: number;
  nights: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: typeof CURRENCY;
};

export function priceStay(nightlyRateCents: number, checkIn: string, checkOut: string): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  const subtotalCents = nightlyRateCents * nights;
  const taxCents = Math.round(subtotalCents * TAX_RATE);

  return {
    nightlyRateCents,
    nights,
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    currency: CURRENCY,
  };
}
