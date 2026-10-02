import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/reader/", "/read/", "/api/"],
    },
    sitemap: "https://readora.library/sitemap.xml",
  };
}
