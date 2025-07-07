"use client";

import React from "react";
import { format } from "date-fns";
import {
  File,
  Calendar,
  User,
  Tag,
  HardDrive,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Document } from "@/types/api";

interface PreviewState {
  zoom: number;
  isFullscreen: boolean;
  rotation: number;
  currentPage?: number;
  totalPages?: number;
}

interface DocumentMetadataProps {
  document: Document;
  previewState: PreviewState;
  isLoading: boolean;
  error: string | null;
}

const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  document,
  previewState,
  isLoading,
  error,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("image")) return "🖼️";
    if (lowerType.includes("pdf")) return "📄";
    if (lowerType.includes("text")) return "📝";
    if (lowerType.includes("video")) return "🎥";
    if (lowerType.includes("audio")) return "🎵";
    return "📁";
  };

  return (
    <div className="p-4 space-y-4">
      {/* Document Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <File className="h-4 w-4" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <p className="text-sm break-words">{document.name}</p>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Content Type
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getFileTypeIcon(document.contentType)}
              </span>
              <span className="text-sm">{document.contentType}</span>
            </div>
          </div>

          {/* Size */}
          {document.size && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Size
              </label>
              <p className="text-sm flex items-center gap-2">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(document.size)}
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <div className="mt-1">
              <Badge
                variant={
                  document.status === "completed"
                    ? "default"
                    : document.status === "processing"
                      ? "secondary"
                      : document.status === "failed"
                        ? "destructive"
                        : "outline"
                }
              >
                {document.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timestamps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {document.createdAt && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-sm">
                {format(new Date(document.createdAt), "PPp")}
              </p>
            </div>
          )}

          {document.updatedAt && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Last Modified
              </label>
              <p className="text-sm">
                {format(new Date(document.updatedAt), "PPp")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {document.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded By */}
      {document.uploadedBy && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Uploaded By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{document.uploadedBy}</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Zoom
            </label>
            <p className="text-sm">{previewState.zoom}%</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Rotation
            </label>
            <p className="text-sm">{previewState.rotation}°</p>
          </div>

          {previewState.currentPage && previewState.totalPages && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Page
              </label>
              <p className="text-sm">
                {previewState.currentPage} of {previewState.totalPages}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Loading
            </label>
            <p className="text-sm">{isLoading ? "Yes" : "No"}</p>
          </div>

          {error && (
            <div>
              <label className="text-xs font-medium text-muted-foreground text-destructive">
                Error
              </label>
              <p className="text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zoom In</span>
              <span className="font-mono">Ctrl + +</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zoom Out</span>
              <span className="font-mono">Ctrl + -</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reset Zoom</span>
              <span className="font-mono">Ctrl + 0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rotate</span>
              <span className="font-mono">Ctrl + R</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fullscreen</span>
              <span className="font-mono">Ctrl + F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Download</span>
              <span className="font-mono">Ctrl + D</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Close/Exit</span>
              <span className="font-mono">Escape</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous Page</span>
              <span className="font-mono">← Arrow</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Page</span>
              <span className="font-mono">→ Arrow</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { DocumentMetadata };
