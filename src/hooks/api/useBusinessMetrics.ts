import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, buildUrl } from "@/lib/api-client";
import { apiConfig } from "@/lib/api-client";
import { handleApiError } from "@/lib/error-handling";
import {
  queryKeys,
  cacheStrategies,
  cacheInvalidation,
} from "@/lib/cache-config";
import type {
  BusinessMetricsResponse,
  MetricsFilterRequest,
  KPIResponse,
  CreateKPIRequest,
  UpdateKPIRequest,
  AnalyticsReportRequest,
  AnalyticsReportResponse,
  MetricsExportRequest,
  MetricsExportResponse,
  PaginationParams,
} from "@/types/api";

// Business metrics overview hook
export const useBusinessMetrics = (filters?: MetricsFilterRequest) => {
  const cacheConfig = cacheStrategies.businessMetrics;

  return useQuery<BusinessMetricsResponse>({
    queryKey: queryKeys.businessMetrics.overview(filters),
    queryFn: async (): Promise<BusinessMetricsResponse> => {
      try {
        const response = await apiClient.get<BusinessMetricsResponse>(
          apiConfig.endpoints.businessMetrics.overview,
          filters
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

// KPI (Key Performance Indicators) hook
export const useKPIs = (params?: PaginationParams) => {
  const cacheConfig = cacheStrategies.businessMetrics;

  return useQuery<KPIResponse>({
    queryKey: queryKeys.businessMetrics.kpis(params),
    queryFn: async (): Promise<KPIResponse> => {
      try {
        const response = await apiClient.get<KPIResponse>(
          apiConfig.endpoints.businessMetrics.kpis,
          params
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

// Analytics report hook
export const useAnalyticsReport = (
  reportRequest: AnalyticsReportRequest,
  enabled: boolean = true
) => {
  const cacheConfig = cacheStrategies.businessMetrics;

  return useQuery<AnalyticsReportResponse>({
    queryKey: queryKeys.businessMetrics.report(reportRequest),
    queryFn: async (): Promise<AnalyticsReportResponse> => {
      try {
        const response = await apiClient.post<AnalyticsReportResponse>(
          apiConfig.endpoints.businessMetrics.reports,
          reportRequest
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!reportRequest.dateRange,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Create KPI mutation
export const useCreateKPI = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.businessMetrics;

  return useMutation<KPIResponse, Error, CreateKPIRequest>({
    mutationFn: async (kpiData: CreateKPIRequest): Promise<KPIResponse> => {
      try {
        const response = await apiClient.post<KPIResponse>(
          apiConfig.endpoints.businessMetrics.createKPI,
          kpiData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: () => {
      // Invalidate specific KPI queries using cache invalidation utilities
      cacheInvalidation.invalidateBusinessMetrics(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.businessMetrics.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.businessMetrics.overview() });
    },
  });
};

// Update KPI mutation
export const useUpdateKPI = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.businessMetrics;

  return useMutation<
    KPIResponse,
    Error,
    { id: string; updates: UpdateKPIRequest }
  >({
    mutationFn: async ({ id, updates }): Promise<KPIResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.businessMetrics.updateKPI,
          { id }
        );
        const response = await apiClient.patch<KPIResponse>(url, updates);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: () => {
      // Invalidate specific business metrics queries
      cacheInvalidation.invalidateBusinessMetrics(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.businessMetrics.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.businessMetrics.overview() });
    },
  });
};

// Delete KPI mutation
export const useDeleteKPI = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.businessMetrics;

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.businessMetrics.deleteKPI,
          { id }
        );
        await apiClient.delete(url);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: () => {
      // Invalidate specific business metrics queries  
      cacheInvalidation.invalidateBusinessMetrics(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.businessMetrics.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.businessMetrics.overview() });
    },
  });
};

// Export metrics mutation
export const useExportMetrics = () => {
  const cacheConfig = cacheStrategies.businessMetrics;

  return useMutation<MetricsExportResponse, Error, MetricsExportRequest>({
    mutationFn: async (
      exportData: MetricsExportRequest
    ): Promise<MetricsExportResponse> => {
      try {
        const response = await apiClient.post<MetricsExportResponse>(
          apiConfig.endpoints.businessMetrics.export,
          exportData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Real-time metrics hook (with polling)
export const useRealTimeMetrics = (
  filters?: MetricsFilterRequest,
  intervalMs: number = 30000
) => {
  const cacheConfig = cacheStrategies.businessMetrics;

  return useQuery<BusinessMetricsResponse>({
    queryKey: queryKeys.businessMetrics.realtime(filters),
    queryFn: async (): Promise<BusinessMetricsResponse> => {
      try {
        const response = await apiClient.get<BusinessMetricsResponse>(
          apiConfig.endpoints.businessMetrics.realtime,
          filters
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    // More frequent updates for real-time metrics
    staleTime: intervalMs / 2,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: intervalMs,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Dashboard metrics aggregation hook
export const useDashboardMetrics = (dashboardId?: string) => {
  const overview = useBusinessMetrics();
  const kpis = useKPIs({ limit: 10 }); // Get top 10 KPIs
  const realtime = useRealTimeMetrics(undefined, 60000); // Update every minute

  return {
    // Individual queries
    overview,
    kpis,
    realtime,

    // Combined loading state
    isLoading: overview.isLoading || kpis.isLoading || realtime.isLoading,
    isError: overview.isError || kpis.isError || realtime.isError,
    error: overview.error || kpis.error || realtime.error,

    // Combined data
    data: {
      overview: overview.data,
      kpis: kpis.data,
      realtime: realtime.data,
    },

    // Combined actions
    refetch: () => {
      overview.refetch();
      kpis.refetch();
      realtime.refetch();
    },

    // Dashboard-specific metrics
    isHealthy:
      overview.data?.status === "healthy" &&
      !overview.data?.alerts?.some((alert) => alert.severity === "critical"),

    // Key metrics summary
    totalUsers: overview.data?.totalUsers || 0,
    totalDocuments: overview.data?.totalDocuments || 0,
    totalCollections: overview.data?.totalCollections || 0,
    systemLoad: realtime.data?.systemLoad || 0,

    // Performance indicators
    responseTime: realtime.data?.averageResponseTime || 0,
    errorRate: realtime.data?.errorRate || 0,
    uptime: overview.data?.uptime || 100,
  };
};

// Metrics comparison hook (period over period)
export const useMetricsComparison = (
  currentPeriod: AnalyticsReportRequest,
  previousPeriod: AnalyticsReportRequest,
  enabled: boolean = true
) => {
  const currentReport = useAnalyticsReport(currentPeriod, enabled);
  const previousReport = useAnalyticsReport(previousPeriod, enabled);

  return {
    current: currentReport,
    previous: previousReport,

    // Comparison state
    isLoading: currentReport.isLoading || previousReport.isLoading,
    isError: currentReport.isError || previousReport.isError,
    error: currentReport.error || previousReport.error,

    // Comparison calculations
    comparison:
      currentReport.data && previousReport.data
        ? {
            userGrowth: calculateGrowthRate(
              currentReport.data.totalUsers,
              previousReport.data.totalUsers
            ),
            documentGrowth: calculateGrowthRate(
              currentReport.data.totalDocuments,
              previousReport.data.totalDocuments
            ),
            collectionGrowth: calculateGrowthRate(
              currentReport.data.totalCollections,
              previousReport.data.totalCollections
            ),
            queryGrowth: calculateGrowthRate(
              currentReport.data.totalQueries,
              previousReport.data.totalQueries
            ),
            // Add more comparison metrics as needed
          }
        : null,

    // Trend indicators
    trends:
      currentReport.data && previousReport.data
        ? {
            isUserGrowthPositive:
              currentReport.data.totalUsers > previousReport.data.totalUsers,
            isDocumentGrowthPositive:
              currentReport.data.totalDocuments >
              previousReport.data.totalDocuments,
            isCollectionGrowthPositive:
              currentReport.data.totalCollections >
              previousReport.data.totalCollections,
            isQueryGrowthPositive:
              currentReport.data.totalQueries >
              previousReport.data.totalQueries,
          }
        : null,
  };
};

// Helper function for growth rate calculation
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Metrics alerts hook
export const useMetricsAlerts = () => {
  const cacheConfig = cacheStrategies.businessMetrics;

  return useQuery<any>({
    queryKey: queryKeys.businessMetrics.alerts(),
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          apiConfig.endpoints.businessMetrics.alerts
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    // Poll alerts more frequently
    staleTime: 10000, // 10 seconds
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 15000, // Check every 15 seconds
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};
