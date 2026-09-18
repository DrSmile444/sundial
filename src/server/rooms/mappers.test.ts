import { describe, expect, it } from 'vitest';
import { toRoomDetail, type RoomDetailRow } from './mappers';

const row: RoomDetailRow = {
  id: 1,
  slug: 'atomic-suite',
  name: 'Atomic Suite',
  tagline: 'Where the desert sky meets a mid-century glow',
  description: 'A sunken lounge and a wall of glass.',
  capacity: 3,
  bedType: 'King',
  nightlyRateCents: 58000,
  gallery: {
    images: [
      { url: 'https://example.test/atomic-1.jpg', alt: 'Atomic Suite, photo 1', isPrimary: true },
      { url: 'https://example.test/atomic-2.jpg', alt: 'Atomic Suite, photo 2' },
    ],
  },
  amenities: ['pool-access', 'record-player'],
};

describe('toRoomDetail', () => {
  it('keeps the gallery in the order the catalogue stored it', () => {
    const detail = toRoomDetail(row, { average: 4.9, count: 8433 }, []);

    expect(detail.images).toEqual([
      { url: 'https://example.test/atomic-1.jpg', alt: 'Atomic Suite, photo 1', isPrimary: true },
      { url: 'https://example.test/atomic-2.jpg', alt: 'Atomic Suite, photo 2', isPrimary: false },
    ]);
  });

  it('carries the room, its amenities and its rating through', () => {
    const detail = toRoomDetail(row, { average: 4.9, count: 8433 }, []);

    expect(detail.slug).toBe('atomic-suite');
    expect(detail.nightlyRateCents).toBe(58000);
    expect(detail.amenities).toEqual(['pool-access', 'record-player']);
    expect(detail.rating).toEqual({ average: 4.9, count: 8433 });
  });

  it('treats a gallery with no images array as having zero images', () => {
    const gardenCasitaRow: RoomDetailRow = {
      ...row,
      slug: 'garden-casita',
      name: 'Garden Casita',
      gallery: {
        primary: 'https://example.test/garden-casita-1.jpg',
        caption: 'Garden casita with private patio',
      },
    };

    const detail = toRoomDetail(gardenCasitaRow, { average: 4.4, count: 12 }, []);

    expect(detail.images).toEqual([]);
  });
});
