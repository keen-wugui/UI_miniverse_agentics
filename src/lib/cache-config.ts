import type {
  QueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import apiConfig from "@/config/api-config.json";

// Cache configuration types
export interface CacheConfig {
  staleTime: number;
  gcTime: number; // Formerly cacheTime in React Query v4
  refetchOnWindowFocus: boolean;
  refetchOnMount: boolean;
  refetchOnReconnect: boolean;
  retry: number | boolean | ((failureCount: number, error: Error) => boolean);
  retryDelay: number | ((retryAttempt: number) => number);
}

export interface CacheStrategy {
  health: CacheConfig;
  documents: CacheConfig;
  collections: CacheConfig;
  workflows: CacheConfig;
  rag: CacheConfig;
  businessMetrics: CacheConfig;
}

// Convert API config caching to React Query config
const createCacheConfig = (apiCacheConfig: any): CacheConfig => ({
  staleTime: apiCacheConfig.staleTime || 0,
  gcTime: apiCacheConfig.cacheTime || 5 * 60 * 1000, // 5 minutes default
  refetchOnWindowFocus: apiCacheConfig.refetchOnWindowFocus ?? true,
  refetchOnMount: apiCacheConfig.refetchOnMount ?? true,
  refetchOnReconnect: apiCacheConfig.refetchOnReconnect ?? true,
  retry: apiCacheConfig.retryAttempts || 3,
  retryDelay: (retryAttempt: number) =>
    Math.min(1000 * 2 ** retryAttempt, 30000),
});

// Create cache strategies from API config
export const cacheStrategies: CacheStrategy = {
  health: createCacheConfig(apiConfig.cache.strategies.health),
  documents: createCacheConfig(apiConfig.cache.strategies.documents),
  collections: createCacheConfig(apiConfig.cache.strategies.collections),
  workflows: createCacheConfig(apiConfig.cache.strategies.workflows),
  rag: createCacheConfig(apiConfig.cache.strategies.rag),
  businessMetrics: createCacheConfig(
    apiConfig.cache.strategies.businessMetrics
  ),
};

// Query key factories
export const queryKeys = {
  // Health queries
  health: {
    all: ["health"] as const,
    status: () => [...queryKeys.health.all, "status"] as const,
    database: () => [...queryKeys.health.all, "database"] as const,
    databaseMetrics: () =>
      [...queryKeys.health.all, "database", "metrics"] as const,
  },

  // Document queries
  documents: {
    all: ["documents"] as const,
    lists: () => [...queryKeys.documents.all, "list"] as const,
    list: (params?: any) => [...queryKeys.documents.lists(), params] as const,
    details: () => [...queryKeys.documents.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    search: (params: any) =>
      [...queryKeys.documents.all, "search", params] as const,
    extraction: (id: string) =>
      [...queryKeys.documents.detail(id), "extraction"] as const,
  },

  // Collection queries
  collections: {
    all: ["collections"] as const,
    lists: () => [...queryKeys.collections.all, "list"] as const,
    list: (params?: any) => [...queryKeys.collections.lists(), params] as const,
    details: () => [...queryKeys.collections.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.collections.details(), id] as const,
    search: (params: any) =>
      [...queryKeys.collections.all, "search", params] as const,
    documents: (id: string, params?: any) =>
      [...queryKeys.collections.detail(id), "documents", params] as const,
  },

  // Workflow queries
  workflows: {
    all: ["workflows"] as const,
    lists: () => [...queryKeys.workflows.all, "list"] as const,
    list: (params?: any) => [...queryKeys.workflows.lists(), params] as const,
    details: () => [...queryKeys.workflows.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.workflows.details(), id] as const,
    executions: {
      all: (workflowId: string) =>
        [...queryKeys.workflows.detail(workflowId), "executions"] as const,
      list: (workflowId: string, params?: any) =>
        [
          ...queryKeys.workflows.executions.all(workflowId),
          "list",
          params,
        ] as const,
      detail: (workflowId: string, executionId: string) =>
        [
          ...queryKeys.workflows.executions.all(workflowId),
          executionId,
        ] as const,
    },
  },

  // RAG queries
  rag: {
    all: ["rag"] as const,
    config: () => [...queryKeys.rag.all, "config"] as const,
    query: (params: any) => [...queryKeys.rag.all, "query", params] as const,
    chat: {
      all: ["rag", "chat"] as const,
      conversation: (conversationId: string) =>
        [...queryKeys.rag.chat.all, conversationId] as const,
    },
  },

  // Business metrics queries
  businessMetrics: {
    all: ["business-metrics"] as const,
    summary: () => [...queryKeys.businessMetrics.all, "summary"] as const,
    performance: (timeRange?: string) =>
      [...queryKeys.businessMetrics.all, "performance", timeRange] as const,
    usage: (timeRange?: string) =>
      [...queryKeys.businessMetrics.all, "usage", timeRange] as const,
    cost: (timeRange?: string) =>
      [...queryKeys.businessMetrics.all, "cost", timeRange] as const,
  },
} as const;

// Default query options factory
export const createQueryOptions = <T = unknown>(
  strategy: keyof CacheStrategy,
  overrides: Partial<UseQueryOptions<T, Error>> = {}
): Partial<UseQueryOptions<T, Error>> => {
  const cacheConfig = cacheStrategies[strategy];

  return {
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    retryDelay: cacheConfig.retryDelay,
    ...overrides,
  };
};

// Default mutation options factory
export const createMutationOptions = <
  TData = unknown,
  TError = Error,
  TVariables = unknown,
>(
  strategy: keyof CacheStrategy,
  overrides: Partial<UseMutationOptions<TData, TError, TVariables>> = {}
): UseMutationOptions<TData, TError, TVariables> => {
  const cacheConfig = cacheStrategies[strategy];

  return {
    retry: cacheConfig.retry,
    retryDelay: cacheConfig.retryDelay,
    ...overrides,
  };
};

// Cache invalidation utilities
export const cacheInvalidation = {
  // Health invalidations
  invalidateHealth: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.health.all });
  },

  // Document invalidations
  invalidateDocuments: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
  },

  invalidateDocumentLists: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.documents.lists(),
    });
  },

  invalidateDocument: (queryClient: QueryClient, id: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.documents.detail(id),
    });
  },

  // Collection invalidations
  invalidateCollections: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.collections.all,
    });
  },

  invalidateCollectionLists: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.collections.lists(),
    });
  },

  invalidateCollection: (queryClient: QueryClient, id: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.collections.detail(id),
    });
  },

  // Workflow invalidations
  invalidateWorkflows: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
  },

  invalidateWorkflow: (queryClient: QueryClient, id: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.workflows.detail(id),
    });
  },

  invalidateWorkflowExecutions: (
    queryClient: QueryClient,
    workflowId: string
  ) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.workflows.executions.all(workflowId),
    });
  },

  // RAG invalidations
  invalidateRAGConfig: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.rag.config() });
  },

  invalidateRAGQueries: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.rag.all });
  },

  // Business metrics invalidations
  invalidateBusinessMetrics: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.businessMetrics.all,
    });
  },
};

// Cache prefetching utilities
export const cachePrefetch = {
  // Prefetch health status (commonly accessed)
  prefetchHealthStatus: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.health.status(),
      ...createQueryOptions("health"),
    });
  },

  // Prefetch document lists for quick navigation
  prefetchDocumentLists: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.documents.lists(),
      ...createQueryOptions("documents"),
    });
  },

  // Prefetch collection lists
  prefetchCollectionLists: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.collections.lists(),
      ...createQueryOptions("collections"),
    });
  },

  // Prefetch business metrics summary
  prefetchBusinessSummary: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.businessMetrics.summary(),
      ...createQueryOptions("businessMetrics"),
    });
  },
};

// Cache warming on app startup
export const warmCache = async (queryClient: QueryClient) => {
  try {
    await Promise.allSettled([
      cachePrefetch.prefetchHealthStatus(queryClient),
      cachePrefetch.prefetchDocumentLists(queryClient),
      cachePrefetch.prefetchCollectionLists(queryClient),
      cachePrefetch.prefetchBusinessSummary(queryClient),
    ]);
  } catch (error) {
    console.warn("Cache warming failed:", error);
  }
};

// Background sync utilities
export const backgroundSync = {
  // Refresh critical data in background
  refreshCriticalData: (queryClient: QueryClient) => {
    // Refresh health status
    queryClient.refetchQueries({ queryKey: queryKeys.health.status() });

    // Refresh business metrics
    queryClient.refetchQueries({
      queryKey: queryKeys.businessMetrics.summary(),
    });
  },

  // Setup periodic background refresh
  setupBackgroundRefresh: (
    queryClient: QueryClient,
    intervalMs: number = 5 * 60 * 1000
  ) => {
    const interval = setInterval(() => {
      backgroundSync.refreshCriticalData(queryClient);
    }, intervalMs);

    return () => clearInterval(interval);
  },
};

// Cache debugging utilities
export const cacheDebug = {
  // Log cache status
  logCacheStatus: (queryClient: QueryClient) => {
    const cache = queryClient.getQueryCache();
    console.log("Query Cache Status:", {
      totalQueries: cache.getAll().length,
      stalQueries: cache.getAll().filter((query) => query.isStale()).length,
      freshQueries: cache.getAll().filter((query) => !query.isStale()).length,
      errorQueries: cache
        .getAll()
        .filter((query) => query.state.status === "error").length,
    });
  },

  // Clear all cache
  clearAllCache: (queryClient: QueryClient) => {
    queryClient.clear();
    console.log("All cache cleared");
  },

  // Log specific query status
  logQueryStatus: (queryClient: QueryClient, queryKey: any[]) => {
    const query = queryClient.getQueryState(queryKey);
    console.log("Query Status:", { queryKey, state: query });
  },
};

// Optimistic updates utilities
export const optimisticUpdates = {
  // Document optimistic updates
  updateDocumentOptimistically: (
    queryClient: QueryClient,
    documentId: string,
    updateData: Partial<any>
  ) => {
    queryClient.setQueryData(
      queryKeys.documents.detail(documentId),
      (oldData: any) => ({
        ...oldData,
        ...updateData,
      })
    );
  },

  // Collection optimistic updates
  updateCollectionOptimistically: (
    queryClient: QueryClient,
    collectionId: string,
    updateData: Partial<any>
  ) => {
    queryClient.setQueryData(
      queryKeys.collections.detail(collectionId),
      (oldData: any) => ({
        ...oldData,
        ...updateData,
      })
    );
  },

  // Add document to collection optimistically
  addDocumentToCollectionOptimistically: (
    queryClient: QueryClient,
    collectionId: string,
    document: any
  ) => {
    queryClient.setQueryData(
      queryKeys.collections.documents(collectionId),
      (oldData: any) => ({
        ...oldData,
        data: [...(oldData?.data || []), document],
        pagination: {
          ...oldData?.pagination,
          total: (oldData?.pagination?.total || 0) + 1,
        },
      })
    );
  },
};

// All exports are already declared above
