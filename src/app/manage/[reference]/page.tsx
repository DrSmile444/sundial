import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiError, serverFetch } from '@/lib/api-client';
import type { ReservationView } from '@/server/reservations';
import { PageShell } from '@/components/site/PageShell';
import { CancelReservation } from '@/components/booking/CancelReservation';
import { ReservationFacts } from '@/components/booking/ReservationFacts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your reservation',
};

export default async function ManageReservationPage({
  params,
  searchParams,
}: PageProps<'/manage/[reference]'>) {
  const { reference } = await params;
  const query = await searchParams;
  const email = typeof query.email === 'string' ? query.email : '';

  let reservation: ReservationView | null = null;

  if (email) {
    try {
      const { data } = await serverFetch<{ reservation: ReservationView }>(
        `/api/reservations/${reference}?email=${encodeURIComponent(email)}`,
      );
      reservation = data.reservation;
    } catch (caught) {
      if (!(caught instanceof ApiError) || caught.status !== 404) throw caught;
    }
  }

  if (!reservation) {
    return (
      <PageShell>
        <h1>No reservation found</h1>
        <p className="mt-4 max-w-xl">
          No reservation matches the reference {reference} and that email address. Check both and{' '}
          <Link href="/manage">try again</Link>.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">Your stay</p>
      <h1 className="mt-3">{reservation.reference}</h1>
      <p className="mt-4 max-w-xl">Held for {email}. Pay at the property when you arrive.</p>

      <div className="mt-8">
        <ReservationFacts reservation={reservation} />
      </div>

      <CancelReservation
        reference={reservation.reference}
        email={email}
        status={reservation.status}
      />

      <p className="mt-8 text-sm">
        <Link href={`/rooms/${reservation.roomSlug}`}>See this room again</Link>
      </p>
    </PageShell>
  );
}
