import winston from 'winston';
import dotenv from 'dotenv';
import { mkdirSync } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Use console.error here as logger might not be initialized yet
  console.error('Failed to create logs directory:', error);
}

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom console format that's easier to read
const consoleFormat = winston.format.printf(
  ({ level, message, timestamp, service, ...metadata }) => {
    // Color coding for log levels
    const colors: Record<string, string> = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      debug: '\x1b[32m', // Green
      verbose: '\x1b[34m', // Blue
      silly: '\x1b[35m', // Magenta
      reset: '\x1b[0m', // Reset
    };

    const color = colors[level] || colors.reset;
    const time = new Date(timestamp as string).toLocaleTimeString();
    const serviceName = service ? `[${service}]` : ''; // Include service name (logger name)

    // Simple metadata formatting
    const metaString = Object.keys(metadata).length
      ? ` ${JSON.stringify(metadata)}` // Basic JSON stringify for other metadata
      : '';

    // Added check for Error instances within metadata for better stack trace logging
    let errorStack = '';
    if (metadata.error instanceof Error && metadata.error.stack) {
      errorStack = `\n${metadata.error.stack}`;
      // Optionally remove the error from metaString if you don't want it duplicated
      // delete metadata.error; // Requires cloning metadata first if modifying
    }

    return (
      `${color}${time} ${serviceName}[${level.toUpperCase()}]${colors.reset}: ` +
      `${message}${metaString}${errorStack}`
    );
  },
);

// Create a logger instance with a specified name (service).
// name: Name of the logger/service (used for log file naming and prefix).
// returns: A configured winston logger instance.
export function createLogger(name: string): winston.Logger {
  const loggerInstance = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }), // Ensure stack traces are captured
      winston.format.splat(),
      winston.format.json(), // Used for file transport
    ),
    defaultMeta: { service: name }, // Use the provided name as service meta
    transports: [
      // Write logs with level 'error' and below to error-<name>.log
      new winston.transports.File({
        filename: path.join(logsDir, `error-${name}.log`),
        level: 'error',
      }),
      // Write all logs to combined-<name>.log
      new winston.transports.File({
        filename: path.join(logsDir, `combined-${name}.log`),
      }),
    ],
  });

  // If we're not in production, log to the console with colored output
  // Use the custom consoleFormat defined above
  if (process.env.NODE_ENV !== 'production') {
    loggerInstance.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(), // Add timestamp to console
          winston.format.splat(),
          winston.format.errors({ stack: true }), // Add stack trace support to console
          consoleFormat, // Apply the custom color format
        ),
      }),
    );
  }

  return loggerInstance;
}

// Export a default logger for general application use
export default createLogger('app');
