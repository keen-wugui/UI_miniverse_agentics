"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import {
  FileText,
  Image,
  FileVideo,
  FileAudio,
  FileCode,
  Download,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document } from "@/types/api";

interface PreviewState {
  zoom: number;
  isFullscreen: boolean;
  rotation: number;
  currentPage?: number;
  totalPages?: number;
}

interface DocumentPreviewProps {
  document: Document;
  previewState: PreviewState;
  onStateUpdate: (updates: Partial<PreviewState>) => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  className?: string;
  fullscreen?: boolean;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  previewState,
  onStateUpdate,
  onError,
  onLoadingChange,
  className = "",
  fullscreen = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // File type detection
  const fileType = useMemo(() => {
    const contentType = document.contentType.toLowerCase();
    if (contentType.includes("image/")) return "image";
    if (contentType.includes("application/pdf")) return "pdf";
    if (
      contentType.includes("text/") ||
      contentType.includes("application/json")
    )
      return "text";
    if (contentType.includes("video/")) return "video";
    if (contentType.includes("audio/")) return "audio";
    if (
      contentType.includes("application/javascript") ||
      contentType.includes("text/javascript") ||
      contentType.includes("text/typescript") ||
      contentType.includes("text/html") ||
      contentType.includes("text/css")
    )
      return "code";
    return "unknown";
  }, [document.contentType]);

  // Generate preview URL (in real app, this would come from API)
  useEffect(() => {
    setIsLoading(true);
    onLoadingChange(true);

    // Simulate API call to get preview URL
    const generatePreviewUrl = () => {
      try {
        // In a real app, you'd call your API here
        // For now, simulate different file types
        switch (fileType) {
          case "image":
            setPreviewUrl(`/api/documents/${document.id}/preview`);
            break;
          case "pdf":
            setPreviewUrl(
              `/api/documents/${document.id}/preview?page=${previewState.currentPage || 1}`
            );
            break;
          case "text":
          case "code":
            setPreviewUrl(`/api/documents/${document.id}/content`);
            break;
          default:
            setPreviewUrl(null);
        }
        onError(null);
      } catch (error) {
        onError(
          `Failed to generate preview: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        setPreviewUrl(null);
      } finally {
        setIsLoading(false);
        onLoadingChange(false);
      }
    };

    const timeout = setTimeout(generatePreviewUrl, 500); // Simulate network delay
    return () => clearTimeout(timeout);
  }, [
    document.id,
    fileType,
    previewState.currentPage,
    onError,
    onLoadingChange,
  ]);

  // Transform styles based on preview state
  const transformStyle = useMemo(() => {
    const { zoom, rotation } = previewState;
    return {
      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
      transformOrigin: "center",
      transition: "transform 0.2s ease-in-out",
    };
  }, [previewState.zoom, previewState.rotation]);

  const renderFileIcon = () => {
    const iconProps = { className: "h-16 w-16 text-muted-foreground" };

    switch (fileType) {
      case "image":
        return <Image {...iconProps} />;
      case "pdf":
        return <FileText {...iconProps} />;
      case "text":
        return <FileText {...iconProps} />;
      case "video":
        return <FileVideo {...iconProps} />;
      case "audio":
        return <FileAudio {...iconProps} />;
      case "code":
        return <FileCode {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      );
    }

    switch (fileType) {
      case "image":
        return (
          <div className="flex h-full items-center justify-center p-4">
            <div style={transformStyle}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={document.name}
                  className="max-w-full max-h-full object-contain"
                  onError={() => onError("Failed to load image preview")}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 p-8">
                  {renderFileIcon()}
                  <p className="text-sm text-muted-foreground text-center">
                    Image preview not available
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="flex h-full items-center justify-center p-4">
            <div style={transformStyle} className="w-full h-full">
              {previewUrl ? (
                <div className="w-full h-full border rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    title={`PDF Preview - ${document.name}`}
                    onError={() => onError("Failed to load PDF preview")}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8">
                  {renderFileIcon()}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      PDF preview not available
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "text":
      case "code":
        return (
          <div className="h-full p-4">
            <div style={transformStyle} className="h-full">
              {previewUrl ? (
                <div className="h-full border rounded-lg bg-background">
                  <div className="p-4 h-full overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {/* In real app, fetch and display text content */}
                      Loading text content...
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8">
                  {renderFileIcon()}
                  <p className="text-sm text-muted-foreground text-center">
                    Text preview not available
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "video":
        return (
          <div className="flex h-full items-center justify-center p-4">
            <div style={transformStyle}>
              {previewUrl ? (
                <video
                  controls
                  className="max-w-full max-h-full"
                  onError={() => onError("Failed to load video preview")}
                >
                  <source src={previewUrl} type={document.contentType} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8">
                  {renderFileIcon()}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Video preview not available
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="flex h-full items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
              {renderFileIcon()}
              {previewUrl ? (
                <audio
                  controls
                  className="w-full max-w-md"
                  onError={() => onError("Failed to load audio preview")}
                >
                  <source src={previewUrl} type={document.contentType} />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Audio preview not available
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download to listen
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex h-full items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 text-center">
              {renderFileIcon()}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Preview not available for this file type
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {document.contentType}
                </p>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download file
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  // Show error state
  if (previewState.currentPage && document.metadata.pageCount) {
    const errorMsg = `Invalid page ${previewState.currentPage} of ${document.metadata.pageCount}`;
    return (
      <Card className={`h-full ${className}`}>
        <div className="flex h-full items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive mb-1">
                Preview Error
              </p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`h-full ${className}`}>
      <div className="h-full relative">
        {renderPreviewContent()}

        {/* File info overlay (bottom-left) */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{document.contentType}</span>
            {document.size && (
              <>
                <span>•</span>
                <span>{(document.size / 1024 / 1024).toFixed(1)} MB</span>
              </>
            )}
            {document.metadata.pageCount && fileType === "pdf" && (
              <>
                <span>•</span>
                <span>{document.metadata.pageCount} pages</span>
              </>
            )}
          </div>
        </div>

        {/* Processing status overlay */}
        {document.status === "processing" && (
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
              Processing...
              {document.processingProgress && (
                <span>{document.processingProgress}%</span>
              )}
            </div>
          </div>
        )}

        {/* Error status overlay */}
        {document.status === "failed" && (
          <div className="absolute top-4 right-4 bg-destructive/10 backdrop-blur-sm border border-destructive/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Processing failed
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export { DocumentPreview };
