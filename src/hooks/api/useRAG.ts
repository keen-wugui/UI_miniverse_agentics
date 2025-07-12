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
  RAGQueryRequest,
  RAGQueryResponse,
  RAGIndexRequest,
  RAGIndexResponse,
  RAGIndexStatusResponse,
  RAGGenerateRequest,
  RAGGenerateResponse,
  RAGSourcesResponse,
  RAGConfigurationResponse,
  UpdateRAGConfigRequest,
  PaginationParams,
} from "@/types/api";

// RAG query hook - main retrieval and generation
export const useRAGQuery = () => {
  const cacheConfig = cacheStrategies.rag;

  return useMutation<RAGQueryResponse, Error, RAGQueryRequest>({
    mutationFn: async (
      queryData: RAGQueryRequest
    ): Promise<RAGQueryResponse> => {
      try {
        const response = await apiClient.post<RAGQueryResponse>(
          apiConfig.endpoints.rag.query,
          queryData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// RAG generation hook - text generation without retrieval
export const useRAGGenerate = () => {
  const cacheConfig = cacheStrategies.rag;

  return useMutation<RAGGenerateResponse, Error, RAGGenerateRequest>({
    mutationFn: async (
      generateData: RAGGenerateRequest
    ): Promise<RAGGenerateResponse> => {
      try {
        const response = await apiClient.post<RAGGenerateResponse>(
          apiConfig.endpoints.rag.generate,
          generateData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// RAG index creation hook
export const useCreateRAGIndex = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.rag;

  return useMutation<RAGIndexResponse, Error, RAGIndexRequest>({
    mutationFn: async (
      indexData: RAGIndexRequest
    ): Promise<RAGIndexResponse> => {
      try {
        const response = await apiClient.post<RAGIndexResponse>(
          apiConfig.endpoints.rag.index,
          indexData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data) => {
      // Invalidate index lists and configuration
      queryClient.invalidateQueries({
        queryKey: queryKeys.rag.configuration(),
      });

      // Set the index status in cache for tracking
      queryClient.setQueryData(queryKeys.rag.indexStatus(data.indexId), {
        status: "processing",
        progress: 0,
      });
    },
  });
};

// RAG index status hook
export const useRAGIndexStatus = (indexId: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.rag;

  return useQuery<RAGIndexStatusResponse>({
    queryKey: queryKeys.rag.indexStatus(indexId),
    queryFn: async (): Promise<RAGIndexStatusResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.rag.indexStatus,
          { indexId }
        );
        const response = await apiClient.get<RAGIndexStatusResponse>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!indexId,
    // More frequent polling for indexing status
    staleTime: 3000, // 3 seconds
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: (query) => {
      // Poll while indexing is in progress
      const data = query.state.data;
      if (data?.status === "processing" || data?.status === "pending") {
        return 3000; // Poll every 3 seconds
      }
      return false; // Don't poll for completed/failed indexes
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// RAG sources hook - get sources used in responses
export const useRAGSources = (queryId: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.rag;

  return useQuery<RAGSourcesResponse>({
    queryKey: queryKeys.rag.sources(queryId),
    queryFn: async (): Promise<RAGSourcesResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.rag.sources,
          { queryId }
        );
        const response = await apiClient.get<RAGSourcesResponse>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!queryId,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// RAG configuration hook
export const useRAGConfiguration = () => {
  const cacheConfig = cacheStrategies.rag;

  return useQuery<RAGConfigurationResponse>({
    queryKey: queryKeys.rag.configuration(),
    queryFn: async (): Promise<RAGConfigurationResponse> => {
      try {
        const response = await apiClient.get<RAGConfigurationResponse>(
          apiConfig.endpoints.rag.configuration
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

// Update RAG configuration hook
export const useUpdateRAGConfiguration = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.rag;

  return useMutation<RAGConfigurationResponse, Error, UpdateRAGConfigRequest>({
    mutationFn: async (
      configData: UpdateRAGConfigRequest
    ): Promise<RAGConfigurationResponse> => {
      try {
        const response = await apiClient.patch<RAGConfigurationResponse>(
          apiConfig.endpoints.rag.configuration,
          configData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data) => {
      // Update the configuration in cache
      queryClient.setQueryData(queryKeys.rag.configuration(), data);
    },
  });
};

// Delete RAG index hook
export const useDeleteRAGIndex = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.rag;

  return useMutation<void, Error, string>({
    mutationFn: async (indexId: string): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.rag.deleteIndex,
          { indexId }
        );
        await apiClient.delete(url);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, indexId) => {
      // Remove the index status from cache
      queryClient.removeQueries({
        queryKey: queryKeys.rag.indexStatus(indexId),
      });

      // Invalidate configuration to update index lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.rag.configuration(),
      });
    },
  });
};

// Rebuild RAG index hook
export const useRebuildRAGIndex = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.rag;

  return useMutation<RAGIndexResponse, Error, string>({
    mutationFn: async (indexId: string): Promise<RAGIndexResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.rag.rebuildIndex,
          { indexId }
        );
        const response = await apiClient.post<RAGIndexResponse>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data, indexId) => {
      // Update the index status to show rebuilding
      queryClient.setQueryData(queryKeys.rag.indexStatus(indexId), {
        status: "processing",
        progress: 0,
      });

      // Invalidate configuration
      queryClient.invalidateQueries({
        queryKey: queryKeys.rag.configuration(),
      });
    },
  });
};

// Hook for RAG query with automatic source fetching
export const useRAGQueryWithSources = () => {
  const ragQuery = useRAGQuery();
  const queryClient = useQueryClient();

  return {
    ...ragQuery,
    mutateAsync: async (queryData: RAGQueryRequest) => {
      const result = await ragQuery.mutateAsync(queryData);

      // Automatically fetch and cache sources if available
      if (result.queryId) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.rag.sources(result.queryId),
          queryFn: async () => {
            try {
              const url = buildUrl(
                apiConfig.api.baseUrl,
                apiConfig.endpoints.rag.sources,
                { queryId: result.queryId }
              );
              const response = await apiClient.get<RAGSourcesResponse>(url);
              return response.data;
            } catch (error) {
              // Don't throw error for sources, just log it
              console.warn("Failed to fetch RAG sources:", error);
              return null;
            }
          },
        });
      }

      return result;
    },
  };
};

// Hook for tracking RAG index operations
export const useRAGIndexTracking = (
  indexId: string,
  enabled: boolean = true
) => {
  const indexStatus = useRAGIndexStatus(indexId, enabled);

  return {
    ...indexStatus,

    // Index state helpers
    isPending: indexStatus.data?.status === "pending",
    isProcessing: indexStatus.data?.status === "processing",
    isCompleted: indexStatus.data?.status === "completed",
    isFailed: indexStatus.data?.status === "failed",

    // Progress information
    progress: indexStatus.data?.progress || 0,
    documentsProcessed: indexStatus.data?.documentsProcessed || 0,
    totalDocuments: indexStatus.data?.totalDocuments || 0,

    // Timing information
    startedAt: indexStatus.data?.completedAt,
    completedAt: indexStatus.data?.completedAt,
    
    // Error information
    errorMessage: indexStatus.data?.errorMessage,

    // Whether the index operation is still active
    isActive:
      indexStatus.data?.status === "processing" ||
      indexStatus.data?.status === "pending",
  };
};

// Batch RAG operations hook
export const useBatchRAGOperations = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.rag;

  const batchQuery = useMutation<RAGQueryResponse[], Error, RAGQueryRequest[]>({
    mutationFn: async (
      queries: RAGQueryRequest[]
    ): Promise<RAGQueryResponse[]> => {
      try {
        const response = await apiClient.post<RAGQueryResponse[]>(
          apiConfig.endpoints.rag.batchQuery,
          { queries }
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });

  const batchIndex = useMutation<RAGIndexResponse[], Error, RAGIndexRequest[]>({
    mutationFn: async (
      indexRequests: RAGIndexRequest[]
    ): Promise<RAGIndexResponse[]> => {
      try {
        const response = await apiClient.post<RAGIndexResponse[]>(
          apiConfig.endpoints.rag.batchIndex,
          { requests: indexRequests }
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data) => {
      // Set status for all created indexes
      data.forEach((indexResponse) => {
        queryClient.setQueryData(
          queryKeys.rag.indexStatus(indexResponse.indexId),
          { status: "processing", progress: 0 }
        );
      });

      // Invalidate configuration
      queryClient.invalidateQueries({
        queryKey: queryKeys.rag.configuration(),
      });
    },
  });

  return {
    batchQuery,
    batchIndex,
  };
};
