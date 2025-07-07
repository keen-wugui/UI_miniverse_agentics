"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Document } from "@/types/api";

interface DocumentCardProps {
  document: Document;
  view: "list" | "grid";
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const getStatusIcon = (status: Document["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "processing":
      return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "pending":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusBadgeVariant = (status: Document["status"]) => {
  switch (status) {
    case "completed":
      return "default";
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "outline";
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function DocumentCard({
  document,
  view,
  isSelected = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onDownload,
}: DocumentCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleSelect = () => {
    onSelect?.(document.id, !isSelected);
  };

  const getFileIcon = () => {
    const extension = document.filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "txt":
        return "📰";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      default:
        return "📁";
    }
  };

  if (view === "list") {
    return (
      <div
        className={`flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow ${
          isSelected ? "bg-blue-50 border-blue-200" : "bg-white"
        }`}
      >
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />

        {/* File Icon */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">{getFileIcon()}</span>
          </div>
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.name}
            </h3>
            {getStatusIcon(document.status)}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>{document.filename}</span>
            <span>{formatFileSize(document.size)}</span>
            <span>{format(new Date(document.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex-shrink-0 flex gap-1">
          {document.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {document.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{document.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <Badge variant={getStatusBadgeVariant(document.status)}>
            {document.status}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(document.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload?.(document.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(document.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(document.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
    >
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        <div className="flex justify-between items-start mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(document.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload?.(document.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(document.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(document.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File Preview */}
        <div className="mb-4">
          <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <span className="text-4xl">{getFileIcon()}</span>
          </div>
        </div>

        {/* Document Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate flex-1">
              {document.name}
            </h3>
            {getStatusIcon(document.status)}
          </div>

          <p className="text-xs text-gray-500 truncate">{document.filename}</p>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{formatFileSize(document.size)}</span>
            <span>{format(new Date(document.createdAt), "MMM d")}</span>
          </div>

          {/* Status Badge */}
          <Badge
            variant={getStatusBadgeVariant(document.status)}
            className="text-xs"
          >
            {document.status}
          </Badge>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
