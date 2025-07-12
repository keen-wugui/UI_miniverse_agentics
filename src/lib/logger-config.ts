import pino from 'pino';
import { serializeError } from 'serialize-error';

// Environment-aware logging configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logger instance based on environment
const createLogger = () => {
  const config: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    
    // Development: pretty print to console
    // Production: structured JSON logs
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),

    // Test: minimal output
    ...(isTest && {
      level: 'silent',
    }),

    // Base configuration
    base: {
      pid: false,
      hostname: false,
    },

    // Custom serializers for error objects
    serializers: {
      error: (error: Error) => serializeError(error),
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },

    // Redact sensitive information
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.headers["x-auth-token"]',
        'password',
        'token',
        'apiKey',
        'secret',
      ],
      censor: '[REDACTED]',
    },
  };

  return pino(config);
};

// Create singleton logger instance
export const logger = createLogger();

// API-specific logging context
export interface ApiLogContext {
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  correlationId?: string;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
}

// Structured API logging helpers
export const apiLogger = {
  request: (context: ApiLogContext, message = 'API Request') => {
    logger.info(context, message);
  },

  response: (context: ApiLogContext, message = 'API Response') => {
    logger.info(context, message);
  },

  error: (error: Error, context: ApiLogContext, message = 'API Error') => {
    logger.error({ ...context, error }, message);
  },

  warn: (context: ApiLogContext, message: string) => {
    logger.warn(context, message);
  },

  debug: (context: ApiLogContext, message: string) => {
    logger.debug(context, message);
  },
};

// General application logging helpers
export const appLogger = {
  info: (message: string, data?: Record<string, any>) => {
    logger.info(data, message);
  },

  warn: (message: string, data?: Record<string, any>) => {
    logger.warn(data, message);
  },

  error: (error: Error | string, data?: Record<string, any>) => {
    if (typeof error === 'string') {
      logger.error(data, error);
    } else {
      logger.error({ ...data, error }, error.message);
    }
  },

  debug: (message: string, data?: Record<string, any>) => {
    logger.debug(data, message);
  },
};

// Utility to create child loggers with context
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Utility to safely extract error information
export const extractErrorInfo = (error: any) => {
  if (!error) return null;

  try {
    // Use serialize-error to safely handle all types of errors
    const serialized = serializeError(error);
    
    return {
      message: serialized.message || 'Unknown error',
      name: serialized.name || 'Error',
      code: serialized.code,
      status: serialized.status,
      statusText: serialized.statusText,
      stack: serialized.stack?.split('\n').slice(0, 10).join('\n'), // Limit stack trace length
      ...((serialized as any).data && { data: (serialized as any).data }),
    };
  } catch (extractionError) {
    // Fallback for completely problematic error objects
    return {
      message: 'Error extraction failed',
      name: 'ExtractionError',
      originalError: String(error),
      extractionError: String(extractionError),
    };
  }
};

export default logger;