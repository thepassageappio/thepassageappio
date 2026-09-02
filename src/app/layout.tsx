import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thepassageapp.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Passage Authority | Financial POA Operations",
    template: "%s | Passage Authority",
  },
  description: "Turn a power of attorney request into a guided, reviewable, scoped institution decision and keep every permitted party current.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  referrer: "no-referrer",
  openGraph: {
    title: "Passage Authority | Financial POA Operations",
    description: "Power of attorney, made operational for financial institutions.",
    images: [{ url: "/passage-authority-og.png", width: 1744, height: 909, alt: "Passage Authority financial POA institution review workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Passage Authority | Financial POA Operations",
    description: "Power of attorney, made operational for financial institutions.",
    images: ["/passage-authority-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
