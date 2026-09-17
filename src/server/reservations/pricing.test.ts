import { describe, expect, it } from 'vitest';
import { priceStay, TAX_RATE } from './pricing';

describe('priceStay', () => {
  it('multiplies the nightly rate by the number of nights', () => {
    const quote = priceStay(58000, '2026-11-10', '2026-11-13');

    expect(quote.nights).toBe(3);
    expect(quote.subtotalCents).toBe(174000);
  });

  it('adds tax on top of the subtotal', () => {
    const quote = priceStay(21000, '2026-11-10', '2026-11-12');

    expect(quote.taxCents).toBe(Math.round(quote.subtotalCents * TAX_RATE));
    expect(quote.totalCents).toBe(quote.subtotalCents + quote.taxCents);
  });

  it('returns whole minor units and a currency code', () => {
    const quote = priceStay(19999, '2026-11-10', '2026-11-17');

    expect(Number.isInteger(quote.taxCents)).toBe(true);
    expect(Number.isInteger(quote.totalCents)).toBe(true);
    expect(quote.currency).toBe('USD');
  });
});
