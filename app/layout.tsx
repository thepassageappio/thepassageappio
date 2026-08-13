import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Passage', template: '%s | Passage' },
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
    <html lang="en" data-scroll-behavior="smooth">
      <body><PassageZeroProvider>{children}</PassageZeroProvider></body>
    </html>
  );
}
