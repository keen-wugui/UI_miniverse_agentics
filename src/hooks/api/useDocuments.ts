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
  DocumentsResponse,
  DocumentResponse,
  DocumentSearchResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentExtractionResult,
  DocumentSearchRequest,
  PaginationParams,
} from "@/types/api";

// Document list hook
export const useDocuments = (params?: PaginationParams) => {
  const cacheConfig = cacheStrategies.documents;

  return useQuery<DocumentsResponse>({
    queryKey: queryKeys.documents.list(params),
    queryFn: async (): Promise<DocumentsResponse> => {
      try {
        const response = await apiClient.get<DocumentsResponse>(
          apiConfig.endpoints.documents.list,
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

// Document detail hook
export const useDocument = (id: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.documents;

  return useQuery<DocumentResponse>({
    queryKey: queryKeys.documents.detail(id),
    queryFn: async (): Promise<DocumentResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.documents.detail,
          { id }
        );
        const response = await apiClient.get<DocumentResponse>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!id,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Document search hook
export const useDocumentSearch = (searchParams: DocumentSearchRequest) => {
  const cacheConfig = cacheStrategies.documents;

  return useQuery<DocumentSearchResponse>({
    queryKey: queryKeys.documents.search(searchParams),
    queryFn: async (): Promise<DocumentSearchResponse> => {
      try {
        const response = await apiClient.get<DocumentSearchResponse>(
          apiConfig.endpoints.documents.search,
          searchParams
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !!searchParams.query || !!searchParams.contentQuery,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Document extraction hook
export const useDocumentExtraction = (id: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.documents;

  return useQuery<DocumentExtractionResult>({
    queryKey: queryKeys.documents.extraction(id),
    queryFn: async (): Promise<DocumentExtractionResult> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.documents.extract,
          { id }
        );
        const response = await apiClient.get<DocumentExtractionResult>(url);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!id,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Document upload mutation
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.documents;

  return useMutation<DocumentUploadResponse, Error, DocumentUploadRequest>({
    mutationFn: async (
      uploadData: DocumentUploadRequest
    ): Promise<DocumentUploadResponse> => {
      try {
        const response = await apiClient.uploadFile<DocumentUploadResponse>(
          apiConfig.endpoints.documents.upload,
          uploadData.file,
          {
            name: uploadData.name,
            tags: uploadData.tags?.join(","),
            metadata: uploadData.metadata
              ? JSON.stringify(uploadData.metadata)
              : undefined,
            collections: uploadData.collections?.join(","),
          }
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data) => {
      // Invalidate document lists to show the new document
      cacheInvalidation.invalidateDocumentLists(queryClient);

      // If collections were specified, invalidate those as well
      if (data.document.collections) {
        data.document.collections.forEach((collectionId) => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.collections.documents(collectionId),
          });
        });
      }
    },
  });
};

// Document delete mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.documents;

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.documents.delete,
          { id }
        );
        await apiClient.delete(url);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, documentId) => {
      // Remove the specific document from cache
      queryClient.removeQueries({
        queryKey: queryKeys.documents.detail(documentId),
      });

      // Invalidate document lists
      cacheInvalidation.invalidateDocumentLists(queryClient);

      // Invalidate any collection document lists
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("collections") && queryKey.includes("documents")
          );
        },
      });
    },
  });
};

// Document update mutation (for metadata, tags, etc.)
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.documents;

  return useMutation<
    DocumentResponse,
    Error,
    { id: string; updates: Partial<any> }
  >({
    mutationFn: async ({ id, updates }): Promise<DocumentResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.documents.detail,
          { id }
        );
        const response = await apiClient.patch<DocumentResponse>(url, updates);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data, { id }) => {
      // Update the specific document in cache
      queryClient.setQueryData(queryKeys.documents.detail(id), data);

      // Update the document in any lists that might contain it
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey.includes("documents") && queryKey.includes("list");
        },
      });
    },
  });
};

// Bulk document operations
export const useBulkDeleteDocuments = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.documents;

  return useMutation<void, Error, string[]>({
    mutationFn: async (documentIds: string[]): Promise<void> => {
      try {
        // Execute delete operations in parallel
        await Promise.all(
          documentIds.map(async (id) => {
            const url = buildUrl(
              apiConfig.api.baseUrl,
              apiConfig.endpoints.documents.delete,
              { id }
            );
            return apiClient.delete(url);
          })
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, documentIds) => {
      // Remove all deleted documents from cache
      documentIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: queryKeys.documents.detail(id) });
      });

      // Invalidate all document-related queries
      cacheInvalidation.invalidateDocuments(queryClient);
    },
  });
};

// Hook for checking document processing status
export const useDocumentProcessingStatus = (
  id: string,
  enabled: boolean = true
) => {
  const document = useDocument(id, enabled);

  return {
    ...document,
    isProcessing: document.data?.status === "processing",
    isPending: document.data?.status === "pending",
    isCompleted: document.data?.status === "completed",
    isFailed: document.data?.status === "failed",
    progress: document.data?.processingProgress,
    errorMessage: document.data?.errorMessage,
  };
};
