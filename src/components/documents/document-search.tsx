"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

interface DocumentSearchProps {
  onSearch: (query: string, options: SearchOptions) => void;
  placeholder?: string;
  initialQuery?: string;
  initialOptions?: SearchOptions;
}

export interface SearchOptions {
  searchFields: ("name" | "content" | "tags" | "filename")[];
  searchMode: "exact" | "fuzzy" | "prefix";
  caseSensitive: boolean;
}

const SEARCH_FIELDS = [
  { value: "name", label: "Document Name" },
  { value: "content", label: "Content" },
  { value: "tags", label: "Tags" },
  { value: "filename", label: "Filename" },
];

const SEARCH_MODES = [
  { value: "fuzzy", label: "Smart Search (Fuzzy)" },
  { value: "exact", label: "Exact Match" },
  { value: "prefix", label: "Starts With" },
];

export function DocumentSearch({
  onSearch,
  placeholder = "Search documents...",
  initialQuery = "",
  initialOptions = {
    searchFields: ["name", "content"],
    searchMode: "fuzzy",
    caseSensitive: false,
  },
}: DocumentSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [options, setOptions] = useState<SearchOptions>(initialOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Trigger search when debounced query or options change
  const handleSearch = useCallback(() => {
    onSearch(debouncedQuery, options);
  }, [debouncedQuery, options, onSearch]);

  // Auto-search when debounced query changes
  useMemo(() => {
    handleSearch();
  }, [handleSearch]);

  const updateOption = <K extends keyof SearchOptions>(
    key: K,
    value: SearchOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const addSearchField = (field: SearchOptions["searchFields"][0]) => {
    if (!options.searchFields.includes(field)) {
      updateOption("searchFields", [...options.searchFields, field]);
    }
  };

  const removeSearchField = (field: SearchOptions["searchFields"][0]) => {
    if (options.searchFields.length > 1) {
      updateOption(
        "searchFields",
        options.searchFields.filter((f) => f !== field)
      );
    }
  };

  const clearSearch = () => {
    setQuery("");
    setOptions(initialOptions);
  };

  const hasAdvancedOptions =
    options.searchFields.length !== initialOptions.searchFields.length ||
    options.searchMode !== initialOptions.searchMode ||
    options.caseSensitive !== initialOptions.caseSensitive;

  return (
    <div className="space-y-3">
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Search Mode Selector */}
          <Select
            value={options.searchMode}
            onValueChange={(value: SearchOptions["searchMode"]) =>
              updateOption("searchMode", value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEARCH_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Case Sensitive Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="case-sensitive"
              checked={options.caseSensitive}
              onChange={(e) => updateOption("caseSensitive", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="case-sensitive" className="text-sm text-gray-700">
              Case sensitive
            </label>
          </div>
        </div>

        {/* Advanced Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showAdvanced ? "Hide" : "Advanced"}
          {hasAdvancedOptions && (
            <Badge variant="secondary" className="ml-1 h-4 text-xs">
              •
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Search Options */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Search In</label>
            <Select onValueChange={addSearchField}>
              <SelectTrigger>
                <SelectValue placeholder="Add search field..." />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_FIELDS.map((field) => (
                  <SelectItem
                    key={field.value}
                    value={field.value}
                    disabled={options.searchFields.includes(field.value as any)}
                  >
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Search Fields */}
            <div className="flex flex-wrap gap-2 mt-2">
              {options.searchFields.map((field) => (
                <Badge key={field} variant="secondary" className="gap-1">
                  {SEARCH_FIELDS.find((f) => f.value === field)?.label || field}
                  {options.searchFields.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-inherit hover:bg-transparent"
                      onClick={() => removeSearchField(field)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search Mode Description */}
          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
            {options.searchMode === "fuzzy" && (
              <>
                <strong>Smart Search:</strong> Finds matches even with typos or
                partial words. Great for general searching.
              </>
            )}
            {options.searchMode === "exact" && (
              <>
                <strong>Exact Match:</strong> Finds only exact matches of your
                search terms. Use for precise searches.
              </>
            )}
            {options.searchMode === "prefix" && (
              <>
                <strong>Starts With:</strong> Finds items that start with your
                search terms. Good for finding names or organized content.
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Summary */}
      {query && (
        <div className="text-xs text-gray-500">
          Searching {options.searchFields.length} field
          {options.searchFields.length !== 1 ? "s" : ""} for "{query}" using{" "}
          {options.searchMode} matching
          {options.caseSensitive && " (case sensitive)"}
        </div>
      )}

      {/* TODO: Business API - Advanced search requires enhanced query parameters */}
      {/* See docs/api-change-requests.md entry from 2024-12-19 */}
      {hasAdvancedOptions && (
        <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
          Note: Advanced search features require Business API enhancements (see
          API change requests)
        </div>
      )}
    </div>
  );
}
