import { sql } from 'drizzle-orm';
import { db } from './index';
import { amenities, roomAmenities, rooms } from './schema';
import { amenityDefs } from './data/amenities';
import { roomDefs } from './data/rooms';
import { seedReservations } from './seed-reservations';
import { seedReviews } from './seed-reviews';
import type { Gallery } from './types';

async function seedCatalogue() {
  await db.insert(amenities).values(amenityDefs);

  const amenityRows = await db.select({ id: amenities.id, slug: amenities.slug }).from(amenities);
  const amenityIdBySlug = new Map(amenityRows.map((row) => [row.slug, row.id]));

  for (const room of roomDefs) {
    const [inserted] = await db
      .insert(rooms)
      .values({
        slug: room.slug,
        name: room.name,
        tagline: room.tagline,
        description: room.description,
        capacity: room.capacity,
        bedType: room.bedType,
        nightlyRateCents: room.nightlyRateCents,
        ratingDisplay: room.ratingDisplay,
        gallery: room.gallery as unknown as Gallery,
        featured: room.featured,
        sortOrder: room.sortOrder,
      })
      .returning({ id: rooms.id });

    if (!inserted) throw new Error(`Failed to insert room ${room.slug}`);

    const links = room.amenities
      .map((amenitySlug) => amenityIdBySlug.get(amenitySlug))
      .filter((id): id is number => id !== undefined)
      .map((amenityId) => ({ roomId: inserted.id, amenityId }));
    if (links.length > 0) await db.insert(roomAmenities).values(links);
  }
}

async function main() {
  const start = Date.now();

  await db.execute(
    sql`TRUNCATE TABLE reservations, booking_intents, reviews, room_amenities, rooms, amenities RESTART IDENTITY CASCADE`,
  );

  await seedCatalogue();
  console.log(
    `Seeded ${String(roomDefs.length)} rooms and ${String(amenityDefs.length)} amenities.`,
  );

  const { inserted: reservationCount } = await seedReservations();
  console.log(`Seeded ${String(reservationCount)} reservations.`);

  const { inserted: reviewCount } = await seedReviews();
  console.log(`Seeded ${String(reviewCount)} reviews.`);

  console.log(`Seed completed in ${((Date.now() - start) / 1000).toFixed(1)}s.`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
