import { MetadataRoute } from "next";
import { MOCK_BOOKS } from "@/lib/data/mockBooks";
import { CATEGORIES } from "@/lib/data/mockCategories";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://readora.library";

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ];

  const bookPages = MOCK_BOOKS.map((b) => ({
    url: `${baseUrl}/books/${b.slug}`,
    lastModified: new Date(b.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${baseUrl}/explore?category=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...bookPages, ...categoryPages];
}
