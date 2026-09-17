import { z } from 'zod';

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a date as YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'is not a calendar date');

export const guestCount = z.coerce.number().int().min(1).max(12);

export const stayRequest = z
  .object({
    roomSlug: z.string().min(1),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: guestCount,
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: 'must be later than the arrival date',
    path: ['checkOut'],
  });

export const email = z.email();
