import http from 'http';
import { ENV } from './config/env';
import mongoose from 'mongoose';
import logger from './utils/logger';

process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { error: err.message, stack: err.stack });
  process.exit(1);
});

import app from './app';

let server: http.Server;

async function start(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    logger.info('DB connection successful!');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    server = app.listen(ENV.PORT, () => {
      logger.info(`Server is running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error('Failed to start the server', { error: (err as Error).message });
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { reason });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED! Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated!');
    });
  } else {
    process.exit(1);
  }
});
