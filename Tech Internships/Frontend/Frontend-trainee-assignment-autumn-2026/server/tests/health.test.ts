import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

describe('GET /health', () => {
  it('reports that the service is healthy', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
