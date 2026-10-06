import { Book } from "./types";

export interface PageData {
  pageNumber: number;
  chapterTitle: string;
  paragraphs: string[];
}

/**
 * Paginates a book's chapters and content into distinct, readable pages
 * with ~160-220 words per page for comfortable editorial reading on both
 * mobile and desktop inside the 3D book reader.
 */
export function paginateBook(book: Book): PageData[] {
  const pages: PageData[] = [];
  let pageCounter = 1;

  if (book.chapters && book.chapters.length > 0) {
    for (const ch of book.chapters) {
      const rawText = ch.content || "";
      // Split on double newlines or single newlines if no double newlines exist
      let rawParas = rawText
        .split(/\r?\n\s*\r?\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (rawParas.length === 0 && rawText.trim().length > 0) {
        rawParas = rawText
          .split(/\r?\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      }

      if (rawParas.length === 0) {
        pages.push({
          pageNumber: pageCounter++,
          chapterTitle: ch.title,
          paragraphs: [
            book.sampleContent ||
              book.description ||
              "In the quiet digital sanctuary of READORA, every thought, idea, and dialogue is crafted for deep contemplation.",
          ],
        });
        continue;
      }

      // Group paragraphs into comfortable pages (~110-140 words per page)
      // Page 1 of each chapter has the title block, so use ~90-110 words
      let currentBatch: string[] = [];
      let currentWordCount = 0;
      const isChapterStart = () => currentBatch.length === 0 && (pages.length === 0 || pages[pages.length - 1]?.chapterTitle !== ch.title);
      const targetMaxWords = () => (isChapterStart() ? 100 : 135);

      for (const p of rawParas) {
        const words = p.split(/\s+/).length;
        const maxLimit = targetMaxWords();

        // If a single paragraph is too long (> 140 words), split into sentence chunks
        if (words > 140) {
          if (currentBatch.length > 0) {
            pages.push({
              pageNumber: pageCounter++,
              chapterTitle: ch.title,
              paragraphs: [...currentBatch],
            });
            currentBatch = [];
            currentWordCount = 0;
          }

          const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [p];
          let subBatch: string[] = [];
          let subCount = 0;

          for (const s of sentences) {
            const sWords = s.split(/\s+/).length;
            if (subCount + sWords > 120 && subBatch.length > 0) {
              pages.push({
                pageNumber: pageCounter++,
                chapterTitle: ch.title,
                paragraphs: [subBatch.join(" ").trim()],
              });
              subBatch = [s];
              subCount = sWords;
            } else {
              subBatch.push(s);
              subCount += sWords;
            }
          }
          if (subBatch.length > 0) {
            currentBatch = [subBatch.join(" ").trim()];
            currentWordCount = subCount;
          }
        } else if (currentBatch.length > 0 && currentWordCount + words > maxLimit) {
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
    const paras = defaultText.split(/\r?\n\s*\r?\n/).filter(Boolean);
    pages.push({
      pageNumber: 1,
      chapterTitle: book.title,
      paragraphs: paras.length > 0 ? paras : [defaultText],
    });
  }

  return pages;
}
