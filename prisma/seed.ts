import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MOCK_BOOKS } from "../src/lib/data/mockBooks";
import { CATEGORIES } from "../src/lib/data/mockCategories";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding READORA SQLite database with complete commercial data...");

  // 1. Seed Categories with Modern Cartoon Illustration Keys
  const categoryIllustrationMap: Record<string, string> = {
    "self-development": "compass",
    "business": "chart-plant",
    "technology": "computer-robot",
    "literature": "feather-ink",
    "philosophy": "lantern-owl",
    "hindi": "peacock-lotus",
    "history": "hourglass-pyramid",
    "fiction": "magic-book",
    "non-fiction": "magnifier-notes",
    "education": "graduation-cap",
    "children": "rocket-stars",
  };

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        illustrationKey: categoryIllustrationMap[cat.slug] || "book",
        featured: cat.featured ?? false,
        sortOrder: cat.sort_order ?? 0,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        illustrationKey: categoryIllustrationMap[cat.slug] || "book",
        featured: cat.featured ?? false,
        sortOrder: cat.sort_order ?? 0,
      },
    });
  }
  console.log("✓ Curated categories seeded.");

  // 2. Seed Default Admin Curator and Normal Reader accounts
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const readerPasswordHash = await bcrypt.hash("reader123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@readora.library" },
    update: {
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      onboardingCompleted: true,
    },
    create: {
      id: "usr-admin-readora",
      name: "Marcus Vance",
      email: "admin@readora.library",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      onboardingCompleted: true,
      avatarPath: "/avatars/curator.png",
      preferences: JSON.stringify({
        theme: "light",
        readerTheme: "paper",
        fontSize: 18,
        fontFamily: "serif",
        lineHeight: 1.75,
        soundEffects: false,
        animationSpeed: "normal",
      }),
    },
  });

  const readerUser = await prisma.user.upsert({
    where: { email: "reader@readora.library" },
    update: {
      passwordHash: readerPasswordHash,
      role: "USER",
    },
    create: {
      id: "usr-reader-readora",
      name: "Elena Rostova",
      email: "reader@readora.library",
      passwordHash: readerPasswordHash,
      role: "USER",
      onboardingCompleted: false, // First time tour experience
      avatarPath: "/avatars/reader.png",
      preferences: JSON.stringify({
        theme: "light",
        readerTheme: "paper",
        fontSize: 18,
        fontFamily: "serif",
        lineHeight: 1.75,
        soundEffects: false,
        animationSpeed: "normal",
      }),
    },
  });
  console.log("✓ Admin (admin@readora.library / admin123) and Reader (reader@readora.library / reader123) seeded.");

  // 3. Seed Subscription Plans
  const monthlyPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "readora-monthly" },
    update: {
      name: "Readora Monthly",
      price: 199,
      interval: "MONTHLY",
      intervalCount: 1,
      trialDays: 7,
      active: true,
      featured: false,
      displayOrder: 1,
      description: "Unlimited access to thousands of curated digital volumes and audio experiences.",
      benefits: JSON.stringify([
        "Unlimited access to all eligible books",
        "3D realistic page-turning reader",
        "Reading history and progress sync across devices",
        "Personalized bookmarks, highlights and marginalia notes",
        "Offline reading cache capability",
      ]),
    },
    create: {
      id: "plan-monthly",
      name: "Readora Monthly",
      slug: "readora-monthly",
      price: 199,
      currency: "INR",
      interval: "MONTHLY",
      intervalCount: 1,
      trialDays: 7,
      active: true,
      featured: false,
      displayOrder: 1,
      description: "Unlimited access to thousands of curated digital volumes and audio experiences.",
      benefits: JSON.stringify([
        "Unlimited access to all eligible books",
        "3D realistic page-turning reader",
        "Reading history and progress sync across devices",
        "Personalized bookmarks, highlights and marginalia notes",
        "Offline reading cache capability",
      ]),
    },
  });

  const annualPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "readora-annual" },
    update: {
      name: "Readora Annual",
      price: 1499,
      interval: "YEARLY",
      intervalCount: 1,
      trialDays: 14,
      active: true,
      featured: true,
      displayOrder: 2,
      description: "Best value. Save 37% annually with VIP reading privileges and author releases.",
      benefits: JSON.stringify([
        "All Readora Monthly benefits included",
        "Save ₹889 every year (37% discount)",
        "Early access to newly acquired titles",
        "Curated monthly editorial book drop",
        "Exclusive author interviews and study notes",
        "Priority 24/7 reader concierge support",
      ]),
    },
    create: {
      id: "plan-annual",
      name: "Readora Annual",
      slug: "readora-annual",
      price: 1499,
      currency: "INR",
      interval: "YEARLY",
      intervalCount: 1,
      trialDays: 14,
      active: true,
      featured: true,
      displayOrder: 2,
      description: "Best value. Save 37% annually with VIP reading privileges and author releases.",
      benefits: JSON.stringify([
        "All Readora Monthly benefits included",
        "Save ₹889 every year (37% discount)",
        "Early access to newly acquired titles",
        "Curated monthly editorial book drop",
        "Exclusive author interviews and study notes",
        "Priority 24/7 reader concierge support",
      ]),
    },
  });
  console.log("✓ Subscription plans seeded.");

  // 4. Seed Payment Gateways Config
  await prisma.paymentProviderConfig.upsert({
    where: { provider: "razorpay" },
    update: {
      enabled: true,
      testMode: true,
      publicKey: "rzp_test_readora_live_sim",
      webhookSecret: "whsec_readora_test_signature",
    },
    create: {
      id: "pp-razorpay",
      provider: "razorpay",
      enabled: true,
      testMode: true,
      publicKey: "rzp_test_readora_live_sim",
      secretKeyEncrypted: "rzp_test_secret_key_mock",
      webhookSecret: "whsec_readora_test_signature",
    },
  });

  await prisma.paymentProviderConfig.upsert({
    where: { provider: "stripe" },
    update: {
      enabled: true,
      testMode: true,
      publicKey: "pk_test_readora_stripe_sim",
      webhookSecret: "whsec_stripe_test_signature",
    },
    create: {
      id: "pp-stripe",
      provider: "stripe",
      enabled: true,
      testMode: true,
      publicKey: "pk_test_readora_stripe_sim",
      secretKeyEncrypted: "sk_test_stripe_secret_mock",
      webhookSecret: "whsec_stripe_test_signature",
    },
  });

  await prisma.paymentProviderConfig.upsert({
    where: { provider: "paypal" },
    update: {
      enabled: false,
      testMode: true,
      publicKey: "client_id_paypal_sim",
    },
    create: {
      id: "pp-paypal",
      provider: "paypal",
      enabled: false,
      testMode: true,
      publicKey: "client_id_paypal_sim",
    },
  });
  console.log("✓ Payment provider configurations seeded.");

  // 5. Seed Coupons
  await prisma.coupon.upsert({
    where: { code: "WELCOME50" },
    update: {
      discountType: "PERCENTAGE",
      discountValue: 50,
      minOrderAmount: 0,
      maxDiscountAmount: 150,
      active: true,
    },
    create: {
      id: "cp-welcome50",
      code: "WELCOME50",
      discountType: "PERCENTAGE",
      discountValue: 50,
      minOrderAmount: 0,
      maxDiscountAmount: 150,
      usageLimit: 1000,
      perUserLimit: 1,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "READORA20" },
    update: {
      discountType: "FIXED",
      discountValue: 20,
      minOrderAmount: 99,
      active: true,
    },
    create: {
      id: "cp-readora20",
      code: "READORA20",
      discountType: "FIXED",
      discountValue: 20,
      minOrderAmount: 99,
      usageLimit: 500,
      perUserLimit: 2,
      active: true,
    },
  });
  console.log("✓ Promotional coupons seeded.");

  // 6. Seed Books with Access Models, Prices, & Preview Rules
  const accessConfigMap: Record<string, { accessType: string; price: number; originalPrice: number; discount: number; previewPages: number }> = {
    "atomic-habits": { accessType: "ONE_TIME_PURCHASE", price: 199, originalPrice: 299, discount: 33, previewPages: 10 },
    "the-psychology-of-money": { accessType: "FREE_WITH_SUBSCRIPTION", price: 149, originalPrice: 249, discount: 40, previewPages: 8 },
    "sapiens-a-brief-history": { accessType: "SUBSCRIPTION", price: 299, originalPrice: 399, discount: 25, previewPages: 12 },
    "siddhartha": { accessType: "FREE", price: 0, originalPrice: 0, discount: 0, previewPages: 100 },
    "deep-work": { accessType: "PREVIEW", price: 199, originalPrice: 299, discount: 33, previewPages: 8 },
    "rich-dad-poor-dad": { accessType: "ONE_TIME_PURCHASE", price: 99, originalPrice: 199, discount: 50, previewPages: 10 },
  };

  for (const b of MOCK_BOOKS) {
    const config = accessConfigMap[b.slug] || {
      accessType: "ONE_TIME_PURCHASE",
      price: 149,
      originalPrice: 199,
      discount: 25,
      previewPages: 10,
    };

    const book = await prisma.book.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        author: b.author,
        description: b.description,
        coverPath: b.coverUrl,
        filePath: `/storage/books/${b.slug}.txt`,
        fileName: `${b.slug}.txt`,
        mimeType: "text/plain",
        fileSize: 48500,
        format: b.format.toUpperCase(),
        isbn: b.isbn,
        language: b.language,
        categoryId: b.categoryId,
        categoryName: b.categoryName || "Curated",
        tags: JSON.stringify(b.tags),
        publisher: b.publisher,
        publicationDate: b.publicationDate,
        pages: b.pages,
        featured: b.featured ?? false,
        trending: b.trending ?? false,
        popular: b.popular ?? false,
        status: "PUBLISHED",
        rating: b.rating,
        ratingCount: b.ratingCount,
        readCount: b.readCount,
        sampleContent: b.sampleContent,
        accessType: config.accessType,
        price: config.price,
        originalPrice: config.originalPrice,
        discount: config.discount,
        currency: "INR",
        previewType: "PAGES",
        previewPages: config.previewPages,
        previewPercentage: 15,
        previewChapters: 2,
        watermarkEnabled: true,
      },
      create: {
        id: b.id,
        slug: b.slug,
        title: b.title,
        author: b.author,
        description: b.description,
        coverPath: b.coverUrl,
        filePath: `/storage/books/${b.slug}.txt`,
        fileName: `${b.slug}.txt`,
        mimeType: "text/plain",
        fileSize: 48500,
        format: b.format.toUpperCase(),
        isbn: b.isbn,
        language: b.language,
        categoryId: b.categoryId,
        categoryName: b.categoryName || "Curated",
        tags: JSON.stringify(b.tags),
        publisher: b.publisher,
        publicationDate: b.publicationDate,
        pages: b.pages,
        featured: b.featured ?? false,
        trending: b.trending ?? false,
        popular: b.popular ?? false,
        status: "PUBLISHED",
        rating: b.rating,
        ratingCount: b.ratingCount,
        readCount: b.readCount,
        sampleContent: b.sampleContent,
        accessType: config.accessType,
        price: config.price,
        originalPrice: config.originalPrice,
        discount: config.discount,
        currency: "INR",
        previewType: "PAGES",
        previewPages: config.previewPages,
        previewPercentage: 15,
        previewChapters: 2,
        watermarkEnabled: true,
      },
    });

    if (b.chapters && b.chapters.length > 0) {
      for (let i = 0; i < b.chapters.length; i++) {
        const ch = b.chapters[i];
        await prisma.chapter.upsert({
          where: { id: ch.id },
          update: {
            title: ch.title,
            page: ch.page,
            content: ch.content,
            order: i,
          },
          create: {
            id: ch.id,
            bookId: book.id,
            title: ch.title,
            page: ch.page,
            content: ch.content,
            order: i,
          },
        });
      }
    }
  }
  console.log("✓ Books and multi-chapter readings seeded with commercial access types.");

  // 7. Seed Sample Completed Order & Entitlement for Admin
  const sampleBook = MOCK_BOOKS[0]; // Atomic Habits
  const orderNumber = "ORD-READORA-2026-001";
  const existingOrder = await prisma.order.findUnique({ where: { orderNumber } });
  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: adminUser.id,
        status: "PAID",
        subtotal: 199,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 199,
        currency: "INR",
        paymentMethod: "upi",
        paymentProvider: "razorpay",
        items: {
          create: {
            bookId: sampleBook.id,
            title: sampleBook.title,
            price: 199,
            quantity: 1,
          },
        },
        payments: {
          create: {
            provider: "razorpay",
            providerPaymentId: "pay_sim_123456789",
            providerOrderId: "order_sim_987654321",
            amount: 199,
            currency: "INR",
            status: "SUCCESS",
          },
        },
      },
    });

    // Entitlement
    await prisma.bookEntitlement.upsert({
      where: {
        userId_bookId: {
          userId: adminUser.id,
          bookId: sampleBook.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        bookId: sampleBook.id,
        orderId: order.id,
        source: "PURCHASE",
        active: true,
      },
    });
  }

  // 8. Seed Reader's Active Subscription
  const existingSub = await prisma.subscription.findFirst({ where: { userId: readerUser.id } });
  if (!existingSub) {
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    await prisma.subscription.create({
      data: {
        userId: readerUser.id,
        planId: annualPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        provider: "razorpay",
      },
    });
  }

  // 9. Seed Homepage Sections
  const sections = [
    { sectionKey: "hero", title: "Cinematic Hero", subtitle: "Hero headline & animated book composition", sortOrder: 1 },
    { sectionKey: "continue_reading", title: "Continue Reading", subtitle: "Jump straight back into your reading session", sortOrder: 2 },
    { sectionKey: "featured", title: "Featured Editorial Collection", subtitle: "Stories Worth Getting Lost In", sortOrder: 3 },
    { sectionKey: "trending", title: "Trending Now", subtitle: "Curated horizontal reader recommendations", sortOrder: 4 },
    { sectionKey: "mood", title: "Browse by Reading Mood", subtitle: "Explore by how you want to feel", sortOrder: 5 },
    { sectionKey: "categories", title: "Curated Categories", subtitle: "Browse our expansive catalog by genre", sortOrder: 6 },
    { sectionKey: "popular", title: "Popular This Week", subtitle: "Most engaged volumes across the community", sortOrder: 7 },
    { sectionKey: "new_releases", title: "New Releases", subtitle: "Fresh acquisitions added to our shelves", sortOrder: 8 },
  ];

  for (const s of sections) {
    await prisma.homepageSection.upsert({
      where: { sectionKey: s.sectionKey },
      update: {
        title: s.title,
        subtitle: s.subtitle,
        sortOrder: s.sortOrder,
        enabled: true,
      },
      create: {
        sectionKey: s.sectionKey,
        title: s.title,
        subtitle: s.subtitle,
        sortOrder: s.sortOrder,
        enabled: true,
      },
    });
  }

  console.log("READORA SQLite database successfully primed with complete commercial library ecosystem!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
