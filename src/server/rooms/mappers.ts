import type { Gallery } from '@/db/types';

export type RoomImage = {
  url: string;
  alt: string;
  isPrimary: boolean;
};

export type RoomDetailRow = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capacity: number;
  bedType: string;
  nightlyRateCents: number;
  gallery: unknown;
  amenities: string[];
};

export type RatingSummary = {
  average: number | null;
  count: number;
};

export type ReviewSummary = {
  rating: number;
  title: string;
  body: string;
  stayedOn: string;
};

export type RoomDetail = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capacity: number;
  bedType: string;
  nightlyRateCents: number;
  images: RoomImage[];
  amenities: string[];
  rating: RatingSummary;
  recentReviews: ReviewSummary[];
};

function toImage(image: Gallery['images'][number]): RoomImage {
  return {
    url: image.url,
    alt: image.alt,
    isPrimary: image.isPrimary ?? false,
  };
}

export function toRoomDetail(
  row: RoomDetailRow,
  rating: RatingSummary,
  recentReviews: ReviewSummary[],
): RoomDetail {
  const gallery = row.gallery as Gallery;

  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    capacity: row.capacity,
    bedType: row.bedType,
    nightlyRateCents: row.nightlyRateCents,
    images: gallery.images.map(toImage),
    amenities: row.amenities,
    rating,
    recentReviews,
  };
}
