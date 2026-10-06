"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getPdfDocument } from "@/lib/pdf/pdfjs";
import { pageCache } from "@/lib/reader/pageCache";
import { Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";

interface PdfPageProps {
  bookId: string;
  pageNumber: number;
  width?: number;
  height?: number;
  scale?: number;
  watermark?: string | null;
  hasFullAccess?: boolean;
  previewLimit?: number;
  price?: number;
  currency?: string;
  isActiveWindow?: boolean;
  onPageRendered?: (pageNum: number, totalPages: number) => void;
  onUnlockRequest?: () => void;
  className?: string;
}

export const PdfPage = React.memo(function PdfPage({
  bookId,
  pageNumber,
  width,
  height,
  scale = 1.0,
  watermark,
  hasFullAccess = true,
  previewLimit = 10,
  price,
  currency = "INR",
  isActiveWindow = true,
  onPageRendered,
  onUnlockRequest,
  className = "",
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRenderTaskRef = useRef<any>(null);
  const hasRenderedRef = useRef<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [cssSize, setCssSize] = useState<{ width: number; height: number } | null>(null);

  // Check if this page is beyond the allowed free preview limit
  const isLocked = !hasFullAccess && previewLimit && pageNumber > previewLimit;

  const renderPage = useCallback(
    async (signal?: AbortSignal) => {
      if (isLocked) {
        setLoading(false);
        return;
      }

      if (!canvasRef.current || !containerRef.current) return;

      // Only show prominent loading spinner on initial unrendered load
      if (!hasRenderedRef.current) {
        setLoading(true);
      }
      setError(null);

      // Cancel previous render task on this canvas if active
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {}
        activeRenderTaskRef.current = null;
      }

      try {
        const pdf = await getPdfDocument(bookId);
        if (signal?.aborted) return;

        setTotalPages(pdf.numPages);
        if (onPageRendered) {
          onPageRendered(pageNumber, pdf.numPages);
        }

        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          setError(`Page ${pageNumber} does not exist in this manuscript.`);
          setLoading(false);
          return;
        }

        const page = await pdf.getPage(pageNumber);
        if (signal?.aborted) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Base unscaled viewport
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const originalAspect = unscaledViewport.width / unscaledViewport.height;

        // Container bounds allowing the page to fill the book leaf naturally
        const targetWidth = width ? Math.max(width, 200) : Math.max(container.clientWidth, 240);
        const targetHeight = height ? Math.max(height, 280) : Math.max(container.clientHeight, 340);

        // Fit page while strictly preserving the original PDF's aspect ratio
        const fitScale = Math.min(
          targetWidth / unscaledViewport.width,
          targetHeight / unscaledViewport.height
        );
        const effectiveFitScale = fitScale * scale;

        // High-DPI crisp Retina scaling (at least 2.0x for razor sharp typography)
        const dpr = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2.0) : 2.0;
        const viewport = page.getViewport({ scale: effectiveFitScale * dpr });

        const displayWidth = Math.floor(viewport.width / dpr);
        const displayHeight = Math.floor(viewport.height / dpr);

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        setCssSize({ width: displayWidth, height: displayHeight });

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Ensure white paper background for pages with transparent backgrounds
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = (page as any).render({
          canvasContext: ctx,
          viewport: viewport,
        });
        activeRenderTaskRef.current = renderTask;

        await renderTask.promise;
        if (activeRenderTaskRef.current === renderTask) {
          activeRenderTaskRef.current = null;
        }

        // Cache page metrics
        pageCache.touch(pageNumber, {
          pageNumber,
          viewportWidth: unscaledViewport.width,
          viewportHeight: unscaledViewport.height,
          aspectRatio: originalAspect,
        });

        if (!signal?.aborted) {
          hasRenderedRef.current = true;
          setLoading(false);
        }
      } catch (err: any) {
        if (
          err?.name === "RenderingCancelledException" ||
          err?.message?.toLowerCase().includes("cancel")
        ) {
          return;
        }

        if (!signal?.aborted) {
          console.warn(`PDF page ${pageNumber} render notice:`, err?.message || err);
          setError(err?.message || "Failed to render page");
          setLoading(false);
        }
      }
    },
    [bookId, pageNumber, width, height, scale, isLocked, onPageRendered]
  );

  useEffect(() => {
    if (!isActiveWindow && hasRenderedRef.current) {
      setLoading(false);
      return;
    }

    const controller = pageCache.createAbortController(pageNumber);

    renderPage(controller.signal);

    return () => {
      controller.abort();
      pageCache.removeAbortController(pageNumber);
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {}
        activeRenderTaskRef.current = null;
      }
    };
  }, [renderPage, pageNumber, isActiveWindow]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center relative overflow-hidden select-none ${className}`}
    >
      {/* LOCKED PREVIEW OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[var(--background)]/95 via-[var(--background)]/90 to-[var(--background)]/95 backdrop-blur-sm z-30">
          <div className="w-12 h-12 rounded-full bg-[var(--coral)]/15 text-[var(--coral)] flex items-center justify-center mb-3 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)] bg-[var(--coral)]/10 px-3 py-1 rounded-full mb-2">
            Free Preview Limit ({previewLimit} Pages)
          </span>
          <h4 className="font-editorial text-lg font-bold text-[var(--foreground)] mb-1.5">
            Page {pageNumber} is Locked
          </h4>
          <p className="text-xs text-[var(--muted)] max-w-xs mb-4 leading-relaxed">
            Purchase this edition to unlock all {totalPages || ""} pages and permanent digital access.
          </p>
          {onUnlockRequest && (
            <button
              onClick={onUnlockRequest}
              className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Unlock Full Book {price ? `• ₹${price}` : ""}</span>
            </button>
          )}
        </div>
      )}

      {/* LOADING SPINNER */}
      {loading && !hasRenderedRef.current && !isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-2xs z-20 transition-opacity">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)] mb-1.5 opacity-70" />
          <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest text-[var(--foreground)]">
            Rendering Page {pageNumber}
          </span>
        </div>
      )}

      {/* ERROR FALLBACK */}
      {error && !loading && !hasRenderedRef.current && !isLocked && (
        <div className="text-center p-6 text-xs text-[var(--muted)] space-y-2 z-20">
          <p className="font-semibold text-[var(--foreground)]">Could not render Page {pageNumber}</p>
          <p className="text-[11px] opacity-70 max-w-xs mx-auto">{error}</p>
          <button
            onClick={() => renderPage()}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs mx-auto mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* REAL HIGH-DPI PDF PAGE CANVAS */}
      <canvas
        ref={canvasRef}
        className="rounded-xs transition-opacity duration-300 block shadow-xs"
        style={{
          width: cssSize ? `${cssSize.width}px` : "100%",
          height: cssSize ? `${cssSize.height}px` : "auto",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          opacity: (!hasRenderedRef.current && loading) || isLocked ? 0 : 1,
        }}
      />

      {/* SUBTLE LICENSED USER WATERMARK OVERLAY */}
      {watermark && !isLocked && !loading && (
        <div className="absolute inset-x-2 bottom-3 pointer-events-none text-center opacity-20 text-[9px] font-mono select-none z-10 truncate">
          {watermark}
        </div>
      )}
    </div>
  );
});
