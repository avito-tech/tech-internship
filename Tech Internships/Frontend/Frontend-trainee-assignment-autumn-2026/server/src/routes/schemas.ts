import { z } from 'zod';
import { AppError } from '../domain/errors.js';

export const idParamsSchema = z.object({ id: z.string().min(1) });
export const roomParamsSchema = z.object({ roomId: z.string().min(1) });
export const bookingParamsSchema = z.object({ bookingId: z.string().min(1) });

export const isoTimestampSchema = z
  .string()
  .regex(/(?:Z|[+-]\d{2}:\d{2})$/, 'Укажите смещение часового пояса')
  .refine((value) => Number.isFinite(Date.parse(value)), 'Укажите корректную дату');

export const roomsQuerySchema = z
  .object({
    officeId: z.string().min(1),
    minCapacity: z.coerce.number().int().positive().optional(),
    from: isoTimestampSchema.optional(),
    to: isoTimestampSchema.optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.from) !== Boolean(value.to)) {
      context.addIssue({
        code: 'custom',
        path: value.from ? ['to'] : ['from'],
        message: 'Начало и окончание интервала необходимо указать вместе',
      });
    }
  });

export const scheduleQuerySchema = z.object({
  from: isoTimestampSchema,
  to: isoTimestampSchema,
});

export const bookingsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  officeId: z.string().min(1).optional(),
});

export const createBookingSchema = z.object({
  roomId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  comment: z.string().trim().max(2_000).nullable().optional(),
  startsAt: isoTimestampSchema,
  endsAt: isoTimestampSchema,
});

export function parseRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 400, 'Проверьте параметры запроса', {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        code: issue.code,
        message: /[А-Яа-яЁё]/.test(issue.message) ? issue.message : 'Некорректное значение',
      })),
    });
  }
  return parsed.data;
}
