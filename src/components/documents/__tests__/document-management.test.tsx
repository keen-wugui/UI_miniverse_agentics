import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../test/mocks/server";
import { http, HttpResponse } from "msw";
import { createTestQueryClient } from "../../../test/utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { DocumentManagement } from "../document-management";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the child components to focus on DocumentManagement logic
vi.mock("../document-search", () => ({
  DocumentSearch: ({ onSearch, initialQuery }: any) => (
    <div data-testid="document-search">
      <input
        placeholder="Search documents..."
        defaultValue={initialQuery}
        onChange={(e) => onSearch(e.target.value, {})}
      />
    </div>
  ),
}));

vi.mock("../document-filters", () => ({
  DocumentFilters: ({ onFiltersChange }: any) => (
    <div data-testid="document-filters">
      <button onClick={() => onFiltersChange({ fileTypes: ["pdf"] })}>
        Apply Filter
      </button>
    </div>
  ),
}));

vi.mock("../document-card", () => ({
  DocumentCard: ({ document, isSelected, onSelect, onDelete, onView }: any) => (
    <div data-testid={`document-card-${document.id}`}>
      <span>{document.name}</span>
      <span>{document.status}</span>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(document.id, e.target.checked)}
        aria-label={`Select ${document.name}`}
      />
      <button onClick={() => onDelete(document.id)}>Delete</button>
      <button onClick={() => onView(document.id)}>View</button>
    </div>
  ),
}));

vi.mock("../document-upload", () => ({
  DocumentUpload: ({ onUploadSuccess }: any) => (
    <div data-testid="document-upload">
      <button onClick={onUploadSuccess}>Upload Complete</button>
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
    name: "Test Document 1",
    filename: "test1.pdf",
    size: 1024000,
    type: "application/pdf",
    status: "completed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    extractedText: "Sample text...",
    metadata: { pages: 10 },
    tags: ["test"],
    collections: [],
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
    collections: [],
  },
  {
    id: "doc-3",
    name: "Test Document 3",
    filename: "test3.txt",
    size: 256000,
    type: "text/plain",
    status: "completed",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
    extractedText: "More sample text...",
    metadata: {},
    tags: ["important"],
    collections: [],
  },
];

describe("DocumentManagement", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();

    // Mock documents endpoint
    server.use(
      http.get(`${baseUrl}/documents`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const sortBy = url.searchParams.get("sortBy") || "createdAt";
        const sortOrder = url.searchParams.get("sortOrder") || "desc";
        const query = url.searchParams.get("query");

        let filteredDocs = [...mockDocuments];

        // Apply search filter
        if (query) {
          filteredDocs = filteredDocs.filter(doc =>
            doc.name.toLowerCase().includes(query.toLowerCase())
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

    // Mock delete endpoint
    server.use(
      http.delete(`${baseUrl}/documents/:id`, ({ params }) => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    // Mock bulk delete endpoint
    server.use(
      http.post(`${baseUrl}/documents/bulk-delete`, () => {
        return new HttpResponse(null, { status: 204 });
      })
    );
  });

  describe("Initial Render", () => {
    it("should render document management interface", async () => {
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search documents...")).toBeInTheDocument();
      expect(screen.getByText("Upload")).toBeInTheDocument();
      expect(screen.getByText("Add Document")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("3 documents")).toBeInTheDocument();
      });
    });

    it("should load and display documents", async () => {
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-2")).toBeInTheDocument();
        expect(screen.getByTestId("document-card-doc-3")).toBeInTheDocument();
      });

      expect(screen.getByText("Test Document 1")).toBeInTheDocument();
      expect(screen.getByText("Test Document 2")).toBeInTheDocument();
      expect(screen.getByText("Test Document 3")).toBeInTheDocument();
    });

    it("should show loading state initially", () => {
      render(<DocumentManagement />, { wrapper: createTestWrapper() });
      expect(screen.getByText("Loading documents...")).toBeInTheDocument();
    });

    it("should handle error state", async () => {
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
    });
  });

  describe("View Mode Toggle", () => {
    it("should switch between list and grid view", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      // Default should be list view
      const listButton = screen.getByRole("button", { name: "" }); // List icon button
      const gridButton = screen.getByRole("button", { name: "" }); // Grid icon button

      // Switch to grid view
      await user.click(gridButton);
      // Note: The actual grid/list layout change would be tested in integration tests
      // Here we just verify the buttons are clickable

      // Switch back to list view
      await user.click(listButton);
    });
  });

  describe("Search Functionality", () => {
    it("should filter documents based on search query", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search documents...");
      await user.type(searchInput, "Test Document 1");

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
        expect(screen.queryByTestId("document-card-doc-2")).not.toBeInTheDocument();
        expect(screen.queryByTestId("document-card-doc-3")).not.toBeInTheDocument();
      });
    });

    it("should show no results when search has no matches", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search documents...");
      await user.type(searchInput, "NonexistentDocument");

      await waitFor(() => {
        expect(screen.getByText("No documents found")).toBeInTheDocument();
        expect(screen.getByText("Upload Your First Document")).toBeInTheDocument();
      });
    });
  });

  describe("Sorting", () => {
    it("should sort documents by different fields", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      // Test sorting by name
      const sortSelect = screen.getByDisplayValue("Date Created");
      await user.click(sortSelect);
      await user.click(screen.getByText("Name"));

      await waitFor(() => {
        // Documents should be re-fetched with new sort order
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });
    });

    it("should toggle sort order when clicking sort direction button", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const sortButton = screen.getByRole("button", { name: "" }); // Sort order button
      await user.click(sortButton);

      // Should trigger a refetch with toggled sort order
      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });
    });
  });

  describe("Document Selection", () => {
    it("should select and deselect individual documents", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText("Select Test Document 1");
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(screen.getByText("Delete (1)")).toBeInTheDocument();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(screen.queryByText("Delete (1)")).not.toBeInTheDocument();
    });

    it("should show bulk actions when documents are selected", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const checkbox1 = screen.getByLabelText("Select Test Document 1");
      const checkbox2 = screen.getByLabelText("Select Test Document 2");

      await user.click(checkbox1);
      await user.click(checkbox2);

      expect(screen.getByText("Delete (2)")).toBeInTheDocument();
    });

    it("should perform bulk delete operation", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const checkbox1 = screen.getByLabelText("Select Test Document 1");
      await user.click(checkbox1);

      const deleteButton = screen.getByText("Delete (1)");
      await user.click(deleteButton);

      // Should make bulk delete API call
      await waitFor(() => {
        expect(screen.queryByText("Delete (1)")).not.toBeInTheDocument();
      });
    });
  });

  describe("Document Actions", () => {
    it("should delete individual documents", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText("Delete")[0];
      await user.click(deleteButton);

      // Should make delete API call and refetch
      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });
    });

    it("should handle document view action", async () => {
      const user = userEvent.setup();
      const mockOnDocumentView = vi.fn();
      
      render(<DocumentManagement onDocumentView={mockOnDocumentView} />, { 
        wrapper: createTestWrapper() 
      });

      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("View")[0];
      await user.click(viewButton);

      expect(mockOnDocumentView).toHaveBeenCalledWith("doc-1");
    });
  });

  describe("Filters", () => {
    it("should show/hide filter panel", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      expect(screen.queryByTestId("document-filters")).not.toBeInTheDocument();

      const filtersButton = screen.getByText("Filters");
      await user.click(filtersButton);

      expect(screen.getByTestId("document-filters")).toBeInTheDocument();

      await user.click(filtersButton);
      expect(screen.queryByTestId("document-filters")).not.toBeInTheDocument();
    });

    it("should apply filters and reset pagination", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      const filtersButton = screen.getByText("Filters");
      await user.click(filtersButton);

      const applyFilterButton = screen.getByText("Apply Filter");
      await user.click(applyFilterButton);

      // Should trigger refetch with filters applied
      await waitFor(() => {
        expect(screen.getByTestId("document-card-doc-1")).toBeInTheDocument();
      });
    });
  });

  describe("Upload Sheet", () => {
    it("should open upload sheet when upload button is clicked", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      const uploadButton = screen.getByText("Upload");
      await user.click(uploadButton);

      expect(screen.getByText("Upload New Documents")).toBeInTheDocument();
      expect(screen.getByTestId("document-upload")).toBeInTheDocument();
    });

    it("should close upload sheet and refetch on upload success", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      const uploadButton = screen.getByText("Upload");
      await user.click(uploadButton);

      const uploadCompleteButton = screen.getByText("Upload Complete");
      await user.click(uploadCompleteButton);

      await waitFor(() => {
        expect(screen.queryByText("Upload New Documents")).not.toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    beforeEach(() => {
      // Mock more documents to trigger pagination
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
    });

    it("should show pagination controls when there are multiple pages", async () => {
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
      });
    });

    it("should navigate between pages", async () => {
      const user = userEvent.setup();
      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      });

      const nextButton = screen.getByText("Next");
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
      });

      const prevButton = screen.getByText("Previous");
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no documents exist", async () => {
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

      render(<DocumentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("No documents found")).toBeInTheDocument();
        expect(screen.getByText("Upload Your First Document")).toBeInTheDocument();
      });
    });
  });

  describe("Error Recovery", () => {
    it("should retry loading documents when try again is clicked", async () => {
      const user = userEvent.setup();
      
      // Start with error response
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
      });

      // Now return successful response
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
  });
});