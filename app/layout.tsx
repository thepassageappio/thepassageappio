import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Passage', template: '%s · Passage' },
  description: 'One trusted continuity layer for every person around a loss.',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f7fb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><PassageZeroProvider>{children}</PassageZeroProvider></body>
    </html>
  );
}
