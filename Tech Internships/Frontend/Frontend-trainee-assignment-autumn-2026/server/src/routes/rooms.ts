import type { FastifyPluginCallback } from 'fastify';
import { bookingSchema, errorResponseSchema, itemsSchema, roomSchema } from './openapi-schemas.js';
import {
  parseRequest,
  roomParamsSchema,
  roomsQuerySchema,
  scheduleQuerySchema,
} from './schemas.js';

export const roomRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get(
    '/api/v1/rooms',
    {
      schema: {
        tags: ['Переговорные'],
        summary: 'Список переговорных',
        querystring: {
          type: 'object',
          required: ['officeId'],
          properties: {
            officeId: { type: 'string' },
            minCapacity: { type: 'integer', minimum: 1 },
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: itemsSchema(roomSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    (request) => {
      const query = parseRequest(roomsQuerySchema, request.query);
      const items = app.bookingService.listRooms({
        officeId: query.officeId,
        ...(query.minCapacity === undefined ? {} : { minCapacity: query.minCapacity }),
        ...(query.from && query.to ? { from: new Date(query.from), to: new Date(query.to) } : {}),
      });
      return { items };
    },
  );

  app.get(
    '/api/v1/rooms/:roomId',
    {
      schema: {
        tags: ['Переговорные'],
        summary: 'Информация о переговорной',
        params: {
          type: 'object',
          required: ['roomId'],
          properties: { roomId: { type: 'string' } },
        },
        response: { 200: roomSchema, 404: errorResponseSchema },
      },
    },
    (request) => {
      const { roomId } = parseRequest(roomParamsSchema, request.params);
      return app.bookingService.getRoom(roomId);
    },
  );

  app.get(
    '/api/v1/rooms/:roomId/bookings',
    {
      schema: {
        tags: ['Переговорные'],
        summary: 'Расписание переговорной',
        params: {
          type: 'object',
          required: ['roomId'],
          properties: { roomId: { type: 'string' } },
        },
        querystring: {
          type: 'object',
          required: ['from', 'to'],
          properties: {
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: itemsSchema(bookingSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    (request) => {
      const { roomId } = parseRequest(roomParamsSchema, request.params);
      const query = parseRequest(scheduleQuerySchema, request.query);
      return {
        items: app.bookingService.getRoomSchedule({
          roomId,
          from: new Date(query.from),
          to: new Date(query.to),
        }),
      };
    },
  );
  done();
};
