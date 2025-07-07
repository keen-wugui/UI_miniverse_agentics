"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewState {
  zoom: number;
  isFullscreen: boolean;
  rotation: number;
  currentPage?: number;
  totalPages?: number;
}

interface PreviewControlsProps {
  previewState: PreviewState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onRotate: () => void;
  onToggleFullscreen: () => void;
  onDownload: () => void;
  onShare: () => void;
  compact?: boolean;
}

const PreviewControls: React.FC<PreviewControlsProps> = ({
  previewState,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onRotate,
  onToggleFullscreen,
  onDownload,
  onShare,
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          disabled={previewState.zoom <= 25}
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        {!compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomReset}
            title="Reset Zoom (Ctrl+0)"
            className="min-w-[60px] text-xs"
          >
            {previewState.zoom}%
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          disabled={previewState.zoom >= 500}
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Rotate */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRotate}
        title="Rotate (Ctrl+R)"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      {/* Fullscreen */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFullscreen}
        title="Toggle Fullscreen (Ctrl+F)"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {/* Action Controls */}
      <div className="flex items-center gap-1 ml-2 border-l pl-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          title="Download (Ctrl+D)"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onShare} title="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { PreviewControls };
