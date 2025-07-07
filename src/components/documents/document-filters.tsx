"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Document } from "@/types/api";

interface DocumentFiltersProps {
  onFiltersChange: (filters: DocumentFilterState) => void;
  initialFilters?: Partial<DocumentFilterState>;
}

export interface DocumentFilterState {
  fileTypes: string[];
  status: Document["status"][];
  tags: string[];
  collections: string[];
  uploadDateRange?: {
    start: string;
    end: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  tagsOperator: "AND" | "OR";
}

const FILE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Word Document" },
  { value: "docx", label: "Word Document (DOCX)" },
  { value: "txt", label: "Text File" },
  { value: "jpg", label: "JPEG Image" },
  { value: "jpeg", label: "JPEG Image" },
  { value: "png", label: "PNG Image" },
  { value: "gif", label: "GIF Image" },
  { value: "csv", label: "CSV File" },
  { value: "xlsx", label: "Excel Spreadsheet" },
];

const STATUS_OPTIONS: { value: Document["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const SIZE_RANGES = [
  { value: "small", label: "Small (< 1MB)", min: 0, max: 1024 * 1024 },
  {
    value: "medium",
    label: "Medium (1-10MB)",
    min: 1024 * 1024,
    max: 10 * 1024 * 1024,
  },
  {
    value: "large",
    label: "Large (10-100MB)",
    min: 10 * 1024 * 1024,
    max: 100 * 1024 * 1024,
  },
  {
    value: "xlarge",
    label: "Very Large (> 100MB)",
    min: 100 * 1024 * 1024,
    max: Infinity,
  },
];

export function DocumentFilters({
  onFiltersChange,
  initialFilters,
}: DocumentFiltersProps) {
  const [filters, setFilters] = useState<DocumentFilterState>({
    fileTypes: [],
    status: [],
    tags: [],
    collections: [],
    tagsOperator: "AND",
    ...initialFilters,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof DocumentFilterState>(
    key: K,
    value: DocumentFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const addFileType = (fileType: string) => {
    if (!filters.fileTypes.includes(fileType)) {
      updateFilter("fileTypes", [...filters.fileTypes, fileType]);
    }
  };

  const removeFileType = (fileType: string) => {
    updateFilter(
      "fileTypes",
      filters.fileTypes.filter((type) => type !== fileType)
    );
  };

  const addStatus = (status: Document["status"]) => {
    if (!filters.status.includes(status)) {
      updateFilter("status", [...filters.status, status]);
    }
  };

  const removeStatus = (status: Document["status"]) => {
    updateFilter(
      "status",
      filters.status.filter((s) => s !== status)
    );
  };

  const setSizeRange = (range: string) => {
    const sizeRange = SIZE_RANGES.find((r) => r.value === range);
    if (sizeRange) {
      updateFilter("sizeRange", { min: sizeRange.min, max: sizeRange.max });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      fileTypes: [],
      status: [],
      tags: [],
      collections: [],
      tagsOperator: "AND",
    });
  };

  const hasActiveFilters =
    filters.fileTypes.length > 0 ||
    filters.status.length > 0 ||
    filters.tags.length > 0 ||
    filters.collections.length > 0 ||
    filters.uploadDateRange ||
    filters.sizeRange;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Filters</CardTitle>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Basic" : "Advanced"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Types */}
        <div>
          <label className="text-sm font-medium mb-2 block">File Types</label>
          <Select onValueChange={addFileType}>
            <SelectTrigger>
              <SelectValue placeholder="Select file types..." />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPES.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  disabled={filters.fileTypes.includes(type.value)}
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.fileTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.fileTypes.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {FILE_TYPES.find((t) => t.value === type)?.label || type}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-inherit hover:bg-transparent"
                    onClick={() => removeFileType(type)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select onValueChange={addStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  disabled={filters.status.includes(status.value)}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.status.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.status.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  {STATUS_OPTIONS.find((s) => s.value === status)?.label ||
                    status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-inherit hover:bg-transparent"
                    onClick={() => removeStatus(status)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            {/* File Size */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                File Size
              </label>
              <Select onValueChange={setSizeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size range..." />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.sizeRange && (
                <div className="mt-2">
                  <Badge variant="secondary" className="gap-1">
                    {
                      SIZE_RANGES.find(
                        (r) =>
                          r.min === filters.sizeRange?.min &&
                          r.max === filters.sizeRange?.max
                      )?.label
                    }
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-inherit hover:bg-transparent"
                      onClick={() => updateFilter("sizeRange", undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Upload Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Upload Date
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={filters.uploadDateRange?.start || ""}
                    onChange={(e) =>
                      updateFilter("uploadDateRange", {
                        ...filters.uploadDateRange,
                        start: e.target.value,
                        end: filters.uploadDateRange?.end || "",
                      })
                    }
                  />
                </div>
                <span className="px-2 py-2 text-sm text-gray-500">to</span>
                <div className="flex-1">
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={filters.uploadDateRange?.end || ""}
                    onChange={(e) =>
                      updateFilter("uploadDateRange", {
                        ...filters.uploadDateRange,
                        start: filters.uploadDateRange?.start || "",
                        end: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              {filters.uploadDateRange &&
                (filters.uploadDateRange.start ||
                  filters.uploadDateRange.end) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => updateFilter("uploadDateRange", undefined)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Date Range
                  </Button>
                )}
            </div>

            {/* Tags Operator */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tags Filter Logic
              </label>
              <Select
                value={filters.tagsOperator}
                onValueChange={(value: "AND" | "OR") =>
                  updateFilter("tagsOperator", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">Match ALL tags</SelectItem>
                  <SelectItem value="OR">Match ANY tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* TODO: Business API - Enhanced filtering requires new query parameters */}
        {/* See docs/api-change-requests.md entry from 2024-12-19 */}
        {hasActiveFilters && (
          <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
            Note: Advanced filtering requires Business API enhancements (see API
            change requests)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
