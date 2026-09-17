import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ApiError, serverFetch } from '@/lib/api-client';
import type { RoomDetail } from '@/server/rooms/mappers';
import { PageShell } from '@/components/site/PageShell';
import { BookingPanel } from '@/components/booking/BookingPanel';
import { Divider } from '@/components/motifs/Divider';
import { amenityLabel, formatRate, formatRating, formatStayDate } from '@/components/rooms/format';

export const dynamic = 'force-dynamic';

async function readRoom(slug: string): Promise<RoomDetail> {
  try {
    const { data } = await serverFetch<{ room: RoomDetail }>(`/api/rooms/${slug}`);
    return data.room;
  } catch (caught) {
    if (caught instanceof ApiError) {
      if (caught.status === 404) notFound();

      throw new Error(
        `The room detail request answered ${String(caught.status)} (reference ${caught.requestId}).`,
      );
    }

    throw caught;
  }
}

export async function generateMetadata({ params }: PageProps<'/rooms/[slug]'>): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await serverFetch<{ room: RoomDetail }>(`/api/rooms/${slug}`);
    return { title: data.room.name, description: data.room.tagline };
  } catch {
    return { title: 'Room' };
  }
}

export default async function RoomDetailPage({ params, searchParams }: PageProps<'/rooms/[slug]'>) {
  const { slug } = await params;
  const stay = await searchParams;
  const room = await readRoom(slug);

  const [lead, ...rest] = room.images;
  const guests = Number(stay.guests);

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {lead ? (
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-card bg-sand sm:col-span-2 sm:row-span-2">
            <Image
              src={lead.url}
              alt={lead.alt}
              fill
              sizes="(max-width: 640px) 100vw, 66vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        {rest.slice(0, 4).map((image) => (
          <div
            key={image.url}
            className="relative aspect-4/3 w-full overflow-hidden rounded-card bg-sand"
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div>
          <h1>{room.name}</h1>
          <p className="mt-3 text-lg text-ink/70">{room.tagline}</p>
          <p className="mt-6">{room.description}</p>

          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Sleeps', value: String(room.capacity) },
              { label: 'Bed', value: room.bedType },
              { label: 'Nightly rate', value: formatRate(room.nightlyRateCents) },
            ].map((fact) => (
              <div key={fact.label} className="rounded-card border border-sand bg-white/60 p-5">
                <dt className="text-xs uppercase tracking-wide text-ink/60">{fact.label}</dt>
                <dd className="mt-1 font-display text-xl">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-12">What the room includes</h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {room.amenities.map((slug) => (
              <li key={slug} className="rounded-full border border-sand bg-white/60 px-4 py-2">
                {amenityLabel(slug)}
              </li>
            ))}
          </ul>

          <h2 className="mt-12">What guests said</h2>
          <p className="mt-3 text-sm">
            <span className="font-display text-2xl text-teal">
              {formatRating(room.rating.average)}
            </span>
            {room.rating.average === null ? null : (
              <span className="text-ink/60">
                {' '}
                from {room.rating.count.toLocaleString('en-US')} reviews
              </span>
            )}
          </p>
          <Divider />
          <ul className="mt-4 flex flex-col gap-4">
            {room.recentReviews.map((review) => (
              <li
                key={`${review.stayedOn}-${review.title}`}
                className="rounded-card border border-sand bg-white/60 p-5"
              >
                <p className="font-display text-lg">{review.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink/60">
                  {String(review.rating)} out of 5 · stayed {formatStayDate(review.stayedOn)}
                </p>
                <p className="mt-2 text-sm">{review.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <BookingPanel
          slug={room.slug}
          nightlyRateCents={room.nightlyRateCents}
          capacity={room.capacity}
          checkIn={typeof stay.checkIn === 'string' ? stay.checkIn : undefined}
          checkOut={typeof stay.checkOut === 'string' ? stay.checkOut : undefined}
          guests={Number.isInteger(guests) && guests > 0 ? guests : undefined}
        />
      </div>
    </PageShell>
  );
}
