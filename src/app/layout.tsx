import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thepassageapp.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Passage Authority | Financial POA Operations",
    template: "%s | Passage Authority",
  },
  description: "Turn a power of attorney request into a guided, reviewable, scoped institution decision and keep every permitted party current.",
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
