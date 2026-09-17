'use client';

import { useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { ReservationView } from '@/server/reservations';
import { StatusBadge } from './ReservationFacts';

type CancelReservationProps = {
  reference: string;
  email: string;
  status: ReservationView['status'];
};

export function CancelReservation({ reference, email, status }: CancelReservationProps) {
  const [current, setCurrent] = useState(status);
  const [message, setMessage] = useState<string | null>(null);

  async function cancel(): Promise<void> {
    setMessage(null);

    try {
      const { data } = await apiFetch<{ reservation: ReservationView }>(
        `/api/reservations/${reference}/cancel`,
        { method: 'POST', body: JSON.stringify({ email }) },
      );

      setCurrent(data.reservation.status);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setMessage(`${caught.message} (reference ${caught.requestId})`);
        return;
      }

      throw caught;
    }
  }

  return (
    <div className="mt-8 rounded-card border border-sand bg-white/60 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink/60">Status</p>
        <StatusBadge status={current} />
      </div>

      <p className="mt-3 text-sm" aria-live="polite">
        {current === 'cancelled'
          ? 'This reservation is cancelled. The nights are free for other guests.'
          : 'Cancel free of charge up to your arrival day.'}
      </p>

      {message ? <p className="mt-3 text-sm">{message}</p> : null}

      <button
        type="button"
        onClick={() => {
          void cancel();
        }}
        className="mt-5 inline-flex items-center justify-center rounded-card border border-ink px-6 py-3 font-body text-sm font-medium text-ink transition-colors hover:border-burnt hover:text-burnt"
      >
        Cancel reservation
      </button>
    </div>
  );
}
