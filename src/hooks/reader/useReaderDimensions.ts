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
  spreadMode: "dual" | "single"
): ReaderDimensions {
  const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2.5) : 2;

  // Mobile threshold (< 1024px defaults to single page portrait)
  const isMobile = windowWidth < 1024;
  const isSingle = isMobile || spreadMode === "single";

  // Available reading area accounting for top/bottom floating toolbars
  const verticalChrome = isMobile ? 84 : 110;
  const horizontalPadding = isMobile ? 8 : 48;

  const availableWidth = Math.max(windowWidth - horizontalPadding, 240);
  const availableHeight = Math.max(windowHeight - verticalChrome, 360);

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

  const flooredPageWidth = Math.max(240, Math.floor(targetWidth));
  const flooredPageHeight = Math.max(340, Math.floor(targetHeight));

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
  const [dimensions, setDimensions] = useState<ReaderDimensions>(() =>
    calculateDimensions(aspectRatio, spreadMode)
  );

  useEffect(() => {
    const update = () => {
      setDimensions(calculateDimensions(aspectRatio, spreadMode));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [aspectRatio, spreadMode]);

  return dimensions;
}
