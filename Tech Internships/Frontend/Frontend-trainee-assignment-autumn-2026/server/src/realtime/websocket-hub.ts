import WebSocket from 'ws';
import type { Clock } from '../clock.js';

export interface RealtimeEvent<TData extends Record<string, unknown> = Record<string, unknown>> {
  type: string;
  occurredAt: string;
  data: TData;
}

export class WebSocketHub {
  private readonly clients = new Map<WebSocket, boolean>();
  private readonly heartbeat: NodeJS.Timeout;

  constructor(
    private readonly clock: Clock,
    heartbeatIntervalMs = 30_000,
  ) {
    this.heartbeat = setInterval(() => this.pingClients(), heartbeatIntervalMs);
    this.heartbeat.unref();
  }

  add(client: WebSocket): void {
    this.clients.set(client, true);
    client.on('pong', () => this.clients.set(client, true));
    client.once('close', () => this.clients.delete(client));
    client.once('error', () => this.clients.delete(client));
  }

  broadcast<TData extends Record<string, unknown>>(type: string, data: TData): void {
    const event: RealtimeEvent<TData> = {
      type,
      occurredAt: this.clock.now().toISOString(),
      data,
    };
    const payload = JSON.stringify(event);
    for (const client of this.clients.keys()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): void {
    clearInterval(this.heartbeat);
    for (const client of this.clients.keys()) {
      client.close(1001, 'Сервер завершает работу');
    }
    this.clients.clear();
  }

  private pingClients(): void {
    for (const [client, alive] of this.clients) {
      if (!alive) {
        client.terminate();
        this.clients.delete(client);
        continue;
      }
      this.clients.set(client, false);
      client.ping();
    }
  }
}
