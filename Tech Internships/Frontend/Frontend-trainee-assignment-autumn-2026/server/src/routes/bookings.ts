import type { FastifyPluginCallback } from 'fastify';
import {
  bookingSchema,
  createBookingBodySchema,
  errorResponseSchema,
  itemsSchema,
} from './openapi-schemas.js';
import {
  bookingParamsSchema,
  bookingsQuerySchema,
  createBookingSchema,
  parseRequest,
} from './schemas.js';

export const bookingRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get(
    '/api/v1/bookings',
    {
      schema: {
        tags: ['Бронирования'],
        summary: 'Бронирования текущего пользователя',
        querystring: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['upcoming', 'past', 'all'], default: 'upcoming' },
            officeId: { type: 'string' },
          },
        },
        response: { 200: itemsSchema(bookingSchema), 400: errorResponseSchema },
      },
    },
    (request) => {
      const query = parseRequest(bookingsQuerySchema, request.query);
      return {
        items: app.bookingService.listCurrentUserBookings({
          scope: query.scope,
          ...(query.officeId ? { officeId: query.officeId } : {}),
        }),
      };
    },
  );

  app.post(
    '/api/v1/bookings',
    {
      schema: {
        tags: ['Бронирования'],
        summary: 'Создать бронирование',
        body: createBookingBodySchema,
        response: {
          201: bookingSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    (request, reply) => {
      const body = parseRequest(createBookingSchema, request.body);
      const booking = app.bookingService.createBooking({
        roomId: body.roomId,
        title: body.title,
        ...(body.comment === undefined ? {} : { comment: body.comment }),
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      });
      app.webSocketHub.broadcast('booking.created', { booking });
      app.webSocketHub.broadcast('room.availability_changed', {
        roomId: booking.roomId,
        officeId: booking.office.id,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        available: false,
      });
      return reply.status(201).send(booking);
    },
  );

  app.delete(
    '/api/v1/bookings/:bookingId',
    {
      schema: {
        tags: ['Бронирования'],
        summary: 'Отменить бронирование',
        params: {
          type: 'object',
          required: ['bookingId'],
          properties: { bookingId: { type: 'string' } },
        },
        response: {
          204: { type: 'null' },
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    (request, reply) => {
      const { bookingId } = parseRequest(bookingParamsSchema, request.params);
      const booking = app.bookingService.cancelBooking(bookingId);
      app.webSocketHub.broadcast('booking.cancelled', { booking });
      app.webSocketHub.broadcast('room.availability_changed', {
        roomId: booking.roomId,
        officeId: booking.office.id,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        available: true,
      });
      return reply.status(204).send();
    },
  );
  done();
};
