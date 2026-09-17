'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const fieldClasses =
  'w-full rounded-card border border-sand bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal';

const labelClasses = 'text-xs font-medium uppercase tracking-wide text-ink/60';

export function ManageLookupForm() {
  const router = useRouter();
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form
      className="mt-8 flex max-w-md flex-col gap-4 rounded-card border border-sand bg-white/60 p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(
          `/manage/${reference.trim().toUpperCase()}?email=${encodeURIComponent(email.trim())}`,
        );
      }}
    >
      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="manage-reference">
          Reservation reference
        </label>
        <input
          id="manage-reference"
          required
          placeholder="SD-XXXXXX"
          className={fieldClasses}
          value={reference}
          onChange={(event) => {
            setReference(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="manage-email">
          Email address
        </label>
        <input
          id="manage-email"
          type="email"
          required
          className={fieldClasses}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-card bg-burnt px-6 py-3 font-body text-sm font-medium text-ground transition-colors hover:bg-mustard"
      >
        Find my reservation
      </button>
    </form>
  );
}
