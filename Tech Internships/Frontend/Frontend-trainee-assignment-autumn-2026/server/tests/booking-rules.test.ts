import { describe, expect, it } from 'vitest';
import type { Office, Room } from '../src/domain/models.js';
import { validateBookingInterval } from '../src/services/booking-rules.js';

const now = new Date('2026-08-18T09:00:00.000Z');
const office: Office = {
  id: 'office-moscow',
  name: 'Офис Москва',
  address: 'Москва, ул. Лесная, 7',
  timezone: 'Europe/Moscow',
};
const room: Room = {
  id: 'room-everest',
  officeId: office.id,
  name: 'Эверест',
  floor: 4,
  capacity: 12,
  features: [],
};

function assertErrorCode(action: () => void, code: string): void {
  try {
    action();
    expect.fail(`Ожидалась ошибка ${code}`);
  } catch (error) {
    expect(error).toMatchObject({ code });
    expect(error).toMatchObject({ message: expect.stringMatching(/[А-Яа-яЁё]/) });
  }
}

function validate(startsAt: string, endsAt: string): void {
  validateBookingInterval({
    room,
    office,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    now,
  });
}

describe('validateBookingInterval', () => {
  it('rejects a booking that does not start in the future', () => {
    assertErrorCode(
      () => validate('2026-08-18T09:00:00.000Z', '2026-08-18T09:15:00.000Z'),
      'START_NOT_IN_FUTURE',
    );
  });

  it('rejects a booking starting more than 30 days ahead', () => {
    assertErrorCode(
      () => validate('2026-09-17T09:15:00.000Z', '2026-09-17T09:30:00.000Z'),
      'BOOKING_TOO_FAR_AHEAD',
    );
  });

  it('rejects a duration shorter than 15 minutes', () => {
    assertErrorCode(
      () => validate('2026-08-19T06:00:00.000Z', '2026-08-19T06:14:00.000Z'),
      'DURATION_TOO_SHORT',
    );
  });

  it('rejects times that are not aligned to 15-minute boundaries', () => {
    assertErrorCode(
      () => validate('2026-08-19T06:05:00.000Z', '2026-08-19T06:20:00.000Z'),
      'TIME_NOT_ALIGNED',
    );
  });

  it('rejects an interval before local working hours', () => {
    assertErrorCode(
      () => validate('2026-08-19T05:45:00.000Z', '2026-08-19T06:00:00.000Z'),
      'OUTSIDE_WORKING_HOURS',
    );
  });

  it('rejects an interval ending after local working hours', () => {
    assertErrorCode(
      () => validate('2026-08-19T16:45:00.000Z', '2026-08-19T17:15:00.000Z'),
      'OUTSIDE_WORKING_HOURS',
    );
  });

  it('accepts the first and last 15-minute slots of the local workday', () => {
    expect(() => validate('2026-08-19T06:00:00.000Z', '2026-08-19T06:15:00.000Z')).not.toThrow();
    expect(() => validate('2026-08-19T16:45:00.000Z', '2026-08-19T17:00:00.000Z')).not.toThrow();
  });
});
