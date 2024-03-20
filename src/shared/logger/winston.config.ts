import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Development transports for logging.
 * All logs are printed to the console.
 */
const devTransports = [
  new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
      ),
    ),
  }),
];

/**
 * Array of production transports for logging.
 * Errors are logged in a daily rotating file with a 30 day retention period.
 * Info logs are logged in a daily rotating file with a 14 day retention period.
 */
const prodTransports = [
  new winston.transports.DailyRotateFile({
    level: 'error',
    filename: 'logs/simulation-%DATE%-error.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  new winston.transports.DailyRotateFile({
    level: 'info',
    filename: 'logs/simulation-%DATE%-info.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
  }),
];

const instanceTransports =
  process.env.NODE_ENV === 'production' ? prodTransports : devTransports;

// Create and export the logger instance
export const logger = WinstonModule.createLogger({
  transports: instanceTransports,
});
