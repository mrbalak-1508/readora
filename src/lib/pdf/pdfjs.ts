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

    // Strategy 1: Fetch as JSON Base64 payload.
    // Download managers (IDM, Free Download Manager) intercept binary/PDF downloads,
    // hijack the file onto disk, and return 204 No Content to the browser.
    // Fetching via application/json guarantees that IDM NEVER intercepts the stream.
    try {
      const separator = url.includes("?") ? "&" : "?";
      const requestUrl = `${url}${separator}stream=reader&format=base64&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
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

      // Check if JSON Base64 payload received (immune to download managers)
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await res.json();
        if (payload?.data) {
          const binaryStr = atob(payload.data);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const task = pdfjs.getDocument({
            data: bytes,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
          });
          return await task.promise;
        }
      }

      // Fallback: Direct binary response
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
