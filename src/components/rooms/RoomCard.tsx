import Image from 'next/image';
import Link from 'next/link';
import type { RoomListItem } from '@/server/rooms';
import { amenityLabel, formatRate, formatRating } from './format';
import { stayQueryString, type StayQuery } from './StayQuery';

type RoomCardProps = {
  room: RoomListItem;
  stay?: StayQuery;
};

export function RoomCard({ room, stay }: RoomCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-sand bg-white/60 shadow-sm">
      <div className="relative aspect-4/3 w-full bg-sand">
        {room.primaryImage ? (
          <Image
            src={room.primaryImage}
            alt={`${room.name} at Sundial`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : null}
        {room.available === false ? (
          <p className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-ground">
            Unavailable for these dates
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div>
          <h3>
            <Link
              href={`/rooms/${room.slug}${stayQueryString(stay ?? {})}`}
              className="text-ink no-underline hover:text-teal"
            >
              {room.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink/70">{room.tagline}</p>
        </div>

        <p className="text-sm text-ink/70">
          Sleeps {room.capacity} · {room.bedType} bed
        </p>

        <p className="text-sm">
          <span className="font-medium text-teal">{formatRating(room.rating.average)}</span>
          {room.rating.average === null ? null : (
            <span className="text-ink/60">
              {' '}
              · {room.rating.count.toLocaleString('en-US')} reviews
            </span>
          )}
        </p>

        <ul className="flex flex-wrap gap-2 text-xs text-ink/70">
          {room.amenities.slice(0, 3).map((slug) => (
            <li key={slug} className="rounded-full border border-sand px-3 py-1">
              {amenityLabel(slug)}
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-2 font-display text-xl">
          {formatRate(room.nightlyRateCents)}
          <span className="font-body text-sm text-ink/60"> / night</span>
        </p>
      </div>
    </article>
  );
}
