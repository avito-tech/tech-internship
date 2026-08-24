import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

describe('read-only API', () => {
  it('returns the mocked current user and offices with Russian display values', async () => {
    const app = await buildTestApp();

    const me = await app.inject({ method: 'GET', url: '/api/v1/me' });
    const offices = await app.inject({ method: 'GET', url: '/api/v1/offices' });

    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ login: 'kkuznetsov', displayName: 'Константин Кузнецов' });
    expect(offices.statusCode).toBe(200);
    expect(offices.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Офис Москва', timezone: 'Europe/Moscow' }),
      ]),
    );
  });

  it('requires an office to display rooms', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/rooms' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR', message: expect.stringMatching(/[А-Яа-яЁё]/) },
    });
  });

  it('filters rooms by capacity and includes interval availability', async () => {
    const app = await buildTestApp();
    const query = new URLSearchParams({
      officeId: 'office-moscow',
      minCapacity: '8',
      from: '2026-08-19T12:00:00.000Z',
      to: '2026-08-19T13:00:00.000Z',
    });
    const response = await app.inject({ method: 'GET', url: `/api/v1/rooms?${query}` });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual([
      expect.objectContaining({ id: 'room-everest', available: false, capacity: 12 }),
      expect.objectContaining({ id: 'room-kazbek', available: true, capacity: 8 }),
    ]);
  });

  it('requires from and to room filters together', async () => {
    const app = await buildTestApp();
    const query = new URLSearchParams({
      officeId: 'office-moscow',
      from: '2026-08-19T12:00:00.000Z',
    });
    const response = await app.inject({ method: 'GET', url: `/api/v1/rooms?${query}` });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns room details and a sorted schedule', async () => {
    const app = await buildTestApp();
    const details = await app.inject({ method: 'GET', url: '/api/v1/rooms/room-everest' });
    const query = new URLSearchParams({
      from: '2026-08-19T06:00:00.000Z',
      to: '2026-08-19T17:00:00.000Z',
    });
    const schedule = await app.inject({
      method: 'GET',
      url: `/api/v1/rooms/room-everest/bookings?${query}`,
    });

    expect(details.statusCode).toBe(200);
    expect(details.json()).toMatchObject({
      id: 'room-everest',
      name: 'Эверест',
      office: { name: 'Офис Москва' },
      features: expect.arrayContaining([expect.objectContaining({ name: 'Маркерная доска' })]),
    });
    expect(schedule.statusCode).toBe(200);
    expect(schedule.json().items).toEqual([
      expect.objectContaining({
        id: 'booking-future-current-user',
        title: 'Ежедневная встреча команды',
        owner: expect.objectContaining({ displayName: 'Константин Кузнецов' }),
      }),
    ]);
  });

  it('returns a Russian not-found error for an unknown room', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/rooms/missing-room' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: { code: 'ROOM_NOT_FOUND', message: expect.stringMatching(/[А-Яа-яЁё]/) },
    });
  });

  it('filters and sorts the current users bookings', async () => {
    const app = await buildTestApp();
    const upcoming = await app.inject({ method: 'GET', url: '/api/v1/bookings?scope=upcoming' });
    const past = await app.inject({ method: 'GET', url: '/api/v1/bookings?scope=past' });
    const office = await app.inject({
      method: 'GET',
      url: '/api/v1/bookings?scope=all&officeId=office-saint-petersburg',
    });

    expect(upcoming.statusCode).toBe(200);
    expect(upcoming.json<{ items: { id: string }[] }>().items.map(({ id }) => id)).toEqual([
      'booking-future-current-user',
      'booking-future-current-user-2',
    ]);
    expect(past.statusCode).toBe(200);
    expect(past.json<{ items: { id: string }[] }>().items.map(({ id }) => id)).toEqual([
      'booking-past-current-user',
    ]);
    expect(office.statusCode).toBe(200);
    expect(office.json().items).toEqual([]);
  });

  it('restores seed data through the test reset endpoint', async () => {
    const app = await buildTestApp();
    app.appStore.deleteBooking('booking-future-current-user');

    const reset = await app.inject({ method: 'POST', url: '/api/v1/test/reset' });

    expect(reset.statusCode).toBe(204);
    expect(app.appStore.findBooking('booking-future-current-user')).toBeDefined();
  });
});
