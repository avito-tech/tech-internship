import type { Clock } from '../clock.js';
import type { AppState, Booking, Office, Room, User } from '../domain/models.js';
import { createSeedState } from './seed.js';

export class MemoryStore {
  private state: AppState;

  constructor(private readonly clock: Clock) {
    this.state = createSeedState(clock);
  }

  getCurrentUser(): User {
    const user = this.state.users.find(({ id }) => id === this.state.currentUserId);
    if (!user) {
      throw new Error('Seed state does not contain the current user');
    }
    return structuredClone(user);
  }

  listUsers(): User[] {
    return structuredClone(this.state.users);
  }

  listOffices(): Office[] {
    return structuredClone(this.state.offices);
  }

  listRooms(): Room[] {
    return structuredClone(this.state.rooms);
  }

  listBookings(): Booking[] {
    return structuredClone(this.state.bookings);
  }

  findOffice(id: string): Office | undefined {
    return structuredClone(this.state.offices.find((office) => office.id === id));
  }

  findRoom(id: string): Room | undefined {
    return structuredClone(this.state.rooms.find((room) => room.id === id));
  }

  findUser(id: string): User | undefined {
    return structuredClone(this.state.users.find((user) => user.id === id));
  }

  findBooking(id: string): Booking | undefined {
    return structuredClone(this.state.bookings.find((booking) => booking.id === id));
  }

  insertBooking(booking: Booking): Booking {
    this.state.bookings.push(structuredClone(booking));
    return structuredClone(booking);
  }

  deleteBooking(id: string): Booking | undefined {
    const index = this.state.bookings.findIndex((booking) => booking.id === id);
    if (index === -1) {
      return undefined;
    }
    const [booking] = this.state.bookings.splice(index, 1);
    return structuredClone(booking);
  }

  reset(): void {
    this.state = createSeedState(this.clock);
  }
}
