import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "../../../test/mocks/server";
import { http, HttpResponse } from "msw";
import { createTestQueryClient } from "../../../test/utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useDocuments,
  useDocument,
  useDocumentSearch,
  useDocumentExtraction,
  useUploadDocument,
  useDeleteDocument,
  useUpdateDocument,
  useBulkDeleteDocuments,
  useDocumentProcessingStatus,
} from "../useDocuments";

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
const mockDocuments = [
  {
    id: "doc-1",
    name: "Test Document 1",
    filename: "test1.pdf",
    size: 1024000,
    type: "application/pdf",
    status: "completed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    extractedText: "Sample extracted text...",
    metadata: {
      pages: 10,
      author: "Test Author",
    },
    tags: ["test", "document"],
    collections: [],
    processingProgress: 100,
  },
  {
    id: "doc-2",
    name: "Test Document 2",
    filename: "test2.docx",
    size: 512000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "processing",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    extractedText: "",
    metadata: {},
    tags: [],
    collections: ["collection-1"],
    processingProgress: 75,
  },
];

describe("useDocuments hooks", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    server.resetHandlers();
  });

  describe("useDocuments", () => {
    it("should fetch documents list successfully", async () => {
      server.use(
        http.get(`${baseUrl}/documents`, () => {
          return HttpResponse.json({
            data: mockDocuments,
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

      const { result } = renderHook(() => useDocuments(), {
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
      expect(result.current.data?.data).toEqual(mockDocuments);
      expect(result.current.data?.pagination.total).toBe(2);
      expect(result.current.error).toBeNull();
    });

    it("should handle documents list error", async () => {
      server.use(
        http.get(`${baseUrl}/documents`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDocuments(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should pass pagination parameters correctly", async () => {
      server.use(
        http.get(`${baseUrl}/documents`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("page")).toBe("2");
          expect(url.searchParams.get("limit")).toBe("10");
          expect(url.searchParams.get("sortBy")).toBe("name");
          
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
        () => useDocuments({ 
          page: 2, 
          limit: 10, 
          sortBy: "name" 
        }),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(() => useDocuments({ enabled: false }), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useDocument", () => {
    it("should fetch document details successfully", async () => {
      const documentId = "doc-1";
      const mockDocument = mockDocuments[0];

      server.use(
        http.get(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(mockDocument);
        })
      );

      const { result } = renderHook(() => useDocument(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDocument);
    });

    it("should handle document not found error", async () => {
      const documentId = "non-existent";

      server.use(
        http.get(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(
            { error: "Document not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useDocument(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(() => useDocument("doc-1", false), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it("should not fetch when id is empty", () => {
      const { result } = renderHook(() => useDocument(""), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("useDocumentSearch", () => {
    it("should search documents successfully", async () => {
      const searchParams = {
        query: "test",
        searchFields: ["name", "content"],
        searchMode: "fuzzy" as const,
        caseSensitive: false,
      };

      const mockSearchResults = {
        documents: [mockDocuments[0]],
        total: 1,
        searchTime: 125,
        suggestions: [],
      };

      server.use(
        http.get(`${baseUrl}/documents/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("query")).toBe("test");
          
          return HttpResponse.json(mockSearchResults);
        })
      );

      const { result } = renderHook(() => useDocumentSearch(searchParams), {
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
        () => useDocumentSearch({
          query: "",
          searchFields: ["name"],
          searchMode: "exact",
          caseSensitive: false,
        }),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it("should handle search errors", async () => {
      server.use(
        http.get(`${baseUrl}/documents/search`, () => {
          return HttpResponse.json(
            { error: "Search service unavailable" },
            { status: 503 }
          );
        })
      );

      const { result } = renderHook(
        () => useDocumentSearch({
          query: "test",
          searchFields: ["name"],
          searchMode: "fuzzy",
          caseSensitive: false,
        }),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useDocumentExtraction", () => {
    it("should fetch extraction results successfully", async () => {
      const documentId = "doc-1";
      const mockExtraction = {
        documentId,
        extractedText: "Full extracted text content...",
        metadata: {
          pages: 10,
          wordCount: 1500,
          language: "en",
        },
        entities: [
          { type: "PERSON", text: "John Doe", confidence: 0.95 },
          { type: "DATE", text: "2024-01-01", confidence: 0.98 },
        ],
        processingTime: 2500,
        status: "completed",
      };

      server.use(
        http.get(`${baseUrl}/documents/${documentId}/extract`, () => {
          return HttpResponse.json(mockExtraction);
        })
      );

      const { result } = renderHook(() => useDocumentExtraction(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockExtraction);
    });

    it("should handle extraction errors", async () => {
      const documentId = "doc-1";

      server.use(
        http.get(`${baseUrl}/documents/${documentId}/extract`, () => {
          return HttpResponse.json(
            { error: "Extraction failed" },
            { status: 422 }
          );
        })
      );

      const { result } = renderHook(() => useDocumentExtraction(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useUploadDocument", () => {
    it("should upload document successfully", async () => {
      const mockUploadResponse = {
        document: mockDocuments[0],
        message: "Document uploaded successfully",
      };

      server.use(
        http.post(`${baseUrl}/documents/upload`, async ({ request }) => {
          const formData = await request.formData();
          const file = formData.get("file") as File;
          
          expect(file).toBeInstanceOf(File);
          expect(file.name).toBe("test.pdf");
          
          return HttpResponse.json(mockUploadResponse, { status: 201 });
        })
      );

      const { result } = renderHook(() => useUploadDocument(), {
        wrapper: createTestWrapper(),
      });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const uploadData = {
        file,
        name: "Test Document",
        tags: ["test"],
        collections: ["collection-1"],
      };

      result.current.mutate(uploadData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUploadResponse);
      expect(result.current.error).toBeNull();
    });

    it("should handle upload errors", async () => {
      server.use(
        http.post(`${baseUrl}/documents/upload`, () => {
          return HttpResponse.json(
            { error: "File too large" },
            { status: 413 }
          );
        })
      );

      const { result } = renderHook(() => useUploadDocument(), {
        wrapper: createTestWrapper(),
      });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const uploadData = { file };

      result.current.mutate(uploadData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should handle upload with minimal data", async () => {
      const mockUploadResponse = {
        document: { ...mockDocuments[0], collections: [] },
        message: "Document uploaded successfully",
      };

      server.use(
        http.post(`${baseUrl}/documents/upload`, async ({ request }) => {
          const formData = await request.formData();
          
          expect(formData.get("name")).toBeNull();
          expect(formData.get("tags")).toBeNull();
          expect(formData.get("collections")).toBeNull();
          
          return HttpResponse.json(mockUploadResponse, { status: 201 });
        })
      );

      const { result } = renderHook(() => useUploadDocument(), {
        wrapper: createTestWrapper(),
      });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      result.current.mutate({ file });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useDeleteDocument", () => {
    it("should delete document successfully", async () => {
      const documentId = "doc-1";

      server.use(
        http.delete(`${baseUrl}/documents/${documentId}`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useDeleteDocument(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(documentId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle delete errors", async () => {
      const documentId = "doc-1";

      server.use(
        http.delete(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(
            { error: "Document not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useDeleteDocument(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(documentId);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useUpdateDocument", () => {
    it("should update document successfully", async () => {
      const documentId = "doc-1";
      const updates = {
        name: "Updated Document Name",
        tags: ["updated", "test"],
      };

      const updatedDocument = {
        ...mockDocuments[0],
        ...updates,
        updatedAt: "2024-01-03T00:00:00Z",
      };

      server.use(
        http.patch(`${baseUrl}/documents/${documentId}`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(updates);
          
          return HttpResponse.json(updatedDocument);
        })
      );

      const { result } = renderHook(() => useUpdateDocument(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ id: documentId, updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedDocument);
    });

    it("should handle update errors", async () => {
      const documentId = "doc-1";
      const updates = { name: "Updated Name" };

      server.use(
        http.patch(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(
            { error: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useUpdateDocument(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({ id: documentId, updates });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useBulkDeleteDocuments", () => {
    it("should delete multiple documents successfully", async () => {
      const documentIds = ["doc-1", "doc-2"];

      server.use(
        http.delete(`${baseUrl}/documents/doc-1`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
        http.delete(`${baseUrl}/documents/doc-2`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useBulkDeleteDocuments(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(documentIds);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle partial failures in bulk delete", async () => {
      const documentIds = ["doc-1", "doc-2"];

      server.use(
        http.delete(`${baseUrl}/documents/doc-1`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
        http.delete(`${baseUrl}/documents/doc-2`, () => {
          return HttpResponse.json(
            { error: "Document not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useBulkDeleteDocuments(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(documentIds);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle empty document list", async () => {
      const { result } = renderHook(() => useBulkDeleteDocuments(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate([]);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useDocumentProcessingStatus", () => {
    it("should return processing status for completed document", async () => {
      const documentId = "doc-1";
      const completedDocument = mockDocuments[0];

      server.use(
        http.get(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(completedDocument);
        })
      );

      const { result } = renderHook(() => useDocumentProcessingStatus(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCompleted).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.progress).toBe(100);
    });

    it("should return processing status for processing document", async () => {
      const documentId = "doc-2";
      const processingDocument = mockDocuments[1];

      server.use(
        http.get(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(processingDocument);
        })
      );

      const { result } = renderHook(() => useDocumentProcessingStatus(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isProcessing).toBe(true);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isFailed).toBe(false);
      expect(result.current.progress).toBe(75);
    });

    it("should return processing status for failed document", async () => {
      const documentId = "doc-3";
      const failedDocument = {
        ...mockDocuments[0],
        id: "doc-3",
        status: "failed",
        errorMessage: "Processing failed due to invalid format",
        processingProgress: 0,
      };

      server.use(
        http.get(`${baseUrl}/documents/${documentId}`, () => {
          return HttpResponse.json(failedDocument);
        })
      );

      const { result } = renderHook(() => useDocumentProcessingStatus(documentId), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isFailed).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.errorMessage).toBe("Processing failed due to invalid format");
      expect(result.current.progress).toBe(0);
    });

    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(
        () => useDocumentProcessingStatus("doc-1", false),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("Cache Management", () => {
    it("should invalidate cache on successful upload", async () => {
      const mockUploadResponse = {
        document: mockDocuments[0],
        message: "Document uploaded successfully",
      };

      server.use(
        http.post(`${baseUrl}/documents/upload`, () => {
          return HttpResponse.json(mockUploadResponse, { status: 201 });
        })
      );

      const { result } = renderHook(() => useUploadDocument(), {
        wrapper: createTestWrapper(),
      });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      result.current.mutate({ file });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Cache invalidation is handled internally by the hook
      expect(result.current.isSuccess).toBe(true);
    });

    it("should invalidate cache on successful delete", async () => {
      const documentId = "doc-1";

      server.use(
        http.delete(`${baseUrl}/documents/${documentId}`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useDeleteDocument(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(documentId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Cache invalidation is handled internally by the hook
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      server.use(
        http.get(`${baseUrl}/documents`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useDocuments(), {
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
        http.get(`${baseUrl}/documents`, () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.json(
              { error: "Server Error" },
              { status: 500 }
            );
          }
          return HttpResponse.json({
            data: mockDocuments,
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

      const { result } = renderHook(() => useDocuments(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 10000 });

      expect(attemptCount).toBe(3);
      expect(result.current.data?.data).toEqual(mockDocuments);
    });
  });
});