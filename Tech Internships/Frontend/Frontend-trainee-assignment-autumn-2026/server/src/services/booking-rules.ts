import { DateTime } from 'luxon';
import type { Office, Room } from '../domain/models.js';
import { AppError } from '../domain/errors.js';

const MINIMUM_DURATION_MS = 15 * 60 * 1000;
const MAXIMUM_ADVANCE_MS = 30 * 24 * 60 * 60 * 1000;
const WORKDAY_START_MINUTES = 9 * 60;
const WORKDAY_END_MINUTES = 20 * 60;

export interface BookingInterval {
  room: Room;
  office: Office;
  startsAt: Date;
  endsAt: Date;
  now: Date;
}

export function validateBookingInterval(input: BookingInterval): void {
  const { startsAt, endsAt, now, office } = input;

  if (
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime()) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new AppError('INVALID_DATE', 400, 'Указана некорректная дата');
  }

  const duration = endsAt.getTime() - startsAt.getTime();
  if (duration <= 0) {
    throw new AppError('END_BEFORE_START', 400, 'Время окончания должно быть позже начала');
  }
  if (duration < MINIMUM_DURATION_MS) {
    throw new AppError(
      'DURATION_TOO_SHORT',
      400,
      'Минимальная продолжительность бронирования — 15 минут',
    );
  }
  if (startsAt.getTime() <= now.getTime()) {
    throw new AppError('START_NOT_IN_FUTURE', 400, 'Бронирование можно создать только на будущее');
  }
  if (startsAt.getTime() - now.getTime() > MAXIMUM_ADVANCE_MS) {
    throw new AppError(
      'BOOKING_TOO_FAR_AHEAD',
      400,
      'Бронирование доступно не более чем на 30 дней вперёд',
    );
  }

  const localStart = DateTime.fromJSDate(startsAt, { zone: 'utc' }).setZone(office.timezone);
  const localEnd = DateTime.fromJSDate(endsAt, { zone: 'utc' }).setZone(office.timezone);

  if (!localStart.isValid || !localEnd.isValid) {
    throw new AppError('INVALID_DATE', 400, 'Указана некорректная дата');
  }

  const isAligned = (value: DateTime): boolean =>
    value.minute % 15 === 0 && value.second === 0 && value.millisecond === 0;
  if (!isAligned(localStart) || !isAligned(localEnd)) {
    throw new AppError(
      'TIME_NOT_ALIGNED',
      400,
      'Время начала и окончания должно быть кратно 15 минутам',
    );
  }

  const startMinutes = localStart.hour * 60 + localStart.minute;
  const endMinutes = localEnd.hour * 60 + localEnd.minute;
  const sameLocalDay = localStart.toISODate() === localEnd.toISODate();
  if (!sameLocalDay || startMinutes < WORKDAY_START_MINUTES || endMinutes > WORKDAY_END_MINUTES) {
    throw new AppError(
      'OUTSIDE_WORKING_HOURS',
      400,
      'Бронирование должно полностью находиться в рабочих часах с 09:00 до 20:00',
    );
  }
}
