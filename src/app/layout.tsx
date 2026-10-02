import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0D0C" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://readora.library"),
  title: {
    default: "READORA — Your Digital Library",
    template: "%s | READORA",
  },
  description:
    "A modern, elegant digital library where you can discover, read and organize eBooks with an editorial reading experience.",
  keywords: [
    "digital library",
    "ebook reader",
    "online books",
    "epub reader",
    "pdf reader",
    "readora",
    "books online",
  ],
  authors: [{ name: "READORA Editorial Team" }],
  creator: "READORA",
  publisher: "READORA Inc.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://readora.library",
    title: "READORA — Your Digital Library",
    description:
      "A modern, elegant digital library where you can discover, read and organize eBooks with an editorial reading experience.",
    siteName: "READORA",
  },
  twitter: {
    card: "summary_large_image",
    title: "READORA — Your Digital Library",
    description:
      "A modern, elegant digital library where you can discover, read and organize eBooks with an editorial reading experience.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} scroll-smooth`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans antialiased selection:bg-[#8A2846]/15 selection:text-[#8A2846]"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
