export type StayRange = {
  checkIn: string;
  checkOut: string;
};

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / MS_PER_NIGHT);
}

/** Whether a held stay and a requested stay claim any of the same time. */
export function staysConflict(held: StayRange, requested: StayRange): boolean {
  return held.checkIn < requested.checkOut && held.checkOut >= requested.checkIn;
}
