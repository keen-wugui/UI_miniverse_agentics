"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, useCallback } from "react";
import {
  cacheStrategies,
  warmCache,
  backgroundSync,
  cacheDebug,
} from "@/lib/cache-config";
import {
  convertApiError,
  ErrorReporter,
  handleApiError,
} from "@/lib/error-handling";

// Enable MSW in development
async function enableMocking() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const { worker } = await import("@/test/mocks/browser");

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: (req, print) => {
      // Only warn about unhandled requests to our API server (localhost:8000)
      // Ignore all other requests (Next.js app, static assets, etc.)
      if (req.url.startsWith('http://localhost:8000')) {
        print.warning();
      }
    },
  });
}

// Start MSW before anything else
enableMocking();

// Global error reporter instance
const errorReporter = new ErrorReporter({
  enabled: process.env.NODE_ENV === "production",
  includeStack: true,
  includeUserData: false,
  severityThreshold: "medium",
});

// Create QueryClient with comprehensive configuration
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Use health cache strategy as baseline for queries
        staleTime: cacheStrategies.health.staleTime,
        gcTime: cacheStrategies.health.gcTime,
        refetchOnWindowFocus: cacheStrategies.health.refetchOnWindowFocus,
        refetchOnMount: cacheStrategies.health.refetchOnMount,
        refetchOnReconnect: cacheStrategies.health.refetchOnReconnect,
        retry: (failureCount, error) => {
          // Don't retry for authentication/authorization errors
          const enhancedError = handleApiError(error);
          if (
            enhancedError.category === "authentication" ||
            enhancedError.category === "authorization"
          ) {
            return false;
          }

          // Default retry for retryable errors up to 3 attempts
          return enhancedError.retryable && failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Global error handler for queries
        throwOnError: (error, query) => {
          const enhancedError = handleApiError(error);

          // Report errors to error reporting system
          errorReporter.report(enhancedError, {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
          });

          // Log error for debugging in development
          if (process.env.NODE_ENV === "development") {
            console.error("Query error:", {
              queryKey: query.queryKey,
              error: enhancedError,
            });
          }

          // Always throw to allow components to handle errors
          return true;
        },
      },
      mutations: {
        // Use shorter retry for mutations
        retry: (failureCount, error) => {
          const enhancedError = handleApiError(error);

          // Don't retry auth errors or validation errors
          if (
            enhancedError.category === "authentication" ||
            enhancedError.category === "authorization" ||
            enhancedError.category === "validation"
          ) {
            return false;
          }

          // Only retry network errors and system errors, and only once
          return enhancedError.retryable && failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // Global error handler for mutations
        throwOnError: (error: Error) => {
          const enhancedError = handleApiError(error);

          // Report mutation errors
          errorReporter.report(enhancedError, {
            type: "mutation_error",
          });

          // Log error for debugging in development
          if (process.env.NODE_ENV === "development") {
            console.error("Mutation error:", {
              error: enhancedError,
            });
          }

          return true;
        },
      },
    },
  });
};

export function QueryProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  // Cache warming on mount
  useEffect(() => {
    const initializeCache = async () => {
      try {
        // Warm the cache with critical data
        await warmCache(queryClient);

        if (process.env.NODE_ENV === "development") {
          console.log("Cache warming completed");
          cacheDebug.logCacheStatus(queryClient);
        }
      } catch (error) {
        console.warn("Cache warming failed:", error);
        errorReporter.report(handleApiError(error), {
          type: "cache_warming_error",
        });
      }
    };

    initializeCache();
  }, [queryClient]);

  // Setup background sync for critical data
  useEffect(() => {
    // Setup background refresh every 5 minutes
    const cleanup = backgroundSync.setupBackgroundRefresh(
      queryClient,
      5 * 60 * 1000
    );

    return cleanup;
  }, [queryClient]);

  // Setup cache debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Log cache status every 2 minutes in development
      const interval = setInterval(
        () => {
          cacheDebug.logCacheStatus(queryClient);
        },
        2 * 60 * 1000
      );

      return () => clearInterval(interval);
    }
  }, [queryClient]);

  // Cleanup error reporter on unmount
  useEffect(() => {
    return () => {
      errorReporter.flush().catch(console.error);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
