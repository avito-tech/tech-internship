# Backend бронирования переговорных

Mock-backend для бронирования переговорных. Сервис предоставляет REST API, WebSocket-обновления и сбрасываемые тестовые данные. Авторизация замокана.

## Быстрый запуск

Требуется Node.js 20 или новее.

```bash
npm ci
cp .env.example .env
npm run dev
```

По умолчанию сервис доступен на `http://localhost:3000`, WebSocket — на `ws://localhost:3000/api/v1/ws`, интерактивная документация — на `http://localhost:3000/documentation`.

Переменные из `.env` не загружаются автоматически. Их можно передать средствами оболочки или менеджера процессов:

```bash
set -a
source .env
set +a
npm run dev
```

## Команды

| Команда              | Назначение                                           |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Запустить сервер с перезапуском при изменении кода   |
| `npm run build`      | Собрать JavaScript в `dist/`                         |
| `npm start`          | Запустить собранную production-версию                |
| `npm test`           | Запустить все тесты один раз                         |
| `npm run test:watch` | Запустить тесты в watch-режиме                       |
| `npm run check`      | Проверить форматирование, ESLint, TypeScript и тесты |

## Конфигурация

| Переменная          | Значение по умолчанию   | Описание                               |
| ------------------- | ----------------------- | -------------------------------------- |
| `HOST`              | `0.0.0.0`               | Адрес для прослушивания                |
| `PORT`              | `3000`                  | HTTP/WebSocket-порт                    |
| `LOG_LEVEL`         | `info`                  | Уровень логирования Fastify            |
| `CORS_ORIGINS`      | `http://localhost:5173` | Разрешённые origin через запятую       |
| `ENABLE_TEST_RESET` | `true`                  | Доступность ручки сброса данных        |
| `NODE_ENV`          | `development`           | `development`, `test` или `production` |

Swagger UI отключён при `NODE_ENV=production`. Для публичного окружения также рекомендуется задать `ENABLE_TEST_RESET=false`.

## REST API

Все прикладные ручки используют префикс `/api/v1`.

| Метод    | Путь                             | Назначение                         |
| -------- | -------------------------------- | ---------------------------------- |
| `GET`    | `/health`                        | Проверка состояния сервиса         |
| `GET`    | `/api/v1/me`                     | Замоканный текущий пользователь    |
| `GET`    | `/api/v1/offices`                | Список офисов и timezone           |
| `GET`    | `/api/v1/rooms`                  | Комнаты выбранного офиса           |
| `GET`    | `/api/v1/rooms/:roomId`          | Информация и оснащение комнаты     |
| `GET`    | `/api/v1/rooms/:roomId/bookings` | Расписание за интервал             |
| `GET`    | `/api/v1/bookings`               | Бронирования текущего пользователя |
| `POST`   | `/api/v1/bookings`               | Создать бронирование               |
| `DELETE` | `/api/v1/bookings/:bookingId`    | Отменить бронирование              |
| `POST`   | `/api/v1/test/reset`             | Восстановить тестовые данные       |
| `GET`    | `/api/v1/ws`                     | Подключиться по WebSocket          |

### Фильтры комнат

`GET /api/v1/rooms` требует `officeId`. Дополнительно принимает:

- `minCapacity` — минимальная вместимость;
- `from` и `to` — ISO 8601 timestamps с timezone; указываются только вместе.

Если задан интервал, каждая комната содержит `available`.

```bash
curl 'http://localhost:3000/api/v1/rooms?officeId=office-moscow&minCapacity=8&from=2026-08-19T12%3A00%3A00.000Z&to=2026-08-19T13%3A00%3A00.000Z'
```

### Создание бронирования

```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H 'content-type: application/json' \
  -d '{
    "roomId": "room-everest",
    "title": "Обсуждение проекта",
    "comment": "Сверяем план работ",
    "startsAt": "2026-08-19T10:00:00.000Z",
    "endsAt": "2026-08-19T11:00:00.000Z"
  }'
```

При пересечении с существующим бронированием сервер возвращает `409 BOOKING_CONFLICT`.

### Мои бронирования

`GET /api/v1/bookings` принимает:

- `scope=upcoming|past|all`, по умолчанию `upcoming`;
- необязательный `officeId`.

### Ошибки

```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Переговорная уже забронирована на выбранное время",
    "details": {
      "roomId": "room-everest"
    }
  }
}
```

`error.code` предназначен для программной обработки. Все человекочитаемые строки, которые API предлагает показать пользователю, возвращаются на русском.

## WebSocket

Сервер рассылает каждое событие всем подключённым клиентам. Подписки и журнал пропущенных событий отсутствуют: после reconnect фронтенд должен повторно запросить актуальные данные через REST.

```json
{
  "type": "room.availability_changed",
  "occurredAt": "2026-08-18T09:00:00.000Z",
  "data": {
    "roomId": "room-everest",
    "officeId": "office-moscow",
    "startsAt": "2026-08-19T10:00:00.000Z",
    "endsAt": "2026-08-19T11:00:00.000Z",
    "available": false
  }
}
```

Типы событий:

- `booking.created` — созданное бронирование;
- `booking.cancelled` — снимок отменённого бронирования;
- `room.availability_changed` — изменившаяся доступность интервала;
- `data.reset` — тестовые данные восстановлены.

После создания или отмены сначала приходит `booking.*`, затем `room.availability_changed`. Сервер использует ping/pong и закрывает потерянные соединения.

## Тестовые данные

Seed содержит два офиса, шесть комнат, двух пользователей и прошлые/будущие встречи. Время встреч вычисляется относительно момента запуска, поэтому интерфейс не остаётся с устаревшими примерами.

```bash
curl -X POST http://localhost:3000/api/v1/test/reset
```

Сброс атомарно заменяет всё in-memory состояние и отправляет событие `data.reset`.

## Архитектура

- `src/store` — seed и синхронное in-memory хранилище;
- `src/services` — временные ограничения, конфликты и use cases;
- `src/routes` — HTTP/WebSocket transport, Zod-парсинг и OpenAPI;
- `src/realtime` — broadcast и heartbeat;
- `src/app.ts` — композиция приложения с внедряемыми часами;
- `tests` — unit и integration-тесты реального Fastify-приложения.
