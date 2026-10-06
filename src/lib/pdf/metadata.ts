/**
 * Dedicated PDF Metadata Extractor
 * Extracts total page count, document title, author, creation date, and more.
 */

export interface PdfMetadata {
  pageCount: number;
  title: string;
  author: string;
  creator?: string;
  producer?: string;
  creationDate?: string; // YYYY-MM-DD
  modificationDate?: string; // YYYY-MM-DD
  language?: "English" | "Hindi" | "Other";
  languageRaw?: string;
  subject?: string;
  keywords?: string;
  isEncrypted?: boolean;
  formatVersion?: string;
}

export function parsePdfDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  // Standard PDF date format: D:YYYYMMDDHHmmSS...
  const match = dateStr.match(/(?:D:)?(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return null;
}

export function cleanTitleFromFilename(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function isJunkTitle(title?: string | null): boolean {
  if (!title) return true;
  const trimmed = title.trim();
  if (trimmed.length < 2) return true;
  return /^(untitled|document\d*|microsoft word|pdf document|adobe|scan|scan_\d+|untitled document|presentation|new document)/i.test(
    trimmed
  );
}

export function isJunkAuthor(author?: string | null): boolean {
  if (!author) return true;
  const trimmed = author.trim();
  if (trimmed.length < 2) return true;
  return /^(unknown|author|administrator|admin|hp|canon|epson|xerox|user|windows user|pc|owner|default)/i.test(
    trimmed
  );
}

export function detectLanguageFromCode(code?: string | null): "English" | "Hindi" | "Other" {
  if (!code) return "English";
  const lower = code.toLowerCase();
  if (lower.startsWith("hi")) return "Hindi";
  if (lower.startsWith("en")) return "English";
  return "Other";
}

/**
 * Pure buffer regex fallback to count pages and locate metadata fields
 */
export function extractMetadataFromRawBuffer(
  buffer: Buffer | Uint8Array,
  fileName?: string
): PdfMetadata {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const raw = buf.toString("binary");

  const isEncrypted = raw.slice(0, 50000).includes("/Encrypt");

  // Count /Type /Page
  const pageMatches = raw.match(/\/Type\s*\/Page(?!\w)/g);
  // Look for /Count in /Pages dictionary
  const countMatches = raw.match(/\/Count\s+(\d+)/);
  let pageCount = 1;
  if (countMatches && countMatches[1]) {
    const parsed = parseInt(countMatches[1], 10);
    if (parsed > 0 && parsed < 20000) pageCount = parsed;
  } else if (pageMatches && pageMatches.length > 0) {
    pageCount = pageMatches.length;
  }

  // Version match e.g. %PDF-1.7
  const versionMatch = raw.slice(0, 20).match(/%PDF-(\d+\.\d+)/);
  const formatVersion = versionMatch ? versionMatch[1] : undefined;

  let rawTitle = "";
  const titleMatch = raw.match(/\/Title\s*(?:\(([^)]+)\)|<([0-9a-fA-F]+)>)/);
  if (titleMatch) {
    rawTitle = titleMatch[1] || "";
  }

  let rawAuthor = "";
  const authorMatch = raw.match(/\/Author\s*(?:\(([^)]+)\)|<([0-9a-fA-F]+)>)/);
  if (authorMatch) {
    rawAuthor = authorMatch[1] || "";
  }

  let rawDate = "";
  const dateMatch = raw.match(/\/CreationDate\s*(?:\(([^)]+)\)|<([0-9a-fA-F]+)>)/);
  if (dateMatch) {
    rawDate = dateMatch[1] || "";
  }

  const finalTitle = !isJunkTitle(rawTitle)
    ? rawTitle.trim()
    : fileName
    ? cleanTitleFromFilename(fileName)
    : "";
  const finalAuthor = !isJunkAuthor(rawAuthor) ? rawAuthor.trim() : "";
  const creationDate = parsePdfDate(rawDate) || undefined;

  return {
    pageCount: Math.max(1, pageCount),
    title: finalTitle,
    author: finalAuthor,
    creationDate,
    isEncrypted,
    formatVersion,
  };
}

/**
 * Main PDF Metadata extraction method
 */
export async function extractPdfMetadata(
  buffer: Buffer | Uint8Array,
  fileName?: string
): Promise<PdfMetadata> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // Check encryption first
  const headerSlice = buf.subarray(0, 50000).toString("binary");
  const isEncrypted = headerSlice.includes("/Encrypt");

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

    const loadingTask = pdfjs.getDocument({
      data: uint8,
      useSystemFonts: true,
    });

    const doc = await loadingTask.promise;
    const pageCount = doc.numPages || 1;

    let info: any = {};
    try {
      const meta = await doc.getMetadata();
      info = meta?.info || {};
    } catch (metaErr) {
      console.warn("Could not retrieve full PDF getMetadata():", metaErr);
    }

    const rawTitle = typeof info.Title === "string" ? info.Title : "";
    const rawAuthor = typeof info.Author === "string" ? info.Author : "";
    const rawCreator = typeof info.Creator === "string" ? info.Creator : undefined;
    const rawProducer = typeof info.Producer === "string" ? info.Producer : undefined;
    const rawSubject = typeof info.Subject === "string" ? info.Subject : undefined;
    const rawKeywords = typeof info.Keywords === "string" ? info.Keywords : undefined;
    const rawLang = typeof info.Language === "string" ? info.Language : undefined;

    const creationDate = parsePdfDate(info.CreationDate) || undefined;
    const modificationDate = parsePdfDate(info.ModDate) || undefined;

    const finalTitle = !isJunkTitle(rawTitle)
      ? rawTitle.trim()
      : fileName
      ? cleanTitleFromFilename(fileName)
      : "";

    const finalAuthor = !isJunkAuthor(rawAuthor) ? rawAuthor.trim() : "";

    return {
      pageCount: Math.max(1, pageCount),
      title: finalTitle,
      author: finalAuthor,
      creator: rawCreator,
      producer: rawProducer,
      subject: rawSubject,
      keywords: rawKeywords,
      creationDate,
      modificationDate,
      language: detectLanguageFromCode(rawLang),
      languageRaw: rawLang,
      isEncrypted,
      formatVersion: info.PDFFormatVersion,
    };
  } catch (err) {
    console.warn("PDF.js metadata extraction encountered error, using fallback buffer parser:", err);
    return extractMetadataFromRawBuffer(buf, fileName);
  }
}
