import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.slug && { slug: body.slug.trim() }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "CATEGORY_UPDATE",
        targetType: "CATEGORY",
        targetId: updated.id,
        details: JSON.stringify({ name: updated.name, slug: updated.slug }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("Category PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category._count.books > 0) {
      return NextResponse.json(
        { error: `Cannot delete category containing ${category._count.books} books. Reassign the books first.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "CATEGORY_DELETE",
        targetType: "CATEGORY",
        targetId: id,
        details: JSON.stringify({ name: category.name }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Category DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
