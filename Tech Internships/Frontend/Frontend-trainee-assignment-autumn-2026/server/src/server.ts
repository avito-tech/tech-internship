import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildApp({ config, logger: true });

const shutdown = async (): Promise<void> => {
  await app.close();
};

process.once('SIGINT', () => {
  void shutdown();
});
process.once('SIGTERM', () => {
  void shutdown();
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
