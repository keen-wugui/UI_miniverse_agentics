import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../test/mocks/server";
import { http, HttpResponse } from "msw";
import { createTestQueryClient } from "../../../test/utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { DocumentUpload } from "../document-upload";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
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

// Test data
const mockCollections = [
  {
    id: "collection-1",
    name: "Test Collection 1",
    description: "First test collection",
    documentCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["test"],
    metadata: {},
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

describe("DocumentUpload", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    
    // Mock collections endpoint
    server.use(
      http.get(`${baseUrl}/collections`, () => {
        return HttpResponse.json({
          data: mockCollections,
          pagination: {
            page: 1,
            limit: 10,
            total: mockCollections.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      })
    );
  });

  describe("Initial Render", () => {
    it("should render upload interface correctly", () => {
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      expect(screen.getByText("Drag & drop files here, or click to select")).toBeInTheDocument();
      expect(screen.getByText("Supports PDF, DOC, DOCX, TXT, MD, XLS, XLSX, JPG, PNG, GIF")).toBeInTheDocument();
      expect(screen.getByText("Maximum file size: 10MB • Maximum files: 20")).toBeInTheDocument();
    });

    it("should show collection selector when collections are available", async () => {
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Upload Settings")).toBeInTheDocument();
        expect(screen.getByText("Default Collection:")).toBeInTheDocument();
      });
    });

    it("should apply default collection when provided", async () => {
      render(<DocumentUpload defaultCollectionId="collection-1" />, { 
        wrapper: createTestWrapper() 
      });

      await waitFor(() => {
        const select = screen.getByDisplayValue("Test Collection 1");
        expect(select).toBeInTheDocument();
      });
    });
  });

  describe("File Selection", () => {
    it("should accept valid file types", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File(["test content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Upload Queue")).toBeInTheDocument();
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
        expect(screen.getByText("1 pending")).toBeInTheDocument();
      });
    });

    it("should handle multiple file selection", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const files = [
        new File(["content 1"], "file1.pdf", { type: "application/pdf" }),
        new File(["content 2"], "file2.docx", { 
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        }),
        new File(["content 3"], "file3.txt", { type: "text/plain" }),
      ];

      const input = screen.getByLabelText(/drag & drop files here/i);
      await user.upload(input, files);

      await waitFor(() => {
        expect(screen.getByText("file1.pdf")).toBeInTheDocument();
        expect(screen.getByText("file2.docx")).toBeInTheDocument();
        expect(screen.getByText("file3.txt")).toBeInTheDocument();
        expect(screen.getByText("3 pending")).toBeInTheDocument();
      });
    });

    it("should reject files that are too large", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      // Create a file larger than 10MB
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], 
        "large-file.pdf", 
        { type: "application/pdf" }
      );

      const input = screen.getByLabelText(/drag & drop files here/i);
      
      // We need to manually trigger the dropzone validation
      const dropzone = input.parentElement;
      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [largeFile],
            items: [{ kind: "file", type: "application/pdf", getAsFile: () => largeFile }],
          },
        });
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "File too large",
          description: "large-file.pdf exceeds the 10MB limit",
          variant: "destructive",
        });
      });
    });

    it("should reject invalid file types", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const invalidFile = new File(
        ["content"], 
        "script.js", 
        { type: "application/javascript" }
      );

      const input = screen.getByLabelText(/drag & drop files here/i);
      const dropzone = input.parentElement;
      
      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [invalidFile],
            items: [{ kind: "file", type: "application/javascript", getAsFile: () => invalidFile }],
          },
        });
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Invalid file type",
          description: "script.js is not a supported file type",
          variant: "destructive",
        });
      });
    });
  });

  describe("Upload Queue Management", () => {
    beforeEach(() => {
      // Mock successful upload response
      server.use(
        http.post(`${baseUrl}/documents/upload`, async ({ request }) => {
          const formData = await request.formData();
          const file = formData.get("file") as File;
          
          return HttpResponse.json(
            {
              document: {
                id: `doc-${Date.now()}`,
                name: file.name,
                filename: file.name,
                size: file.size,
                type: file.type,
                status: "processing",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                extractedText: "",
                metadata: {},
                tags: [],
                collections: [],
              },
              message: "Document uploaded successfully",
            },
            { status: 201 }
          );
        })
      );
    });

    it("should remove files from queue", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
      });

      const removeButton = screen.getByRole("button", { name: "" }); // X button
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText("Upload Queue")).not.toBeInTheDocument();
        expect(screen.queryByText("test.pdf")).not.toBeInTheDocument();
      });
    });

    it("should update file collection assignment", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
      });

      // Find and click the collection select for the individual file
      const selects = screen.getAllByText("No Collection");
      const fileSelect = selects[selects.length - 1]; // Last one should be for the file
      
      await user.click(fileSelect);
      await user.click(screen.getByText("Test Collection 1"));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Collection 1")).toBeInTheDocument();
      });
    });

    it("should clear completed uploads", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
      });

      // Start upload
      const uploadButton = screen.getByRole("button", { name: /upload all/i });
      await user.click(uploadButton);

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText("1 success")).toBeInTheDocument();
      }, { timeout: 5000 });

      // Clear completed
      const clearButton = screen.getByRole("button", { name: /clear completed/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText("Upload Queue")).not.toBeInTheDocument();
      });
    });

    it("should clear all files from queue", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const files = [
        new File(["content 1"], "file1.pdf", { type: "application/pdf" }),
        new File(["content 2"], "file2.txt", { type: "text/plain" }),
      ];

      const input = screen.getByLabelText(/drag & drop files here/i);
      await user.upload(input, files);

      await waitFor(() => {
        expect(screen.getByText("2 pending")).toBeInTheDocument();
      });

      const clearAllButton = screen.getByRole("button", { name: /clear all/i });
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(screen.queryByText("Upload Queue")).not.toBeInTheDocument();
      });
    });
  });

  describe("File Upload Process", () => {
    beforeEach(() => {
      // Mock successful upload response
      server.use(
        http.post(`${baseUrl}/documents/upload`, async ({ request }) => {
          const formData = await request.formData();
          const file = formData.get("file") as File;
          
          return HttpResponse.json(
            {
              document: {
                id: `doc-${Date.now()}`,
                name: file.name,
                filename: file.name,
                size: file.size,
                type: file.type,
                status: "processing",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                extractedText: "",
                metadata: {},
                tags: [],
                collections: [],
              },
              message: "Document uploaded successfully",
            },
            { status: 201 }
          );
        })
      );
    });

    it("should upload files successfully", async () => {
      const user = userEvent.setup();
      const onUploadSuccess = vi.fn();
      
      render(<DocumentUpload onUploadSuccess={onUploadSuccess} />, { 
        wrapper: createTestWrapper() 
      });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("1 pending")).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole("button", { name: /upload all/i });
      await user.click(uploadButton);

      // Check upload progress
      await waitFor(() => {
        expect(screen.getByText("1 uploading")).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText("1 success")).toBeInTheDocument();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Upload completed",
          description: "1 file uploaded successfully",
        });
        expect(onUploadSuccess).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it("should handle upload errors", async () => {
      const user = userEvent.setup();
      
      // Mock error response
      server.use(
        http.post(`${baseUrl}/documents/upload`, () => {
          return HttpResponse.json(
            { error: "Upload failed", message: "Server error" },
            { status: 500 }
          );
        })
      );

      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);
      
      await user.upload(input, file);
      
      const uploadButton = screen.getByRole("button", { name: /upload all/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText("1 error")).toBeInTheDocument();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Upload failed", 
          description: "1 file failed to upload",
          variant: "destructive",
        });
      }, { timeout: 5000 });
    });

    it("should upload multiple files sequentially", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const files = [
        new File(["content 1"], "file1.pdf", { type: "application/pdf" }),
        new File(["content 2"], "file2.txt", { type: "text/plain" }),
      ];

      const input = screen.getByLabelText(/drag & drop files here/i);
      await user.upload(input, files);

      const uploadButton = screen.getByRole("button", { name: /upload all/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText("2 success")).toBeInTheDocument();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Upload completed",
          description: "2 files uploaded successfully",
        });
      }, { timeout: 10000 });
    });
  });

  describe("File Display and Icons", () => {
    it("should display correct file icons", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const files = [
        new File(["content"], "test.pdf", { type: "application/pdf" }),
        new File(["content"], "image.png", { type: "image/png" }),
        new File(["content"], "sheet.xlsx", { 
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        }),
        new File(["content"], "generic.txt", { type: "text/plain" }),
      ];

      const input = screen.getByLabelText(/drag & drop files here/i);
      await user.upload(input, files);

      await waitFor(() => {
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
        expect(screen.getByText("image.png")).toBeInTheDocument();
        expect(screen.getByText("sheet.xlsx")).toBeInTheDocument();
        expect(screen.getByText("generic.txt")).toBeInTheDocument();
      });
    });

    it("should display file sizes correctly", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File([new ArrayBuffer(1024)], "test.pdf", { 
        type: "application/pdf" 
      });

      const input = screen.getByLabelText(/drag & drop files here/i);
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("1 KB")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const input = screen.getByLabelText(/drag & drop files here/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "file");
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<DocumentUpload />, { wrapper: createTestWrapper() });

      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/drag & drop files here/i);
      
      await user.upload(input, file);

      await waitFor(() => {
        const uploadButton = screen.getByRole("button", { name: /upload all/i });
        expect(uploadButton).toBeInTheDocument();
      });

      // Should be focusable with keyboard
      await user.tab();
      expect(screen.getByRole("button", { name: /upload all/i })).toHaveFocus();
    });
  });
});