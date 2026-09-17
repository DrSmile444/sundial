export type StayRange = {
  checkIn: string;
  checkOut: string;
};

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / MS_PER_NIGHT);
}

/**
 * A held stay conflicts with a requested one when the held arrival falls before
 * the requested departure and the held departure falls on or after the
 * requested arrival.
 */
export function staysConflict(held: StayRange, requested: StayRange): boolean {
  return held.checkIn < requested.checkOut && held.checkOut >= requested.checkIn;
}
