"use client";

import { useState, useEffect } from "react";

interface ReaderDimensions {
  containerWidth: number;
  containerHeight: number;
  pageWidth: number;
  pageHeight: number;
  isMobile: boolean;
  dpr: number;
}

function calculateDimensions(
  aspectRatio: number,
  spreadMode: "dual" | "single",
  isSsr: boolean = false
): ReaderDimensions {
  const windowWidth = !isSsr && typeof window !== "undefined" ? window.innerWidth : 1200;
  const windowHeight = !isSsr && typeof window !== "undefined" ? window.innerHeight : 800;
  const dpr = !isSsr && typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2.5) : 2;

  // Mobile threshold (< 1024px defaults to single page portrait)
  const isMobile = windowWidth < 1024;
  const isSingle = isMobile || spreadMode === "single";

  // Available reading area accounting for top/bottom floating toolbars and navigation clearance
  const verticalChrome = isMobile ? 140 : 130;
  const horizontalPadding = isMobile ? 24 : 48;

  const availableWidth = Math.max(windowWidth - horizontalPadding, 220);
  const availableHeight = Math.max(windowHeight - verticalChrome, 320);

  let targetWidth = 0;
  let targetHeight = 0;

  if (isSingle) {
    const maxSingleWidth = Math.min(availableWidth, 780);
    targetHeight = Math.min(availableHeight, 1020);
    targetWidth = targetHeight * aspectRatio;

    if (targetWidth > maxSingleWidth) {
      targetWidth = maxSingleWidth;
      targetHeight = targetWidth / aspectRatio;
    }
  } else {
    const maxSinglePageWidth = (availableWidth - 24) / 2;
    targetHeight = Math.min(availableHeight, 960);
    targetWidth = targetHeight * aspectRatio;

    if (targetWidth > maxSinglePageWidth) {
      targetWidth = maxSinglePageWidth;
      targetHeight = targetWidth / aspectRatio;
    }
  }

  const flooredPageWidth = Math.max(220, Math.floor(targetWidth));
  const flooredPageHeight = Math.max(320, Math.floor(targetHeight));

  return {
    containerWidth: isSingle ? flooredPageWidth : flooredPageWidth * 2,
    containerHeight: flooredPageHeight,
    pageWidth: flooredPageWidth,
    pageHeight: flooredPageHeight,
    isMobile,
    dpr,
  };
}

export function useReaderDimensions(
  aspectRatio: number = 0.707,
  spreadMode: "dual" | "single" = "dual"
): ReaderDimensions {
  // Always initialize with deterministic SSR dimensions so initial server HTML
  // and initial client hydration match exactly with 0% mismatch
  const [dimensions, setDimensions] = useState<ReaderDimensions>(() =>
    calculateDimensions(aspectRatio, spreadMode, true)
  );

  useEffect(() => {
    // Immediately calculate against the browser's real viewport on mount
    setDimensions(calculateDimensions(aspectRatio, spreadMode, false));

    const update = () => {
      setDimensions(calculateDimensions(aspectRatio, spreadMode, false));
    };

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [aspectRatio, spreadMode]);

  return dimensions;
}
