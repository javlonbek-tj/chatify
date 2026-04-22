import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ENV } from '../config/env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack ?? message}${extra}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const transports: winston.transport[] = [new winston.transports.Console()];

if (ENV.NODE_ENV === 'production') {
  // Combined logs: all levels (warn and above)
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, // compress rotated files to .gz
      maxSize: '20m',      // max 20MB per file
      maxFiles: '30d',     // delete files older than 30 days
    }),
  );

  // Error logs: error level only
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d', // retain errors longer for post-mortem analysis
    }),
  );
}

const logger = winston.createLogger({
  level: ENV.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: ENV.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports,
});

export default logger;
