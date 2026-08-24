import { describe, expect, it } from 'vitest';
import type { Clock } from '../src/clock.js';
import { MemoryStore } from '../src/store/memory-store.js';

const TEST_NOW = new Date('2026-08-18T09:00:00.000Z');

class FixedClock implements Clock {
  now(): Date {
    return new Date(TEST_NOW);
  }
}

function createTestStore(): MemoryStore {
  return new MemoryStore(new FixedClock());
}

describe('MemoryStore', () => {
  it('restores the original seed after reset', () => {
    const store = createTestStore();
    const original = store.listBookings();

    store.deleteBooking(original[0]!.id);
    expect(store.listBookings()).not.toEqual(original);

    store.reset();

    expect(store.listBookings()).toEqual(original);
  });

  it('seeds past and future bookings relative to the clock', () => {
    const store = createTestStore();
    const now = TEST_NOW.getTime();

    expect(store.listBookings().some((booking) => booking.endsAt.getTime() < now)).toBe(true);
    expect(store.listBookings().some((booking) => booking.startsAt.getTime() > now)).toBe(true);
  });

  it('returns defensive copies of mutable state', () => {
    const store = createTestStore();
    const bookings = store.listBookings();
    bookings[0]!.title = 'Изменённый заголовок';

    expect(store.listBookings()[0]!.title).not.toBe('Изменённый заголовок');
  });
});
