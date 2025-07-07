"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { X, Maximize2, Download, Share2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Document } from "@/types/api";
import { DocumentPreview } from "./document-preview";
import { DocumentMetadata } from "./document-metadata";
import { PreviewControls } from "./preview-controls";

interface DocumentDetailViewProps {
  document: Document;
  onClose?: () => void;
  className?: string;
}

interface PreviewState {
  zoom: number;
  isFullscreen: boolean;
  rotation: number;
  currentPage?: number;
  totalPages?: number;
}

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({
  document: doc,
  onClose,
  className = "",
}) => {
  const router = useRouter();
  const [previewState, setPreviewState] = useState<PreviewState>({
    zoom: 100,
    isFullscreen: false,
    rotation: 0,
    currentPage: 1,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "Escape":
          if (previewState.isFullscreen) {
            handleToggleFullscreen();
          } else {
            handleClose();
          }
          break;
        case "f":
        case "F":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleToggleFullscreen();
          }
          break;
        case "+":
        case "=":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomIn();
          }
          break;
        case "-":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomOut();
          }
          break;
        case "0":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomReset();
          }
          break;
        case "r":
        case "R":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleRotate();
          }
          break;
        case "d":
        case "D":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleDownload();
          }
          break;
        case "ArrowLeft":
          if (previewState.currentPage && previewState.currentPage > 1) {
            setPreviewState((prev) => ({
              ...prev,
              currentPage: Math.max(1, (prev.currentPage || 1) - 1),
            }));
          }
          break;
        case "ArrowRight":
          if (
            previewState.currentPage &&
            previewState.totalPages &&
            previewState.currentPage < previewState.totalPages
          ) {
            setPreviewState((prev) => ({
              ...prev,
              currentPage: Math.min(
                prev.totalPages || 1,
                (prev.currentPage || 1) + 1
              ),
            }));
          }
          break;
      }
    };

    window.document.addEventListener("keydown", handleKeyPress);
    return () => window.document.removeEventListener("keydown", handleKeyPress);
  }, [
    previewState.isFullscreen,
    previewState.currentPage,
    previewState.totalPages,
  ]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  const handleToggleFullscreen = useCallback(() => {
    setPreviewState((prev) => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
    }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setPreviewState((prev) => ({
      ...prev,
      zoom: Math.min(500, prev.zoom + 25),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPreviewState((prev) => ({
      ...prev,
      zoom: Math.max(25, prev.zoom - 25),
    }));
  }, []);

  const handleZoomReset = useCallback(() => {
    setPreviewState((prev) => ({
      ...prev,
      zoom: 100,
    }));
  }, []);

  const handleRotate = useCallback(() => {
    setPreviewState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  const handleDownload = useCallback(() => {
    // Trigger download - generate download URL from document ID
    const link = window.document.createElement("a");
    link.href = `/api/documents/${doc.id}/download`;
    link.download = doc.name;
    link.click();
  }, [doc.id, doc.name]);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/documents/${doc.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: doc.name,
          text: `Document: ${doc.name}`,
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          // Could show a toast notification here
          console.log("Link copied to clipboard");
        })
        .catch(console.error);
    }
  }, [doc.name, doc.id]);

  const updatePreviewState = useCallback((updates: Partial<PreviewState>) => {
    setPreviewState((prev) => ({ ...prev, ...updates }));
  }, []);

  if (previewState.isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex h-full flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h1 className="text-lg font-semibold truncate">{doc.name}</h1>
            <div className="flex items-center gap-2">
              <PreviewControls
                previewState={previewState}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                onRotate={handleRotate}
                onToggleFullscreen={handleToggleFullscreen}
                onDownload={handleDownload}
                onShare={handleShare}
                compact
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFullscreen}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fullscreen Preview */}
          <div className="flex-1 overflow-hidden">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  Loading preview...
                </div>
              }
            >
              <DocumentPreview
                document={doc}
                previewState={previewState}
                onStateUpdate={updatePreviewState}
                onError={setError}
                onLoadingChange={setIsLoading}
                className="h-full"
                fullscreen
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold truncate">{doc.name}</h1>
        <div className="flex items-center gap-2">
          <PreviewControls
            previewState={previewState}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onRotate={handleRotate}
            onToggleFullscreen={handleToggleFullscreen}
            onDownload={handleDownload}
            onShare={handleShare}
          />
          {onClose && (
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Split Panel Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Preview Panel */}
          <Panel defaultSize={70} minSize={40}>
            <div className="h-full overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading preview...
                      </p>
                    </div>
                  </div>
                }
              >
                <DocumentPreview
                  document={doc}
                  previewState={previewState}
                  onStateUpdate={updatePreviewState}
                  onError={setError}
                  onLoadingChange={setIsLoading}
                  className="h-full"
                />
              </Suspense>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

          {/* Metadata Panel */}
          <Panel defaultSize={30} minSize={25} maxSize={50}>
            <div className="h-full overflow-auto">
              <DocumentMetadata
                document={doc}
                previewState={previewState}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </Card>
  );
};

export { DocumentDetailView };
