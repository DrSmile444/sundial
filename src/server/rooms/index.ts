import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { amenities, roomAmenities, reviews, rooms } from '@/db/schema';
import { db } from '@/lib/db';
import { findHeldRoomIds, type StayRange } from '@/server/availability';
import { toRoomDetail, type RatingSummary, type RoomDetail, type ReviewSummary } from './mappers';

export const ROOM_SORTS = ['recommended', 'price', 'top-rated'] as const;

export type RoomSort = (typeof ROOM_SORTS)[number];

export type RoomListQuery = {
  sort: RoomSort;
  guests?: number;
  amenities?: string[];
  maxRateCents?: number;
  stay?: StayRange;
};

export type RoomListItem = {
  slug: string;
  name: string;
  tagline: string;
  capacity: number;
  bedType: string;
  nightlyRateCents: number;
  primaryImage: string | null;
  rating: RatingSummary;
  amenities: string[];
  available?: boolean;
};

const amenitySlugs = sql<string[]>`
  coalesce(
    (
      select json_agg(a.slug order by a.slug)
      from ${roomAmenities} ra
      join ${amenities} a on a.id = ra.amenity_id
      where ra.room_id = rooms.id
    ),
    '[]'::json
  )
`;

const primaryImage = sql<string | null>`${rooms.gallery} -> 'images' -> 0 ->> 'url'`;

function withAmenities(slugs: string[]) {
  return inArray(
    rooms.id,
    db
      .select({ roomId: roomAmenities.roomId })
      .from(roomAmenities)
      .innerJoin(amenities, eq(amenities.id, roomAmenities.amenityId))
      .where(inArray(amenities.slug, slugs))
      .groupBy(roomAmenities.roomId)
      .having(sql`count(distinct ${amenities.id}) = ${slugs.length}`),
  );
}

/** Average and number of guest reviews for one room, computed from the reviews held now. */
export async function getRatingSummary(roomId: number): Promise<RatingSummary> {
  const [row] = await db
    .select({
      average: sql<number | null>`avg(${reviews.rating})::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.roomId, roomId));

  return {
    average: row?.average === null || row?.average === undefined ? null : round(row.average),
    count: row?.count ?? 0,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function listRooms(query: RoomListQuery): Promise<RoomListItem[]> {
  const conditions = [];

  if (query.guests !== undefined) conditions.push(gte(rooms.capacity, query.guests));
  if (query.maxRateCents !== undefined) {
    conditions.push(lte(rooms.nightlyRateCents, query.maxRateCents));
  }
  if (query.amenities && query.amenities.length > 0) {
    conditions.push(withAmenities(query.amenities));
  }

  const found = await db
    .select({
      id: rooms.id,
      slug: rooms.slug,
      name: rooms.name,
      tagline: rooms.tagline,
      capacity: rooms.capacity,
      bedType: rooms.bedType,
      nightlyRateCents: rooms.nightlyRateCents,
      ratingDisplay: rooms.ratingDisplay,
      primaryImage,
      amenities: amenitySlugs,
    })
    .from(rooms)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(query.sort === 'price' ? asc(rooms.nightlyRateCents) : asc(rooms.sortOrder));

  const ordered =
    query.sort === 'top-rated' ? await byLiveRating(found) : await byStoredRating(found);

  if (!query.stay) return ordered.map((entry) => entry.item);

  const held = await findHeldRoomIds(
    ordered.map((entry) => entry.id),
    query.stay,
  );

  return ordered
    .filter((entry) => !held.has(entry.id))
    .map((entry) => ({ ...entry.item, available: true }));
}

type FoundRoom = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  capacity: number;
  bedType: string;
  nightlyRateCents: number;
  ratingDisplay: string | null;
  primaryImage: string | null;
  amenities: string[];
};

type OrderedRoom = { id: number; item: RoomListItem };

function present(room: FoundRoom, rating: RatingSummary): OrderedRoom {
  return {
    id: room.id,
    item: {
      slug: room.slug,
      name: room.name,
      tagline: room.tagline,
      capacity: room.capacity,
      bedType: room.bedType,
      nightlyRateCents: room.nightlyRateCents,
      primaryImage: room.primaryImage,
      amenities: room.amenities,
      rating,
    },
  };
}

/** Rating as the catalogue holds it, with the review counts read in one pass. */
async function byStoredRating(found: FoundRoom[]): Promise<OrderedRoom[]> {
  if (found.length === 0) return [];

  const counts = await db
    .select({ roomId: reviews.roomId, count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(
      inArray(
        reviews.roomId,
        found.map((room) => room.id),
      ),
    )
    .groupBy(reviews.roomId);

  const countByRoom = new Map(counts.map((row) => [row.roomId, row.count]));

  return found.map((room) =>
    present(room, {
      average: room.ratingDisplay === null ? null : Number(room.ratingDisplay),
      count: countByRoom.get(room.id) ?? 0,
    }),
  );
}

/** Sorting by rating reads the average each room has right now rather than the stored one. */
async function byLiveRating(found: FoundRoom[]): Promise<OrderedRoom[]> {
  const rated: OrderedRoom[] = [];

  for (const room of found) {
    const summary = await getRatingSummary(room.id);
    rated.push(present(room, summary));
  }

  return rated.sort(
    (left, right) => (right.item.rating.average ?? 0) - (left.item.rating.average ?? 0),
  );
}

export async function getRoomDetail(slug: string): Promise<RoomDetail | null> {
  const [room] = await db
    .select({
      id: rooms.id,
      slug: rooms.slug,
      name: rooms.name,
      tagline: rooms.tagline,
      description: rooms.description,
      capacity: rooms.capacity,
      bedType: rooms.bedType,
      nightlyRateCents: rooms.nightlyRateCents,
      gallery: rooms.gallery,
      amenities: amenitySlugs,
    })
    .from(rooms)
    .where(eq(rooms.slug, slug))
    .limit(1);

  if (!room) return null;

  const rating = await getRatingSummary(room.id);

  const recent = await db
    .select({
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      stayedOn: reviews.stayedOn,
    })
    .from(reviews)
    .where(eq(reviews.roomId, room.id))
    .orderBy(desc(reviews.stayedOn))
    .limit(5);

  const recentReviews: ReviewSummary[] = recent.map((review) => ({
    rating: review.rating,
    title: review.title,
    body: review.body,
    stayedOn: review.stayedOn,
  }));

  return toRoomDetail(room, rating, recentReviews);
}

export async function findRoomBySlug(slug: string) {
  const [room] = await db
    .select({
      id: rooms.id,
      slug: rooms.slug,
      name: rooms.name,
      capacity: rooms.capacity,
      nightlyRateCents: rooms.nightlyRateCents,
    })
    .from(rooms)
    .where(eq(rooms.slug, slug))
    .limit(1);

  return room ?? null;
}
