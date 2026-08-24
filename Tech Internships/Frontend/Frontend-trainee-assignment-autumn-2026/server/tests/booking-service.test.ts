import { describe, expect, it } from 'vitest';
import type { Clock } from '../src/clock.js';
import { BookingService } from '../src/services/booking-service.js';
import { MemoryStore } from '../src/store/memory-store.js';

const TEST_NOW = new Date('2026-08-18T09:00:00.000Z');

class FixedClock implements Clock {
  now(): Date {
    return new Date(TEST_NOW);
  }
}

function createService(): BookingService {
  const clock = new FixedClock();
  return new BookingService(new MemoryStore(clock), clock);
}

function assertErrorCode(action: () => unknown, code: string): void {
  try {
    action();
    expect.fail(`Ожидалась ошибка ${code}`);
  } catch (error) {
    expect(error).toMatchObject({ code });
    expect(error).toMatchObject({ message: expect.stringMatching(/[А-Яа-яЁё]/) });
  }
}

const baseInput = {
  roomId: 'room-everest',
  title: 'Обсуждение проекта',
  comment: null,
  startsAt: new Date('2026-08-19T07:00:00.000Z'),
  endsAt: new Date('2026-08-19T08:00:00.000Z'),
};

describe('BookingService', () => {
  it('rejects overlapping intervals but permits adjacent intervals', () => {
    const service = createService();
    service.createBooking(baseInput);

    assertErrorCode(
      () =>
        service.createBooking({
          ...baseInput,
          startsAt: new Date('2026-08-19T07:30:00.000Z'),
          endsAt: new Date('2026-08-19T08:30:00.000Z'),
        }),
      'BOOKING_CONFLICT',
    );

    expect(() =>
      service.createBooking({
        ...baseInput,
        startsAt: new Date('2026-08-19T08:00:00.000Z'),
        endsAt: new Date('2026-08-19T08:15:00.000Z'),
      }),
    ).not.toThrow();
  });

  it('only cancels the current users future booking', () => {
    const service = createService();

    assertErrorCode(() => service.cancelBooking('booking-future-other-user'), 'FORBIDDEN');
    assertErrorCode(
      () => service.cancelBooking('booking-past-current-user'),
      'BOOKING_NOT_CANCELLABLE',
    );

    expect(service.cancelBooking('booking-future-current-user').id).toBe(
      'booking-future-current-user',
    );
  });

  it('filters rooms by office, capacity, and availability', () => {
    const service = createService();
    const rooms = service.listRooms({
      officeId: 'office-moscow',
      minCapacity: 8,
      from: new Date('2026-08-19T12:00:00.000Z'),
      to: new Date('2026-08-19T13:00:00.000Z'),
    });

    expect(rooms.map(({ id, available }) => ({ id, available }))).toEqual([
      { id: 'room-everest', available: false },
      { id: 'room-kazbek', available: true },
    ]);
  });

  it('sorts the current users upcoming bookings by start time', () => {
    const service = createService();

    expect(service.listCurrentUserBookings({ scope: 'upcoming' }).map(({ id }) => id)).toEqual([
      'booking-future-current-user',
      'booking-future-current-user-2',
    ]);
  });
});
