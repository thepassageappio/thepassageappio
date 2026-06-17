import { useEffect } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

export default function SystemDemoRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/system/admin?tool=demo-studio#demo-studio');
    }
  }, []);

  return (
    <>
      <SiteHeader />
      <main style={wrap}>
        <section style={panel}>
          <div style={eyebrow}>Passage System Admin</div>
          <h1 style={h1}>Demo tools moved into System Admin.</h1>
          <p style={lead}>Internal demo controls, QA links, readiness checks, and operator notes now live in one owner-only cabinet so customer and public pages stay clean.</p>
          <Link href="/system/admin?tool=demo-studio#demo-studio" style={button}>Open System Admin</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

const wrap = {
  minHeight: '58vh',
  background: '#f8f4ec',
  padding: '70px 22px',
  display: 'grid',
  placeItems: 'center',
};

const panel = {
  width: 'min(720px, 100%)',
  background: '#fffdf8',
  border: '1px solid #e6dac9',
  borderRadius: 18,
  padding: 28,
  boxShadow: '0 18px 50px rgba(47, 38, 27, 0.08)',
};

const eyebrow = {
  color: '#6f8f73',
  fontSize: 12,
  letterSpacing: 1.6,
  textTransform: 'uppercase',
  fontWeight: 900,
  marginBottom: 10,
};

const h1 = {
  margin: 0,
  color: '#21180f',
  fontSize: 'clamp(32px, 4vw, 52px)',
  lineHeight: 1.02,
  letterSpacing: 0,
};

const lead = {
  color: '#5f554a',
  fontSize: 18,
  lineHeight: 1.58,
  margin: '16px 0 24px',
};

const button = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 46,
  padding: '0 18px',
  borderRadius: 12,
  background: '#111111',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 900,
};