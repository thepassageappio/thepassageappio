import Link from 'next/link';
import type { ReactNode } from 'react';
import { resolveAccountHomeLink } from '@/lib/auth/account-home';
import { MobileNavDisclosure } from './MobileNavDisclosure';

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

// Was a static shell that always showed "Sign in" / "Get started", even to an
// already-authenticated visitor -- there was no way to reach an account/case
// dashboard from any marketing page once signed in, which is exactly what
// "sign in with Google still doesn't take me to my account page" was hitting:
// the sign-in itself worked, but nothing in the header ever offered a way back
// to the account it signed them into. Now resolves and shows the real
// destination for a signed-in viewer instead.
export async function TopShell({ children, context = 'Connected care', mode = 'workspace' }: TopShellProps) {
  const accountLink = await resolveAccountHomeLink();

  const authLinks = accountLink ? (
    <>
      <Link className="top-shell__navPrimary" href={accountLink.href}>{accountLink.label}</Link>
    </>
  ) : (
    <>
      <Link className="top-shell__navSignIn" href="/login">Sign in</Link>
      <Link className="top-shell__navPrimary" href="/#what-you-need">Get started</Link>
    </>
  );

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
          {authLinks}
        </nav>
        <MobileNavDisclosure buttonClassName="top-shell__navToggle" label="Menu" panelClassName="top-shell__navPanel">
          {marketingNav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          {authLinks}
        </MobileNavDisclosure>
      </header>
      {children}
    </div>
  );
}
