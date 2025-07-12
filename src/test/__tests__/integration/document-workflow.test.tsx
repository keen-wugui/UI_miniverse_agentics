import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { createTestQueryClient } from "../../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { DocumentManagement } from "../../../components/documents/document-management";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock child components for focused integration testing
vi.mock("../../../components/documents/document-search", () => ({
  DocumentSearch: ({ onSearch, initialQuery }: any) => (
    <div data-testid="document-search">
      <input
        placeholder="Search documents..."
        defaultValue={initialQuery}
        onChange={(e) => onSearch(e.target.value, {
          searchFields: ["name", "content"],
          searchMode: "fuzzy",
          caseSensitive: false,
        })}
      />
    </div>
  ),
}));

vi.mock("../../../components/documents/document-filters", () => ({
  DocumentFilters: ({ onFiltersChange }: any) => (
    <div data-testid="document-filters">
      <button onClick={() => onFiltersChange({ fileTypes: ["pdf"], status: [], tags: [], collections: [], tagsOperator: "AND" })}>
        Apply PDF Filter
      </button>
    </div>
  ),
}));

vi.mock("../../../components/documents/document-card", () => ({
  DocumentCard: ({ document, isSelected, onSelect, onDelete, onView }: any) => (
    <div data-testid={`document-card-${document.id}`} className="border p-4 m-2">
      <h3>{document.name}</h3>
      <p>Status: {document.status}</p>
      <p>Size: {document.size} bytes</p>
      <div className="flex gap-2 mt-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(document.id, e.target.checked)}
          aria-label={`Select ${document.name}`}
        />
        <button onClick={() => onView(document.id)}>View</button>
        <button onClick={() => onDelete(document.id)}>Delete</button>
      </div>
    </div>
  ),
}));

vi.mock("../../../components/documents/document-upload", () => ({
  DocumentUpload: ({ onUploadSuccess }: any) => (
    <div data-testid="document-upload">
      <h3>Upload Documents</h3>
      <button onClick={onUploadSuccess}>Complete Upload</button>
    </div>
  ),
}));

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
    name: "Project Requirements.pdf",
    filename: "requirements.pdf",
    size: 2048000,
    type: "application/pdf",
    status: "completed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    extractedText: "This document contains the project requirements...",
    metadata: { pages: 25 },
    tags: ["requirements", "project"],
    collections: ["project-docs"],
  },
  {
    id: "doc-2",
    name: "Meeting Notes.docx",
    filename: "meeting-notes.docx",
    size: 512000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "processing",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    extractedText: "",
    metadata: {},
    tags: ["meeting", "notes"],
    collections: [],
  },
  {
    id: "doc-3",
    name: "Budget Spreadsheet.xlsx",
    filename: "budget.xlsx",
    size: 1024000,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    status: "completed",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
    extractedText: "Budget data extracted...",
    metadata: { sheets: 3 },
    tags: ["budget", "finance"],
    collections: ["finance-docs"],
  },
];

describe("Document Workflow Integration Tests", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();

    // Default documents endpoint
    server.use(
      http.get(`${baseUrl}/documents`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const query = url.searchParams.get("query");
        const sortBy = url.searchParams.get("sortBy") || "createdAt";
        const sortOrder = url.searchParams.get("sortOrder") || "desc";

        let filteredDocs = [...mockDocuments];

        // Apply search filter
        if (query) {
          filteredDocs = filteredDocs.filter(doc =>
            doc.name.toLowerCase().includes(query.toLowerCase()) ||
            doc.extractedText.toLowerCase().includes(query.toLowerCase())
          );
        }

        // Apply sorting
        filteredDocs.sort((a, b) => {
          let aVal: any = a[sortBy as keyof typeof a];
          let bVal: any = b[sortBy as keyof typeof b];

          if (sortBy === "size") {
            aVal = Number(aVal);
            bVal = Number(bVal);
          }

          if (sortOrder === "desc") {
            return aVal > bVal ? -1 : 1;
          }
          return aVal > bVal ? 1 : -1;
        });

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

        return HttpResponse.json({
          data: paginatedDocs,
          pagination: {
            page,
            limit,
            total: filteredDocs.length,
            totalPages: Math.ceil(filteredDocs.length / limit),
            hasNext: endIndex < filteredDocs.length,
            hasPrev: page > 1,
          },
        });
      })
    );

    // Delete endpoints
    server.use(
      http.delete(`${baseUrl}/documents/:id`, ({ params }) => {
        return new HttpResponse(null, { status: 204 });
      })
    );
  });

  describe("Document Management Complete Workflow", () => {
    it("should complete the full document management workflow", async () => {
      const user = userEvent.setup();
      const mockOnDocumentView = vi.fn();
      
      render(
        <DocumentManagement onDocumentView={mockOnDocumentView} />, 
        { wrapper: createTestWrapper() }
      );

      // 1. Initial load - should show all documents
      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-2")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-3")).toBeInTheDocument();
      });

      // 2. Search functionality
      const searchInput = screen.getByPlaceholderText("Search documents...");
      await user.type(searchInput, "requirements");

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
        expect(screen.queryByTestId("document-card-doc-2")).not.toBeInTheDocument();
        expect(screen.queryByTestId("document-card-doc-3")).not.toBeInTheDocument();
      });

      // 3. Clear search to see all documents again
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-2")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-3")).toBeInTheDocument();
      });

      // 4. Test sorting functionality
      const sortSelect = screen.getByDisplayValue("Date Created");
      await user.click(sortSelect);
      await user.click(screen.getByText("Name"));

      await waitFor(() => {
        // Documents should be re-fetched with name sorting
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      // 5. Test view mode toggle
      const gridButton = screen.getByRole("button", { name: "" }); // Grid icon button
      await user.click(gridButton);

      // 6. Document selection workflow
      const checkbox1 = screen.getByLabelText("Select Project Requirements.pdf");
      const checkbox2 = screen.getByLabelText("Select Meeting Notes.docx");

      await user.click(checkbox1);
      expect(checkbox1).toBeChecked();
      expect(screen.getByText("Delete (1)")).toBeInTheDocument();

      await user.click(checkbox2);
      expect(checkbox2).toBeChecked();
      expect(screen.getByText("Delete (2)")).toBeInTheDocument();

      // 7. Bulk delete operation
      const bulkDeleteButton = screen.getByText("Delete (2)");
      await user.click(bulkDeleteButton);

      await waitFor(() => {
        // Selection should be cleared after bulk delete
        expect(screen.queryByText("Delete (2)")).not.toBeInTheDocument();
      });

      // 8. Individual document actions
      const viewButton = screen.getAllByText("View")[0];
      await user.click(viewButton);
      expect(mockOnDocumentView).toHaveBeenCalledWith("doc-1");

      // 9. Upload workflow
      const uploadButton = screen.getByText("Upload");
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText("Upload New Documents")).toBeInTheDocument();
        expect(screen.getByTestId("document-upload")).toBeInTheDocument();
      });

      // Complete upload
      const completeUploadButton = screen.getByText("Complete Upload");
      await user.click(completeUploadButton);

      await waitFor(() => {
        // Upload sheet should close
        expect(screen.queryByText("Upload New Documents")).not.toBeInTheDocument();
      });
    });

    it("should handle error states gracefully", async () => {
      const user = userEvent.setup();

      // Mock server error
      server.use(
        http.get(`${baseUrl}/documents`, () => {
          return HttpResponse.json(
            { error: "Server Error" },
            { status: 500 }
          );
        })
      );

      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Error loading documents")).toBeInTheDocument();
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });

      // Test retry functionality
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

      const tryAgainButton = screen.getByText("Try Again");
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });
    });

    it("should handle empty state correctly", async () => {
      // Mock empty response
      server.use(
        http.get(`${baseUrl}/documents`, () => {
          return HttpResponse.json({
            data: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          });
        })
      );

      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("No documents found")).toBeInTheDocument();
        expect(screen.getByText("Upload Your First Document")).toBeInTheDocument();
      });

      // Test upload from empty state
      const uploadButton = screen.getByText("Upload Your First Document");
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText("Upload New Documents")).toBeInTheDocument();
      });
    });

    it("should handle pagination workflow", async () => {
      // Mock many documents to trigger pagination
      const manyDocs = Array.from({ length: 25 }, (_, i) => ({
        id: `doc-${i + 1}`,
        name: `Document ${i + 1}`,
        filename: `doc${i + 1}.pdf`,
        size: 1024000,
        type: "application/pdf",
        status: "completed",
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        updatedAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        extractedText: "Sample text...",
        metadata: {},
        tags: [],
        collections: [],
      }));

      server.use(
        http.get(`${baseUrl}/documents`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "20");

          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedDocs = manyDocs.slice(startIndex, endIndex);

          return HttpResponse.json({
            data: paginatedDocs,
            pagination: {
              page,
              limit,
              total: manyDocs.length,
              totalPages: Math.ceil(manyDocs.length / limit),
              hasNext: endIndex < manyDocs.length,
              hasPrev: page > 1,
            },
          });
        })
      );

      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
      });

      // Navigate to next page
      const nextButton = screen.getByText("Next");
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
      });

      // Navigate back to first page
      const prevButton = screen.getByText("Previous");
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      });
    });

    it("should handle complex search and filter combinations", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
      });

      // 1. Apply search filter
      const searchInput = screen.getByPlaceholderText("Search documents...");
      await user.type(searchInput, "project");

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
        expect(screen.queryByTestId("document-card-doc-2")).not.toBeInTheDocument();
      });

      // 2. Open filters panel
      const filtersButton = screen.getByText("Filters");
      await user.click(filtersButton);

      expect(screen.getByTestId("document-filters")).toBeInTheDocument();

      // 3. Apply additional filter
      const applyFilterButton = screen.getByText("Apply PDF Filter");
      await user.click(applyFilterButton);

      // Filters should work in combination with search
      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      // 4. Clear search while keeping filters
      await user.clear(searchInput);

      await waitFor(() => {
        // Should now show all PDF documents
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });
    });

    it("should handle document status updates", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
      });

      // Find the processing document
      const processingDoc = screen.getByTestId("document-card-doc-2");
      expect(processingDoc).toHaveTextContent("Status: processing");

      // Mock status update
      server.use(
        http.get(`${baseUrl}/documents`, () => {
          const updatedDocs = mockDocuments.map(doc =>
            doc.id === "doc-2" ? { ...doc, status: "completed" } : doc
          );

          return HttpResponse.json({
            data: updatedDocs,
            pagination: {
              page: 1,
              limit: 20,
              total: updatedDocs.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          });
        })
      );

      // Trigger refresh by changing sort order
      const sortButton = screen.getByRole("button", { name: "" }); // Sort direction button
      await user.click(sortButton);

      await waitFor(() => {
        const updatedDoc = screen.getByTestId("document-card-doc-2");
        expect(updatedDoc).toHaveTextContent("Status: completed");
      });
    });
  });

  describe("Performance and User Experience", () => {
    it("should handle rapid user interactions", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
      });

      // Rapid selection/deselection
      const checkbox1 = screen.getByLabelText("Select Project Requirements.pdf");
      const checkbox2 = screen.getByLabelText("Select Meeting Notes.docx");

      // Rapid clicks
      await user.click(checkbox1);
      await user.click(checkbox2);
      await user.click(checkbox1);
      await user.click(checkbox2);

      // Final state should be consistent
      expect(checkbox1).not.toBeChecked();
      expect(checkbox2).not.toBeChecked();
      expect(screen.queryByText(/Delete \(/)).not.toBeInTheDocument();
    });

    it("should maintain UI state during async operations", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
      });

      // Select documents
      const checkbox1 = screen.getByLabelText("Select Project Requirements.pdf");
      await user.click(checkbox1);

      expect(screen.getByText("Delete (1)")).toBeInTheDocument();

      // Start delete operation
      const deleteButton = screen.getByText("Delete (1)");
      await user.click(deleteButton);

      // Selection should be cleared after operation
      await waitFor(() => {
        expect(screen.queryByText("Delete (1)")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Workflows", () => {
    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab(); // Search input
      expect(screen.getByPlaceholderText("Search documents...")).toHaveFocus();

      // Continue tabbing to other controls
      await user.tab(); // Filters button
      await user.tab(); // Sort select
      await user.tab(); // Sort direction button
      await user.tab(); // View mode buttons

      // Should be able to interact with keyboard
      await user.keyboard("{Enter}");
    });

    it("should provide proper ARIA labels and roles", () => {
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      // Check for proper ARIA labels
      expect(screen.getByPlaceholderText("Search documents...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add document/i })).toBeInTheDocument();
    });
  });
});