import { describe, expect, it } from 'vitest';
import { amenityLabel, formatGuests, formatRate, formatStayDate, formatTotal } from './format';

describe('formatRate', () => {
  it('shows a nightly rate in whole dollars', () => {
    expect(formatRate(58000)).toBe('$580');
  });
});

describe('formatTotal', () => {
  it('shows a total with cents', () => {
    expect(formatTotal(129920)).toBe('$1,299.20');
  });
});

describe('formatStayDate', () => {
  it('reads a stored date on the calendar day it names', () => {
    expect(formatStayDate('2027-03-02')).toBe('Tue, Mar 2, 2027');
  });
});

describe('formatGuests', () => {
  it('counts one guest in the singular', () => {
    expect(formatGuests(1)).toBe('1 guest');
    expect(formatGuests(3)).toBe('3 guests');
  });
});

describe('amenityLabel', () => {
  it('reads a slug back as words', () => {
    expect(amenityLabel('pool-access')).toBe('Pool access');
  });
});
