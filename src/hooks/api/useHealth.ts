import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { apiConfig } from "@/lib/api-client";
import { handleApiError } from "@/lib/error-handling";
import { queryKeys, cacheStrategies } from "@/lib/cache-config";
import type {
  HealthResponse,
  DatabaseHealthResponse,
  DatabaseMetricsResponse,
} from "@/types/api";

// Health status hook
export const useHealthStatus = (options?: { enabled?: boolean }) => {
  const cacheConfig = cacheStrategies.health;

  return useQuery<HealthResponse>({
    queryKey: queryKeys.health.status(),
    queryFn: async (): Promise<HealthResponse> => {
      try {
        const response = await apiClient.get<HealthResponse>(
          apiConfig.endpoints.health.base
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Database health hook
export const useDatabaseHealth = () => {
  const cacheConfig = cacheStrategies.health;

  return useQuery<DatabaseHealthResponse>({
    queryKey: queryKeys.health.database(),
    queryFn: async (): Promise<DatabaseHealthResponse> => {
      try {
        const response = await apiClient.get<DatabaseHealthResponse>(
          apiConfig.endpoints.health.database
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Database metrics hook
export const useDatabaseMetrics = (options?: { refetchInterval?: number }) => {
  const cacheConfig = cacheStrategies.health;

  return useQuery<DatabaseMetricsResponse>({
    queryKey: queryKeys.health.databaseMetrics(),
    queryFn: async (): Promise<DatabaseMetricsResponse> => {
      try {
        const response = await apiClient.get<DatabaseMetricsResponse>(
          apiConfig.endpoints.health.databaseMetrics
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    refetchInterval: options?.refetchInterval,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Composite health hook - combines all health checks
export const useCompleteHealthCheck = () => {
  const healthStatus = useHealthStatus();
  const databaseHealth = useDatabaseHealth();
  const databaseMetrics = useDatabaseMetrics();

  return {
    // Individual queries
    healthStatus,
    databaseHealth,
    databaseMetrics,

    // Combined status
    isLoading:
      healthStatus.isLoading ||
      databaseHealth.isLoading ||
      databaseMetrics.isLoading,
    isError:
      healthStatus.isError || databaseHealth.isError || databaseMetrics.isError,
    error: healthStatus.error || databaseHealth.error || databaseMetrics.error,

    // Combined data
    data: {
      health: healthStatus.data,
      database: databaseHealth.data,
      metrics: databaseMetrics.data,
    },

    // Overall system health
    isHealthy:
      healthStatus.data?.status === "healthy" &&
      databaseHealth.data?.status === "connected",

    // Refetch all health data
    refetch: () => {
      healthStatus.refetch();
      databaseHealth.refetch();
      databaseMetrics.refetch();
    },
  };
};

// Health metrics hook (alias for useDatabaseMetrics for backward compatibility)
export const useHealthMetrics = useDatabaseMetrics;
