/**
 * Centralized PDF.js client setup for Readora 3D Book Reader
 */

import type { PDFDocumentProxy } from "pdfjs-dist";

// Document promise cache by bookId
const documentCache = new Map<string, Promise<PDFDocumentProxy>>();

/**
 * Configure worker & CMaps, and load the PDF document.
 */
export async function getPdfDocument(bookId: string, pdfUrlOrData?: string | Uint8Array): Promise<PDFDocumentProxy> {
  const cached = documentCache.get(bookId);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const pdfjs = await import("pdfjs-dist");

    const version = pdfjs.version || "6.4.299";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.${version}.min.mjs`;
    }

    const cMapUrl = origin ? `${origin}/cmaps/` : `https://unpkg.com/pdfjs-dist@${version}/cmaps/`;
    const standardFontDataUrl = origin ? `${origin}/standard_fonts/` : `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`;

    // If binary data provided directly
    if (pdfUrlOrData instanceof Uint8Array) {
      const dataCopy = new Uint8Array(pdfUrlOrData.byteLength);
      dataCopy.set(pdfUrlOrData);
      const task = pdfjs.getDocument({
        data: dataCopy,
        cMapUrl,
        cMapPacked: true,
        standardFontDataUrl,
      });
      return await task.promise;
    }

    // Default source URL
    const url = typeof pdfUrlOrData === "string" ? pdfUrlOrData : `/api/files/books/${bookId}`;

    // Strategy 1: Fetch ArrayBuffer with cache-busting to prevent stale caches
    try {
      const separator = url.includes("?") ? "&" : "?";
      const requestUrl = `${url}${separator}_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        cache: "no-store",
        headers: { Accept: "application/pdf,*/*" },
      });

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer && buffer.byteLength > 0) {
          const task = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
          });
          return await task.promise;
        }
      }
    } catch (fetchErr) {
      console.warn("ArrayBuffer direct load fallback:", fetchErr);
    }

    // Strategy 2: Direct URL loading fallback
    const directTask = pdfjs.getDocument({
      url,
      cMapUrl,
      cMapPacked: true,
      standardFontDataUrl,
    });
    return await directTask.promise;
  })().catch((err) => {
    documentCache.delete(bookId);
    throw err;
  });

  documentCache.set(bookId, promise);
  return promise;
}

export function clearPdfDocumentCache(bookId?: string) {
  if (bookId) {
    documentCache.delete(bookId);
  } else {
    documentCache.clear();
  }
}
