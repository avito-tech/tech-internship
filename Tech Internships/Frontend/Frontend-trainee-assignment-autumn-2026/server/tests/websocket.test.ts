import type { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

interface ReceivedEvent {
  type: string;
  occurredAt: string;
  data: Record<string, unknown>;
}

async function connectClient(app: FastifyInstance): Promise<WebSocket> {
  await app.ready();
  return app.injectWS('/api/v1/ws');
}

function collectEvents(client: WebSocket, count: number): Promise<ReceivedEvent[]> {
  return new Promise((resolve, reject) => {
    const events: ReceivedEvent[] = [];
    const timeout = setTimeout(() => reject(new Error('Не получены WebSocket-события')), 1_000);
    const onMessage = (message: WebSocket.RawData): void => {
      const text = Array.isArray(message)
        ? Buffer.concat(message).toString('utf8')
        : message instanceof ArrayBuffer
          ? Buffer.from(new Uint8Array(message)).toString('utf8')
          : message.toString('utf8');
      events.push(JSON.parse(text) as ReceivedEvent);
      if (events.length === count) {
        clearTimeout(timeout);
        client.off('message', onMessage);
        resolve(events);
      }
    };
    client.on('message', onMessage);
  });
}

function expectNoEvent(client: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const onMessage = (): void => reject(new Error('Получено неожиданное WebSocket-событие'));
    client.once('message', onMessage);
    setTimeout(() => {
      client.off('message', onMessage);
      resolve();
    }, 100);
  });
}

const payload = {
  roomId: 'room-everest',
  title: 'Обсуждение проекта',
  startsAt: '2026-08-19T10:00:00.000Z',
  endsAt: '2026-08-19T11:00:00.000Z',
};

describe('WebSocket API', () => {
  it('broadcasts creation and availability events to every client', async () => {
    const app = await buildTestApp();
    const first = await connectClient(app);
    const second = await connectClient(app);
    const firstEvents = collectEvents(first, 2);
    const secondEvents = collectEvents(second, 2);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const expected = [
      expect.objectContaining({
        type: 'booking.created',
        occurredAt: '2026-08-18T09:00:00.000Z',
        data: { booking: expect.objectContaining({ title: 'Обсуждение проекта' }) },
      }),
      expect.objectContaining({
        type: 'room.availability_changed',
        data: expect.objectContaining({ roomId: 'room-everest', available: false }),
      }),
    ];
    expect(await firstEvents).toEqual(expected);
    expect(await secondEvents).toEqual(expected);
    first.close();
    second.close();
  });

  it('broadcasts the cancelled booking snapshot before released availability', async () => {
    const app = await buildTestApp();
    const client = await connectClient(app);
    const events = collectEvents(client, 2);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/bookings/booking-future-current-user',
    });

    expect(response.statusCode).toBe(204);
    expect(await events).toEqual([
      expect.objectContaining({
        type: 'booking.cancelled',
        data: { booking: expect.objectContaining({ id: 'booking-future-current-user' }) },
      }),
      expect.objectContaining({
        type: 'room.availability_changed',
        data: expect.objectContaining({ roomId: 'room-everest', available: true }),
      }),
    ]);
    client.close();
  });

  it('does not broadcast an event after a rejected conflict', async () => {
    const app = await buildTestApp();
    const client = await connectClient(app);
    const noEvent = expectNoEvent(client);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload: {
        ...payload,
        startsAt: '2026-08-19T12:00:00.000Z',
        endsAt: '2026-08-19T13:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(409);
    await expect(noEvent).resolves.toBeUndefined();
    client.close();
  });

  it('broadcasts reset and closes connected clients with the application', async () => {
    const app = await buildTestApp();
    const client = await connectClient(app);
    const event = collectEvents(client, 1);

    expect((await app.inject({ method: 'POST', url: '/api/v1/test/reset' })).statusCode).toBe(204);
    expect(await event).toEqual([expect.objectContaining({ type: 'data.reset', data: {} })]);

    const closed = new Promise<void>((resolve) => client.once('close', () => resolve()));
    await app.close();
    await expect(closed).resolves.toBeUndefined();
  });
});
