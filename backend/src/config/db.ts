import mongoose from 'mongoose';
import { ENV } from './env';
import logger from '../utils/logger';

export async function connectDb(): Promise<void> {
  await mongoose.connect(ENV.MONGODB_URI);
  logger.info('DB connection successful!');

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });
}
