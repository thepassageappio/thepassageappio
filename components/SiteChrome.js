import Link from 'next/link';
import { useRouter } from 'next/router';

export const CHROME_COLORS = {
  bg: '#f6f3ee',
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
};

const LINKS = [
  ['Mission', '/mission'],
  ['Resources', '/content'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
  ['Participating', '/participating'],
];

const navLink = { color: CHROME_COLORS.mid, textDecoration: 'none', borderRadius: 10, padding: '7px 10px' };

function isActivePath(current, href) {
  if (!current) return false;
  if (href === '/') return current === '/';
  return current === href || current.startsWith(href + '/');
}

export function SiteHeader({ user, onSignIn, onSignOut }) {
  const router = useRouter();
  const path = router?.pathname || '';
  const activeStyle = {
    background: CHROME_COLORS.sage,
    color: '#fff',
    textDecoration: 'none',
    borderRadius: 10,
    padding: '7px 11px',
    fontWeight: 800,
  };
  const quietMyEstate = {
    color: CHROME_COLORS.mid,
    background: CHROME_COLORS.sageFaint,
    textDecoration: 'none',
    borderRadius: 10,
    padding: '8px 14px',
    fontWeight: 800,
  };
  return (
    <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '9px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
      <Link href="/" style={{ color: CHROME_COLORS.ink, textDecoration: 'none', fontSize: 22, fontWeight: 700 }}>Passage</Link>
      <div style={{ display: 'flex', gap: 6, fontSize: 13, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} style={isActivePath(path, href) ? activeStyle : navLink}>{label}</Link>)}
        <Link href="/" style={isActivePath(path, '/') ? activeStyle : quietMyEstate}>My estate</Link>
        <span style={{ width: 92, display: 'inline-flex', justifyContent: 'flex-end' }}>
          {user && onSignOut && (
            <button onClick={onSignOut} style={{ width: 88, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 10, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign out</button>
          )}
          {!user && onSignIn && (
            <button onClick={onSignIn} style={{ width: 88, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 10, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>
          )}
        </span>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 22px 32px', borderTop: '1px solid ' + CHROME_COLORS.border, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12, color: CHROME_COLORS.soft }}>
      <div>Passage</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} style={navLink}>{label}</Link>)}
        <Link href="/funeral-home/dashboard" style={navLink}>For funeral homes</Link>
        <Link href="/" style={navLink}>My estate</Link>
      </div>
    </footer>
  );
}
