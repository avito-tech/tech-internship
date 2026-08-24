import { DateTime } from 'luxon';
import type { Clock } from '../clock.js';
import type { AppState, Booking, Office, Room, User } from '../domain/models.js';

const CURRENT_USER_ID = 'user-konstantin';
const OTHER_USER_ID = 'user-anna';

const users: User[] = [
  {
    id: CURRENT_USER_ID,
    login: 'kkuznetsov',
    displayName: 'Константин Кузнецов',
    email: 'kkuznetsov@example.test',
    avatarUrl: null,
    initials: 'КК',
  },
  {
    id: OTHER_USER_ID,
    login: 'asmirnova',
    displayName: 'Анна Смирнова',
    email: 'asmirnova@example.test',
    avatarUrl: null,
    initials: 'АС',
  },
];

const offices: Office[] = [
  {
    id: 'office-moscow',
    name: 'Офис Москва',
    address: 'Москва, ул. Лесная, 7',
    timezone: 'Europe/Moscow',
  },
  {
    id: 'office-saint-petersburg',
    name: 'Офис Санкт-Петербург',
    address: 'Санкт-Петербург, наб. реки Карповки, 5',
    timezone: 'Europe/Moscow',
  },
];

const rooms: Room[] = [
  {
    id: 'room-everest',
    officeId: 'office-moscow',
    name: 'Эверест',
    floor: 4,
    capacity: 12,
    features: [
      { code: 'display', name: 'Проектор и ТВ-панель 4К' },
      { code: 'whiteboard', name: 'Маркерная доска' },
      { code: 'video', name: 'Система видеоконференций' },
    ],
  },
  {
    id: 'room-kazbek',
    officeId: 'office-moscow',
    name: 'Казбек',
    floor: 3,
    capacity: 8,
    features: [
      { code: 'display', name: 'ТВ-панель' },
      { code: 'whiteboard', name: 'Маркерная доска' },
    ],
  },
  {
    id: 'room-elbrus',
    officeId: 'office-moscow',
    name: 'Эльбрус',
    floor: 5,
    capacity: 6,
    features: [{ code: 'video', name: 'Система видеоконференций' }],
  },
  {
    id: 'room-altai',
    officeId: 'office-moscow',
    name: 'Алтай',
    floor: 2,
    capacity: 4,
    features: [{ code: 'whiteboard', name: 'Маркерная доска' }],
  },
  {
    id: 'room-neva',
    officeId: 'office-saint-petersburg',
    name: 'Нева',
    floor: 6,
    capacity: 10,
    features: [
      { code: 'display', name: 'ТВ-панель' },
      { code: 'video', name: 'Система видеоконференций' },
    ],
  },
  {
    id: 'room-ladoga',
    officeId: 'office-saint-petersburg',
    name: 'Ладога',
    floor: 6,
    capacity: 4,
    features: [{ code: 'whiteboard', name: 'Маркерная доска' }],
  },
];

function officeTime(clock: Clock, days: number, hour: number, minute = 0): Date {
  return DateTime.fromJSDate(clock.now(), { zone: 'utc' })
    .setZone('Europe/Moscow')
    .plus({ days })
    .startOf('day')
    .set({ hour, minute })
    .toJSDate();
}

function booking(
  clock: Clock,
  values: Pick<Booking, 'id' | 'roomId' | 'userId' | 'title' | 'comment'> & {
    days: number;
    startHour: number;
    startMinute?: number;
    durationMinutes: number;
  },
): Booking {
  const startsAt = officeTime(clock, values.days, values.startHour, values.startMinute);
  return {
    id: values.id,
    roomId: values.roomId,
    userId: values.userId,
    title: values.title,
    comment: values.comment,
    startsAt,
    endsAt: DateTime.fromJSDate(startsAt).plus({ minutes: values.durationMinutes }).toJSDate(),
    createdAt: DateTime.fromJSDate(clock.now()).minus({ days: 2 }).toJSDate(),
  };
}

export function createSeedState(clock: Clock): AppState {
  const bookings: Booking[] = [
    booking(clock, {
      id: 'booking-past-current-user',
      roomId: 'room-everest',
      userId: CURRENT_USER_ID,
      title: 'Ретроспектива команды',
      comment: 'Обсуждаем итоги спринта',
      days: -1,
      startHour: 15,
      durationMinutes: 60,
    }),
    booking(clock, {
      id: 'booking-future-current-user',
      roomId: 'room-everest',
      userId: CURRENT_USER_ID,
      title: 'Ежедневная встреча команды',
      comment: 'Синхронизация по задачам',
      days: 1,
      startHour: 15,
      durationMinutes: 60,
    }),
    booking(clock, {
      id: 'booking-future-current-user-2',
      roomId: 'room-kazbek',
      userId: CURRENT_USER_ID,
      title: 'Собеседование с разработчиком',
      comment: null,
      days: 2,
      startHour: 11,
      startMinute: 30,
      durationMinutes: 60,
    }),
    booking(clock, {
      id: 'booking-future-other-user',
      roomId: 'room-elbrus',
      userId: OTHER_USER_ID,
      title: 'Планирование продукта',
      comment: 'Квартальные цели',
      days: 1,
      startHour: 10,
      durationMinutes: 90,
    }),
  ];

  return structuredClone({
    currentUserId: CURRENT_USER_ID,
    users,
    offices,
    rooms,
    bookings,
  });
}
