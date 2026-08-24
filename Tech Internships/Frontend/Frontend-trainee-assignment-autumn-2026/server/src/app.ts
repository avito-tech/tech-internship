import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Clock } from './clock.js';
import { SystemClock } from './clock.js';
import { loadConfig, type AppConfig } from './config.js';
import { AppError } from './domain/errors.js';
import { WebSocketHub } from './realtime/websocket-hub.js';
import { bookingRoutes } from './routes/bookings.js';
import { officeRoutes } from './routes/offices.js';
import { roomRoutes } from './routes/rooms.js';
import { systemRoutes } from './routes/system.js';
import { websocketRoutes } from './routes/websocket.js';
import { BookingService } from './services/booking-service.js';
import { MemoryStore } from './store/memory-store.js';

export interface AppOptions {
  clock?: Clock;
  config?: AppConfig;
  logger?: boolean;
}

interface ValidationIssue {
  instancePath?: string;
  params: { missingProperty?: string };
  keyword: string;
}

function isValidationError(error: unknown): error is { validation: ValidationIssue[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'validation' in error &&
    Array.isArray(error.validation)
  );
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const clock = options.clock ?? new SystemClock();
  const app = Fastify({
    logger: options.logger ?? false,
  });
  const store = new MemoryStore(clock);
  const bookingService = new BookingService(store, clock);
  const webSocketHub = new WebSocketHub(clock);

  app.decorate('appClock', clock);
  app.decorate('appConfig', config);
  app.decorate('appStore', store);
  app.decorate('bookingService', bookingService);
  app.decorate('webSocketHub', webSocketHub);
  app.addHook('onClose', () => webSocketHub.close());

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }

    if (isValidationError(error)) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Проверьте параметры запроса',
          details: {
            issues: error.validation.map((issue) => ({
              path: issue.instancePath || issue.params.missingProperty || '',
              code: issue.keyword,
              message: 'Некорректное значение',
            })),
          },
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла внутренняя ошибка сервера',
      },
    });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Запрошенный ресурс не найден',
      },
    }),
  );

  await app.register(cors, {
    origin: config.corsOrigins,
  });
  if (config.environment !== 'production') {
    const [{ default: swagger }, { default: swaggerUi }] = await Promise.all([
      import('@fastify/swagger'),
      import('@fastify/swagger-ui'),
    ]);
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Сервис бронирования переговорных',
          description: 'REST и WebSocket API для тестового задания Frontend-стажёра.',
          version: '1.0.0',
        },
        tags: [
          { name: 'Пользователь' },
          { name: 'Офисы' },
          { name: 'Переговорные' },
          { name: 'Бронирования' },
          { name: 'Real-time' },
          { name: 'Тестирование' },
        ],
      },
    });
    await app.register(swaggerUi, {
      routePrefix: '/documentation',
    });
  }
  await app.register(websocket);
  await app.register(systemRoutes);
  await app.register(officeRoutes);
  await app.register(roomRoutes);
  await app.register(bookingRoutes);
  await app.register(websocketRoutes);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    appClock: Clock;
    appConfig: AppConfig;
    appStore: MemoryStore;
    bookingService: BookingService;
    webSocketHub: WebSocketHub;
  }
}
