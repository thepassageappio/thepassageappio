import Link from 'next/link';
import type { ReactNode } from 'react';

type TopShellProps = {
  children: ReactNode;
  context?: string;
  mode?: 'gateway' | 'workspace';
};

const marketingNav = [
  { href: '/organization/start', label: 'Funeral homes' },
  { href: '/partner/start', label: 'Vendors' },
  { href: '/story', label: 'Our story' },
  { href: '/mission', label: 'Mission' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/guides', label: 'Guides' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export function TopShell({ children, context = 'Connected care', mode = 'workspace' }: TopShellProps) {
  return (
    <div className={`top-shell top-shell--${mode}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="top-shell__bar">
        <Link className="top-shell__brand" href="/" aria-label="Passage home">
          <span className="signal-mark" aria-hidden="true"><i /><i /><i /></span>
          <strong>PASSAGE</strong>
        </Link>
        <span className="top-shell__context"><i aria-hidden="true" />{context}</span>
        <nav className="top-shell__nav" aria-label="Passage">
          {marketingNav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          <Link className="top-shell__navSignIn" href="/login">Sign in</Link>
          <Link className="top-shell__navPrimary" href="/#what-you-need">Get started</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
