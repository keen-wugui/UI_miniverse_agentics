import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "../../../test/mocks/server";
import { http, HttpResponse } from "msw";
import { createTestQueryClient } from "../../../test/utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useCollections,
  useCollection,
  useCollectionDocuments,
  useCollectionSearch,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useAddDocumentToCollection,
  useRemoveDocumentFromCollection,
  useBulkAddDocumentsToCollection,
  useCollectionStats,
} from "../useCollections";

// Create wrapper component for tests
const createTestWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

// Mock data
const mockCollections = [
  {
    id: "collection-1",
    name: "Test Collection 1",
    description: "First test collection",
    documentCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["test", "collection"],
    metadata: {
      author: "Test User",
      category: "testing",
    },
  },
  {
    id: "collection-2",
    name: "Test Collection 2",
    description: "Second test collection",
    documentCount: 3,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    tags: ["test"],
    metadata: {},
  },
];

const mockDocuments = [
  {
    id: "doc-1",
    name: "Document 1",
    filename: "doc1.pdf",
    size: 1024000,
    type: "application/pdf",
    status: "completed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    extractedText: "Content 1",
    metadata: {},
    tags: [],
    collections: ["collection-1"],
  },
  {
    id: "doc-2",
    name: "Document 2",
    filename: "doc2.pdf",
    size: 512000,
    type: "application/pdf",
    status: "completed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    extractedText: "Content 2",
    metadata: {},
    tags: [],
    collections: ["collection-1"],
  },
];

describe("useCollections hooks", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    server.resetHandlers();
  });

  describe("useCollections", () => {
    it("should fetch collections list successfully", async () => {
      server.use(
        http.get(`${baseUrl}/collections`, () => {
          return HttpResponse.json({
            data: mockCollections,
            pagination: {
              page: 1,
              limit: 20,
              total: mockCollections.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          });
        })
      );

      const { result } = renderHook(() => useCollections(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.data).toEqual(mockCollections);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("should handle collections list error", async () => {
      server.use(
        http.get(`${baseUrl}/collections`, () => {
          return HttpResponse.json(
            { error: "Server Error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useCollections(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should pass pagination parameters correctly", async () => {
      server.use(
        http.get(`${baseUrl}/collections`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("page")).toBe("2");
          expect(url.searchParams.get("limit")).toBe("10");
          
          return HttpResponse.json({
            data: [],
            pagination: {
              page: 2,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: true,
            },
          });
        })
      );

      const { result } = renderHook(
        () => useCollections({ page: 2, limit: 10 }),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useCollection", () => {
    it("should fetch collection details successfully", async () => {
      const collectionId = "collection-1";
      const mockCollection = mockCollections[0];

      server.use(
        http.get(`${baseUrl}/collections/${collectionId}`, () => {
          return HttpResponse.json(mockCollection);
        })
      );

      const { result } = renderHook(() => useCollection(collectionId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockCollection);
    });

    it("should handle collection not found error", async () => {
      const collectionId = "non-existent";

      server.use(
        http.get(`${baseUrl}/collections/${collectionId}`, () => {
          return HttpResponse.json(
            { error: "Collection not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useCollection(collectionId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(() => useCollection("collection-1", false), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it("should not fetch when id is empty", () => {
      const { result } = renderHook(() => useCollection(""), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("useCollectionDocuments", () => {
    it("should fetch collection documents successfully", async () => {
      const collectionId = "collection-1";

      server.use(
        http.get(`${baseUrl}/collections/${collectionId}/documents`, () => {
          return HttpResponse.json({
            documents: mockDocuments,
            collection: mockCollections[0],
            pagination: {
              page: 1,
              limit: 20,
              total: mockDocuments.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          });
        })
      );

      const { result } = renderHook(
        () => useCollectionDocuments(collectionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.documents).toEqual(mockDocuments);
      expect(result.current.data?.collection).toEqual(mockCollections[0]);
    });

    it("should handle collection documents error", async () => {
      const collectionId = "collection-1";

      server.use(
        http.get(`${baseUrl}/collections/${collectionId}/documents`, () => {
          return HttpResponse.json(
            { error: "Access denied" },
            { status: 403 }
          );
        })
      );

      const { result } = renderHook(
        () => useCollectionDocuments(collectionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(
        () => useCollectionDocuments("collection-1", undefined, false),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("useCollectionSearch", () => {
    it("should search collections successfully", async () => {
      const searchParams = {
        query: "test",
        searchFields: ["name", "description"],
        fuzzy: true,
      };

      const mockSearchResults = {
        collections: [mockCollections[0]],
        total: 1,
        searchTime: 85,
        suggestions: [],
      };

      server.use(
        http.get(`${baseUrl}/collections/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("query")).toBe("test");
          
          return HttpResponse.json(mockSearchResults);
        })
      );

      const { result } = renderHook(() => useCollectionSearch(searchParams), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockSearchResults);
    });

    it("should not search when query is empty", () => {
      const { result } = renderHook(
        () => useCollectionSearch({ query: "" }),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("useCreateCollection", () => {
    it("should create collection successfully", async () => {
      const newCollectionData = {
        name: "New Collection",
        description: "A new test collection",
        tags: ["new", "test"],
        metadata: { category: "testing" },
      };

      const createdCollection = {
        id: "collection-3",
        ...newCollectionData,
        documentCount: 0,
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-03T00:00:00Z",
      };

      server.use(
        http.post(`${baseUrl}/collections`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(newCollectionData);
          
          return HttpResponse.json(createdCollection, { status: 201 });
        })
      );

      const { result } = renderHook(() => useCreateCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(newCollectionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(createdCollection);
    });

    it("should handle creation errors", async () => {
      const newCollectionData = {
        name: "Invalid Collection",
        description: "",
      };

      server.use(
        http.post(`${baseUrl}/collections`, () => {
          return HttpResponse.json(
            { error: "Validation failed", details: "Name already exists" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useCreateCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(newCollectionData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useUpdateCollection", () => {
    it("should update collection successfully", async () => {
      const collectionId = "collection-1";
      const updates = {
        name: "Updated Collection Name",
        description: "Updated description",
        tags: ["updated", "test"],
      };

      const updatedCollection = {
        ...mockCollections[0],
        ...updates,
        updatedAt: "2024-01-03T00:00:00Z",
      };

      server.use(
        http.patch(`${baseUrl}/collections/${collectionId}`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(updates);
          
          return HttpResponse.json(updatedCollection);
        })
      );

      const { result } = renderHook(() => useUpdateCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ id: collectionId, updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedCollection);
    });

    it("should handle update errors", async () => {
      const collectionId = "collection-1";
      const updates = { name: "" };

      server.use(
        http.patch(`${baseUrl}/collections/${collectionId}`, () => {
          return HttpResponse.json(
            { error: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useUpdateCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ id: collectionId, updates });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useDeleteCollection", () => {
    it("should delete collection successfully", async () => {
      const collectionId = "collection-1";

      server.use(
        http.delete(`${baseUrl}/collections/${collectionId}`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useDeleteCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(collectionId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle delete errors", async () => {
      const collectionId = "collection-1";

      server.use(
        http.delete(`${baseUrl}/collections/${collectionId}`, () => {
          return HttpResponse.json(
            { error: "Collection not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useDeleteCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(collectionId);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useAddDocumentToCollection", () => {
    it("should add document to collection successfully", async () => {
      const collectionId = "collection-1";
      const documentId = "doc-3";

      server.use(
        http.post(`${baseUrl}/collections/${collectionId}/documents/${documentId}`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ documentId });
          
          return new HttpResponse(null, { status: 201 });
        })
      );

      const { result } = renderHook(() => useAddDocumentToCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentId });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle add document errors", async () => {
      const collectionId = "collection-1";
      const documentId = "doc-3";

      server.use(
        http.post(`${baseUrl}/collections/${collectionId}/documents/${documentId}`, () => {
          return HttpResponse.json(
            { error: "Document already in collection" },
            { status: 409 }
          );
        })
      );

      const { result } = renderHook(() => useAddDocumentToCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentId });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useRemoveDocumentFromCollection", () => {
    it("should remove document from collection successfully", async () => {
      const collectionId = "collection-1";
      const documentId = "doc-1";

      server.use(
        http.delete(`${baseUrl}/collections/${collectionId}/documents/${documentId}`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useRemoveDocumentFromCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentId });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle remove document errors", async () => {
      const collectionId = "collection-1";
      const documentId = "doc-1";

      server.use(
        http.delete(`${baseUrl}/collections/${collectionId}/documents/${documentId}`, () => {
          return HttpResponse.json(
            { error: "Document not in collection" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useRemoveDocumentFromCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentId });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useBulkAddDocumentsToCollection", () => {
    it("should bulk add documents to collection successfully", async () => {
      const collectionId = "collection-1";
      const documentIds = ["doc-3", "doc-4", "doc-5"];

      server.use(
        http.post(`${baseUrl}/collections/${collectionId}/documents/bulk`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ documentIds });
          
          return new HttpResponse(null, { status: 201 });
        })
      );

      const { result } = renderHook(() => useBulkAddDocumentsToCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentIds });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle bulk add errors", async () => {
      const collectionId = "collection-1";
      const documentIds = ["doc-3", "doc-4"];

      server.use(
        http.post(`${baseUrl}/collections/${collectionId}/documents/bulk`, () => {
          return HttpResponse.json(
            { error: "Some documents already in collection" },
            { status: 409 }
          );
        })
      );

      const { result } = renderHook(() => useBulkAddDocumentsToCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentIds });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle empty document list", async () => {
      const collectionId = "collection-1";
      const documentIds: string[] = [];

      server.use(
        http.post(`${baseUrl}/collections/${collectionId}/documents/bulk`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ documentIds: [] });
          
          return new HttpResponse(null, { status: 201 });
        })
      );

      const { result } = renderHook(() => useBulkAddDocumentsToCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ collectionId, documentIds });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useCollectionStats", () => {
    it("should fetch collection stats successfully", async () => {
      const collectionId = "collection-1";
      const mockStats = {
        totalDocuments: 5,
        totalSize: 2048000,
        averageSize: 409600,
        fileTypes: [
          { type: "application/pdf", count: 3 },
          { type: "text/plain", count: 2 },
        ],
        processingStatus: {
          completed: 4,
          processing: 1,
          failed: 0,
          pending: 0,
        },
        createdThisWeek: 2,
        lastUpdated: "2024-01-03T00:00:00Z",
      };

      server.use(
        http.get(`${baseUrl}/collections/${collectionId}/stats`, () => {
          return HttpResponse.json(mockStats);
        })
      );

      const { result } = renderHook(() => useCollectionStats(collectionId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockStats);
    });

    it("should handle stats errors", async () => {
      const collectionId = "collection-1";

      server.use(
        http.get(`${baseUrl}/collections/${collectionId}/stats`, () => {
          return HttpResponse.json(
            { error: "Stats not available" },
            { status: 503 }
          );
        })
      );

      const { result } = renderHook(() => useCollectionStats(collectionId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(
        () => useCollectionStats("collection-1", false),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("Cache Management", () => {
    it("should invalidate cache on successful creation", async () => {
      const newCollectionData = {
        name: "Cache Test Collection",
        description: "Testing cache invalidation",
      };

      const createdCollection = {
        id: "collection-cache",
        ...newCollectionData,
        documentCount: 0,
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-03T00:00:00Z",
        tags: [],
        metadata: {},
      };

      server.use(
        http.post(`${baseUrl}/collections`, () => {
          return HttpResponse.json(createdCollection, { status: 201 });
        })
      );

      const { result } = renderHook(() => useCreateCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(newCollectionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(createdCollection);
    });

    it("should invalidate cache on successful deletion", async () => {
      const collectionId = "collection-1";

      server.use(
        http.delete(`${baseUrl}/collections/${collectionId}`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useDeleteCollection(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(collectionId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      server.use(
        http.get(`${baseUrl}/collections`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useCollections(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should retry failed requests according to configuration", async () => {
      let attemptCount = 0;
      
      server.use(
        http.get(`${baseUrl}/collections`, () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.json(
              { error: "Server Error" },
              { status: 500 }
            );
          }
          return HttpResponse.json({
            data: mockCollections,
            pagination: {
              page: 1,
              limit: 20,
              total: mockCollections.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          });
        })
      );

      const { result } = renderHook(() => useCollections(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 10000 });

      expect(attemptCount).toBe(3);
      expect(result.current.data?.data).toEqual(mockCollections);
    });
  });
});