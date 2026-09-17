'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { amenityDefs } from '@/db/data/amenities';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { RoomListItem, RoomSort } from '@/server/rooms';
import { formatStayDate } from './format';
import { RoomCard } from './RoomCard';
import { readStayQuery } from './StayQuery';

const SORT_OPTIONS: { value: RoomSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price', label: 'Price' },
  { value: 'top-rated', label: 'Top rated' },
];

const RATE_CAPS = [30000, 40000, 50000, 65000];

const API_PARAMS = ['checkIn', 'checkOut', 'guests', 'maxRate', 'amenities', 'sort'] as const;

const fieldClasses =
  'w-full rounded-card border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal';

const labelClasses = 'text-xs font-medium uppercase tracking-wide text-ink/60';

function apiQuery(params: URLSearchParams): string {
  const forApi = new URLSearchParams();

  for (const key of API_PARAMS) {
    const value = params.get(key);
    if (value) forApi.set(key, value);
  }

  if (!forApi.get('checkIn') || !forApi.get('checkOut')) {
    forApi.delete('checkIn');
    forApi.delete('checkOut');
  }

  return forApi.toString();
}

type Result = {
  query: string;
  rooms: RoomListItem[];
  message: string | null;
};

export function RoomsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const subscription = { live: true };

    apiFetch<{ rooms: RoomListItem[] }>(`/api/rooms?${apiQuery(new URLSearchParams(query))}`)
      .then(({ data }) => {
        if (subscription.live) setResult({ query, rooms: data.rooms, message: null });
      })
      .catch((caught: unknown) => {
        if (!subscription.live) return;

        setResult({
          query,
          rooms: [],
          message:
            caught instanceof ApiError
              ? `${caught.message} (reference ${caught.requestId})`
              : 'The room list could not be loaded. Please try again.',
        });
      });

    return () => {
      subscription.live = false;
    };
  }, [query]);

  const loading = result === null || result.query !== query;
  const rooms = loading ? [] : result.rooms;
  const message = loading ? null : result.message;

  const params = new URLSearchParams(query);
  const stay = readStayQuery(params);
  const selectedAmenities = (params.get('amenities') ?? '').split(',').filter(Boolean);

  function update(changes: Record<string, string>): void {
    const next = new URLSearchParams(query);

    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }

    router.replace(`/rooms?${next.toString()}`, { scroll: false });
  }

  function toggleAmenity(slug: string): void {
    const next = selectedAmenities.includes(slug)
      ? selectedAmenities.filter((entry) => entry !== slug)
      : [...selectedAmenities, slug];

    update({ amenities: next.join(',') });
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[16rem_1fr] lg:items-start">
      <aside className="rounded-card border border-sand bg-white/60 p-6 shadow-sm">
        <h2 className="font-display text-lg">Filters</h2>

        {stay.checkIn && stay.checkOut ? (
          <p className="mt-3 text-sm text-ink/70">
            {formatStayDate(stay.checkIn)} to {formatStayDate(stay.checkOut)}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          <label className={labelClasses} htmlFor="filter-guests">
            Guests
          </label>
          <select
            id="filter-guests"
            className={fieldClasses}
            value={params.get('guests') ?? ''}
            onChange={(event) => {
              update({ guests: event.target.value });
            }}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <label className={labelClasses} htmlFor="filter-max-rate">
            Max nightly rate
          </label>
          <select
            id="filter-max-rate"
            className={fieldClasses}
            value={params.get('maxRate') ?? ''}
            onChange={(event) => {
              update({ maxRate: event.target.value });
            }}
          >
            <option value="">Any</option>
            {RATE_CAPS.map((cents) => (
              <option key={cents} value={cents}>
                Up to ${cents / 100}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="mt-5">
          <legend className={labelClasses}>Amenities</legend>
          <div className="mt-3 flex flex-col gap-2">
            {amenityDefs.map((amenity) => (
              <label key={amenity.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-teal"
                  checked={selectedAmenities.includes(amenity.slug)}
                  onChange={() => {
                    toggleAmenity(amenity.slug);
                  }}
                />
                {amenity.name}
              </label>
            ))}
          </div>
        </fieldset>
      </aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/70" aria-live="polite">
            {loading ? 'Loading rooms' : `${String(rooms.length)} rooms`}
          </p>
          <div className="flex items-center gap-2">
            <label className={labelClasses} htmlFor="sort">
              Sort
            </label>
            <select
              id="sort"
              className="rounded-card border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
              value={params.get('sort') ?? 'recommended'}
              onChange={(event) => {
                update({ sort: event.target.value });
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message ? (
          <p className="mt-8 rounded-card border border-burnt/40 bg-white/60 p-6 text-sm">
            {message}
          </p>
        ) : null}

        {!message && !loading && rooms.length === 0 ? (
          <p className="mt-8 rounded-card border border-sand bg-white/60 p-6 text-sm">
            No room matches those filters. Try widening the search.
          </p>
        ) : null}

        {rooms.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {rooms.map((room) => (
              <RoomCard key={room.slug} room={room} stay={stay} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
