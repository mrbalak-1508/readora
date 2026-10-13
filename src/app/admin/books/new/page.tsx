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
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Edit3,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Lock,
  Layers,
  Save,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert, showToastAlert } from "@/lib/alerts";

export default function NewBookWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Book Information
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    slug: "",
    author: "",
    coAuthors: "",
    description: "",
    language: "English",
    categoryId: CATEGORIES[0].id,
    categoryName: CATEGORIES[0].name,
    tags: "Classics, Curated, Philosophy",
    publisher: "Readora Editions",
    isbn: "",
    publicationDate: new Date().toISOString().split("T")[0],
    seoTitle: "",
    seoDescription: "",

    // Content Type (Step 2)
    contentType: "PDF" as "PDF" | "EPUB" | "WRITTEN",

    // Pricing & Access Control (Step 3)
    accessType: "FREE" as "FREE" | "ONE_TIME_PURCHASE" | "SUBSCRIPTION" | "FREE_WITH_SUBSCRIPTION" | "PROMOTIONAL",
    price: 0,
    originalPrice: 0,
    discount: 0,
    currency: "INR",
    previewPages: 10,
    previewChapters: 1,
    allowDownload: false,
    allowPrint: false,
    allowCopy: false,
    allowFreeToc: true,
    watermarkEnabled: true,
    status: "PUBLISHED" as "PUBLISHED" | "DRAFT",
  });

  // Cover image file & preview
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>(
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"
  );
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Book manuscript file (PDF / EPUB)
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [fileValidationState, setFileValidationState] = useState<{
    valid: boolean;
    pages: number;
    fileSize: number;
    fileName: string;
    checksum?: string;
    message?: string;
  } | null>(null);
  const [validatingFile, setValidatingFile] = useState(false);
  const bookFileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { num: 1, title: "Book Info & Cover" },
    { num: 2, title: "Content Format" },
    { num: 3, title: "Pricing & Access" },
    { num: 4, title: "Review & Publish" },
  ];

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: generateSlug(val),
      seoTitle: prev.seoTitle || `${val} — Readora Digital Library`,
    }));
  };

  const handleCategoryChange = (catId: string) => {
    const selected = CATEGORIES.find((c) => c.id === catId);
    setFormData((prev) => ({
      ...prev,
      categoryId: catId,
      categoryName: selected ? selected.name : "Literature",
    }));
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showErrorAlert("Invalid Artwork", "Please upload a valid JPG, PNG, or WebP cover image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showErrorAlert("Cover Too Large", "Cover artwork must be under 10MB.");
      return;
    }
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleBookFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
    const isEpub = lower.endsWith(".epub") || file.type.includes("epub");

    if (formData.contentType === "PDF" && !isPdf) {
      showErrorAlert("Format Mismatch", "Please select a standard .pdf document.");
      return;
    }
    if (formData.contentType === "EPUB" && !isEpub) {
      showErrorAlert("Format Mismatch", "Please select a valid .epub package.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showErrorAlert("File Too Large", "Book file exceeds the maximum 50MB limit.");
      return;
    }

    setBookFile(file);
    setValidatingFile(true);
    setFileValidationState(null);

    // Quick client-side signature check before upload
    try {
      const slice = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(slice);

      if (isPdf) {
        const header = String.fromCharCode(...bytes.subarray(0, 5));
        if (header !== "%PDF-") {
          throw new Error("Invalid PDF header signature. File is not a valid PDF document.");
        }
      } else if (isEpub) {
        if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
          throw new Error("Invalid EPUB zip header. File is not a valid EPUB container.");
        }
      }

      setFileValidationState({
        valid: true,
        pages: isPdf ? 120 : 80, // estimated until server ingestion
        fileSize: file.size,
        fileName: file.name,
        message: "Signature verified (%PDF- / PK\\x03\\x04)",
      });
      showToastAlert("File signature verified", "success");
    } catch (err: any) {
      showErrorAlert("Verification Failed", err.message);
      setBookFile(null);
    } finally {
      setValidatingFile(false);
    }
  };

  const handleSubmit = async (publishNow = true) => {
    if (!formData.title.trim()) {
      showErrorAlert("Missing Field", "Please specify a book title.");
      setCurrentStep(1);
      return;
    }

    if (formData.contentType !== "WRITTEN" && !bookFile) {
      showErrorAlert("Missing File", `Please select a ${formData.contentType} manuscript file.`);
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. If cover file selected, upload cover first
      let finalCoverPath = coverPreviewUrl;
      if (coverFile) {
        const coverData = new FormData();
        coverData.append("file", coverFile);
        const coverRes = await fetch("/api/admin/books/upload-cover", {
          method: "POST",
          body: coverData,
        }).catch(() => null);

        if (coverRes && coverRes.ok) {
          const d = await coverRes.json();
          if (d.filePath) finalCoverPath = d.filePath;
        }
      }

      // 2. If file-based (PDF / EPUB), ingest book manuscript file via upload process first
      let uploadedFilePath: string | null = null;
      let uploadedFileName: string | null = null;
      let uploadedFileSize: number | null = null;
      let uploadedMimeType: string | null = null;
      let uploadedPages: number = fileValidationState?.pages || 1;
      let uploadJobId: string | null = null;
      let uploadChecksum: string | null = null;

      if (bookFile && (formData.contentType === "PDF" || formData.contentType === "EPUB")) {
        const uploadData = new FormData();
        uploadData.append("file", bookFile);
        uploadData.append("format", formData.contentType);

        const ingestRes = await fetch("/api/admin/uploads/process", {
          method: "POST",
          body: uploadData,
        });

        if (!ingestRes.ok) {
          let errText = "Failed to process manuscript file";
          try {
            const errData = await ingestRes.json();
            if (errData?.error) errText = errData.error;
          } catch {}
          throw new Error(errText);
        }

        const ingestData = await ingestRes.json();
        if (ingestData?.file) {
          uploadedFilePath = ingestData.file.storagePath;
          uploadedFileName = ingestData.file.fileName;
          uploadedFileSize = ingestData.file.fileSize;
          uploadedMimeType = ingestData.file.format === "PDF" ? "application/pdf" : "application/epub+zip";
          if (ingestData.file.pages) {
            uploadedPages = ingestData.file.pages;
          }
          if (ingestData.file.checksum) {
            uploadChecksum = ingestData.file.checksum;
          }
        }
        if (ingestData?.job?.id) {
          uploadJobId = ingestData.job.id;
        }
      }

      // 3. Create Book record in database with valid storage paths
      const bookPayload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        slug: formData.slug || generateSlug(formData.title),
        author: formData.author.trim() || "Readora Curator",
        description: formData.description.trim(),
        language: formData.language,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        publisher: formData.publisher,
        isbn: formData.isbn,
        publicationDate: formData.publicationDate,
        coverPath: finalCoverPath,
        coverUrl: finalCoverPath,
        filePath: uploadedFilePath,
        fileName: uploadedFileName,
        fileSize: uploadedFileSize,
        mimeType: uploadedMimeType,
        checksum: uploadChecksum,
        uploadJobId,
        format: formData.contentType,
        status: publishNow ? "PUBLISHED" : "DRAFT",
        accessType: formData.accessType,
        price: Number(formData.price) || 0,
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        discount: Number(formData.discount) || 0,
        currency: formData.currency,
        previewPages: Number(formData.previewPages) || 10,
        previewChapters: Number(formData.previewChapters) || 1,
        allowDownload: formData.allowDownload,
        allowPrint: formData.allowPrint,
        allowCopy: formData.allowCopy,
        allowFreeToc: formData.allowFreeToc,
        watermarkEnabled: formData.watermarkEnabled,
        pages: uploadedPages,
      };

      const createRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookPayload),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || "Failed to create book record");
      }

      const createdBook = await createRes.json();

      // 4. Success message & navigation
      showSuccessAlert(
        publishNow ? "Book Published!" : "Draft Saved",
        `"${formData.title}" has been successfully configured in the catalog.`
      );

      if (formData.contentType === "WRITTEN") {
        router.push(`/admin/written-books/${createdBook.id}`);
      } else {
        router.push("/admin/books");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to complete book publishing wizard");
      showErrorAlert("Publishing Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Publication Wizard
            </span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Add New Volume to Library
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Unified publishing workflow for PDF manuscripts, reflowable EPUBs, and written chapter books.
          </p>
        </div>

        <Link
          href="/admin/books"
          className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1.5 self-start sm:self-center"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isCurrent
                      ? "text-[var(--primary)] font-bold"
                      : isCompleted
                      ? "text-emerald-600 font-bold"
                      : "text-[var(--muted)]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                      isCurrent
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : isCompleted
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-[var(--background)] border border-[var(--border)]"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="text-xs hidden md:inline">{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 transition-colors ${
                      currentStep > s.num ? "bg-emerald-500" : "bg-[var(--border)]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Book Info & Cover */}
      {currentStep === 1 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              Step 1: Book Information & Artwork
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Enter core title metadata, author credits, and upload high-resolution cover artwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Cover Upload Card */}
            <div className="md:col-span-4 space-y-3">
              <label className="block text-xs font-bold text-[var(--foreground)]">
                Cover Image Artwork *
              </label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative aspect-3/4 rounded-2xl overflow-hidden border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] cursor-pointer group bg-[var(--background)] transition-all shadow-xs"
              >
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <Image
                  src={coverPreviewUrl}
                  alt="Cover Preview"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">Replace Cover Image</span>
                  <span className="text-[10px] opacity-80">JPG, PNG, WebP (max 10MB)</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--muted)] text-center">
                Click cover to upload custom book sleeve image.
              </p>
            </div>

            {/* Book Info Form Fields */}
            <div className="md:col-span-8 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meditations on First Philosophy"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. In Which the Existence of God and the Distinction of the Soul are Demonstrated"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Primary Author *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. René Descartes"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Co-Authors / Translators (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Cottingham (Translator)"
                    value={formData.coAuthors}
                    onChange={(e) => setFormData({ ...formData, coAuthors: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Category Taxonomy *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Sanskrit">Sanskrit (संस्कृत)</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Book Synopsis & Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Compelling description of the book for readers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    ISBN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="978-..."
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.publicationDate}
                    onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-end">
            <button
              onClick={() => {
                if (!formData.title.trim()) {
                  showErrorAlert("Title Required", "Please provide a title for the volume.");
                  return;
                }
                setCurrentStep(2);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs cursor-pointer"
            >
              <span>Next: Content Format</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Content Format Selection & Ingestion */}
      {currentStep === 2 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              Step 2: Select Content Format & Manuscript
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Choose how readers will consume this volume: Original PDF pages, reflowable EPUB, or direct chapter authoring.
            </p>
          </div>

          {/* 3 Clear Content Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option A: PDF */}
            <div
              onClick={() => {
                setFormData({ ...formData, contentType: "PDF" });
                setBookFile(null);
                setFileValidationState(null);
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                formData.contentType === "PDF"
                  ? "border-[var(--primary)] bg-[var(--accent-light)]/40 shadow-xs"
                  : "border-[var(--border)] hover:border-[var(--primary)]/40 bg-[var(--background)]/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-[var(--foreground)]">Option A: Upload PDF</div>
                <div className="text-[11px] text-[var(--muted)] mt-1">
                  Render original pages directly via PDF.js. Preserves exact layout, images, equations, and typography.
                </div>
              </div>
            </div>

            {/* Option B: EPUB */}
            <div
              onClick={() => {
                setFormData({ ...formData, contentType: "EPUB" });
                setBookFile(null);
                setFileValidationState(null);
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                formData.contentType === "EPUB"
                  ? "border-[var(--primary)] bg-[var(--accent-light)]/40 shadow-xs"
                  : "border-[var(--border)] hover:border-[var(--primary)]/40 bg-[var(--background)]/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-[var(--foreground)]">Option B: Upload EPUB</div>
                <div className="text-[11px] text-[var(--muted)] mt-1">
                  Reflowable reader powered by EPUB.js. Supports font resizing, themes, chapters TOC, and bookmarks.
                </div>
              </div>
            </div>

            {/* Option C: Chapter Editor */}
            <div
              onClick={() => {
                setFormData({ ...formData, contentType: "WRITTEN" });
                setBookFile(null);
                setFileValidationState(null);
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                formData.contentType === "WRITTEN"
                  ? "border-[var(--primary)] bg-[var(--accent-light)]/40 shadow-xs"
                  : "border-[var(--border)] hover:border-[var(--primary)]/40 bg-[var(--background)]/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-[var(--foreground)]">Option C: Chapter Editor</div>
                <div className="text-[11px] text-[var(--muted)] mt-1">
                  Write directly using Tiptap rich-text editor with chapters, sections, autosave, and revision history.
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Ingestion Dropzone */}
          {formData.contentType !== "WRITTEN" ? (
            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <label className="block text-xs font-bold text-[var(--foreground)]">
                Upload Manuscript ({formData.contentType}) *
              </label>

              <div
                onClick={() => bookFileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-2xl p-8 text-center cursor-pointer transition-all bg-[var(--background)] group"
              >
                <input
                  type="file"
                  ref={bookFileInputRef}
                  onChange={handleBookFileSelect}
                  accept={formData.contentType === "PDF" ? ".pdf,application/pdf" : ".epub,application/epub+zip"}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] text-[var(--primary)] mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="text-xs font-bold text-[var(--foreground)]">
                  {bookFile ? bookFile.name : `Select or drag ${formData.contentType} file`}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-1">
                  Supports files up to 50MB • Validated on server with secure private storage
                </div>

                {validatingFile && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--primary)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying file signature (%PDF- / PK\\x03\\x04)...</span>
                  </div>
                )}
              </div>

              {fileValidationState && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>File Signature Verified: {fileValidationState.fileName}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--muted)]">
                    {(fileValidationState.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[var(--foreground)]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Chapter Editor Manuscript Initialized</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                After configuring pricing and permissions in the next step, this volume will open immediately in the Three-Part Tiptap Chapter Desk where you can write, add sections, and manage revisions.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] text-xs font-bold transition-colors cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={() => {
                if (formData.contentType !== "WRITTEN" && !bookFile) {
                  showErrorAlert("File Required", `Please select a valid ${formData.contentType} manuscript.`);
                  return;
                }
                setCurrentStep(3);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs cursor-pointer"
            >
              <span>Next: Pricing & Access</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pricing, Preview & Access Control */}
      {currentStep === 3 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              Step 3: Pricing, Preview Rules & Access Controls
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Enforce server-side access entitlements, sample limits, and content restriction flags.
            </p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Access Mode */}
            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1.5">
                Catalog Access Mode *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "FREE", label: "Free Access", desc: "Open to all readers without payment" },
                  { id: "ONE_TIME_PURCHASE", label: "One-Time Purchase", desc: "Lifetime reader ownership via checkout" },
                  { id: "SUBSCRIPTION", label: "Subscription Only", desc: "Available exclusively to active subscribers" },
                  { id: "FREE_WITH_SUBSCRIPTION", label: "Free Preview + Upgrade", desc: "Sample preview with full unlock gate" },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setFormData({ ...formData, accessType: mode.id as any })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.accessType === mode.id
                        ? "border-[var(--primary)] bg-[var(--accent-light)] font-bold text-[var(--foreground)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/40 bg-[var(--background)]/40"
                    }`}
                  >
                    <div className="font-bold">{mode.label}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">{mode.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Fields */}
            {formData.accessType !== "FREE" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Selling Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Original Price (MSRP Strikethrough)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Preview Page / Chapter Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.previewPages}
                    onChange={(e) => setFormData({ ...formData, previewPages: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Restrictions & DRM Flags */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <label className="block font-bold text-[var(--foreground)]">
                Content Restrictions & Delivery Permissions
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Allow Free Table of Contents</span>
                    <span className="block text-[10px] text-[var(--muted)]">Unpaid readers can browse chapter headings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowFreeToc}
                    onChange={(e) => setFormData({ ...formData, allowFreeToc: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Watermark Free Previews</span>
                    <span className="block text-[10px] text-[var(--muted)]">Overlays reader watermark on sample pages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.watermarkEnabled}
                    onChange={(e) => setFormData({ ...formData, watermarkEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Permit File Download</span>
                    <span className="block text-[10px] text-[var(--muted)]">Allow paid users to export offline asset</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowDownload}
                    onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Permit Printing & Copying</span>
                    <span className="block text-[10px] text-[var(--muted)]">Enable text selection and print stylesheets</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowPrint}
                    onChange={(e) => setFormData({ ...formData, allowPrint: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] text-xs font-bold transition-colors cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs cursor-pointer"
            >
              <span>Next: Review & Publish</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Publish */}
      {currentStep === 4 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              Step 4: Final Verification & Publishing
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Review manuscript details before committing to SQLite and the digital library catalog.
            </p>
          </div>

          {/* Book Summary Card */}
          <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex flex-col sm:flex-row gap-5">
            <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-[var(--border)] shadow-xs">
              <Image src={coverPreviewUrl} alt="Cover" fill className="object-cover" />
            </div>

            <div className="space-y-1 text-xs">
              <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                {formData.title}
              </h3>
              {formData.subtitle && (
                <div className="text-[11px] font-serif italic text-[var(--muted)]">{formData.subtitle}</div>
              )}
              <div className="text-[var(--muted)]">
                by <span className="font-semibold text-[var(--foreground)]">{formData.author}</span> • {formData.categoryName} • {formData.language}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--accent-light)] text-[var(--primary)]">
                  Format: {formData.contentType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {formData.accessType === "FREE" ? "Free Catalog" : `₹${formData.price}`}
                </span>
                {formData.accessType !== "FREE" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--muted)] border border-[var(--border)]">
                    Preview: {formData.previewPages} pages
                  </span>
                )}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto"
            >
              Previous
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </button>

              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Book Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
