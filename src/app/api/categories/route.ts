import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORIES } from "@/lib/data/mockCategories";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    if (categories.length === 0) {
      return NextResponse.json(CATEGORIES);
    }

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      featured: c.featured,
      sort_order: c.sortOrder,
      bookCount: c._count.books,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(CATEGORIES);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        featured: Boolean(body.featured),
        sortOrder: Number(body.sortOrder) || 0,
      },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "CATEGORY_CREATE",
        targetType: "CATEGORY",
        targetId: category.id,
        details: JSON.stringify({ name: category.name, slug: category.slug }),
      },
    }).catch(() => {});

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Category creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
