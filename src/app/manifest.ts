import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "READORA — Your Digital Library",
    short_name: "READORA",
    description: "Discover, read and organize eBooks in an editorial digital sanctuary.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F4",
    theme_color: "#8A2846",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
