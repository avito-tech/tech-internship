import type { FastifyPluginCallback } from 'fastify';

export const websocketRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.route({
    method: 'GET',
    url: '/api/v1/ws',
    schema: {
      tags: ['Real-time'],
      summary: 'WebSocket с обновлениями бронирований',
      description:
        'Рассылает booking.created, booking.cancelled, room.availability_changed и data.reset.',
    },
    handler: (_request, reply) =>
      reply.status(426).send({
        error: {
          code: 'WEBSOCKET_UPGRADE_REQUIRED',
          message: 'Для подключения необходимо использовать WebSocket',
        },
      }),
    wsHandler: (socket) => {
      app.webSocketHub.add(socket);
    },
  });
  done();
};
