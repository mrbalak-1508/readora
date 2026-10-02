import { Book } from "./types";

export interface PageData {
  pageNumber: number;
  chapterTitle: string;
  paragraphs: string[];
}

/**
 * Paginates a book's chapters and content into distinct, readable pages
 * with ~180-260 words per page for comfortable editorial reading on both
 * mobile and desktop.
 */
export function paginateBook(book: Book): PageData[] {
  const pages: PageData[] = [];
  let pageCounter = 1;

  if (book.chapters && book.chapters.length > 0) {
    for (const ch of book.chapters) {
      const rawText = ch.content || "";
      const rawParas = rawText
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (rawParas.length === 0) {
        pages.push({
          pageNumber: pageCounter++,
          chapterTitle: ch.title,
          paragraphs: [
            book.sampleContent ||
              "In the quiet digital sanctuary of READORA, every thought, idea, and dialogue is crafted for deep contemplation.",
          ],
        });
        continue;
      }

      // Group paragraphs into digestible pages (~150-250 words per page)
      let currentBatch: string[] = [];
      let currentWordCount = 0;

      for (const p of rawParas) {
        const words = p.split(/\s+/).length;
        if (currentBatch.length > 0 && currentWordCount + words > 220) {
          pages.push({
            pageNumber: pageCounter++,
            chapterTitle: ch.title,
            paragraphs: [...currentBatch],
          });
          currentBatch = [p];
          currentWordCount = words;
        } else {
          currentBatch.push(p);
          currentWordCount += words;
        }
      }

      if (currentBatch.length > 0) {
        pages.push({
          pageNumber: pageCounter++,
          chapterTitle: ch.title,
          paragraphs: [...currentBatch],
        });
      }
    }
  }

  // Fallback if no structured chapters
  if (pages.length === 0) {
    const defaultText = book.sampleContent || book.description || "";
    const paras = defaultText.split("\n\n").filter(Boolean);
    pages.push({
      pageNumber: 1,
      chapterTitle: book.title,
      paragraphs: paras.length > 0 ? paras : [defaultText],
    });
  }

  return pages;
}
