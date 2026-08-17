import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';
import './globals.css';

// Site-wide HubSpot tracking pixel (portal 246159600) -- separate from the
// server-side lib/hubspot.ts API sync (contacts, deals, lifecycle stage).
// This is the client-side analytics/visitor-tracking script; afterInteractive
// keeps it off the critical render path.
const HUBSPOT_PORTAL_ID = '246159600';

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
      <body>
        <PassageZeroProvider>{children}</PassageZeroProvider>
        <Script id="hs-script-loader" src={`https://js.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
