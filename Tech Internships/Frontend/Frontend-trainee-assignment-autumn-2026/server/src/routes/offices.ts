import type { FastifyPluginCallback } from 'fastify';
import { itemsSchema, officeSchema } from './openapi-schemas.js';

export const officeRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get(
    '/api/v1/offices',
    {
      schema: {
        tags: ['Офисы'],
        summary: 'Список офисов',
        response: { 200: itemsSchema(officeSchema) },
      },
    },
    () => ({ items: app.appStore.listOffices() }),
  );
  done();
};
