import Link from 'next/link';

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

const navLink = { color: CHROME_COLORS.mid, textDecoration: 'none' };

export function SiteHeader({ user, onSignIn, onSignOut }) {
  return (
    <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
      <Link href="/" style={{ color: CHROME_COLORS.ink, textDecoration: 'none', fontSize: 22, fontWeight: 700 }}>Passage</Link>
      <div style={{ display: 'flex', gap: 14, fontSize: 13, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} style={navLink}>{label}</Link>)}
        <Link href="/" style={{ background: CHROME_COLORS.sage, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800 }}>My estate</Link>
        {user && onSignOut && (
          <button onClick={onSignOut} style={{ border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 10, padding: '8px 14px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign out</button>
        )}
        {!user && onSignIn && (
          <button onClick={onSignIn} style={{ border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 10, padding: '8px 14px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>
        )}
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
        <Link href="/" style={navLink}>My estate</Link>
      </div>
    </footer>
  );
}
