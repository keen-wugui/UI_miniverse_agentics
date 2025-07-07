"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Grid,
  List,
  Upload,
  Plus,
  Trash2,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DocumentCard } from "./document-card";
import { DocumentFilters, type DocumentFilterState } from "./document-filters";
import { DocumentSearch, type SearchOptions } from "./document-search";
import { DocumentUpload } from "./document-upload";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useDocuments,
  useDeleteDocument,
  useBulkDeleteDocuments,
} from "@/hooks/api/useDocuments";
import type { Document, PaginationParams } from "@/types/api";

interface DocumentManagementProps {
  onDocumentView?: (id: string) => void;
  onDocumentEdit?: (id: string) => void;
}

type ViewMode = "list" | "grid";
type SortField = "name" | "createdAt" | "size" | "status";
type SortOrder = "asc" | "desc";

export function DocumentManagement({
  onDocumentView,
  onDocumentEdit,
}: DocumentManagementProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );
  const [filters, setFilters] = useState<DocumentFilterState>({
    fileTypes: [],
    status: [],
    tags: [],
    collections: [],
    tagsOperator: "AND",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    searchFields: ["name", "content"],
    searchMode: "fuzzy",
    caseSensitive: false,
  });
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
  });

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: PaginationParams & {
      query?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {
      ...pagination,
      sortBy: sortField,
      sortOrder: sortOrder,
    };

    if (searchQuery) {
      params.query = searchQuery;
    }

    return params;
  }, [pagination, sortField, sortOrder, searchQuery]);

  // API hooks
  const {
    data: documentsResponse,
    isLoading,
    error,
    refetch,
  } = useDocuments(queryParams);

  const deleteDocumentMutation = useDeleteDocument();
  const bulkDeleteMutation = useBulkDeleteDocuments();

  // Handlers
  const handleSearch = useCallback((query: string, options: SearchOptions) => {
    setSearchQuery(query);
    setSearchOptions(options);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const handleFiltersChange = useCallback((newFilters: DocumentFilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const handleDocumentSelect = useCallback((id: string, selected: boolean) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (documentsResponse?.data) {
      const allIds = documentsResponse.data.map((doc) => doc.id);
      setSelectedDocuments(new Set(allIds));
    }
  }, [documentsResponse]);

  const handleDeselectAll = useCallback(() => {
    setSelectedDocuments(new Set());
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("asc");
      }
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
    [sortField]
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      try {
        await deleteDocumentMutation.mutateAsync(id);
        setSelectedDocuments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    },
    [deleteDocumentMutation]
  );

  const handleBulkDelete = useCallback(async () => {
    const documentIds = Array.from(selectedDocuments);
    if (documentIds.length === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync(documentIds);
      setSelectedDocuments(new Set());
    } catch (error) {
      console.error("Failed to bulk delete documents:", error);
    }
  }, [selectedDocuments, bulkDeleteMutation]);

  const handleDownload = useCallback((id: string) => {
    // TODO: Business API - Implement document download
    // See docs/api-change-requests.md entry from 2024-12-19
    console.log("Download document:", id);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setIsUploadSheetOpen(false);
    refetch();
  }, [refetch]);

  // Loading and error states
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading documents</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const documents = documentsResponse?.data || [];
  const paginationInfo = documentsResponse?.pagination;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            {paginationInfo?.total || 0} document
            {(paginationInfo?.total || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsUploadSheetOpen(true)}>
            <Upload className="mr-0 md:mr-2 h-4 w-4" />
            <span className="hidden md:inline">Upload</span>
          </Button>
          <Button onClick={() => setIsUploadSheetOpen(true)}>
            <Plus className="mr-0 md:mr-2 h-4 w-4" />
            <span className="hidden md:inline">Add Document</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <DocumentSearch
        onSearch={handleSearch}
        initialQuery={searchQuery}
        initialOptions={searchOptions}
      />

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            <span>Filters</span>
            {/* TODO: Add badge for active filter count */}
          </Button>
          {selectedDocuments.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedDocuments.size})
              </Button>
              {/* TODO: Business API - Implement bulk download/edit */}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {/* Sorting controls */}
          <Select
            value={sortField}
            onValueChange={(value) => handleSort(value as SortField)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleSort(sortField)}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
          <div className="h-8 border-l" />
          {/* View mode toggle */}
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <DocumentFilters
          initialFilters={filters}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* Document list/grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No documents found</p>
            <Button onClick={() => setIsUploadSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Your First Document
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {viewMode === "list" ? (
            <div className="border rounded-md">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  view="list"
                  isSelected={selectedDocuments.has(doc.id)}
                  onSelect={handleDocumentSelect}
                  onView={onDocumentView}
                  onDelete={handleDeleteDocument}
                  onDownload={handleDownload}
                  onUpdate={refetch}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  view="grid"
                  isSelected={selectedDocuments.has(doc.id)}
                  onSelect={handleDocumentSelect}
                  onView={onDocumentView}
                  onDelete={handleDeleteDocument}
                  onDownload={handleDownload}
                  onUpdate={refetch}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {paginationInfo && paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.page - 1)}
            disabled={!paginationInfo.hasPrev}
          >
            Previous
          </Button>
          <span>
            Page {paginationInfo.page} of {paginationInfo.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.page + 1)}
            disabled={!paginationInfo.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {/* Upload Sheet */}
      <Sheet open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
        <SheetContent className="w-[500px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Upload New Documents</SheetTitle>
            <SheetDescription>
              Select one or more files to upload.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
