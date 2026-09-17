import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { Gallery } from './types';

export const reservationStatus = pgEnum('reservation_status', ['confirmed', 'cancelled']);

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  capacity: integer('capacity').notNull(),
  bedType: varchar('bed_type', { length: 50 }).notNull(),
  nightlyRateCents: integer('nightly_rate_cents').notNull(),
  ratingDisplay: numeric('rating_display', { precision: 2, scale: 1 }),
  gallery: jsonb('gallery').$type<Gallery>().notNull(),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const amenities = pgTable('amenities', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: text('name').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
});

export const roomAmenities = pgTable(
  'room_amenities',
  {
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id),
    amenityId: integer('amenity_id')
      .notNull()
      .references(() => amenities.id),
  },
  (table) => [primaryKey({ columns: [table.roomId, table.amenityId] })],
);

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id')
    .notNull()
    .references(() => rooms.id),
  guestName: text('guest_name').notNull(),
  rating: smallint('rating').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  stayedOn: date('stayed_on').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookingIntents = pgTable('booking_intents', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  roomId: integer('room_id')
    .notNull()
    .references(() => rooms.id),
  checkIn: date('check_in').notNull(),
  checkOut: date('check_out').notNull(),
  guestCount: integer('guest_count').notNull(),
  nightlyRateCents: integer('nightly_rate_cents').notNull(),
  nights: integer('nights').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  taxCents: integer('tax_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const reservations = pgTable(
  'reservations',
  {
    id: serial('id').primaryKey(),
    reference: varchar('reference', { length: 10 }).notNull().unique(),
    bookingIntentId: uuid('booking_intent_id')
      .notNull()
      .references(() => bookingIntents.id),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id),
    guestName: text('guest_name').notNull(),
    guestEmail: text('guest_email').notNull(),
    guestPhone: text('guest_phone'),
    specialRequests: text('special_requests'),
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    guestCount: integer('guest_count').notNull(),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxCents: integer('tax_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    status: reservationStatus('status').notNull().default('confirmed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('reservations_room_id_check_in_idx').on(table.roomId, table.checkIn)],
);

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Amenity = typeof amenities.$inferSelect;
export type NewAmenity = typeof amenities.$inferInsert;
export type RoomAmenity = typeof roomAmenities.$inferSelect;
export type NewRoomAmenity = typeof roomAmenities.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type BookingIntent = typeof bookingIntents.$inferSelect;
export type NewBookingIntent = typeof bookingIntents.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
