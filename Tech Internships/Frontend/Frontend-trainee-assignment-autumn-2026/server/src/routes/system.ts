import type { FastifyPluginCallback } from 'fastify';
import { userSchema } from './openapi-schemas.js';

export const systemRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get(
    '/health',
    {
      schema: {
        summary: 'Проверка состояния сервиса',
        response: {
          200: {
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string', enum: ['ok'] } },
          },
        },
      },
    },
    () => ({ status: 'ok' as const }),
  );

  app.get(
    '/api/v1/me',
    {
      schema: {
        tags: ['Пользователь'],
        summary: 'Текущий пользователь',
        response: { 200: userSchema },
      },
    },
    () => app.appStore.getCurrentUser(),
  );

  if (app.appConfig.enableTestReset) {
    app.post(
      '/api/v1/test/reset',
      { schema: { tags: ['Тестирование'], summary: 'Сброс тестовых данных' } },
      (_request, reply) => {
        app.appStore.reset();
        app.webSocketHub.broadcast('data.reset', {});
        return reply.status(204).send();
      },
    );
  }
  done();
};
