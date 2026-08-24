export interface User {
  id: string;
  login: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
}

export interface Office {
  id: string;
  name: string;
  address: string;
  timezone: string;
}

export interface RoomFeature {
  code: string;
  name: string;
}

export interface Room {
  id: string;
  officeId: string;
  name: string;
  floor: number;
  capacity: number;
  features: RoomFeature[];
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  comment: string | null;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

export interface AppState {
  currentUserId: string;
  users: User[];
  offices: Office[];
  rooms: Room[];
  bookings: Booking[];
}

export interface RoomSummary extends Room {
  office: Office;
  available?: boolean;
}

export interface BookingView extends Booking {
  room: Room;
  office: Office;
  owner: User;
}
