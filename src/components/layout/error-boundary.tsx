"use client";

import React from "react";
import { AlertCircle, RefreshCw, ExternalLink, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EnhancedError,
  ErrorBoundaryState,
  getErrorBoundaryMessage,
  ErrorReporter,
  handleApiError,
  ERROR_SEVERITY,
} from "@/lib/error-handling";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: EnhancedError;
    resetError: () => void;
  }>;
  reportErrors?: boolean;
  onError?: (error: EnhancedError, errorInfo: React.ErrorInfo) => void;
}

// Create a global error reporter instance
const errorReporter = new ErrorReporter({
  enabled: process.env.NODE_ENV === "production",
  severityThreshold: ERROR_SEVERITY.MEDIUM,
  includeStack: true,
  includeUserData: false,
});

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert any error to EnhancedError for consistent handling
    const enhancedError =
      error instanceof EnhancedError ? error : handleApiError(error);
    return { hasError: true, error: enhancedError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedError =
      error instanceof EnhancedError ? error : handleApiError(error);

    // Set error info in state
    this.setState({ errorInfo: errorInfo.componentStack || undefined });

    // Report error if enabled
    if (this.props.reportErrors !== false) {
      errorReporter.report(enhancedError, {
        componentStack: errorInfo.componentStack || undefined,
        errorBoundary: true,
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(enhancedError, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: EnhancedError;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const errorMessage = getErrorBoundaryMessage(error);
  const isRetryable = error.retryable;
  const showDetails = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">Something went wrong</CardTitle>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant={getSeverityVariant(error.severity)}>
              {error.severity}
            </Badge>
            <Badge variant="outline">{error.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {errorMessage}
          </p>

          {error.userMessage && error.userMessage !== errorMessage && (
            <p className="text-center text-sm">{error.userMessage}</p>
          )}

          {showDetails && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development)
              </summary>
              <div className="mt-2 space-y-2 text-xs">
                <div className="rounded-md bg-muted p-3">
                  <p>
                    <span className="font-medium">Code:</span> {error.code}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {error.category}
                  </p>
                  <p>
                    <span className="font-medium">Severity:</span>{" "}
                    {error.severity}
                  </p>
                  <p>
                    <span className="font-medium">Timestamp:</span>{" "}
                    {error.timestamp}
                  </p>
                  {error.requestId && (
                    <p>
                      <span className="font-medium">Request ID:</span>{" "}
                      {error.requestId}
                    </p>
                  )}
                  {error.context && (
                    <div>
                      <p className="font-medium">Context:</p>
                      <pre className="mt-1 text-xs">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                {error.stack && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="font-medium mb-1">Stack trace:</p>
                    <pre className="whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            {isRetryable && (
              <Button onClick={resetError} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button
              onClick={() => (window.location.href = "/")}
              variant={isRetryable ? "outline" : "default"}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>

          {process.env.NODE_ENV === "production" && (
            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                This error has been reported automatically.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open("mailto:support@example.com", "_blank")
                }
              >
                <Bug className="mr-1 h-3 w-3" />
                Report Issue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getSeverityVariant(
  severity: string
): "default" | "destructive" | "secondary" | "outline" {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "default";
  }
}

// Section-specific error boundary with enhanced features
export function SectionErrorBoundary({
  children,
  section,
  compact = false,
  reportErrors = true,
  onError,
}: {
  children: React.ReactNode;
  section: string;
  compact?: boolean;
  reportErrors?: boolean;
  onError?: (error: EnhancedError, errorInfo: React.ErrorInfo) => void;
}) {
  const SectionErrorFallback = ({ error, resetError }: ErrorFallbackProps) => (
    <Card className="m-4">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">Error in {section}</p>
                <Badge
                  variant={getSeverityVariant(error.severity)}
                  className="text-xs"
                >
                  {error.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {error.userMessage || getErrorBoundaryMessage(error)}
              </p>
              {!compact && process.env.NODE_ENV === "development" && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Error Details
                  </summary>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <p>Code: {error.code}</p>
                    <p>Category: {error.category}</p>
                    {error.message && <p>Message: {error.message}</p>}
                  </div>
                </details>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {error.retryable && (
              <Button onClick={resetError} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary
      fallback={SectionErrorFallback}
      reportErrors={reportErrors}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
}

// Specialized error boundary for form sections
export function FormErrorBoundary({
  children,
  formName,
  onError,
}: {
  children: React.ReactNode;
  formName: string;
  onError?: (error: EnhancedError, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <SectionErrorBoundary
      section={`${formName} form`}
      compact={true}
      onError={onError}
    >
      {children}
    </SectionErrorBoundary>
  );
}

// Utility function to wrap components with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
