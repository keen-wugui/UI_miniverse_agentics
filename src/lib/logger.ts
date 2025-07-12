import pino, { Logger } from "pino";
import {
  getCurrentLoggingConfig,
  LogContext,
  LOG_CONTEXTS,
  PERFORMANCE_THRESHOLDS,
} from "@/config/logging-config";

// Enhanced log data interface
export interface LogData {
  context?: LogContext;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  version?: string;
  environment?: string;
  [key: string]: any;
}

// Performance log data
export interface PerformanceLogData extends LogData {
  operation: string;
  duration: number;
  threshold?: number;
  metadata?: Record<string, any>;
}

// Error log data
export interface ErrorLogData extends Omit<LogData, 'context'> {
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    severity?: string;
    category?: string;
  };
  context?: Record<string, any>;
}

// API log data
export interface ApiLogData extends LogData {
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  retryAttempt?: number;
}

// Logger class with enhanced functionality
export class EnhancedLogger {
  private logger: Logger;
  private config = getCurrentLoggingConfig();

  constructor() {
    this.logger = this.createLogger();
  }

  private createLogger(): Logger {
    const pinoConfig: pino.LoggerOptions = {
      level: this.config.level,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: this.config.redactPaths,
      base: {
        service: this.config.service,
        version: this.config.version,
        environment: process.env.NODE_ENV || "development",
        hostname: typeof window === "undefined" ? require("os").hostname() : "browser",
      },
    };

    // Browser-specific configuration
    if (typeof window !== "undefined") {
      pinoConfig.browser = {
        write: {
          info: console.info,
          warn: console.warn,
          error: console.error,
          debug: console.debug,
          trace: console.trace,
          fatal: console.error,
        },
      };
    }

    let logger = pino(pinoConfig);

    // Add pretty printing for development
    if (this.config.enablePretty && typeof window === "undefined") {
      const pinoPretty = require("pino-pretty");
      logger = pino(
        pinoConfig,
        pinoPretty({
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "hostname",
        })
      );
    }

    return logger;
  }

  // Generate correlation ID for request tracking
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create child logger with persistent context
  child(context: LogData): EnhancedLogger {
    const childLogger = new EnhancedLogger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  // Basic logging methods
  trace(message: string, data?: LogData): void {
    this.logger.trace(data, message);
  }

  debug(message: string, data?: LogData): void {
    this.logger.debug(data, message);
  }

  info(message: string, data?: LogData): void {
    this.logger.info(data, message);
  }

  warn(message: string, data?: LogData): void {
    this.logger.warn(data, message);
  }

  error(message: string, data?: ErrorLogData): void {
    this.logger.error(data, message);
  }

  fatal(message: string, data?: ErrorLogData): void {
    this.logger.fatal(data, message);
  }

  // Specialized logging methods
  logApiRequest(data: ApiLogData): void {
    this.info(`API Request: ${data.method} ${data.url}`, {
      ...data,
      context: LOG_CONTEXTS.API as LogContext,
    });
  }

  logApiResponse(data: ApiLogData): void {
    const level = this.getApiResponseLogLevel(data.statusCode, data.duration);
    const message = `API Response: ${data.statusCode} ${data.method} ${data.url}`;
    
    if (data.duration && data.duration > PERFORMANCE_THRESHOLDS.API_SLOW_REQUEST) {
      this.warn(`${message} (SLOW)`, {
        ...data,
        context: LOG_CONTEXTS.PERFORMANCE as LogContext,
        performance: { slow: true, threshold: PERFORMANCE_THRESHOLDS.API_SLOW_REQUEST },
      });
    } else {
      this[level](message, {
        ...data,
        context: LOG_CONTEXTS.API as LogContext,
      });
    }
  }

  logApiError(data: ApiLogData & { error: any }): void {
    this.error(`API Error: ${data.method} ${data.url}`, {
      ...data,
      error: {
        name: data.error.name || "ApiError",
        message: data.error.message,
        stack: data.error.stack,
        code: data.error.code,
      },
      context: { apiContext: LOG_CONTEXTS.API },
    });
  }

  logPerformance(data: PerformanceLogData): void {
    const isSlowOperation = data.threshold 
      ? data.duration > data.threshold
      : data.duration > 1000; // Default 1 second threshold

    const level = isSlowOperation ? "warn" : "info";
    const message = `Performance: ${data.operation} took ${data.duration}ms`;

    this[level](message, {
      ...data,
      context: LOG_CONTEXTS.PERFORMANCE as LogContext,
      performance: {
        slow: isSlowOperation,
        threshold: data.threshold,
      },
    });
  }

  logAuth(message: string, data?: LogData): void {
    this.info(message, {
      ...data,
      context: LOG_CONTEXTS.AUTH as LogContext,
    });
  }

  logBusiness(message: string, data?: LogData): void {
    this.info(message, {
      ...data,
      context: LOG_CONTEXTS.BUSINESS_LOGIC as LogContext,
    });
  }

  logSystem(message: string, data?: LogData): void {
    this.info(message, {
      ...data,
      context: LOG_CONTEXTS.SYSTEM as LogContext,
    });
  }

  logUI(message: string, data?: LogData): void {
    this.debug(message, {
      ...data,
      context: LOG_CONTEXTS.UI as LogContext,
    });
  }

  // Enhanced error logging with context
  logError(error: Error | any, context?: LogData): void {
    const errorData: ErrorLogData = {
      ...context,
      context: { errorContext: LOG_CONTEXTS.ERROR },
      error: {
        name: error.name || "Error",
        message: error.message || String(error),
        stack: error.stack,
        code: error.code,
        severity: error.severity,
        category: error.category,
      },
    };

    this.error(`Error occurred: ${error.message || error}`, errorData);
  }

  // Helper methods
  private getApiResponseLogLevel(statusCode?: number, duration?: number): "info" | "warn" | "error" {
    if (!statusCode) return "info";
    
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warn";
    if (duration && duration > PERFORMANCE_THRESHOLDS.API_SLOW_REQUEST) return "warn";
    
    return "info";
  }

  // Create timer for performance monitoring
  startTimer(operation: string, context?: LogData): () => void {
    const startTime = Date.now();
    
    this.debug(`Starting operation: ${operation}`, {
      ...context,
      context: LOG_CONTEXTS.PERFORMANCE as LogContext,
      operation,
    });

    return (additionalData?: Record<string, any>) => {
      const duration = Date.now() - startTime;
      this.logPerformance({
        ...context,
        operation,
        duration,
        metadata: additionalData,
      });
    };
  }

  // Flush logs (useful for testing and shutdown)
  flush(): void {
    if (typeof this.logger.flush === "function") {
      this.logger.flush();
    }
  }
}

// Create singleton logger instance
export const logger = new EnhancedLogger();

// Convenience exports
export { LOG_CONTEXTS, PERFORMANCE_THRESHOLDS };
export type { LogData, PerformanceLogData, ErrorLogData, ApiLogData, LogContext };

// Legacy console replacement (for gradual migration)
export const consoleReplacer = {
  log: (message: any, ...args: any[]) => logger.info(String(message), { args }),
  info: (message: any, ...args: any[]) => logger.info(String(message), { args }),
  warn: (message: any, ...args: any[]) => logger.warn(String(message), { args }),
  error: (message: any, ...args: any[]) => logger.error(String(message), { 
    error: {
      name: 'ConsoleError',
      message: String(message),
    },
    context: { args }
  }),
  debug: (message: any, ...args: any[]) => logger.debug(String(message), { args }),
  trace: (message: any, ...args: any[]) => logger.trace(String(message), { args }),
};