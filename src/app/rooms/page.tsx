import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { RoomsBrowser } from '@/components/rooms/RoomsBrowser';

export const metadata: Metadata = {
  title: 'Rooms',
  description: 'Browse the twenty-four rooms at Sundial and check them for your dates.',
};

export default function RoomsPage() {
  return (
    <PageShell>
      <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">The catalogue</p>
      <h1 className="mt-3">Rooms</h1>
      <p className="mt-4 max-w-xl">
        Every room opens onto the courtyard. Filter by who is coming, what you want to pay, and what
        you want in the room.
      </p>
      <Suspense fallback={<p className="mt-10 text-sm text-ink/70">Loading rooms</p>}>
        <RoomsBrowser />
      </Suspense>
    </PageShell>
  );
}
