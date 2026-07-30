import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import type { ReactNode } from 'react';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-loaded',
});

const sans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
});

export const metadata: Metadata = {
  title: { default: 'Passage', template: '%s · Passage' },
  description: 'One trusted continuity layer for every person around a loss.',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4efe7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} data-scroll-behavior="smooth">
      <body><PassageZeroProvider>{children}</PassageZeroProvider></body>
    </html>
  );
}
