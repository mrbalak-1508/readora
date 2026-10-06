"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data/mockCategories";
import { generateSlug } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  BookOpen,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  FileCheck,
  AlertCircle,
  BookMarked,
  Loader2,
  RefreshCw,
  Eye,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert } from "@/lib/alerts";

function cleanTitleFromFilename(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function NewBookWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [createdBookSlug, setCreatedBookSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>(
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"
  );
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [directPdfPreviewUrl, setDirectPdfPreviewUrl] = useState<string | null>(null);

  // PDF Pre-upload parsing & preview state
  const [parsingBook, setParsingBook] = useState(false);
  const [runningOcr, setRunningOcr] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedPreview, setParsedPreview] = useState<{
    title: string;
    author: string;
    pages: number;
    sampleContent: string;
    format: string;
    fileSize: number;
    fileName: string;
    publicationDate?: string | null;
    detectedLanguage?: "Hindi" | "English" | "Other";
    languageLabel?: string;
    isScanned?: boolean;
    extractionMethod?: "native_unicode" | "ocr";
    extractedPages?: Array<{ pageNumber: number; title: string; content: string }>;
    metadata?: any;
  } | null>(null);

  // Sequential Pages State for Page-by-Page formatting and verification
  const [extractedPages, setExtractedPages] = useState<
    Array<{ pageNumber: number; title: string; content: string }>
  >([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "",
    description: "",
    categoryId: CATEGORIES[0].id,
    categoryName: CATEGORIES[0].name,
    language: "English" as "English" | "Hindi" | "Other",
    format: "PDF" as "PDF" | "EPUB" | "INTERACTIVE",
    sampleContent: "",
    isbn: "978-0123456789",
    publisher: "Readora Editions",
    publicationDate: new Date().toISOString().split("T")[0],
    pages: 280,
    tags: "Classics, Essential, Wisdom",
    featured: false,
    status: "PUBLISHED" as "PUBLISHED" | "DRAFT" | "ARCHIVED",
    accessType: "ONE_TIME_PURCHASE",
    price: 199,
    originalPrice: 299,
    previewType: "PAGES",
    previewPages: 10,
    watermarkEnabled: true,
  });

  const steps = [
    { num: 1, title: "Book Info" },
    { num: 2, title: "Upload Cover" },
    { num: 3, title: "Upload Book File" },
    { num: 4, title: "Metadata" },
    { num: 5, title: "Preview" },
    { num: 6, title: "Publish" },
  ];

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: generateSlug(val),
    }));
  };

  const handleCategoryChange = (catId: string) => {
    const selected = CATEGORIES.find((c) => c.id === catId);
    setFormData((prev) => ({
      ...prev,
      categoryId: catId,
      categoryName: selected ? selected.name : "General",
    }));
  };

  // Cover file handling
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showErrorAlert("Invalid Artwork", "Please upload a valid JPG, PNG, or WebP cover image.");
      return;
    }
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  // Book file handling with pre-upload validation and auto-extraction
  const handleBookFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError("");
    setParsedPreview(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isEpub = file.name.toLowerCase().endsWith(".epub") || file.type.includes("epub");

    if (!isPdf && !isEpub) {
      setParseError("Unsupported file type. Please upload a standard PDF (.pdf) or EPUB (.epub) document.");
      return;
    }

    if (file.size === 0) {
      setParseError("The selected file is empty (0 bytes). Please choose a valid manuscript.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setParseError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 50MB.`);
      return;
    }

    setBookFile(file);

    // Direct PDF Upload: Fetch PDF Metadata (especially page count, title, author, date) while preserving PDF 100% As-Is
    if (isPdf) {
      const derivedTitle = cleanTitleFromFilename(file.name);
      if (directPdfPreviewUrl) {
        URL.revokeObjectURL(directPdfPreviewUrl);
      }
      setDirectPdfPreviewUrl(URL.createObjectURL(file));
      setExtractedPages([]); // Keep empty so no fake extracted text chapters are generated

      setFormData((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : derivedTitle,
        slug: prev.title.trim() ? prev.slug : generateSlug(derivedTitle),
        format: "PDF",
      }));

      // Immediately auto-fetch PDF metadata (page count, title, author, date)
      setParsingBook(true);
      try {
        const data = new FormData();
        data.append("file", file);
        data.append("mode", "metadata");

        const res = await fetch("/api/admin/books/parse-pdf", {
          method: "POST",
          body: data,
        });

        const resData = await res.json();
        if (res.ok && resData.success) {
          setParsedPreview(resData);
          setFormData((prev) => ({
            ...prev,
            title: prev.title.trim() && prev.title !== derivedTitle ? prev.title : resData.title || prev.title,
            slug: prev.title.trim() && prev.title !== derivedTitle ? prev.slug : generateSlug(resData.title || derivedTitle),
            author: resData.author ? resData.author : prev.author,
            pages: resData.pages && resData.pages > 0 ? resData.pages : prev.pages,
            publicationDate: resData.publicationDate || prev.publicationDate,
            language: resData.detectedLanguage || prev.language,
          }));
        }
      } catch (metaErr: any) {
        console.warn("Could not auto-fetch PDF metadata:", metaErr);
      } finally {
        setParsingBook(false);
      }
      return;
    }

    setParsingBook(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/books/parse-pdf", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to inspect file structure.");
      }

      setParsedPreview(resData);

      if (resData.extractedPages && Array.isArray(resData.extractedPages)) {
        setExtractedPages(resData.extractedPages);
        setSelectedPageIndex(0);
      }

      // Auto-populate form data with verified extracted metadata & language
      setFormData((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : resData.title,
        slug: prev.title.trim() ? prev.slug : generateSlug(resData.title),
        author: resData.author ? resData.author : (prev.author || "Curated Author"),
        pages: resData.pages || resData.extractedPages?.length || prev.pages,
        format: resData.format as any,
        sampleContent: resData.sampleContent || prev.sampleContent,
        language: (resData.detectedLanguage as any) || prev.language,
      }));
    } catch (err: any) {
      setParseError(err.message || "Failed to parse file contents. You can still proceed or try another file.");
    } finally {
      setParsingBook(false);
    }
  };

  // Optional manual PDF text extraction (if user wants reflowable reader chapters)
  const handleExtractPdfText = async () => {
    if (!bookFile) return;
    setParsingBook(true);
    setParseError("");

    try {
      const data = new FormData();
      data.append("file", bookFile);

      const res = await fetch("/api/admin/books/parse-pdf", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to inspect file structure.");
      }

      setParsedPreview(resData);

      if (resData.extractedPages && Array.isArray(resData.extractedPages)) {
        setExtractedPages(resData.extractedPages);
        setSelectedPageIndex(0);
      }

      setFormData((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : resData.title,
        slug: prev.title.trim() ? prev.slug : generateSlug(resData.title),
        author: resData.author ? resData.author : (prev.author || "Curated Author"),
        pages: resData.pages || resData.extractedPages?.length || prev.pages,
        sampleContent: resData.sampleContent || prev.sampleContent,
        language: (resData.detectedLanguage as any) || prev.language,
      }));

      showSuccessAlert(
        "Text Extracted",
        `Parsed ${resData.extractedPages?.length || 0} pages from PDF for reflowable viewing.`
      );
    } catch (err: any) {
      setParseError(err.message || "Failed to extract text from PDF.");
      showErrorAlert("Extraction Error", err.message || "Could not extract text.");
    } finally {
      setParsingBook(false);
    }
  };

  // Explicit OCR execution on demand
  const handleRunOcr = async () => {
    if (!bookFile) return;
    setRunningOcr(true);
    setParseError("");

    try {
      const data = new FormData();
      data.append("file", bookFile);
      data.append("ocr", "true");

      const res = await fetch("/api/admin/books/parse-pdf", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "OCR manuscript extraction failed.");
      }

      setParsedPreview(resData);

      if (resData.extractedPages && Array.isArray(resData.extractedPages)) {
        setExtractedPages(resData.extractedPages);
        setSelectedPageIndex(0);
      }

      setFormData((prev) => ({
        ...prev,
        title: resData.title || prev.title,
        author: resData.author || prev.author,
        pages: resData.pages || prev.pages,
        sampleContent: resData.sampleContent || prev.sampleContent,
        language: (resData.detectedLanguage as any) || prev.language,
      }));

      showSuccessAlert(
        "OCR Extraction Completed",
        `Recognized text via Tesseract OCR engine (${resData.languageLabel || resData.detectedLanguage}).`
      );
    } catch (err: any) {
      setParseError(err.message || "Failed to run OCR on this manuscript.");
      showErrorAlert("OCR Processing Error", err.message || "Could not execute OCR.");
    } finally {
      setRunningOcr(false);
    }
  };

  // Sequential Page Formatting Helpers
  const handleFormatSinglePage = (index: number) => {
    setExtractedPages((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const cleaned = p.content
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .replace(/-- \d+ of \d+ --/g, "")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        return { ...p, content: cleaned };
      })
    );
  };

  const handleFormatAllPages = () => {
    setExtractedPages((prev) =>
      prev.map((p) => {
        const cleaned = p.content
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .replace(/-- \d+ of \d+ --/g, "")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        return { ...p, content: cleaned };
      })
    );
    showSuccessAlert(
      "All Pages Formatted",
      `Normalized whitespace, punctuation and paragraph breaks across all ${extractedPages.length} sequential pages.`
    );
  };

  const handleActivePageContentChange = (content: string) => {
    setExtractedPages((prev) =>
      prev.map((p, i) => (i === selectedPageIndex ? { ...p, content } : p))
    );
    if (selectedPageIndex === 0) {
      setFormData((prev) => ({ ...prev, sampleContent: content.slice(0, 4000) }));
    }
  };

  const handleActivePageTitleChange = (title: string) => {
    setExtractedPages((prev) =>
      prev.map((p, i) => (i === selectedPageIndex ? { ...p, title } : p))
    );
  };

  const handleActivePageNumChange = (pageNum: number) => {
    setExtractedPages((prev) =>
      prev.map((p, i) => (i === selectedPageIndex ? { ...p, pageNumber: pageNum } : p))
    );
  };

  const handleAddPage = () => {
    const newPageNum = extractedPages.length + 1;
    const newPage = {
      pageNumber: newPageNum,
      title: `Page ${newPageNum}`,
      content: "",
    };
    const updated = [...extractedPages, newPage];
    setExtractedPages(updated);
    setSelectedPageIndex(updated.length - 1);
    setFormData((prev) => ({ ...prev, pages: updated.length }));
  };

  const handleDeletePage = (index: number) => {
    if (extractedPages.length <= 1) {
      showErrorAlert("Cannot Delete", "At least one page must remain in the book.");
      return;
    }
    const filtered = extractedPages.filter((_, i) => i !== index);
    const renumbered = filtered.map((p, i) => ({
      ...p,
      pageNumber: i + 1,
      title: p.title.startsWith("Page ") ? `Page ${i + 1}` : p.title,
    }));
    setExtractedPages(renumbered);
    setSelectedPageIndex(Math.max(0, Math.min(selectedPageIndex, renumbered.length - 1)));
    setFormData((prev) => ({ ...prev, pages: renumbered.length }));
  };

  const handleNext = () => {
    setErrorMessage("");
    if (currentStep === 1 && !formData.title.trim()) {
      setErrorMessage("Please enter a book title to continue.");
      return;
    }
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handlePublishSubmit = async () => {
    setIsSubmitting(true);
    setUploadProgress(10);
    setErrorMessage("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("slug", formData.slug || generateSlug(formData.title));
      data.append("author", formData.author || "Curated Author");
      data.append("description", formData.description || "A curated volume in the Readora library.");
      data.append("categoryId", formData.categoryId);
      data.append("categoryName", formData.categoryName);
      data.append("language", formData.language);
      data.append("format", formData.format);
      data.append("isbn", formData.isbn);
      data.append("publisher", formData.publisher);
      data.append("publicationDate", formData.publicationDate);
      data.append("pages", formData.pages.toString());
      data.append("tags", formData.tags);
      data.append("featured", formData.featured.toString());
      data.append("status", formData.status);
      data.append("coverUrl", coverPreviewUrl);
      data.append("accessType", formData.accessType);
      data.append("price", formData.price.toString());
      data.append("originalPrice", formData.originalPrice.toString());
      data.append("previewType", formData.previewType);
      data.append("previewPages", formData.previewPages.toString());
      data.append("watermarkEnabled", formData.watermarkEnabled.toString());
      if (formData.sampleContent && formData.format !== "PDF") {
        data.append("sampleContent", formData.sampleContent);
      }
      if (extractedPages.length > 0 && formData.format !== "PDF") {
        data.append("pagesData", JSON.stringify(extractedPages));
      }

      if (coverFile) {
        data.append("coverFile", coverFile);
      }
      if (bookFile) {
        data.append("bookFile", bookFile);
      }

      // Simulated progress ticks for user feedback
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + 15;
        });
      }, 150);

      const res = await fetch("/api/admin/books/upload", {
        method: "POST",
        body: data,
      });

      clearInterval(progressTimer);

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to upload book");
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      setCreatedBookSlug(resData.book?.slug || formData.slug);
      showSuccessAlert("Volume Published!", `"${formData.title}" is now cataloged in the library.`);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during upload.");
      showErrorAlert("Upload Failed", err.message || "An error occurred during manuscript upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
                Curator Studio
              </span>
              <span className="text-xs text-[var(--muted)]">Prisma + Local Storage</span>
            </div>
            <h1 className="font-editorial text-3xl font-bold text-[var(--foreground)]">
              Publish a New Book
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Follow the 6-step guided wizard to catalog, upload and publish local manuscripts.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-all shadow-xs"
          >
            Exit to Dashboard
          </Link>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 mb-8 shadow-xs">
          <div className="grid grid-cols-6 gap-2">
            {steps.map((s) => {
              const isActive = s.num === currentStep;
              const isPast = s.num < currentStep || uploadSuccess;
              return (
                <div key={s.num} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                      isPast
                        ? "bg-emerald-500 text-white shadow-xs"
                        : isActive
                        ? "bg-[var(--primary)] text-white shadow-sm ring-4 ring-purple-100"
                        : "bg-[var(--bg-subtle)] text-[var(--muted)]"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:block truncate w-full ${
                      isActive ? "text-[var(--primary)] font-bold" : "text-[var(--muted)]"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          {/* STEP 1: Book Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
                  Step 1 of 6
                </span>
                <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-1">
                  Book Information
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Enter the primary literary details for this volume.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Meditations on the Open Mind"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Dr. Eleanor Vance"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    URL Slug (Automatic)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--muted)] font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Synopsis / Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide a rich summary of the themes, narrative or teachings..."
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Upload Cover */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
                  Step 2 of 6
                </span>
                <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-1">
                  Upload Cover Artwork
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Choose a local artwork file (JPG, PNG, WebP) from your computer.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Cover Preview */}
                <div className="relative w-44 aspect-[2/3] rounded-2xl overflow-hidden book-cover-shadow book-spine bg-[var(--bg-subtle)] shrink-0 border border-[var(--border)]">
                  <Image
                    src={coverPreviewUrl}
                    alt="Cover Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 176px"
                    className="object-cover"
                    unoptimized={coverPreviewUrl.startsWith("blob:")}
                  />
                </div>

                {/* Local Uploader */}
                <div className="flex-1 w-full space-y-4">
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-3xl p-8 text-center cursor-pointer bg-[var(--background)] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {coverFile ? coverFile.name : "Drag & drop your cover here"}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {coverFile
                        ? `${(coverFile.size / 1024).toFixed(0)} KB ready to upload`
                        : "or click to browse local files"}
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
                    >
                      Choose Cover Image
                    </button>
                    <p className="text-[11px] text-[var(--muted)] mt-2">
                      Supports JPG, JPEG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-[var(--muted)]">Preset covers:</span>
                    {[
                      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
                      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
                      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800",
                    ].map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreviewUrl(url);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--muted)]"
                      >
                        Style #{i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Upload Book File */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
                  Step 3 of 6
                </span>
                <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-1">
                  Upload Book Manuscript
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Select a local PDF or EPUB book file. Files are stored securely on the server outside public access.
                </p>
              </div>

              {/* Format Selection */}
              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] block mb-2">
                  Reading Engine Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "PDF", label: "PDF Document", desc: "Original publication layout" },
                    { id: "EPUB", label: "EPUB eBook", desc: "Reflowable digital standard" },
                    { id: "INTERACTIVE", label: "Interactive Reader", desc: "Paginated web manuscript" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, format: f.id as any })}
                      className={`p-3.5 rounded-2xl text-left border transition-all ${
                        formData.format === f.id
                          ? "bg-[var(--accent-light)] border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                          : "bg-[var(--background)] border-[var(--border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <span className="text-xs font-bold text-[var(--foreground)] block">
                        {f.label}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] block mt-0.5">
                        {f.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Uploader */}
              <input
                type="file"
                ref={bookInputRef}
                onChange={handleBookFileSelect}
                accept=".pdf,.epub"
                className="hidden"
              />

              <div
                onClick={() => bookInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-3xl p-10 text-center cursor-pointer bg-[var(--background)] transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-base font-bold text-[var(--foreground)]">
                  {bookFile ? bookFile.name : "Drag & drop your PDF / EPUB here"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {bookFile
                    ? `File selected: ${(bookFile.size / (1024 * 1024)).toFixed(2)} MB (${bookFile.name.split(".").pop()?.toUpperCase()})`
                    : "or click to choose from your local filesystem"}
                </p>
                <button
                  type="button"
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
                >
                  [ Choose File ]
                </button>
                <p className="text-[11px] text-[var(--muted)] mt-2">
                  Allowed formats: .PDF, .EPUB (Maximum 50MB)
                </p>
              </div>

              {/* Pre-Upload Validation Error Banner */}
              {parseError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Pre-Upload Validation Notice</span>
                    <p className="mt-0.5 leading-relaxed">{parseError}</p>
                    <button
                      type="button"
                      onClick={() => bookInputRef.current?.click()}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors"
                    >
                      Select Different File
                    </button>
                  </div>
                </div>
              )}

              {/* Parsing Loading State */}
              {parsingBook && (
                <div className="p-8 rounded-3xl bg-[var(--accent-light)] border border-[var(--primary)]/20 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    Analyzing PDF Structure & Auto-Extracting Content...
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Validating magic bytes, parsing catalog pages, extracting title & reader text excerpt...
                  </p>
                </div>
              )}

              {/* DIRECT PDF MANUSCRIPT CARD (Preserved 100% As-Is, No Text Extraction) */}
              {bookFile && formData.format === "PDF" && !extractedPages.length && !parsingBook && (
                <div className="p-6 rounded-3xl bg-[var(--bg-subtle)]/80 border border-[var(--border)] shadow-xs space-y-5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            Direct PDF Manuscript Ready (Preserved 100% As-Is)
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                            ⚡ Built-in PDF Reader
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted)] mt-0.5 block">
                          This PDF will be displayed directly in the PDF Reader without extracting, altering, or converting text. Original typography, formatting, graphics, and layout stay 100% intact.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]">
                        {(bookFile.size / (1024 * 1024)).toFixed(2)} MB • PDF
                      </span>
                      <button
                        type="button"
                        onClick={() => bookInputRef.current?.click()}
                        className="text-xs font-bold text-[var(--primary)] hover:underline ml-1"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* Extracted PDF Metadata Banner */}
                  {parsedPreview && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--foreground)]">
                              PDF Metadata Auto-Fetched
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                              ✓ Verified from Manuscript
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            Detected <strong className="text-amber-700 dark:text-amber-300 font-bold">{formData.pages} total pages</strong>
                            {formData.author ? <> • Author: <strong className="text-[var(--foreground)]">{formData.author}</strong></> : null}
                            {formData.publicationDate ? <> • Date: <strong className="text-[var(--foreground)]">{formData.publicationDate}</strong></> : null}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                          📄 {formData.pages} Pages
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Metadata Quick Verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Book Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Book Title"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Author
                      </label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Author Name"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-[var(--foreground)]">
                          Page Count
                        </label>
                        {parsedPreview && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Auto-fetched
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={formData.pages}
                        onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] font-semibold focus:border-[var(--primary)]"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Other">Other / Bilingual</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Embedded PDF Preview */}
                  {directPdfPreviewUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground)]">
                        <span>Live Document Preview (Exact Manuscript Layout)</span>
                        <a
                          href={directPdfPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-1 font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Full Window</span>
                        </a>
                      </div>
                      <div className="w-full h-80 rounded-2xl border border-[var(--border)] overflow-hidden bg-neutral-900 shadow-inner">
                        <object
                          data={`${directPdfPreviewUrl}#toolbar=1&navpanes=0`}
                          type="application/pdf"
                          className="w-full h-full border-0"
                        >
                          <iframe
                            src={`${directPdfPreviewUrl}#toolbar=1&navpanes=0`}
                            className="w-full h-full border-0"
                            title="Direct PDF Preview"
                          />
                        </object>
                      </div>
                    </div>
                  )}

                  {/* Optional text extraction trigger */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-[11px] text-blue-700">
                      <strong>Preserving Original PDF:</strong> Readers will view this file directly in the built-in PDF reader.
                    </div>
                    <button
                      type="button"
                      onClick={handleExtractPdfText}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 text-[11px] font-bold transition-colors shrink-0"
                    >
                      Extract plain text anyway (Optional)
                    </button>
                  </div>
                </div>
              )}

              {/* Verified Content Preview & Immediate Correction Panel (Only if extracted pages exist) */}
              {parsedPreview && !parsingBook && extractedPages.length > 0 && (
                <div className="p-6 rounded-3xl bg-[var(--bg-subtle)]/80 border border-[var(--border)] shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            PDF Verified & Content Extracted
                          </span>
                          {/* Language Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              formData.language === "Hindi" || parsedPreview.detectedLanguage === "Hindi"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                                : "bg-blue-500/10 text-blue-700 border-blue-500/30"
                            }`}
                          >
                            {parsedPreview.languageLabel ||
                              (formData.language === "Hindi" ? "Hindi (हिंदी)" : "English")}
                          </span>

                          {/* Extraction Method Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              parsedPreview.extractionMethod === "ocr"
                                ? "bg-purple-500/10 text-purple-700 border-purple-500/30"
                                : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            }`}
                          >
                            {parsedPreview.extractionMethod === "ocr"
                              ? "🔍 OCR Engine (Hindi + English)"
                              : "⚡ Digital Unicode Stream"}
                          </span>

                          {parsedPreview.isScanned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 text-zinc-700">
                              Scanned Doc
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--muted)] mt-0.5 block">
                          Values below were auto-fetched from the manuscript. You can verify and correct them directly.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRunOcr}
                        disabled={runningOcr || !bookFile}
                        className="px-3 py-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        title="Re-run Tesseract OCR recognizing both Hindi (Devanagari) and English text layers"
                      >
                        {runningOcr ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Running OCR (Hindi + English)...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Re-run OCR (Hindi + English)
                          </>
                        )}
                      </button>

                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]">
                        {(parsedPreview.fileSize / (1024 * 1024)).toFixed(2)} MB • {formData.format}
                      </span>
                      <button
                        type="button"
                        onClick={() => bookInputRef.current?.click()}
                        className="text-xs font-bold text-[var(--primary)] hover:underline ml-1"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* Editable Extracted Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Book Title (Editable)
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Book Title"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Author (Editable)
                      </label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Author Name"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Parsed Pages (Editable)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.pages}
                        onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                        Detected Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] font-semibold focus:border-[var(--primary)]"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Other">Other / Bilingual</option>
                      </select>
                    </div>
                  </div>

                  {/* Sequential Pages Reviewer & Formatter */}
                  {extractedPages.length > 0 && (
                    <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                        <div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[var(--primary)]" />
                            <span className="text-xs font-bold text-[var(--foreground)]">
                              Page Sequence & Formatting ({extractedPages.length} Pages Extracted)
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            Pages will be saved in exact sequence with their page numbers into the reader database.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleFormatAllPages}
                            className="px-3 py-1.5 rounded-xl bg-[var(--accent-light)] hover:bg-[var(--accent-light)]/80 text-[var(--primary)] text-xs font-bold transition-all border border-[var(--primary)]/20 flex items-center gap-1.5"
                            title="Clean margins, normalize spaces and format paragraph breaks for all pages"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Format All Pages
                          </button>
                          <button
                            type="button"
                            onClick={handleAddPage}
                            className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold transition-all border border-[var(--border)]"
                          >
                            + Add Page
                          </button>
                        </div>
                      </div>

                      {/* Horizontal Page Tabs Selector */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                        {extractedPages.map((page, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedPageIndex(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                              selectedPageIndex === idx
                                ? "bg-[var(--primary)] text-white shadow-xs"
                                : "bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            <span>Page {page.pageNumber || idx + 1}</span>
                            {page.content.trim().length > 0 && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  selectedPageIndex === idx ? "bg-white" : "bg-emerald-500"
                                }`}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Active Page Editor */}
                      {extractedPages[selectedPageIndex] && (
                        <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[var(--muted)]">Page #:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={extractedPages[selectedPageIndex].pageNumber || selectedPageIndex + 1}
                                  onChange={(e) => handleActivePageNumChange(Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded-lg text-xs font-bold bg-[var(--card)] border border-[var(--border)] outline-none text-[var(--foreground)] text-center focus:border-[var(--primary)]"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[var(--muted)]">Heading:</span>
                                <input
                                  type="text"
                                  value={extractedPages[selectedPageIndex].title || `Page ${selectedPageIndex + 1}`}
                                  onChange={(e) => handleActivePageTitleChange(e.target.value)}
                                  placeholder="e.g. Chapter 1 or Introduction"
                                  className="w-48 sm:w-64 px-2.5 py-1 rounded-lg text-xs bg-[var(--card)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleFormatSinglePage(selectedPageIndex)}
                                className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-[var(--foreground)] text-[11px] font-semibold transition-all"
                                title="Format this page only"
                              >
                                ✨ Format Page
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePage(selectedPageIndex)}
                                disabled={extractedPages.length <= 1}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-[11px] font-semibold transition-all disabled:opacity-40"
                                title="Remove this page"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>

                          {/* Page Content Editor */}
                          <div className="relative">
                            <textarea
                              rows={8}
                              dir="auto"
                              value={extractedPages[selectedPageIndex].content}
                              onChange={(e) => handleActivePageContentChange(e.target.value)}
                              placeholder={`Enter or edit content for Page ${extractedPages[selectedPageIndex].pageNumber}...`}
                              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--card)] border border-[var(--border)] outline-none text-[var(--foreground)] font-serif leading-relaxed focus:border-[var(--primary)] resize-y min-h-[160px]"
                            />
                            <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mt-1 px-1">
                              <span>
                                {extractedPages[selectedPageIndex].content.length} characters •{" "}
                                {
                                  extractedPages[selectedPageIndex].content.split(/\s+/).filter(Boolean).length
                                }{" "}
                                words
                              </span>
                              <span>
                                {formData.language === "Hindi" ||
                                /[\u0900-\u097F]/.test(extractedPages[selectedPageIndex].content)
                                  ? "Devanagari (Hindi) Script Verified"
                                  : "Latin (English) Script Verified"}
                              </span>
                            </div>
                          </div>

                          {/* Page Nav Prev/Next Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPageIndex((prev) => Math.max(0, prev - 1))}
                              disabled={selectedPageIndex === 0}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-all disabled:opacity-40"
                            >
                              ← Prev Page
                            </button>
                            <span className="text-[11px] font-mono text-[var(--muted)]">
                              Page {selectedPageIndex + 1} of {extractedPages.length}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPageIndex((prev) =>
                                  Math.min(extractedPages.length - 1, prev + 1)
                                )
                              }
                              disabled={selectedPageIndex === extractedPages.length - 1}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-all disabled:opacity-40"
                            >
                              Next Page →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dual Mode Upload Storage Indicator */}
                      <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2.5 text-xs text-blue-700">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                        <div>
                          <strong className="block font-bold">Dual Storage Architecture</strong>
                          <p className="text-[11px] text-blue-600/90 mt-0.5 leading-relaxed">
                            Upon publishing, the <strong>exact original PDF file</strong> ({bookFile ? bookFile.name : "uploaded manuscript"}) is saved securely to disk for facsimile reading, and all <strong>{extractedPages.length} sequential pages</strong> above are cataloged into database chapters for interactive reading.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback Single Excerpt Editor (if extractedPages is empty and NOT PDF) */}
                  {extractedPages.length === 0 && formData.format !== "PDF" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[var(--foreground)] block">
                          Auto-Fetched Reader Manuscript Excerpt (Editable Preview)
                        </label>
                        <span className="text-[10px] text-[var(--muted)] font-mono">
                          {formData.sampleContent.length} chars
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        dir="auto"
                        value={formData.sampleContent}
                        onChange={(e) => setFormData({ ...formData, sampleContent: e.target.value })}
                        placeholder="Extracted book content rendered in the reading sanctuary..."
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] font-serif leading-relaxed focus:border-[var(--primary)] resize-y min-h-[120px]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Optional interactive text fallback */}
              {!parsedPreview && formData.format === "INTERACTIVE" && (
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Direct Chapter / Manuscript Text (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.sampleContent}
                    onChange={(e) => setFormData({ ...formData, sampleContent: e.target.value })}
                    placeholder="Paste introductory chapter text for instant reader rendering..."
                    className="w-full px-4 py-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Metadata */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
                  Step 4 of 6
                </span>
                <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-1">
                  Catalog Metadata
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Configure publishing, indexing and display attributes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.publicationDate}
                    onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--foreground)]">
                      Total Pages
                    </label>
                    {parsedPreview && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Auto-detected from manuscript
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 100 })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Philosophy, Stoicism, Mindfulness"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Access & Commercial Model
                  </label>
                  <select
                    value={formData.accessType}
                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-semibold"
                  >
                    <option value="ONE_TIME_PURCHASE">One-Time Purchase (Buy to Read)</option>
                    <option value="FREE">Free Library Access</option>
                    <option value="PREVIEW">Preview Only (Purchase Required)</option>
                    <option value="SUBSCRIPTION">Readora Premium Subscription Only</option>
                    <option value="FREE_WITH_SUBSCRIPTION">Purchase or Free with Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Original Price / MSRP (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Free Preview Limit (Pages)
                  </label>
                  <input
                    type="number"
                    value={formData.previewPages}
                    onChange={(e) => setFormData({ ...formData, previewPages: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      Feature on Library Homepage (Hero & Carousel)
                    </span>
                  </label>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.watermarkEnabled}
                      onChange={(e) => setFormData({ ...formData, watermarkEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      Enable Reader Watermarking (Licensed to reader@email)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Preview */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
                  Step 5 of 6
                </span>
                <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-1">
                  Catalog Preview
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Verify how your book appears to readers across READORA.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                <div className="relative w-36 aspect-[2/3] rounded-xl overflow-hidden book-cover-shadow book-spine shrink-0">
                  <Image
                    src={coverPreviewUrl}
                    alt={formData.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 144px"
                    className="object-cover"
                    unoptimized={coverPreviewUrl.startsWith("blob:")}
                  />
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-white">
                      {formData.categoryName}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">{formData.language}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {formData.format}
                    </span>
                  </div>

                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    {formData.title || "Untitled Book"}
                  </h3>

                  <p className="text-xs text-[var(--muted)]">
                    by <span className="font-semibold text-[var(--foreground)]">{formData.author || "Unknown"}</span>
                  </p>

                  <p className="text-xs text-[var(--muted)] line-clamp-3">
                    {formData.description || "No synopsis entered."}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-4 text-xs text-[var(--muted)] border-t border-[var(--border)]">
                    <span>{formData.pages} Pages</span>
                    <span>ISBN: {formData.isbn}</span>
                    <span>Publisher: {formData.publisher}</span>
                    <span>Status: <strong className="text-[var(--primary)]">{formData.status}</strong></span>
                  </div>

                  {bookFile && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Exact PDF File: <strong>{bookFile.name}</strong> ({(bookFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      {extractedPages.length > 0 ? (
                        <span className="font-bold text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-lg text-[11px]">
                          {extractedPages.length} Sequential Pages Ready
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-lg text-[11px]">
                          Direct PDF Reader (Preserved 100% As-Is)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Publish / Progress */}
          {currentStep === 6 && (
            <div className="space-y-6 py-6 text-center">
              {!uploadSuccess ? (
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-xs">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                      Ready to Publish to READORA
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Your local files will be securely streamed to the server storage and cataloged in SQLite.
                    </p>
                  </div>

                  {isSubmitting && (
                    <div className="space-y-3 pt-4">
                      <div className="w-full bg-[var(--bg-subtle)] rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-[var(--primary)] h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-[var(--primary)]">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={handlePublishSubmit}
                      className="w-full py-4 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Publish Volume to Library
                    </button>
                  )}
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                      Book Uploaded Successfully!
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      &quot;{formData.title}&quot; is now indexed and available in the READORA digital library.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                    <Link
                      href={`/books/${createdBookSlug}`}
                      className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      View Book Page
                    </Link>
                    <Link
                      href="/admin/books"
                      className="px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground)] text-xs font-bold transition-all shadow-xs"
                    >
                      Manage All Books
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Footer */}
          {!uploadSuccess && (
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--border)] transition-colors ${
                  currentStep === 1 || isSubmitting
                    ? "opacity-40 cursor-not-allowed text-[var(--muted)]"
                    : "text-[var(--foreground)] hover:bg-[var(--background)]"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </button>

              {currentStep < 6 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-xs transition-colors"
                >
                  Continue to {steps[currentStep].title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
