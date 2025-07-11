import { QueryClient } from "@tanstack/react-query";
import {
  EnhancedError,
  ERROR_CODES,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  handleApiError,
  ErrorReporter,
} from "./error-handling";
import {
  showErrorToast,
  showWarningToast,
  showInfoToast,
  createErrorToastHandler,
} from "./toast-utils";
import { ApiClientError } from "./api-client";

// Enhanced API error types
export interface ApiErrorContext {
  endpoint: string;
  method: string;
  requestId?: string;
  userId?: string;
  timestamp: Date;
  retryAttempt?: number;
  requestData?: any;
}

export interface ApiErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  reportError?: boolean;
  enableRetry?: boolean;
  retryCondition?: (error: EnhancedError) => boolean;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: EnhancedError) => void;
  customErrorMap?: Record<number, string>;
}

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
}

// Network status monitor
export class NetworkStatusMonitor {
  private static instance: NetworkStatusMonitor | null = null;
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private currentStatus: NetworkStatus = { isOnline: true };

  private constructor() {
    if (typeof window !== "undefined") {
      this.initializeMonitoring();
    }
  }

  static getInstance(): NetworkStatusMonitor {
    if (!NetworkStatusMonitor.instance) {
      NetworkStatusMonitor.instance = new NetworkStatusMonitor();
    }
    return NetworkStatusMonitor.instance;
  }

  private initializeMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));

    // Monitor connection quality if available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener(
        "change",
        this.handleConnectionChange.bind(this)
      );
      this.updateConnectionInfo(connection);
    }

    // Initial status
    this.currentStatus.isOnline = navigator.onLine;
  }

  private handleOnline(): void {
    this.currentStatus.isOnline = true;
    this.notifyListeners();
    showInfoToast("You're back online!", {
      description: "Your connection has been restored.",
    });
  }

  private handleOffline(): void {
    this.currentStatus.isOnline = false;
    this.notifyListeners();
    showWarningToast("You're offline", {
      description: "Some features may not work until connection is restored.",
    });
  }

  private handleConnectionChange(): void {
    if ("connection" in navigator) {
      this.updateConnectionInfo((navigator as any).connection);
      this.notifyListeners();
    }
  }

  private updateConnectionInfo(connection: any): void {
    this.currentStatus = {
      ...this.currentStatus,
      effectiveType: connection.effectiveType,
      rtt: connection.rtt,
      downlink: connection.downlink,
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentStatus));
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  public hasSlowConnection(): boolean {
    return (
      this.currentStatus.effectiveType === "slow-2g" ||
      this.currentStatus.effectiveType === "2g"
    );
  }
}

// API error classifier
export class ApiErrorClassifier {
  static classifyError(
    error: ApiClientError | Error,
    context?: ApiErrorContext
  ): EnhancedError {
    let enhancedError: EnhancedError;

    if (error instanceof ApiClientError) {
      enhancedError = this.classifyApiClientError(error, context);
    } else {
      enhancedError = this.classifyGenericError(error, context);
    }

    // Add API-specific context
    if (context) {
      enhancedError.context = {
        ...enhancedError.context,
        api: context,
      };
    }

    return enhancedError;
  }

  private static classifyApiClientError(
    error: ApiClientError,
    context?: ApiErrorContext
  ): EnhancedError {
    const status = error.status || 0;
    let category: keyof typeof ERROR_CATEGORIES;
    let severity: keyof typeof ERROR_SEVERITY;
    let code: keyof typeof ERROR_CODES;
    let retryable = false;

    // Classify by status code
    if (status >= 500) {
      category = "SYSTEM";
      severity = "HIGH";
      code = "INTERNAL_ERROR";
      retryable = true;
    } else if (status >= 400) {
      category = "VALIDATION";
      severity = status === 404 ? "MEDIUM" : "LOW";
      code = this.getClientErrorCode(status);
      retryable = status === 408 || status === 429; // Timeout or rate limit
    } else if (status === 0 || error.code === "NETWORK_ERROR") {
      category = "NETWORK";
      severity = "HIGH";
      code = "NETWORK_ERROR";
      retryable = true;
    } else {
      category = "SYSTEM";
      severity = "MEDIUM";
      code = "INTERNAL_ERROR";
      retryable = false;
    }

    return new EnhancedError(error.message, code, category, severity, {
      context: {
        status,
        statusText: error.statusText,
        data: error.data,
        apiCode: error.code,
      },
      retryable,
    });
  }

  private static classifyGenericError(
    error: Error,
    context?: ApiErrorContext
  ): EnhancedError {
    return new EnhancedError(
      error.message,
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_CATEGORIES.SYSTEM,
      ERROR_SEVERITY.MEDIUM,
      {
        context: { originalError: error.name },
        retryable: false,
      }
    );
  }

  private static getClientErrorCode(status: number): keyof typeof ERROR_CODES {
    switch (status) {
      case 400:
      case 422:
        return "INVALID_INPUT";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "RESOURCE_NOT_FOUND";
      case 408:
        return "TIMEOUT_ERROR";
      case 429:
        return "QUOTA_EXCEEDED";
      default:
        return "INTERNAL_ERROR";
    }
  }
}

// Enhanced API error handler
export class EnhancedApiErrorHandler {
  private networkMonitor: NetworkStatusMonitor;
  private errorReporter: ErrorReporter;
  private toastHandler: ReturnType<typeof createErrorToastHandler>;

  constructor() {
    this.networkMonitor = NetworkStatusMonitor.getInstance();
    this.errorReporter = ErrorReporter.getInstance();
    this.toastHandler = createErrorToastHandler();
  }

  async handleError(
    error: ApiClientError | Error,
    context?: ApiErrorContext,
    options: ApiErrorHandlingOptions = {}
  ): Promise<void> {
    const {
      showToast = true,
      logError = true,
      reportError = true,
      customErrorMap = {},
    } = options;

    // Classify the error
    const enhancedError = ApiErrorClassifier.classifyError(error, context);

    // Check network status for better error messages
    const networkStatus = this.networkMonitor.getStatus();
    if (!networkStatus.isOnline) {
      enhancedError.message =
        "You're currently offline. Please check your connection and try again.";
      enhancedError.category = ERROR_CATEGORIES.NETWORK;
    }

    // Apply custom error mapping
    if (context && customErrorMap[context.method]) {
      enhancedError.message = customErrorMap[context.method];
    }

    // Handle the error through our existing system
    await handleApiError(enhancedError);

    // Show toast notification
    if (showToast) {
      await this.toastHandler.showErrorToast(enhancedError, {
        showRetry: enhancedError.retryable && options.enableRetry,
        retryAction: options.onRetry ? () => options.onRetry!(1) : undefined,
      });
    }

    // Report error if configured
    if (reportError && enhancedError.severity >= ERROR_SEVERITY.MEDIUM) {
      await this.errorReporter.reportError(enhancedError, context);
    }

    // Log error if configured
    if (logError) {
      console.error("[Enhanced API Error]", {
        error: enhancedError,
        context,
        networkStatus,
      });
    }
  }

  // Create a contextual error handler for specific endpoints
  createContextualHandler(
    endpoint: string,
    method: string,
    options?: ApiErrorHandlingOptions
  ) {
    return async (error: ApiClientError | Error, requestData?: any) => {
      const context: ApiErrorContext = {
        endpoint,
        method,
        timestamp: new Date(),
        requestData,
      };

      await this.handleError(error, context, options);
    };
  }
}

// React Query error handling utilities
export const reactQueryErrorHandling = {
  // Default error handler for React Query
  defaultErrorHandler: (error: unknown) => {
    const handler = new EnhancedApiErrorHandler();

    if (error instanceof ApiClientError) {
      handler.handleError(error, {
        endpoint: "unknown",
        method: "unknown",
        timestamp: new Date(),
      });
    } else if (error instanceof Error) {
      handler.handleError(error);
    }
  },

  // Create query client with enhanced error handling
  createQueryClient: (): QueryClient => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors (except 408, 429)
            if (error instanceof ApiClientError) {
              const status = error.status || 0;
              if (
                status >= 400 &&
                status < 500 &&
                status !== 408 &&
                status !== 429
              ) {
                return false;
              }
            }

            // Don't retry more than 3 times
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 30000),
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
          onError: reactQueryErrorHandling.defaultErrorHandler,
        },
        mutations: {
          retry: (failureCount, error) => {
            // Only retry mutations on server errors or network issues
            if (error instanceof ApiClientError) {
              const status = error.status || 0;
              return status >= 500 || status === 0;
            }
            return false;
          },
          onError: reactQueryErrorHandling.defaultErrorHandler,
        },
      },
    });
  },

  // Optimistic update error handling
  handleOptimisticUpdateError: async (
    error: unknown,
    queryClient: QueryClient,
    queryKey: string[]
  ) => {
    // Rollback optimistic updates
    await queryClient.invalidateQueries({ queryKey });

    // Handle the error
    reactQueryErrorHandling.defaultErrorHandler(error);
  },

  // Background refetch error handling
  handleBackgroundRefetchError: (error: unknown) => {
    // Silent handling for background refetches
    // Only show errors for critical failures
    if (
      error instanceof ApiClientError &&
      error.status &&
      error.status >= 500
    ) {
      const handler = new EnhancedApiErrorHandler();
      handler.handleError(error, undefined, {
        showToast: false,
        logError: true,
        reportError: true,
      });
    }
  },
};

// Utility functions for API error handling
export const apiErrorUtils = {
  // Check if error is retryable
  isRetryable: (error: unknown): boolean => {
    if (error instanceof ApiClientError) {
      const status = error.status || 0;
      return status >= 500 || status === 408 || status === 429 || status === 0;
    }
    return false;
  },

  // Get user-friendly error message
  getUserFriendlyMessage: (error: unknown): string => {
    if (error instanceof ApiClientError) {
      const status = error.status || 0;

      if (status === 0) {
        return "Unable to connect to server. Please check your internet connection.";
      }

      const friendlyMessages: Record<number, string> = {
        400: "Invalid request. Please check your input and try again.",
        401: "Please log in to continue.",
        403: "You don't have permission to perform this action.",
        404: "The requested resource was not found.",
        408: "Request timed out. Please try again.",
        429: "Too many requests. Please wait a moment and try again.",
        500: "Server error. Please try again later.",
        502: "Service temporarily unavailable. Please try again later.",
        503: "Service temporarily unavailable. Please try again later.",
      };

      return friendlyMessages[status] || error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred. Please try again.";
  },

  // Check if error requires authentication
  requiresAuth: (error: unknown): boolean => {
    return error instanceof ApiClientError && error.status === 401;
  },

  // Check if error is a validation error
  isValidationError: (error: unknown): boolean => {
    return (
      error instanceof ApiClientError &&
      (error.status === 400 || error.status === 422)
    );
  },

  // Extract validation errors from API response
  extractValidationErrors: (error: unknown): Record<string, string[]> => {
    if (error instanceof ApiClientError && error.data?.errors) {
      return error.data.errors;
    }
    return {};
  },
};

// Export singleton instances
export const apiErrorHandler = new EnhancedApiErrorHandler();
export const networkMonitor = NetworkStatusMonitor.getInstance();
