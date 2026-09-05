import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";
import "./interaction-feedback.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thepassageapp.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Passage Authority | Clear Financial Power of Attorney Requests",
    template: "%s | Passage Authority",
  },
  description: "Help an account holder, representative, and financial institution complete a power of attorney request and see the institution's decision.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  referrer: "no-referrer",
  openGraph: {
    title: "Passage Authority | Clear Financial Power of Attorney Requests",
    description: "A clear way for financial institutions to handle power of attorney requests.",
    images: [{ url: "/passage-authority-og.png", width: 1744, height: 909, alt: "Passage Authority financial POA institution review workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Passage Authority | Clear Financial Power of Attorney Requests",
    description: "A clear way for financial institutions to handle power of attorney requests.",
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
