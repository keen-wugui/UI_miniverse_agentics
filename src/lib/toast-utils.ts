import React from "react";
import { toast } from "@/hooks/use-toast";
import {
  EnhancedError,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  ERROR_CODES,
} from "./error-handling";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// Toast type definitions
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
  onClose?: () => void;
}

export interface ErrorToastOptions extends ToastOptions {
  showRetry?: boolean;
  retryAction?: () => void;
  showDetails?: boolean;
  includeCode?: boolean;
}

// Default durations for different toast types
const DEFAULT_DURATIONS = {
  success: 4000,
  error: 8000,
  warning: 6000,
  info: 5000,
} as const;

// Toast variant mapping
const TOAST_VARIANTS = {
  success: "default",
  error: "destructive",
  warning: "default",
  info: "default",
} as const;

// Enhanced toast function with type safety
export function showToast(
  type: ToastType,
  message: string,
  options: ToastOptions = {}
) {
  const {
    title,
    description = message,
    duration = DEFAULT_DURATIONS[type],
    action,
    onClose,
  } = options;

  const toastConfig: any = {
    title: title || getDefaultTitle(type),
    description,
    duration,
    variant: TOAST_VARIANTS[type],
    onOpenChange: (open: boolean) => {
      if (!open && onClose) {
        onClose();
      }
    },
  };

  // Add action if provided
  if (action) {
    toastConfig.action = action;
  }

  return toast(toastConfig);
}

// Specific toast type functions
export function showSuccessToast(message: string, options?: ToastOptions) {
  return showToast("success", message, options);
}

export function showErrorToast(message: string, options?: ErrorToastOptions) {
  return showToast("error", message, options);
}

export function showWarningToast(message: string, options?: ToastOptions) {
  return showToast("warning", message, options);
}

export function showInfoToast(message: string, options?: ToastOptions) {
  return showToast("info", message, options);
}

// Enhanced error toast function
export function showErrorToastFromError(
  error: EnhancedError,
  options: ErrorToastOptions = {}
) {
  const {
    showRetry = error.retryable,
    retryAction,
    showDetails = false,
    includeCode = false,
    ...toastOptions
  } = options;

  // Determine the message to display
  let message = error.userMessage || error.message;
  let title = getErrorTitle(error);

  // Add error code if requested
  if (includeCode && error.code) {
    title = `${title} (${error.code})`;
  }

  // Add context information for certain error types
  if (showDetails && error.context) {
    const contextInfo = formatErrorContext(error.context);
    if (contextInfo) {
      message = `${message}\n\n${contextInfo}`;
    }
  }

  // Create action button for retryable errors
  let action: React.ReactNode | undefined;
  if (showRetry && retryAction) {
    action = React.createElement(
      "button",
      {
        onClick: retryAction,
        className:
          "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
      },
      "Try Again"
    );
  }

  return showErrorToast(message, {
    title,
    action,
    duration: getDurationForError(error),
    ...toastOptions,
  });
}

// Enhanced API error toast function
export function showApiErrorToast(
  error: unknown,
  options: ErrorToastOptions = {}
) {
  if (error instanceof EnhancedError) {
    return showErrorToastFromError(error, options);
  }

  // Handle generic errors
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return showErrorToast(message, options);
}

// Success pattern functions
export function showSuccessWithAction(
  message: string,
  actionLabel: string,
  actionCallback: () => void,
  options?: ToastOptions
) {
  const action = React.createElement(
    "button",
    {
      onClick: actionCallback,
      className:
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
    },
    actionLabel
  );

  return showSuccessToast(message, { ...options, action });
}

// Loading toast with dismiss capability
export function showLoadingToast(message: string, options?: ToastOptions) {
  return showInfoToast(message, {
    duration: 10000, // Longer duration for loading states
    ...options,
  });
}

// Batch operation toast functions
export function showBatchOperationToast(
  operation: string,
  success: number,
  failed: number,
  options?: ToastOptions
) {
  if (failed === 0) {
    return showSuccessToast(
      `${operation} completed successfully (${success} items)`,
      options
    );
  } else if (success === 0) {
    return showErrorToast(
      `${operation} failed for all ${failed} items`,
      options
    );
  } else {
    return showWarningToast(
      `${operation} completed with mixed results: ${success} succeeded, ${failed} failed`,
      options
    );
  }
}

// Offline/online status toasts
export function showOfflineToast() {
  return showWarningToast(
    "You are currently offline. Some features may be limited.",
    {
      duration: 6000,
    }
  );
}

export function showOnlineToast() {
  return showSuccessToast("Connection restored", {
    duration: 3000,
  });
}

// Form validation toast functions
export function showValidationErrorToast(
  fieldName: string,
  errorMessage: string,
  options?: ToastOptions
) {
  return showErrorToast(`${fieldName}: ${errorMessage}`, {
    title: "Validation Error",
    ...options,
  });
}

// Helper functions
function getDefaultTitle(type: ToastType): string {
  switch (type) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    case "info":
      return "Information";
    default:
      return "Notification";
  }
}

function getErrorTitle(error: EnhancedError): string {
  switch (error.category) {
    case ERROR_CATEGORIES.AUTHENTICATION:
      return "Authentication Error";
    case ERROR_CATEGORIES.AUTHORIZATION:
      return "Access Denied";
    case ERROR_CATEGORIES.VALIDATION:
      return "Validation Error";
    case ERROR_CATEGORIES.NETWORK:
      return "Connection Error";
    case ERROR_CATEGORIES.BUSINESS:
      return "Operation Failed";
    case ERROR_CATEGORIES.SYSTEM:
      return "System Error";
    default:
      return "Error";
  }
}

function getDurationForError(error: EnhancedError): number {
  switch (error.severity) {
    case ERROR_SEVERITY.CRITICAL:
      return 10000; // 10 seconds for critical errors
    case ERROR_SEVERITY.HIGH:
      return 8000; // 8 seconds for high severity
    case ERROR_SEVERITY.MEDIUM:
      return 6000; // 6 seconds for medium severity
    case ERROR_SEVERITY.LOW:
      return 4000; // 4 seconds for low severity
    default:
      return 5000;
  }
}

function formatErrorContext(context: Record<string, any>): string | null {
  if (!context || typeof context !== "object") return null;

  const relevantKeys = ["field", "operation", "endpoint", "resource", "userId"];
  const relevantContext = Object.entries(context)
    .filter(([key]) => relevantKeys.includes(key))
    .map(([key, value]) => `${key}: ${value}`);

  return relevantContext.length > 0 ? relevantContext.join(", ") : null;
}

// Toast queue management for bulk operations
class ToastQueue {
  private queue: (() => void)[] = [];
  private processing = false;

  add(toastFn: () => void) {
    this.queue.push(toastFn);
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const toastFn = this.queue.shift();
      if (toastFn) {
        toastFn();
        // Small delay between toasts to prevent overwhelming the user
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.processing = false;
  }
}

export const toastQueue = new ToastQueue();

// Integration with error handling system
export function createErrorToastHandler() {
  return {
    showError: (error: EnhancedError, options?: ErrorToastOptions) => {
      return showErrorToastFromError(error, options);
    },
    showApiError: (error: unknown, options?: ErrorToastOptions) => {
      return showApiErrorToast(error, options);
    },
    showSuccess: (message: string, options?: ToastOptions) => {
      return showSuccessToast(message, options);
    },
    showWarning: (message: string, options?: ToastOptions) => {
      return showWarningToast(message, options);
    },
    showInfo: (message: string, options?: ToastOptions) => {
      return showInfoToast(message, options);
    },
  };
}

// Export default toast handler instance
export const toastHandler = createErrorToastHandler();
