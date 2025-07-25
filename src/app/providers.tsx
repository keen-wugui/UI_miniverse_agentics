"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, ReactNode } from "react";
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
// Logger is dynamically imported to avoid SSR issues

// Enable MSW in development
async function enableMocking() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // Only enable MSW in browser environment
  if (typeof window === "undefined") {
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

          // Don't retry network errors when backend is completely unavailable
          if (enhancedError.category === "network" && failureCount >= 1) {
            return false;
          }

          // Conservative retry for other retryable errors up to 2 attempts
          return enhancedError.retryable && failureCount < 2;
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

          // Log error for debugging (dynamic import to avoid SSR issues)
          if (typeof window !== "undefined") {
            import("@/lib/logger").then(({ logger }) => {
              logger.error("Query error occurred", {
                queryKey: query.queryKey,
                error: enhancedError,
                context: { queryContext: "react-query" },
              });
            }).catch(() => {
              console.error("Query error occurred:", {
                queryKey: query.queryKey,
                error: enhancedError,
                context: { queryContext: "react-query" },
              });
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

// Simple client-side initialization component
function ClientInitializer({ queryClient }: { queryClient: QueryClient }) {
  const [isClient, setIsClient] = useState(false);

  // Track client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize MSW on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;
    enableMocking().catch(console.error);
  }, [isClient]);

  // Initialize logger on mount (client-side logging only)
  useEffect(() => {
    if (!isClient) return;
    
    const initializeLogger = async () => {
      try {
        // Dynamically import logger to avoid SSR issues
        const { logger } = await import("@/lib/logger");
        
        // Wait for logger initialization
        await logger.waitForInitialization();
        
        // Log application startup (browser-side)
        logger.info("Client application started", {
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });

        if (process.env.NODE_ENV === "development") {
          logger.debug("Client logger initialized", { 
            fileLogging: false,
            consoleLogging: true 
          });
        }
      } catch (error) {
        console.error("Logger initialization failed:", error);
      }
    };

    initializeLogger();
  }, [isClient]);

  // Cache warming on mount
  useEffect(() => {
    if (!isClient) return;
    
    const initializeCache = async () => {
      try {
        // Warm the cache with critical data
        await warmCache(queryClient);

        // Log cache warming success (dynamic import to avoid SSR issues)
        if (typeof window !== "undefined") {
          import("@/lib/logger").then(({ logger }) => {
            logger.info("Cache warming completed", {
              queryCount: queryClient.getQueryCache().getAll().length,
            });
          }).catch(() => {
            console.log("Cache warming completed", {
              queryCount: queryClient.getQueryCache().getAll().length,
            });
          });
        }
      } catch (error) {
        // Log cache warming error (dynamic import to avoid SSR issues)  
        if (typeof window !== "undefined") {
          import("@/lib/logger").then(({ logger }) => {
            logger.error("Cache warming failed", { error: error as Error });
          }).catch(() => {
            console.error("Cache warming failed", { error: error as Error });
          });
        }
        errorReporter.report(handleApiError(error), {
          type: "cache_warming_error",
        });
      }
    };

    initializeCache();
  }, [isClient, queryClient]);

  // Setup background sync for critical data
  useEffect(() => {
    if (!isClient) return;
    
    // Setup background refresh every 5 minutes
    const cleanup = backgroundSync.setupBackgroundRefresh(
      queryClient,
      5 * 60 * 1000
    );

    return cleanup;
  }, [isClient, queryClient]);

  // Setup cache debugging in development
  useEffect(() => {
    if (!isClient || process.env.NODE_ENV !== "development") return;
    
    // Log cache status every 2 minutes in development
    const interval = setInterval(
      () => {
        cacheDebug.logCacheStatus(queryClient);
      },
      2 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [isClient, queryClient]);

  // Cleanup error reporter on unmount
  useEffect(() => {
    if (!isClient) return;
    
    return () => {
      errorReporter.flush().catch(console.error);
    };
  }, [isClient]);

  return null;
}

export function QueryProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ClientInitializer queryClient={queryClient} />
      {children}
      {/* React Query Devtools - only in development */}
      {typeof window !== "undefined" && process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
