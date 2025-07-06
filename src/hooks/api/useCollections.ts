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
  CollectionsResponse,
  CollectionResponse,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CollectionDocumentsResponse,
  AddDocumentToCollectionRequest,
  CollectionSearchRequest,
  CollectionSearchResponse,
  PaginationParams,
} from "@/types/api";

// Collections list hook
export const useCollections = (params?: PaginationParams) => {
  const cacheConfig = cacheStrategies.collections;

  return useQuery<CollectionsResponse>({
    queryKey: queryKeys.collections.list(params),
    queryFn: async (): Promise<CollectionsResponse> => {
      try {
        const response = await apiClient.get<CollectionsResponse>(
          apiConfig.endpoints.collections.list,
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

// Collection detail hook
export const useCollection = (id: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.collections;

  return useQuery<CollectionResponse>({
    queryKey: queryKeys.collections.detail(id),
    queryFn: async (): Promise<CollectionResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.detail,
          { id }
        );
        const response = await apiClient.get<CollectionResponse>(url);
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

// Collection documents hook
export const useCollectionDocuments = (
  collectionId: string,
  params?: PaginationParams,
  enabled: boolean = true
) => {
  const cacheConfig = cacheStrategies.collections;

  return useQuery<CollectionDocumentsResponse>({
    queryKey: queryKeys.collections.documents(collectionId, params),
    queryFn: async (): Promise<CollectionDocumentsResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.documents,
          { id: collectionId }
        );
        const response = await apiClient.get<CollectionDocumentsResponse>(
          url,
          params
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: enabled && !!collectionId,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Collection search hook
export const useCollectionSearch = (searchParams: CollectionSearchRequest) => {
  const cacheConfig = cacheStrategies.collections;

  return useQuery<CollectionSearchResponse>({
    queryKey: queryKeys.collections.search(searchParams),
    queryFn: async (): Promise<CollectionSearchResponse> => {
      try {
        const response = await apiClient.get<CollectionSearchResponse>(
          apiConfig.endpoints.collections.search,
          searchParams
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !!searchParams.query,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
    refetchOnMount: cacheConfig.refetchOnMount,
    refetchOnReconnect: cacheConfig.refetchOnReconnect,
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
  });
};

// Create collection mutation
export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.collections;

  return useMutation<CollectionResponse, Error, CreateCollectionRequest>({
    mutationFn: async (
      collectionData: CreateCollectionRequest
    ): Promise<CollectionResponse> => {
      try {
        const response = await apiClient.post<CollectionResponse>(
          apiConfig.endpoints.collections.create,
          collectionData
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data) => {
      // Add the new collection to lists
      cacheInvalidation.invalidateCollectionLists(queryClient);

      // Set the new collection in cache
      queryClient.setQueryData(
        queryKeys.collections.detail(data.collection.id),
        data
      );
    },
  });
};

// Update collection mutation
export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.collections;

  return useMutation<
    CollectionResponse,
    Error,
    { id: string; updates: UpdateCollectionRequest }
  >({
    mutationFn: async ({ id, updates }): Promise<CollectionResponse> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.detail,
          { id }
        );
        const response = await apiClient.patch<CollectionResponse>(
          url,
          updates
        );
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (data, { id }) => {
      // Update the specific collection in cache
      queryClient.setQueryData(queryKeys.collections.detail(id), data);

      // Invalidate collection lists to reflect changes
      cacheInvalidation.invalidateCollectionLists(queryClient);
    },
  });
};

// Delete collection mutation
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.collections;

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.delete,
          { id }
        );
        await apiClient.delete(url);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, collectionId) => {
      // Remove the specific collection from cache
      queryClient.removeQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });

      // Remove collection documents
      queryClient.removeQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("collections") &&
            queryKey.includes("documents") &&
            queryKey.includes(collectionId)
          );
        },
      });

      // Invalidate collection lists
      cacheInvalidation.invalidateCollectionLists(queryClient);
    },
  });
};

// Add document to collection mutation
export const useAddDocumentToCollection = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.collections;

  return useMutation<void, Error, AddDocumentToCollectionRequest>({
    mutationFn: async (
      request: AddDocumentToCollectionRequest
    ): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.addDocument,
          { id: request.collectionId }
        );
        await apiClient.post(url, { documentId: request.documentId });
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, { collectionId, documentId }) => {
      // Invalidate collection documents
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.documents(collectionId),
      });

      // Invalidate the collection details to update document count
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });

      // Invalidate the document details to show new collection association
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.detail(documentId),
      });
    },
  });
};

// Remove document from collection mutation
export const useRemoveDocumentFromCollection = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.collections;

  return useMutation<void, Error, { collectionId: string; documentId: string }>(
    {
      mutationFn: async ({ collectionId, documentId }): Promise<void> => {
        try {
          const url = buildUrl(
            apiConfig.api.baseUrl,
            apiConfig.endpoints.collections.removeDocument,
            { id: collectionId, documentId }
          );
          await apiClient.delete(url);
        } catch (error) {
          throw handleApiError(error);
        }
      },
      retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
      onSuccess: (_, { collectionId, documentId }) => {
        // Invalidate collection documents
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.documents(collectionId),
        });

        // Invalidate the collection details to update document count
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.detail(collectionId),
        });

        // Invalidate the document details to show removed collection association
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.detail(documentId),
        });
      },
    }
  );
};

// Bulk operations
export const useBulkAddDocumentsToCollection = () => {
  const queryClient = useQueryClient();
  const cacheConfig = cacheStrategies.collections;

  return useMutation<
    void,
    Error,
    { collectionId: string; documentIds: string[] }
  >({
    mutationFn: async ({ collectionId, documentIds }): Promise<void> => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.bulkAddDocuments,
          { id: collectionId }
        );
        await apiClient.post(url, { documentIds });
      } catch (error) {
        throw handleApiError(error);
      }
    },
    retry: typeof cacheConfig.retry === "number" ? cacheConfig.retry : 3,
    onSuccess: (_, { collectionId, documentIds }) => {
      // Invalidate collection documents
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.documents(collectionId),
      });

      // Invalidate the collection details
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });

      // Invalidate all affected document details
      documentIds.forEach((documentId) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.detail(documentId),
        });
      });
    },
  });
};

// Collection analytics/stats hook (if your API provides this)
export const useCollectionStats = (id: string, enabled: boolean = true) => {
  const cacheConfig = cacheStrategies.collections;

  return useQuery<any>({
    queryKey: queryKeys.collections.stats(id),
    queryFn: async () => {
      try {
        const url = buildUrl(
          apiConfig.api.baseUrl,
          apiConfig.endpoints.collections.stats,
          { id }
        );
        const response = await apiClient.get(url);
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
