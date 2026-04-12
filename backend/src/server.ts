import http from 'http';
import { ENV } from './config/env';
import mongoose from 'mongoose';

process.on('uncaughtException', (err: Error) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  process.exit(1);
});

import app from './app';

let server: http.Server;

async function start(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('DB connection successful! ✅');

    server = app.listen(ENV.PORT, () => {
      console.log(`App running on port ${ENV.PORT}...`);
    });
  } catch (err) {
    console.error('Failed to start the server: 💥', err);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (reason: unknown) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED! 💥 Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  } else {
    process.exit(1);
  }
});
