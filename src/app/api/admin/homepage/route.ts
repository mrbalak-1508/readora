import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator access required" }, { status: 403 });
    }

    const sections = await prisma.homepageSection.findMany({
      orderBy: { sortOrder: "asc" },
    });

    const heroSetting = await prisma.siteSetting.findUnique({
      where: { key: "homepage_hero" },
    });

    return NextResponse.json({
      sections,
      heroConfig: heroSetting ? JSON.parse(heroSetting.value) : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator access required" }, { status: 403 });
    }

    const body = await request.json();
    const { sections, heroConfig } = body;

    // Update sections
    if (Array.isArray(sections)) {
      for (const s of sections) {
        await prisma.homepageSection.upsert({
          where: { sectionKey: s.sectionKey },
          update: {
            title: s.title,
            subtitle: s.subtitle,
            enabled: Boolean(s.enabled),
            sortOrder: Number(s.sortOrder),
          },
          create: {
            sectionKey: s.sectionKey,
            title: s.title,
            subtitle: s.subtitle,
            enabled: Boolean(s.enabled),
            sortOrder: Number(s.sortOrder),
          },
        });
      }
    }

    // Update Hero config if provided
    if (heroConfig) {
      await prisma.siteSetting.upsert({
        where: { key: "homepage_hero" },
        update: { value: JSON.stringify(heroConfig) },
        create: {
          key: "homepage_hero",
          value: JSON.stringify(heroConfig),
          description: "Hero title, subtitle and CTA config",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
