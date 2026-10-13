import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = authors.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      bio: a.bio,
      avatarUrl: a.avatarUrl,
      bookCount: a._count.books,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ authors: formatted });
  } catch (error: any) {
    console.error("Authors fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch authors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, bio, avatarUrl } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Author name is required" }, { status: 400 });
    }

    const baseSlug = generateSlug(name.trim());
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const newAuthor = await prisma.author.create({
      data: {
        name: name.trim(),
        slug,
        bio: bio?.trim(),
        avatarUrl: avatarUrl || undefined,
      },
    });

    return NextResponse.json({ success: true, author: newAuthor }, { status: 201 });
  } catch (error: any) {
    console.error("Author creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create author" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, bio, avatarUrl } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "Author ID and name are required" }, { status: 400 });
    }

    const updated = await prisma.author.update({
      where: { id },
      data: {
        name: name.trim(),
        bio: bio?.trim() || null,
        avatarUrl: avatarUrl || null,
      },
    });

    return NextResponse.json({ success: true, author: updated });
  } catch (error: any) {
    console.error("Author update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update author" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Author ID is required" }, { status: 400 });
    }

    await prisma.author.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Author deleted" });
  } catch (error: any) {
    console.error("Author delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete author" }, { status: 500 });
  }
}
