import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

const validPayload = {
  roomId: 'room-everest',
  title: 'Обсуждение проекта',
  comment: 'Сверяем план работ',
  startsAt: '2026-08-19T10:00:00.000Z',
  endsAt: '2026-08-19T11:00:00.000Z',
};

function expectRussianError(response: { statusCode: number; json(): unknown }, code: string): void {
  expect(response.json()).toMatchObject({
    error: {
      code,
      message: expect.stringMatching(/[А-Яа-яЁё]/),
    },
  });
}

describe('booking mutation API', () => {
  it('creates a booking for the mocked current user', async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      roomId: validPayload.roomId,
      title: validPayload.title,
      comment: validPayload.comment,
      startsAt: validPayload.startsAt,
      endsAt: validPayload.endsAt,
      owner: { id: 'user-konstantin', displayName: 'Константин Кузнецов' },
    });
  });

  it.each([
    ['пустая тема', { ...validPayload, title: '   ' }, 'VALIDATION_ERROR'],
    ['некорректная дата', { ...validPayload, startsAt: 'завтра' }, 'VALIDATION_ERROR'],
    [
      'время в прошлом',
      {
        ...validPayload,
        startsAt: '2026-08-18T08:00:00.000Z',
        endsAt: '2026-08-18T08:15:00.000Z',
      },
      'START_NOT_IN_FUTURE',
    ],
    [
      'время вне рабочих часов',
      {
        ...validPayload,
        startsAt: '2026-08-19T05:00:00.000Z',
        endsAt: '2026-08-19T05:15:00.000Z',
      },
      'OUTSIDE_WORKING_HOURS',
    ],
  ])('rejects invalid input: %s', async (_name, payload, code) => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload,
    });

    expect(response.statusCode).toBe(400);
    expectRussianError(response, code);
  });

  it('returns 404 for an unknown room', async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload: { ...validPayload, roomId: 'missing-room' },
    });

    expect(response.statusCode).toBe(404);
    expectRussianError(response, 'ROOM_NOT_FOUND');
  });

  it('returns conflict details for an occupied interval', async () => {
    const app = await buildTestApp();
    const payload = {
      ...validPayload,
      startsAt: '2026-08-19T12:00:00.000Z',
      endsAt: '2026-08-19T13:00:00.000Z',
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload,
    });

    expect(response.statusCode).toBe(409);
    expectRussianError(response, 'BOOKING_CONFLICT');
    expect(response.json().error.details).toEqual({
      roomId: payload.roomId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    });
  });

  it('cancels the current users future booking', async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/bookings/booking-future-current-user',
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect(app.appStore.findBooking('booking-future-current-user')).toBeUndefined();
  });

  it.each([
    ['booking-future-other-user', 403, 'FORBIDDEN'],
    ['booking-past-current-user', 400, 'BOOKING_NOT_CANCELLABLE'],
    ['missing-booking', 404, 'BOOKING_NOT_FOUND'],
  ])('rejects cancellation of %s', async (bookingId, status, code) => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookings/${bookingId}`,
    });

    expect(response.statusCode).toBe(status);
    expectRussianError(response, code);
  });

  it('returns 404 when the same booking is cancelled twice', async () => {
    const app = await buildTestApp();
    const url = '/api/v1/bookings/booking-future-current-user';

    expect((await app.inject({ method: 'DELETE', url })).statusCode).toBe(204);
    const repeated = await app.inject({ method: 'DELETE', url });

    expect(repeated.statusCode).toBe(404);
    expectRussianError(repeated, 'BOOKING_NOT_FOUND');
  });
});
