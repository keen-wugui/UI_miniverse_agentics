import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "../../../test/mocks/server";
import { http, HttpResponse } from "msw";
import { createTestQueryClient } from "../../../test/utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useHealthStatus,
  useDatabaseMetrics,
  useDatabaseHealth,
  useHealthMetrics,
} from "../useHealth";

// Create wrapper component for tests
const createTestWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useHealth hooks", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    // Reset any request handlers that are set during test
    server.resetHandlers();
  });

  describe("useHealthStatus", () => {
    it("should fetch health status successfully", async () => {
      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        version: "1.0.0",
        uptime: 3600,
      };

      server.use(
        http.get(`${baseUrl}/health`, () => {
          return HttpResponse.json(mockHealthData);
        })
      );

      const { result } = renderHook(() => useHealthStatus(), {
        wrapper: createTestWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockHealthData);
      expect(result.current.error).toBeNull();
    });

    it("should handle health status error", async () => {
      server.use(
        http.get(`${baseUrl}/health`, () => {
          return HttpResponse.json(
            { error: "Service Unavailable" },
            { status: 503 }
          );
        })
      );

      const { result } = renderHook(() => useHealthStatus(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(() => useHealthStatus({ enabled: false }), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useHealthMetrics", () => {
    it("should fetch health metrics successfully", async () => {
      const mockMetricsData = {
        cpu: { usage: 45.2, cores: 8 },
        memory: { used: 2048, total: 8192, percentage: 25 },
        disk: { used: 50000, total: 500000, percentage: 10 },
        network: { bytesIn: 1024000, bytesOut: 512000 },
        uptime: 3600,
        timestamp: "2024-01-01T00:00:00Z",
      };

      server.use(
        http.get(`${baseUrl}/health/metrics`, () => {
          return HttpResponse.json(mockMetricsData);
        })
      );

      const { result } = renderHook(() => useHealthMetrics(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockMetricsData);
    });

    it("should handle metrics error", async () => {
      server.use(
        http.get(`${baseUrl}/health/metrics`, () => {
          return HttpResponse.json(
            { error: "Metrics not available" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useHealthMetrics(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useDatabaseHealth", () => {
    it("should fetch database health successfully", async () => {
      const mockDbHealthData = {
        status: "connected",
        connectionCount: 5,
        maxConnections: 100,
        avgResponseTime: 12,
      };

      server.use(
        http.get(`${baseUrl}/health/database`, () => {
          return HttpResponse.json(mockDbHealthData);
        })
      );

      const { result } = renderHook(() => useDatabaseHealth(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDbHealthData);
    });

    it("should handle database connection error", async () => {
      server.use(
        http.get(`${baseUrl}/health/database`, () => {
          return HttpResponse.json(
            { error: "Database connection failed" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDatabaseHealth(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should refetch on manual trigger", async () => {
      const mockDbHealthData = {
        status: "connected",
        connectionCount: 3,
        maxConnections: 100,
        avgResponseTime: 8,
      };

      server.use(
        http.get(`${baseUrl}/health/database`, () => {
          return HttpResponse.json(mockDbHealthData);
        })
      );

      const { result } = renderHook(() => useDatabaseHealth(), {
        wrapper: createTestWrapper(),
      });

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockDbHealthData);

      // Update mock data
      const updatedData = {
        ...mockDbHealthData,
        connectionCount: 7,
        avgResponseTime: 15,
      };

      server.use(
        http.get(`${baseUrl}/health/database`, () => {
          return HttpResponse.json(updatedData);
        })
      );

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });
    });
  });

  describe("Query options and caching", () => {
    it("should respect cache configuration", async () => {
      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        version: "1.0.0",
        uptime: 3600,
      };

      let requestCount = 0;
      server.use(
        http.get(`${baseUrl}/health`, () => {
          requestCount++;
          return HttpResponse.json(mockHealthData);
        })
      );

      // First hook instance
      const { result: result1 } = renderHook(() => useHealthStatus(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Second hook instance - should use cached data
      const { result: result2 } = renderHook(() => useHealthStatus(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should have made only one request due to caching
      expect(requestCount).toBe(1);
      expect(result1.current.data).toEqual(mockHealthData);
      expect(result2.current.data).toEqual(mockHealthData);
    });

    it("should handle polling for real-time updates", async () => {
      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        version: "1.0.0",
        uptime: 3600,
      };

      let requestCount = 0;
      server.use(
        http.get(`${baseUrl}/health/metrics`, () => {
          requestCount++;
          return HttpResponse.json({
            ...mockHealthData,
            uptime: 3600 + requestCount * 30, // Simulate time passing
          });
        })
      );

      const { result } = renderHook(
        () => useHealthMetrics({ refetchInterval: 100 }), // Poll every 100ms for testing
        {
          wrapper: createTestWrapper(),
        }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(requestCount).toBeGreaterThanOrEqual(1);

      // Wait for at least one refetch
      await waitFor(
        () => {
          expect(requestCount).toBeGreaterThan(1);
        },
        { timeout: 1000 }
      );

      expect(result.current.data).toBeTruthy();
    });
  });
});
