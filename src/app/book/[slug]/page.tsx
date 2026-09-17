import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError, serverFetch } from '@/lib/api-client';
import type { RoomDetail } from '@/server/rooms/mappers';
import { PageShell } from '@/components/site/PageShell';
import { BookingFlow } from '@/components/booking/BookingFlow';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/book/[slug]'>): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await serverFetch<{ room: RoomDetail }>(`/api/rooms/${slug}`);
    return { title: `Book the ${data.room.name}` };
  } catch {
    return { title: 'Book a room' };
  }
}

function text(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

export default async function BookRoomPage({ params, searchParams }: PageProps<'/book/[slug]'>) {
  const { slug } = await params;
  const query = await searchParams;

  let room: RoomDetail;
  try {
    const { data } = await serverFetch<{ room: RoomDetail }>(`/api/rooms/${slug}`);
    room = data.room;
  } catch (caught) {
    if (caught instanceof ApiError) {
      if (caught.status === 404) notFound();

      throw new Error(
        `The room detail request answered ${String(caught.status)} (reference ${caught.requestId}).`,
      );
    }

    throw caught;
  }

  const requested = Number(text(query.guests));
  const image = room.images[0] ?? null;

  return (
    <PageShell>
      <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">Reservation</p>
      <h1 className="mt-3">Book the {room.name}</h1>
      <p className="mt-4 max-w-xl">
        Confirm your dates and leave your details. We hold the room without prepayment.
      </p>

      <div className="mt-10">
        <BookingFlow
          room={{
            slug: room.slug,
            name: room.name,
            tagline: room.tagline,
            capacity: room.capacity,
            nightlyRateCents: room.nightlyRateCents,
            image: image && { url: image.url, alt: image.alt },
          }}
          checkIn={text(query.checkIn)}
          checkOut={text(query.checkOut)}
          guests={
            Number.isInteger(requested) && requested > 0 ? Math.min(requested, room.capacity) : 2
          }
        />
      </div>
    </PageShell>
  );
}
