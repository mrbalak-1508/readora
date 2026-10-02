export type UserRole = "user" | "admin" | "USER" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  joined_at: string;
  onboardingCompleted?: boolean;
  preferences?: {
    theme?: "light" | "dark" | "system";
    readerTheme?: "paper" | "warm" | "sepia" | "dark" | "midnight";
    fontSize?: number;
    fontFamily?: "serif" | "sans" | "readable" | "mono";
    lineHeight?: number;
    textAlign?: "left" | "justify";
    pageMode?: "paged" | "scroll";
    soundEffects?: boolean;
    soundVolume?: number;
    animationSpeed?: "fast" | "normal" | "slow";
    animation3d?: boolean;
    language?: "en" | "hi";
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  illustrationKey?: string;
  featured?: boolean;
  bookCount?: number;
  sort_order?: number;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
}

export interface BookChapter {
  id: string;
  title: string;
  page: number;
  content?: string;
}

export type AccessType =
  | "FREE"
  | "PREVIEW"
  | "ONE_TIME_PURCHASE"
  | "SUBSCRIPTION"
  | "FREE_WITH_SUBSCRIPTION"
  | "PREMIUM";

export type PreviewType = "PAGES" | "PERCENTAGE" | "CHAPTERS";

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  author_id?: string;
  description: string;
  coverUrl: string;
  fileUrl?: string;
  format: "epub" | "pdf" | "interactive" | "EPUB" | "PDF" | "INTERACTIVE" | string;
  isbn?: string;
  language: "English" | "Hindi" | "Other" | string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  publisher?: string;
  publicationDate: string;
  pages: number;
  featured?: boolean;
  trending?: boolean;
  popular?: boolean;
  status: "published" | "draft" | "archived" | "PUBLISHED" | "DRAFT" | "ARCHIVED" | string;
  rating: number;
  ratingCount: number;
  readCount: number;
  sampleContent?: string;
  chapters?: BookChapter[];
  tableOfContents?: { title: string; page: number }[];
  createdAt: string;
  fileSize?: string | number;

  // Commercial Access & Pricing
  accessType?: AccessType;
  price?: number;
  originalPrice?: number;
  discount?: number;
  currency?: string;
  previewType?: PreviewType;
  previewPages?: number;
  previewPercentage?: number;
  previewChapters?: number;
  watermarkEnabled?: boolean;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  page: number;
  chapterTitle?: string;
  snippet?: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  page: number;
  chapterTitle?: string;
  selectedText: string;
  color: "yellow" | "coral" | "plum" | "soft-blue" | "soft-green" | string;
  note?: string;
  createdAt: string;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  bookTitle?: string;
  bookCover?: string;
  author?: string;
  currentPage: number;
  totalPages: number;
  currentChapter?: string;
  percentage: number;
  lastOpened: string;
  timeSpentSeconds: number;
  completed: boolean;
  completedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "achievement" | "recommendation";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  bookId: string;
  book: Book;
  status: "reading" | "saved" | "completed" | "purchased";
  progress?: ReadingProgress;
  addedAt: string;
}

// Commercial Orders & Entitlements
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "EXPIRED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  orderId: string;
  bookId?: string;
  book?: Book;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  paymentProvider?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BookEntitlement {
  id: string;
  userId: string;
  bookId: string;
  orderId?: string;
  source: "PURCHASE" | "SUBSCRIPTION" | "ADMIN_GRANT" | "PROMO";
  validUntil?: string | null;
  active: boolean;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY";
  intervalCount: number;
  trialDays: number;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  benefits: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  provider?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  active: boolean;
}
