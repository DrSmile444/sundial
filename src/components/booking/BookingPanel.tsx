'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatRate } from '@/components/rooms/format';
import { stayQueryString } from '@/components/rooms/StayQuery';

type BookingPanelProps = {
  slug: string;
  nightlyRateCents: number;
  capacity: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

const fieldClasses =
  'w-full rounded-card border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal';

const labelClasses = 'text-xs font-medium uppercase tracking-wide text-ink/60';

export function BookingPanel({
  slug,
  nightlyRateCents,
  capacity,
  checkIn = '',
  checkOut = '',
  guests = 2,
}: BookingPanelProps) {
  const [stay, setStay] = useState({ checkIn, checkOut, guests: Math.min(guests, capacity) });

  const href = `/book/${slug}${stayQueryString(stay)}`;

  return (
    <aside className="rounded-card border border-sand bg-white/70 p-6 shadow-sm lg:sticky lg:top-8">
      <p className="font-display text-2xl">
        {formatRate(nightlyRateCents)}
        <span className="font-body text-sm text-ink/60"> / night</span>
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <label className={labelClasses} htmlFor="panel-check-in">
          Check in
        </label>
        <input
          id="panel-check-in"
          type="date"
          className={fieldClasses}
          value={stay.checkIn}
          onChange={(event) => {
            setStay({ ...stay, checkIn: event.target.value });
          }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className={labelClasses} htmlFor="panel-check-out">
          Check out
        </label>
        <input
          id="panel-check-out"
          type="date"
          className={fieldClasses}
          value={stay.checkOut}
          onChange={(event) => {
            setStay({ ...stay, checkOut: event.target.value });
          }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className={labelClasses} htmlFor="panel-guests">
          Guests
        </label>
        <select
          id="panel-guests"
          className={fieldClasses}
          value={stay.guests}
          onChange={(event) => {
            setStay({ ...stay, guests: Number(event.target.value) });
          }}
        >
          {Array.from({ length: capacity }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>

      <Link
        href={href}
        className="mt-6 inline-flex w-full items-center justify-center rounded-card bg-burnt px-6 py-3 font-body text-sm font-medium text-ground no-underline transition-colors hover:bg-mustard"
      >
        Book this room
      </Link>

      <p className="mt-4 text-xs text-ink/60">
        No prepayment. You pay the property when you arrive.
      </p>
    </aside>
  );
}
