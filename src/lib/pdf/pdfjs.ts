/**
 * Centralized PDF.js client setup for Readora 3D Book Reader
 */

import type { PDFDocumentProxy } from "pdfjs-dist";

// Document promise cache by bookId
const documentCache = new Map<string, Promise<PDFDocumentProxy>>();

let cachedPdfjs: typeof import("pdfjs-dist") | null = null;

/**
 * Return singleton pdfjs module instance and configure worker once
 */
export async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!cachedPdfjs) {
    cachedPdfjs = await import("pdfjs-dist");
    const version = cachedPdfjs.version || "6.4.299";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof window !== "undefined") {
      cachedPdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.${version}.min.mjs`;
    }
  }
  return cachedPdfjs;
}

/**
 * Configure worker & CMaps, and load the PDF document with zero UI hang.
 */
export async function getPdfDocument(bookId: string, pdfUrlOrData?: string | Uint8Array): Promise<PDFDocumentProxy> {
  const cached = documentCache.get(bookId);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const pdfjs = await getPdfjs();

    const version = pdfjs.version || "6.4.299";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
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

    try {
      // 1. High-Performance Direct Binary Stream
      // Streams raw ArrayBuffer directly into PDF.js WebAssembly core without Base64 overhead or string loops
      const separator = url.includes("?") ? "&" : "?";
      const requestUrl = `${url}${separator}stream=reader&format=binary`;
      const res = await fetch(requestUrl, {
        headers: {
          Accept: "application/octet-stream, */*",
          "X-Readora-Reader": "1",
        },
      });

      if (!res.ok) {
        let errorMsg = `Server returned status ${res.status}`;
        try {
          const errorJson = await res.json();
          if (errorJson?.error) {
            errorMsg = errorJson.error;
          }
        } catch {
          // not JSON
        }
        throw new Error(errorMsg);
      }

      const contentType = res.headers.get("content-type") || "";

      // Path A: Raw binary response (instant, 0% CPU decoding)
      if (!contentType.includes("application/json")) {
        const buffer = await res.arrayBuffer();
        if (buffer && buffer.byteLength > 0) {
          const task = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
          });
          return await task.promise;
        } else {
          throw new Error("Received empty manuscript content (0 bytes).");
        }
      }

      // Path B: Base64 JSON fallback - decoded via native browser C++ pipeline without freezing main thread
      const payload = await res.json();
      if (payload?.data) {
        const blobRes = await fetch(`data:application/pdf;base64,${payload.data}`);
        const buffer = await blobRes.arrayBuffer();
        const task = pdfjs.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl,
          cMapPacked: true,
          standardFontDataUrl,
        });
        return await task.promise;
      }

      throw new Error("Invalid document stream response from server.");
    } catch (fetchErr: any) {
      throw fetchErr;
    }
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
