import type { RoomListItem } from '@/server/rooms';
import { serverFetch } from '@/lib/api-client';
import { RoomCard } from '@/components/rooms/RoomCard';
import { StaySearchForm } from '@/components/rooms/StaySearchForm';
import { Boomerang } from '@/components/motifs/Boomerang';
import { Divider } from '@/components/motifs/Divider';
import { Starburst } from '@/components/motifs/Starburst';
import { ButtonLink } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

const amenityHighlights = [
  'Saltwater pool, open from breakfast to last light',
  'Record player and a starter stack of vinyl',
  'Private patios facing the San Jacinto range',
  'Desert breakfast served in the courtyard',
];

async function featuredRooms(): Promise<RoomListItem[]> {
  const { data } = await serverFetch<{ rooms: RoomListItem[] }>('/api/rooms');
  return data.rooms.slice(0, 3);
}

export default async function Home() {
  const rooms = await featuredRooms();

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-sand">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:px-8">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">
            Palm Springs · since 1957
          </p>
          <h1 className="mt-4 max-w-2xl">Twenty-four rooms under a wide desert sky</h1>
          <p className="mt-5 max-w-xl text-lg">
            Pick your dates, choose a room, and pay when you arrive.
          </p>
          <div className="mt-10">
            <StaySearchForm />
          </div>
          <Boomerang className="pointer-events-none absolute -right-10 top-10 hidden h-16 w-32 text-mustard lg:block" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2>Rooms guests ask for by name</h2>
          <ButtonLink href="/rooms" variant="secondary">
            See all rooms
          </ButtonLink>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.slug} room={room} />
          ))}
        </div>
      </section>

      <section className="border-y border-sand bg-sand/40">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-body text-sm uppercase tracking-[0.2em] text-teal">Our story</p>
            <h2 className="mt-3">A 1957 property, restored the slow way</h2>
            <p className="mt-4">
              The original steel frame, terrazzo floors and pool deck are the ones the first guests
              walked on. Everything behind the walls is new. The result is a hotel that still feels
              like the desert weekend it was built for.
            </p>
            <div className="mt-6">
              <ButtonLink href="/about" variant="secondary">
                Read the story
              </ButtonLink>
            </div>
          </div>
          <div className="flex justify-center">
            <Starburst className="h-40 w-40 text-mustard" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8">
        <h2 className="text-center">In every stay</h2>
        <Divider />
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {amenityHighlights.map((highlight) => (
            <li
              key={highlight}
              className="rounded-card border border-sand bg-white/60 p-6 text-sm shadow-sm"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-sand bg-sand/40">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-16 text-center sm:px-8">
          <h2>Your dates, your room</h2>
          <p className="max-w-xl">
            Reservations are held without prepayment. Change or cancel them yourself with your
            reference and email address.
          </p>
          <ButtonLink href="/rooms">Find a room</ButtonLink>
        </div>
      </section>
    </div>
  );
}
