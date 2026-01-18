// ============================================
// PDF Preview Pane Component
// Enhanced preview with thumbnails and zoom
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfPreviewPaneProps {
  previewUrl: string | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showDealerSummary?: boolean;
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function PdfPreviewPane({
  previewUrl,
  zoom,
  onZoomChange,
  showDealerSummary,
  pageCount = 1,
  currentPage = 1,
  onPageChange,
}: PdfPreviewPaneProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => onZoomChange(Math.min(zoom + 25, 200));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 25, 50));
  const handleZoomReset = () => onZoomChange(100);

  const handlePrevPage = () => {
    if (onPageChange && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (onPageChange && currentPage < pageCount) {
      onPageChange(currentPage + 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      isFullscreen && "fixed inset-0 z-50 bg-background"
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            Seite {currentPage} von {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= pageCount}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-8 w-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="w-24">
            <Slider
              value={[zoom]}
              onValueChange={([value]) => onZoomChange(value)}
              min={50}
              max={200}
              step={10}
              className="cursor-pointer"
            />
          </div>
          
          <span className="text-sm text-muted-foreground w-12 text-center">
            {zoom}%
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-8 w-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomReset}
            className="h-8 w-8"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Dealer Warning Badge */}
        {showDealerSummary && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-600">
            <span className="text-xs font-medium">🔒 Enthält Händler-Informationen</span>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 min-h-0 bg-muted/50 overflow-auto">
        {previewUrl ? (
          <div
            className="flex justify-center p-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <iframe
              src={previewUrl}
              className="w-full bg-white shadow-lg rounded"
              style={{
                height: isFullscreen ? "calc(100vh - 100px)" : "calc(100vh - 320px)",
                minHeight: "500px",
                maxWidth: "800px",
              }}
              title="PDF Vorschau"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span>Keine Vorschau verfügbar</span>
          </div>
        )}
      </div>

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="fixed bottom-4 right-4 z-50 gap-2"
        >
          <Minimize2 className="w-4 h-4" />
          Vollbild beenden
        </Button>
      )}
    </div>
  );
}
