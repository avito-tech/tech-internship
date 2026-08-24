import { z } from 'zod';

const environmentSchema = z.object({
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  ENABLE_TEST_RESET: z.enum(['true', 'false']).default('true'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export interface AppConfig {
  host: string;
  port: number;
  logLevel: string;
  corsOrigins: string[];
  enableTestReset: boolean;
  environment: 'development' | 'test' | 'production';
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const values = environmentSchema.parse(environment);

  return {
    host: values.HOST,
    port: values.PORT,
    logLevel: values.LOG_LEVEL,
    corsOrigins: values.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    enableTestReset: values.ENABLE_TEST_RESET === 'true',
    environment: values.NODE_ENV,
  };
}
