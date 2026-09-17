import { describe, expect, it } from 'vitest';
import { nightsBetween, staysConflict } from './overlap';

const held = { checkIn: '2026-10-20', checkOut: '2026-10-23' };

describe('staysConflict', () => {
  it('counts a requested stay that sits entirely before the held one as free', () => {
    expect(staysConflict(held, { checkIn: '2026-10-14', checkOut: '2026-10-17' })).toBe(false);
  });

  it('counts a requested stay that sits entirely after the held one as free', () => {
    expect(staysConflict(held, { checkIn: '2026-10-27', checkOut: '2026-10-30' })).toBe(false);
  });

  it('counts a requested stay inside the held one as a conflict', () => {
    expect(staysConflict(held, { checkIn: '2026-10-21', checkOut: '2026-10-22' })).toBe(true);
  });

  it('counts a requested stay that wraps the held one as a conflict', () => {
    expect(staysConflict(held, { checkIn: '2026-10-18', checkOut: '2026-10-27' })).toBe(true);
  });
});

describe('nightsBetween', () => {
  it('counts the nights a stay covers', () => {
    expect(nightsBetween('2026-10-20', '2026-10-23')).toBe(3);
    expect(nightsBetween('2026-11-10', '2026-11-12')).toBe(2);
  });
});
