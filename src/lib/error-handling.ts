import { ApiClientError } from "./api-client";
import { apiConfig } from "./api-client";
import { logger, LogData } from "@/lib/logger";

// Enhanced error types
export interface AppError extends Error {
  code: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "network"
    | "validation"
    | "authentication"
    | "authorization"
    | "business"
    | "system";
  context?: Record<string, any>;
  userMessage?: string;
  timestamp: string;
  requestId?: string;
  retryable: boolean;
}

export interface ErrorReport {
  error: AppError;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Error categories
export const ERROR_CATEGORIES = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  BUSINESS: "business",
  SYSTEM: "system",
} as const;

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

// Common error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",

  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Authorization errors
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Business logic errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  OPERATION_FAILED: "OPERATION_FAILED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
} as const;

// Enhanced error class
export class EnhancedError extends Error implements AppError {
  code: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "network"
    | "validation"
    | "authentication"
    | "authorization"
    | "business"
    | "system";
  context?: Record<string, any>;
  userMessage?: string;
  timestamp: string;
  requestId?: string;
  retryable: boolean;

  constructor(
    message: string,
    code: string,
    category: AppError["category"],
    severity: AppError["severity"] = "medium",
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      requestId?: string;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = "EnhancedError";
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = options.context;
    this.userMessage = options.userMessage;
    this.timestamp = new Date().toISOString();
    this.requestId = options.requestId;
    this.retryable = options.retryable ?? false;

    // Store cause in context if provided
    if (options.cause) {
      this.context = { ...this.context, cause: options.cause };
    }
  }
}

// Error factory functions
export const createNetworkError = (
  message: string,
  code: string = ERROR_CODES.NETWORK_ERROR,
  context?: Record<string, any>
): EnhancedError => {
  return new EnhancedError(
    message,
    code,
    ERROR_CATEGORIES.NETWORK,
    ERROR_SEVERITY.HIGH,
    {
      context,
      userMessage:
        "Connection issue. Please check your internet connection and try again.",
      retryable: true,
    }
  );
};

export const createValidationError = (
  message: string,
  field?: string,
  value?: any
): EnhancedError => {
  return new EnhancedError(
    message,
    ERROR_CODES.INVALID_INPUT,
    ERROR_CATEGORIES.VALIDATION,
    ERROR_SEVERITY.LOW,
    {
      context: { field, value },
      userMessage: message,
      retryable: false,
    }
  );
};

export const createAuthenticationError = (
  message: string = "Authentication required",
  code: string = ERROR_CODES.UNAUTHORIZED
): EnhancedError => {
  return new EnhancedError(
    message,
    code,
    ERROR_CATEGORIES.AUTHENTICATION,
    ERROR_SEVERITY.HIGH,
    {
      userMessage: "Please log in to access this resource.",
      retryable: false,
    }
  );
};

export const createAuthorizationError = (
  message: string = "Access denied",
  requiredPermission?: string
): EnhancedError => {
  return new EnhancedError(
    message,
    ERROR_CODES.FORBIDDEN,
    ERROR_CATEGORIES.AUTHORIZATION,
    ERROR_SEVERITY.MEDIUM,
    {
      context: { requiredPermission },
      userMessage: "You do not have permission to perform this action.",
      retryable: false,
    }
  );
};

export const createBusinessError = (
  message: string,
  code: string,
  context?: Record<string, any>
): EnhancedError => {
  return new EnhancedError(
    message,
    code,
    ERROR_CATEGORIES.BUSINESS,
    ERROR_SEVERITY.MEDIUM,
    {
      context,
      userMessage: message,
      retryable: false,
    }
  );
};

export const createSystemError = (
  message: string = "An unexpected error occurred",
  code: string = ERROR_CODES.INTERNAL_ERROR,
  context?: Record<string, any>
): EnhancedError => {
  return new EnhancedError(
    message,
    code,
    ERROR_CATEGORIES.SYSTEM,
    ERROR_SEVERITY.CRITICAL,
    {
      context,
      userMessage: "Something went wrong. Please try again later.",
      retryable: true,
    }
  );
};

// API error converter
export function convertApiError(apiError: ApiClientError): EnhancedError {
  const { status, message, data, code } = apiError;

  // Map status codes to error categories and types
  if (status) {
    if (status === 401) {
      return createAuthenticationError(
        message,
        code === "TOKEN_EXPIRED"
          ? ERROR_CODES.TOKEN_EXPIRED
          : ERROR_CODES.UNAUTHORIZED
      );
    }

    if (status === 403) {
      return createAuthorizationError(message);
    }

    if (status >= 400 && status < 500) {
      return createValidationError(message);
    }

    if (status >= 500) {
      return createSystemError(message, ERROR_CODES.SERVICE_UNAVAILABLE, {
        originalStatus: status,
      });
    }
  }

  // Handle non-HTTP errors
  switch (code) {
    case "TIMEOUT":
      return createNetworkError(message, ERROR_CODES.TIMEOUT_ERROR);
    case "NETWORK_ERROR":
      return createNetworkError(message, ERROR_CODES.CONNECTION_ERROR);
    default:
      return createSystemError(message, code || ERROR_CODES.INTERNAL_ERROR, {
        originalError: apiError,
      });
  }
}

// Error boundary utilities
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: EnhancedError;
  errorInfo?: string;
}

export const getErrorBoundaryMessage = (error: EnhancedError): string => {
  switch (error.severity) {
    case ERROR_SEVERITY.CRITICAL:
      return "A critical error occurred. The application may not function properly. Please refresh the page.";
    case ERROR_SEVERITY.HIGH:
      return "An error occurred that may affect your experience. Please try again.";
    case ERROR_SEVERITY.MEDIUM:
      return error.userMessage || "Something went wrong. Please try again.";
    case ERROR_SEVERITY.LOW:
      return error.userMessage || "Please check your input and try again.";
    default:
      return "An unexpected error occurred.";
  }
};

// Error reporting
export interface ErrorReportingConfig {
  endpoint?: string;
  enabled: boolean;
  includeStack: boolean;
  includeUserData: boolean;
  severityThreshold: AppError["severity"];
}

export class ErrorReporter {
  private config: ErrorReportingConfig;
  private queue: ErrorReport[] = [];
  private reporting = false;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enabled: true,
      includeStack: true,
      includeUserData: false,
      severityThreshold: ERROR_SEVERITY.MEDIUM,
      ...config,
    };
  }

  async report(error: AppError, context?: Record<string, any>): Promise<void> {
    if (!this.config.enabled || !this.shouldReport(error)) {
      return;
    }

    const report: ErrorReport = {
      error: {
        ...error,
        stack: this.config.includeStack ? error.stack : undefined,
      },
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      metadata: context,
    };

    // Add to queue for batch reporting
    this.queue.push(report);

    // Report immediately for critical errors
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      await this.flush();
    }
  }

  private shouldReport(error: AppError): boolean {
    const severityLevels = {
      [ERROR_SEVERITY.LOW]: 1,
      [ERROR_SEVERITY.MEDIUM]: 2,
      [ERROR_SEVERITY.HIGH]: 3,
      [ERROR_SEVERITY.CRITICAL]: 4,
    };

    return (
      severityLevels[error.severity] >=
      severityLevels[this.config.severityThreshold]
    );
  }

  async flush(): Promise<void> {
    if (this.reporting || this.queue.length === 0) {
      return;
    }

    this.reporting = true;

    try {
      if (this.config.endpoint) {
        // Send to external error reporting service
        await fetch(this.config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reports: this.queue }),
        });
      } else {
        // Log using structured logger
        this.queue.forEach((report) => {
          logger.logError(report.error, {
            correlationId: report.error.requestId,
            userAgent: report.userAgent,
            url: report.url,
            userId: report.userId,
            sessionId: report.sessionId,
            metadata: report.metadata,
          });
        });
      }

      this.queue = [];
    } catch (reportingError) {
      logger.error("Failed to report errors", { error: reportingError });
    } finally {
      this.reporting = false;
    }
  }
}

// Global error reporter instance
export const errorReporter = new ErrorReporter({
  enabled: apiConfig.logging.enabled,
  severityThreshold: ERROR_SEVERITY.HIGH,
});

// Error recovery utilities
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: Error) => {
    if (error instanceof EnhancedError) {
      return error.retryable;
    }
    return false;
  },
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (
        attempt === retryConfig.maxAttempts - 1 ||
        !retryConfig.retryCondition?.(lastError)
      ) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay *
          Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelay
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Error handling hooks for React components (to be used with React Query)
export const handleApiError = (error: unknown): EnhancedError => {
  if (error instanceof ApiClientError) {
    return convertApiError(error);
  }

  if (error instanceof EnhancedError) {
    return error;
  }

  if (error instanceof Error) {
    return createSystemError(error.message, ERROR_CODES.INTERNAL_ERROR, {
      originalError: error,
    });
  }

  return createSystemError(
    "An unknown error occurred",
    ERROR_CODES.INTERNAL_ERROR,
    { originalError: error }
  );
};

// Toast notification helper (will work with any toast library)
export interface ToastConfig {
  show: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
}

export const createErrorToastHandler = (toastConfig: ToastConfig) => {
  return (error: EnhancedError) => {
    if (!apiConfig.errorHandling.showToasts) {
      return;
    }

    const message = error.userMessage || getErrorBoundaryMessage(error);

    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        toastConfig.show(message, "error");
        break;
      case ERROR_SEVERITY.MEDIUM:
        toastConfig.show(message, "warning");
        break;
      case ERROR_SEVERITY.LOW:
        toastConfig.show(message, "info");
        break;
    }
  };
};

// All types are already exported at their declaration points

export interface ErrorLoggerOptions {
  showToast?: boolean;
  toastOptions?: import("./toast-utils").ErrorToastOptions;
  includeStack?: boolean;
  context?: Record<string, any>;
}

export class ErrorLogger {
  private static instance: ErrorLogger | null = null;
  private isEnabled = true;
  private severity = ERROR_SEVERITY.MEDIUM;
  private toastManager: ReturnType<
    typeof import("./toast-utils").createErrorToastHandler
  > | null = null;

  private constructor() {
    // Lazy load toast manager to avoid circular dependencies
    this.initializeToastManager();
  }

  private async initializeToastManager() {
    if (typeof window !== "undefined") {
      try {
        const toastUtils = await import("./toast-utils");
        this.toastManager = toastUtils.createErrorToastHandler();
      } catch (error) {
        logger.warn("Failed to initialize toast manager", { error });
      }
    }
  }

  async log(error: EnhancedError, options: ErrorLoggerOptions = {}) {
    if (!this.isEnabled || error.severity < this.severity) {
      return;
    }

    const formattedError = this.formatErrorForLogging(error);

    // Log using structured logger
    const logData = {
      correlationId: error.requestId,
      ...options.context,
    };

    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
        logger.fatal(`🚨 CRITICAL ERROR: ${error.message}`, { 
          ...logData, 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            severity: error.severity,
            category: error.category,
          },
          context: { errorCategory: error.category }
        });
        break;
      case ERROR_SEVERITY.HIGH:
        logger.error(`🔴 HIGH SEVERITY ERROR: ${error.message}`, { 
          ...logData, 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            severity: error.severity,
            category: error.category,
          },
          context: { errorCategory: error.category }
        });
        break;
      case ERROR_SEVERITY.MEDIUM:
        logger.warn(`🟡 MEDIUM SEVERITY ERROR: ${error.message}`, { 
          ...logData, 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            severity: error.severity,
            category: error.category,
          },
          context: { errorCategory: error.category }
        });
        break;
      case ERROR_SEVERITY.LOW:
        logger.info(`ℹ️ LOW SEVERITY ERROR: ${error.message}`, { 
          ...logData, 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            severity: error.severity,
            category: error.category,
          },
          context: { errorCategory: error.category }
        });
        break;
    }

    // Show toast if requested and available
    if (
      options.showToast &&
      this.toastManager &&
      typeof window !== "undefined"
    ) {
      try {
        this.toastManager.showError(error, options.toastOptions);
      } catch (toastError) {
        logger.warn("Failed to show error toast", { error: toastError });
      }
    }

    // External reporting (existing code)
    if (this.shouldReport(error)) {
      this.reportError(error, options);
    }
  }

  private shouldReport(error: AppError): boolean {
    const severityLevels = {
      [ERROR_SEVERITY.LOW]: 1,
      [ERROR_SEVERITY.MEDIUM]: 2,
      [ERROR_SEVERITY.HIGH]: 3,
      [ERROR_SEVERITY.CRITICAL]: 4,
    };

    return severityLevels[error.severity] >= severityLevels[this.severity];
  }

  private formatErrorForLogging(error: EnhancedError): string {
    const baseMessage = `${error.name}: ${error.message}`;
    const context = error.context ? JSON.stringify(error.context) : "";
    return `${baseMessage} (Code: ${error.code}, Context: ${context})`;
  }

  private async reportError(error: AppError, options: ErrorLoggerOptions) {
    const report: ErrorReport = {
      error: {
        ...error,
        stack: options.includeStack ? error.stack : undefined,
      },
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      metadata: options.context,
    };

    await errorReporter.report(error, options.context);
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
}

// Enhanced error handlers with toast integration
export function createApiErrorHandler(
  options: {
    showToast?: boolean;
    toastOptions?: import("./toast-utils").ErrorToastOptions;
  } = {}
) {
  return async (error: unknown, context?: Record<string, any>) => {
    const enhancedError = handleApiError(error);

    if (options.showToast) {
      await ErrorLogger.getInstance().log(enhancedError, {
        showToast: true,
        toastOptions: options.toastOptions,
      });
    }

    return enhancedError;
  };
}

export function createFormErrorHandler(
  options: {
    showToast?: boolean;
    toastOptions?: import("./toast-utils").ErrorToastOptions;
  } = {}
) {
  return async (error: unknown, field?: string) => {
    const context = field ? { field } : undefined;
    const enhancedError = createValidationError(
      error instanceof Error ? error.message : String(error),
      field
    );

    if (options.showToast) {
      await ErrorLogger.getInstance().log(enhancedError, {
        showToast: true,
        toastOptions: options.toastOptions,
      });
    }

    return enhancedError;
  };
}

// Convenience functions for common error scenarios
export async function showApiErrorToast(
  error: unknown,
  options?: import("./toast-utils").ErrorToastOptions
) {
  if (typeof window === "undefined") return;

  try {
    const { showApiErrorToast } = await import("./toast-utils");
    return showApiErrorToast(error, options);
  } catch (importError) {
    logger.warn("Failed to show API error toast", { error: importError });
  }
}

export async function showValidationErrorToast(
  fieldName: string,
  errorMessage: string,
  options?: import("./toast-utils").ToastOptions
) {
  if (typeof window === "undefined") return;

  try {
    const { showValidationErrorToast } = await import("./toast-utils");
    return showValidationErrorToast(fieldName, errorMessage, options);
  } catch (importError) {
    logger.warn("Failed to show validation error toast", { error: importError });
  }
}

export async function showSuccessToast(
  message: string,
  options?: import("./toast-utils").ToastOptions
) {
  if (typeof window === "undefined") return;

  try {
    const { showSuccessToast } = await import("./toast-utils");
    return showSuccessToast(message, options);
  } catch (importError) {
    logger.warn("Failed to show success toast", { error: importError });
  }
}

// Export error boundary integration
export function createErrorBoundaryWithToast(
  options: {
    showToast?: boolean;
    toastOptions?: import("./toast-utils").ErrorToastOptions;
  } = {}
) {
  return async (error: Error, errorInfo: any) => {
    const enhancedError =
      error instanceof EnhancedError
        ? error
        : new EnhancedError(
            error.message,
            ERROR_CODES.INTERNAL_ERROR,
            ERROR_CATEGORIES.SYSTEM,
            ERROR_SEVERITY.HIGH,
            {
              context: { componentStack: errorInfo.componentStack },
              retryable: false,
            }
          );

    if (options.showToast) {
      await ErrorLogger.getInstance().log(enhancedError, {
        showToast: true,
        toastOptions: options.toastOptions,
      });
    }

    return enhancedError;
  };
}
