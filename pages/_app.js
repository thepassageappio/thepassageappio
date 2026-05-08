import Head from 'next/head';
import { Component } from 'react';

const SITE_URL = 'https://www.thepassageapp.io';
const DESCRIPTION = 'Passage gives families, participants, funeral homes, and trusted vendors one calm place to coordinate tasks, owners, messages, proof, and next steps before, during, and after a death.';

class PassageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Passage client error message:', error?.message || error);
    console.error('Passage client error stack:', error?.stack || '');
    console.error('Passage client component stack:', info?.componentStack || '');
    console.error('Passage client error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const message = String(this.state.error?.message || this.state.error || '').slice(0, 220);
    return (
      <div style={{ minHeight: '100vh', background: '#f6f3ee', color: '#1a1916', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 560, background: '#fff', border: '1px solid #e4ddd4', borderRadius: 18, padding: 22, boxShadow: '0 14px 40px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6b8f71', fontWeight: 900, marginBottom: 8 }}>Passage recovered this screen</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, lineHeight: 1.1 }}>This view hit a temporary issue.</h1>
          <p style={{ margin: '0 0 16px', color: '#6a6560', lineHeight: 1.55 }}>Your estate data was not changed. Return to the estate index or reload this page and Passage will pick the next step back up.</p>
          {message && (
            <div style={{ background: '#fdf3f3', border: '1px solid rgba(196,122,122,.35)', borderRadius: 11, padding: '9px 11px', color: '#6a6560', fontSize: 12, lineHeight: 1.45, marginBottom: 14 }}>
              Error: {message}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => { window.location.href = '/?dashboard=1'; }} style={{ border: 'none', borderRadius: 11, background: '#6b8f71', color: '#fff', padding: '11px 14px', fontFamily: 'inherit', fontWeight: 900, cursor: 'pointer' }}>Open My estate</button>
            <button type="button" onClick={() => { window.location.reload(); }} style={{ border: '1px solid #e4ddd4', borderRadius: 11, background: '#fff', color: '#6a6560', padding: '10px 14px', fontFamily: 'inherit', fontWeight: 900, cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      </div>
    );
  }
}

export default function PassageApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Passage | One calm place for life-to-death transitions</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Passage" />
        <meta property="og:title" content="Passage | One calm place for life-to-death transitions" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Passage | One calm place for life-to-death transitions" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Passage',
              url: SITE_URL,
              email: 'thepassageappio@gmail.com',
              description: DESCRIPTION,
            }),
          }}
        />
      </Head>
      <PassageErrorBoundary>
        <Component {...pageProps} />
      </PassageErrorBoundary>
    </>
  );
}
