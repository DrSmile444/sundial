'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api-client';
import { formatRate, formatStayDate, formatTotal } from '@/components/rooms/format';
import { Divider } from '@/components/motifs/Divider';

type RoomSummary = {
  slug: string;
  name: string;
  tagline: string;
  capacity: number;
  nightlyRateCents: number;
  image: { url: string; alt: string } | null;
};

type Availability = {
  available: boolean;
  nights: number;
};

type Quote = {
  bookingIntentId: string;
  nightlyRateCents: number;
  nights: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

type Guest = {
  name: string;
  email: string;
  phone: string;
  specialRequests: string;
};

type Priced = {
  stayKey: string;
  availability: Availability | null;
  quote: Quote | null;
  message: string | null;
};

type BookingFlowProps = {
  room: RoomSummary;
  checkIn: string;
  checkOut: string;
  guests: number;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClasses =
  'w-full rounded-card border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal';

const labelClasses = 'text-xs font-medium uppercase tracking-wide text-ink/60';

export function BookingFlow({ room, checkIn, checkOut, guests }: BookingFlowProps) {
  const router = useRouter();

  const [stay, setStay] = useState({ checkIn, checkOut, guests });
  const [priced, setPriced] = useState<Priced | null>(null);
  const [guest, setGuest] = useState<Guest>({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const datesChosen = Boolean(stay.checkIn && stay.checkOut && stay.checkOut > stay.checkIn);
  const stayKey = `${stay.checkIn}|${stay.checkOut}|${String(stay.guests)}`;

  useEffect(() => {
    if (!datesChosen) return;

    const subscription = { live: true };
    const dropped = () => !subscription.live;
    const body = JSON.stringify({
      roomSlug: room.slug,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: stay.guests,
    });

    async function price(): Promise<void> {
      const checked = await apiFetch<Availability>('/api/availability/check', {
        method: 'POST',
        body,
      });
      if (dropped()) return;

      setPriced({ stayKey, availability: checked.data, quote: null, message: null });
      if (!checked.data.available) return;

      const quoted = await apiFetch<Quote>('/api/reservations/quote', { method: 'POST', body });
      if (dropped()) return;

      setPriced({
        stayKey,
        availability: checked.data,
        quote: quoted.data,
        message: null,
      });
    }

    price().catch((caught: unknown) => {
      if (dropped()) return;

      setPriced({
        stayKey,
        availability: null,
        quote: null,
        message:
          caught instanceof ApiError
            ? `${caught.message} (reference ${caught.requestId})`
            : 'Those dates could not be priced. Please try again.',
      });
    });

    return () => {
      subscription.live = false;
    };
  }, [room.slug, stay.checkIn, stay.checkOut, stay.guests, stayKey, datesChosen]);

  const current = priced !== null && priced.stayKey === stayKey ? priced : null;
  const availability = current?.availability ?? null;
  const quote = current?.quote ?? null;
  const stayMessage = current?.message ?? null;

  async function confirm(): Promise<void> {
    setFormMessage(null);

    if (!quote) return;

    if (!guest.name.trim()) {
      setFormMessage('Please give the name the reservation is held under.');
      return;
    }

    if (!EMAIL.test(guest.email)) {
      setFormMessage('Please give an email address we can send the confirmation to.');
      return;
    }

    try {
      const { data } = await apiFetch<{ reference: string }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          bookingIntentId: quote.bookingIntentId,
          guest: {
            name: guest.name.trim(),
            email: guest.email.trim(),
            ...(guest.phone.trim() ? { phone: guest.phone.trim() } : {}),
          },
          ...(guest.specialRequests.trim()
            ? { specialRequests: guest.specialRequests.trim() }
            : {}),
        }),
      });

      router.push(
        `/booking/${data.reference}/confirmed?email=${encodeURIComponent(guest.email.trim())}`,
      );
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setFormMessage('This room was just taken for those dates.');
        return;
      }

      if (caught instanceof ApiError) {
        setFormMessage(`${caught.message} (reference ${caught.requestId})`);
        return;
      }

      throw caught;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div>
        <h2>Your stay</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="book-check-in">
              Check in
            </label>
            <input
              id="book-check-in"
              type="date"
              className={fieldClasses}
              value={stay.checkIn}
              onChange={(event) => {
                setStay({ ...stay, checkIn: event.target.value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="book-check-out">
              Check out
            </label>
            <input
              id="book-check-out"
              type="date"
              className={fieldClasses}
              value={stay.checkOut}
              onChange={(event) => {
                setStay({ ...stay, checkOut: event.target.value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="book-guests">
              Guests
            </label>
            <select
              id="book-guests"
              className={fieldClasses}
              value={stay.guests}
              onChange={(event) => {
                setStay({ ...stay, guests: Number(event.target.value) });
              }}
            >
              {Array.from({ length: room.capacity }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm" aria-live="polite">
          {!datesChosen
            ? 'Choose an arrival and a departure date.'
            : stayMessage
              ? stayMessage
              : availability === null
                ? 'Checking those dates'
                : availability.available
                  ? `Available for ${String(availability.nights)} nights.`
                  : 'Those dates are already taken for this room.'}
        </p>

        <h2 className="mt-12">Your details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="guest-name">
              Full name
            </label>
            <input
              id="guest-name"
              className={fieldClasses}
              value={guest.name}
              onChange={(event) => {
                setGuest({ ...guest, name: event.target.value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="guest-email">
              Email
            </label>
            <input
              id="guest-email"
              type="email"
              className={fieldClasses}
              value={guest.email}
              onChange={(event) => {
                setGuest({ ...guest, email: event.target.value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="guest-phone">
              Phone (optional)
            </label>
            <input
              id="guest-phone"
              className={fieldClasses}
              value={guest.phone}
              onChange={(event) => {
                setGuest({ ...guest, phone: event.target.value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className={labelClasses} htmlFor="guest-requests">
              Special requests (optional)
            </label>
            <textarea
              id="guest-requests"
              rows={3}
              className={fieldClasses}
              value={guest.specialRequests}
              onChange={(event) => {
                setGuest({ ...guest, specialRequests: event.target.value });
              }}
            />
          </div>
        </div>

        {formMessage ? (
          <p className="mt-4 rounded-card border border-burnt/40 bg-white/60 p-4 text-sm">
            {formMessage}
          </p>
        ) : null}
      </div>

      <aside className="rounded-card border border-sand bg-white/70 p-6 shadow-sm lg:sticky lg:top-8">
        {room.image ? (
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-card bg-sand">
            <Image
              src={room.image.url}
              alt={room.image.alt}
              fill
              sizes="20rem"
              className="object-cover"
            />
          </div>
        ) : null}

        <h3 className="mt-4">{room.name}</h3>
        <p className="mt-1 text-sm text-ink/70">{room.tagline}</p>

        {datesChosen ? (
          <p className="mt-3 text-sm text-ink/70">
            {formatStayDate(stay.checkIn)} to {formatStayDate(stay.checkOut)}
          </p>
        ) : null}

        <Divider />

        {quote ? (
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt>
                {formatRate(quote.nightlyRateCents)} × {String(quote.nights)} nights
              </dt>
              <dd>{formatTotal(quote.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Taxes and fees</dt>
              <dd>{formatTotal(quote.taxCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-sand pt-2 font-display text-lg">
              <dt>Total at the property</dt>
              <dd>{formatTotal(quote.totalCents)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-ink/70">The price appears once your dates are available.</p>
        )}

        <button
          type="button"
          onClick={() => {
            void confirm();
          }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-card bg-burnt px-6 py-3 font-body text-sm font-medium text-ground transition-colors hover:bg-mustard"
        >
          Confirm reservation
        </button>

        <p className="mt-4 text-xs text-ink/60">
          No prepayment. You pay the property when you arrive.
        </p>
      </aside>
    </div>
  );
}
