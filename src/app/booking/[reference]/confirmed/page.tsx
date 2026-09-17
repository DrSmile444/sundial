import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiError, serverFetch } from '@/lib/api-client';
import type { ReservationView } from '@/server/reservations';
import { PageShell } from '@/components/site/PageShell';
import { Divider } from '@/components/motifs/Divider';
import { Starburst } from '@/components/motifs/Starburst';
import { ButtonLink } from '@/components/ui/Button';
import { ReservationFacts } from '@/components/booking/ReservationFacts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reservation confirmed',
};

export default async function ConfirmedPage({
  params,
  searchParams,
}: PageProps<'/booking/[reference]/confirmed'>) {
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
        <h1>We could not open that reservation</h1>
        <p className="mt-4 max-w-xl">
          Reservation {reference} could not be read with that email address. Look it up on the{' '}
          <Link href="/manage">manage booking</Link> page.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col items-center text-center">
        <Starburst className="h-10 w-10 text-mustard" />
        <h1 className="mt-4">Your room is held</h1>
        <p className="mt-3 max-w-xl">
          We sent the details to {email}. Keep the reference below: it opens your reservation
          whenever you need it.
        </p>
        <p className="mt-6 font-display text-4xl tracking-wide text-burnt">
          {reservation.reference}
        </p>
        <Divider />
      </div>

      <div className="mt-6">
        <ReservationFacts reservation={reservation} />
      </div>

      <p className="mt-6 rounded-card border border-sand bg-white/60 p-5 text-sm">
        Pay at the property. Nothing is charged before you arrive, and the front desk takes card or
        cash on check-in.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={`/manage/${reservation.reference}?email=${encodeURIComponent(email)}`}>
          Manage this reservation
        </ButtonLink>
        <ButtonLink href="/rooms" variant="secondary">
          See all rooms
        </ButtonLink>
      </div>
    </PageShell>
  );
}
