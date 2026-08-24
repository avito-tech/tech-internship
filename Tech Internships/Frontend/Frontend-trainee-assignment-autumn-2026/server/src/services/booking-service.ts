import { randomUUID } from 'node:crypto';
import type { Clock } from '../clock.js';
import { AppError } from '../domain/errors.js';
import type { Booking, BookingView, Office, Room, RoomSummary, User } from '../domain/models.js';
import type { MemoryStore } from '../store/memory-store.js';
import { validateBookingInterval } from './booking-rules.js';

export interface CreateBookingInput {
  roomId: string;
  title: string;
  comment?: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface ListRoomsQuery {
  officeId: string;
  minCapacity?: number;
  from?: Date;
  to?: Date;
}

export interface RoomScheduleQuery {
  roomId: string;
  from: Date;
  to: Date;
}

export interface ListBookingsQuery {
  scope?: 'upcoming' | 'past' | 'all';
  officeId?: string;
}

function intervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart.getTime() < secondEnd.getTime() && firstEnd.getTime() > secondStart.getTime();
}

export class BookingService {
  constructor(
    private readonly store: MemoryStore,
    private readonly clock: Clock,
  ) {}

  createBooking(input: CreateBookingInput): BookingView {
    const room = this.requireRoom(input.roomId);
    const office = this.requireOffice(room.officeId);
    validateBookingInterval({
      room,
      office,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      now: this.clock.now(),
    });

    const conflict = this.store
      .listBookings()
      .find(
        (booking) =>
          booking.roomId === room.id &&
          intervalsOverlap(booking.startsAt, booking.endsAt, input.startsAt, input.endsAt),
      );
    if (conflict) {
      throw new AppError(
        'BOOKING_CONFLICT',
        409,
        'Переговорная уже забронирована на выбранное время',
        {
          roomId: room.id,
          startsAt: input.startsAt.toISOString(),
          endsAt: input.endsAt.toISOString(),
        },
      );
    }

    const title = input.title.trim();
    if (!title) {
      throw new AppError('TITLE_REQUIRED', 400, 'Укажите тему встречи');
    }

    const booking = this.store.insertBooking({
      id: randomUUID(),
      roomId: room.id,
      userId: this.store.getCurrentUser().id,
      title,
      comment: input.comment?.trim() || null,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      createdAt: this.clock.now(),
    });
    return this.toBookingView(booking);
  }

  cancelBooking(id: string): BookingView {
    const booking = this.store.findBooking(id);
    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', 404, 'Бронирование не найдено');
    }
    if (booking.userId !== this.store.getCurrentUser().id) {
      throw new AppError('FORBIDDEN', 403, 'Можно отменять только собственные бронирования');
    }
    if (booking.startsAt.getTime() <= this.clock.now().getTime()) {
      throw new AppError(
        'BOOKING_NOT_CANCELLABLE',
        400,
        'Можно отменять только будущие бронирования',
      );
    }

    const deleted = this.store.deleteBooking(id);
    if (!deleted) {
      throw new AppError('BOOKING_NOT_FOUND', 404, 'Бронирование не найдено');
    }
    return this.toBookingView(deleted);
  }

  listRooms(query: ListRoomsQuery): RoomSummary[] {
    const office = this.requireOffice(query.officeId);
    if ((query.from && !query.to) || (!query.from && query.to)) {
      throw new AppError(
        'INVALID_DATE_RANGE',
        400,
        'Начало и окончание интервала необходимо указать вместе',
      );
    }
    if (query.from && query.to) {
      this.ensureDateRange(query.from, query.to);
    }

    return this.store
      .listRooms()
      .filter((room) => room.officeId === office.id)
      .filter((room) => query.minCapacity === undefined || room.capacity >= query.minCapacity)
      .map((room) => {
        const base = { ...room, office };
        if (!query.from || !query.to) {
          return base;
        }
        const available = !this.store
          .listBookings()
          .some(
            (booking) =>
              booking.roomId === room.id &&
              intervalsOverlap(booking.startsAt, booking.endsAt, query.from!, query.to!),
          );
        return { ...base, available };
      });
  }

  getRoom(id: string): RoomSummary {
    const room = this.requireRoom(id);
    return { ...room, office: this.requireOffice(room.officeId) };
  }

  getRoomSchedule(query: RoomScheduleQuery): BookingView[] {
    this.requireRoom(query.roomId);
    this.ensureDateRange(query.from, query.to);
    return this.store
      .listBookings()
      .filter(
        (booking) =>
          booking.roomId === query.roomId &&
          intervalsOverlap(booking.startsAt, booking.endsAt, query.from, query.to),
      )
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
      .map((booking) => this.toBookingView(booking));
  }

  listCurrentUserBookings(query: ListBookingsQuery = {}): BookingView[] {
    const scope = query.scope ?? 'upcoming';
    const now = this.clock.now().getTime();
    const currentUserId = this.store.getCurrentUser().id;
    const bookings = this.store
      .listBookings()
      .filter((booking) => booking.userId === currentUserId)
      .filter((booking) => {
        if (scope === 'upcoming') return booking.startsAt.getTime() > now;
        if (scope === 'past') return booking.startsAt.getTime() <= now;
        return true;
      })
      .filter((booking) => {
        if (!query.officeId) return true;
        return this.requireRoom(booking.roomId).officeId === query.officeId;
      });

    const direction = scope === 'past' ? -1 : 1;
    return bookings
      .sort((left, right) => direction * (left.startsAt.getTime() - right.startsAt.getTime()))
      .map((booking) => this.toBookingView(booking));
  }

  private ensureDateRange(from: Date, to: Date): void {
    if (
      !Number.isFinite(from.getTime()) ||
      !Number.isFinite(to.getTime()) ||
      from.getTime() >= to.getTime()
    ) {
      throw new AppError('INVALID_DATE_RANGE', 400, 'Указан некорректный диапазон дат');
    }
  }

  private requireOffice(id: string): Office {
    const office = this.store.findOffice(id);
    if (!office) {
      throw new AppError('OFFICE_NOT_FOUND', 404, 'Офис не найден', { officeId: id });
    }
    return office;
  }

  private requireRoom(id: string): Room {
    const room = this.store.findRoom(id);
    if (!room) {
      throw new AppError('ROOM_NOT_FOUND', 404, 'Переговорная не найдена', { roomId: id });
    }
    return room;
  }

  private requireUser(id: string): User {
    const user = this.store.findUser(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'Пользователь не найден', { userId: id });
    }
    return user;
  }

  private toBookingView(booking: Booking): BookingView {
    const room = this.requireRoom(booking.roomId);
    return {
      ...booking,
      room,
      office: this.requireOffice(room.officeId),
      owner: this.requireUser(booking.userId),
    };
  }
}
