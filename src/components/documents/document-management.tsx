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
import {
  useDocuments,
  useDeleteDocument,
  useBulkDeleteDocuments,
} from "@/hooks/api/useDocuments";
import type { Document, PaginationParams } from "@/types/api";

interface DocumentManagementProps {
  onDocumentView?: (id: string) => void;
  onDocumentEdit?: (id: string) => void;
  onDocumentUpload?: () => void;
}

type ViewMode = "list" | "grid";
type SortField = "name" | "createdAt" | "size" | "status";
type SortOrder = "asc" | "desc";

export function DocumentManagement({
  onDocumentView,
  onDocumentEdit,
  onDocumentUpload,
}: DocumentManagementProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            {paginationInfo?.total || 0} document
            {(paginationInfo?.total || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDocumentUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={onDocumentUpload}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Search */}
      <DocumentSearch
        onSearch={handleSearch}
        initialQuery={searchQuery}
        initialOptions={searchOptions}
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedDocuments.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedDocuments.size} selected
              </span>
              <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                Clear
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>

          {/* Sort */}
          <Select
            value={sortField}
            onValueChange={(value: SortField) => handleSort(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="size">File Size</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <DocumentFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={filters}
            />
          </div>
        )}

        {/* Document List/Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No documents found</p>
              <Button onClick={onDocumentUpload}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={
                    selectedDocuments.size === documents.length &&
                    documents.length > 0
                  }
                  onChange={
                    selectedDocuments.size === documents.length
                      ? handleDeselectAll
                      : handleSelectAll
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <label className="text-sm text-gray-700">
                  Select all ({documents.length})
                </label>
              </div>

              {/* Documents */}
              {viewMode === "list" ? (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      view="list"
                      isSelected={selectedDocuments.has(document.id)}
                      onSelect={handleDocumentSelect}
                      onView={onDocumentView}
                      onEdit={onDocumentEdit}
                      onDelete={handleDeleteDocument}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      view="grid"
                      isSelected={selectedDocuments.has(document.id)}
                      onSelect={handleDocumentSelect}
                      onView={onDocumentView}
                      onEdit={onDocumentEdit}
                      onDelete={handleDeleteDocument}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {paginationInfo && paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!paginationInfo.hasPrev}
                    onClick={() => handlePageChange(paginationInfo.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {paginationInfo.page} of {paginationInfo.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!paginationInfo.hasNext}
                    onClick={() => handlePageChange(paginationInfo.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* TODO: Business API - Additional features require API enhancements */}
      {/* See docs/api-change-requests.md entry from 2024-12-19 */}
    </div>
  );
}
