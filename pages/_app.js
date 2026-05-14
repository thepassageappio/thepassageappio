import Head from 'next/head';
import { Component } from 'react';
import { useRouter } from 'next/router';
import { PASSAGE_BRAND } from '../lib/brand';
import { PASSAGE_FONT, PASSAGE_TYPE } from '../lib/typography';

const SITE_URL = 'https://www.thepassageapp.io';
const DESCRIPTION = 'Passage gives families, participants, funeral homes, and trusted vendors one calm place to coordinate tasks, owners, messages, proof, and next steps before, during, and after a death.';
const PAGE_META = {
  '/': ['Passage | Family coordination before, during, and after a death', DESCRIPTION],
  '/mission': ['Mission | Passage', 'Why Passage exists: one calm place for next steps, owners, waiting points, and proof through the hardest family handoffs.'],
  '/story': ['Our Story | Passage', 'The founder story and mission behind Passage, a calmer coordination layer for families and providers.'],
  '/resources': ['Resources | Passage', 'Plain-language resources for families, funeral homes, invited helpers, and local support partners.'],
  '/blog': ['Blog | Passage', 'Guides and founder notes on funeral planning, family coordination, hospice handoffs, and after-death responsibilities.'],
  '/pricing': ['Pricing | Passage', 'Passage pricing for urgent family support and planning-ahead family records.'],
  '/contact': ['Contact | Passage', 'Contact Passage for family support, funeral-home walkthroughs, vendor conversations, hospice partnerships, billing, and product questions.'],
  '/funeral-home': ['For Funeral Homes | Passage', 'A calmer family coordination layer for funeral homes: active cases, staff queues, proof trails, warm handoffs, and exportable context.'],
  '/funeral-home/login': ['Funeral Home Sign In | Passage', 'Funeral home directors and staff choose the private Passage workspace for active cases, My Day, staff work, proof, and setup.'],
  '/funeral-home/setup': ['Create Funeral Home Workspace | Passage', 'Create a funeral-home workspace with owner access, location context, and staff invitations.'],
  '/funeral-home/staff': ['Funeral Home Staff Workspace | Passage', 'Funeral home staff sign in to see assigned work, case context, waiting points, and proof.'],
  '/care-providers': ['Care Providers | Passage', 'Passage helps hospice, assisted living, senior living, and home-care teams create family-owned handoffs into planning, red path, funeral homes, vendors, and aftercare.'],
  '/hospice': ['Hospice Continuity | Passage', 'A warm-path family record for hospice and care teams to prepare contacts, first-call plans, permissions, and funeral-home handoffs before the crisis moment.'],
  '/assisted-living': ['Assisted Living Continuity | Passage', 'Passage helps assisted living and senior living communities support family coordination, care handoffs, activation rules, and downstream funeral-home context.'],
  '/participants': ['For Invited Helpers | Passage', 'How invited participants help with one scoped family request without opening the whole estate record.'],
  '/participating': ['Participant Workspace | Passage', 'Sign in to open a private, scoped Passage request assigned by a family or coordinator.'],
  '/vendors': ['Vendors | Passage', 'Apply as a Passage vendor or sign in to respond to scoped family and funeral-home support requests.'],
  '/vendors/login': ['Vendor Sign In | Passage', 'Approved Passage vendors sign in to manage request queues and quote scoped work.'],
  '/vendors/onboard': ['Vendor Application | Passage', 'Apply to become a reviewed Passage support vendor for family and funeral-home tasks.'],
  '/vendors/request': ['Vendor Request Workspace | Passage', 'Approved vendors open scoped Passage requests, quote service details, and keep families updated without browsing estate records.'],
  '/urgent': ['Urgent Help | Passage', 'Start an urgent family command center for the first practical steps after a death.'],
  '/planning': ['Plan Ahead | Passage', 'Create a planning estate with wishes, documents, people, providers, and activation rules.'],
  '/login': ['Sign In | Passage', 'Choose the Passage workspace you need: family record, participant request, funeral home, vendor, or admin.'],
  '/guides': ['Passage Guides | Passage', 'Practical guides for the first 24 hours, family notifications, executor responsibilities, and funeral-home meeting preparation.'],
  '/privacy': ['Privacy | Passage', 'How Passage approaches privacy, role-scoped access, exports, support requests, retention, and subprocessors.'],
  '/terms': ['Terms | Passage', 'Passage terms, product boundaries, subscriptions, third-party providers, and user responsibilities.'],
  '/trust': ['Trust | Passage', 'Passage trust boundaries for sensitive coordination work, role-based visibility, proof trails, and human review.'],
  '/faq': ['FAQ | Passage', 'Frequently asked questions about Passage for families, participants, funeral homes, vendors, and care providers.'],
  '/status': ['Status | Passage', 'Passage product status, notification posture, and operational readiness.'],
};

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
      <div style={{ minHeight: '100vh', background: '#f6f3ee', color: '#1a1916', fontFamily: PASSAGE_FONT.family, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 560, background: '#fff', border: '1px solid #e4ddd4', borderRadius: 18, padding: 22, boxShadow: '0 14px 40px rgba(0,0,0,.08)' }}>
          <div style={{ ...PASSAGE_TYPE.eyebrow, color: '#6b8f71', marginBottom: 8 }}>Passage recovered this screen</div>
          <h1 style={{ ...PASSAGE_TYPE.h1, margin: '0 0 8px' }}>This view hit a temporary issue.</h1>
          <p style={{ ...PASSAGE_TYPE.bodySmall, margin: '0 0 16px', color: '#6a6560' }}>Your estate data was not changed. Return to the estate index or reload this page and Passage will pick the next step back up.</p>
          {message && (
            <div style={{ ...PASSAGE_TYPE.caption, background: '#fdf3f3', border: '1px solid rgba(196,122,122,.35)', borderRadius: 11, padding: '9px 11px', color: '#6a6560', marginBottom: 14 }}>
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
  const router = useRouter();
  const [title, description] = PAGE_META[router.pathname] || ['Passage | One calm place for life-to-death transitions', DESCRIPTION];
  const canonicalPath = router.pathname === '/' ? '' : router.pathname;
  const canonicalUrl = SITE_URL + canonicalPath;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="icon" href={PASSAGE_BRAND.assets.favicon} type="image/svg+xml" />
        <link rel="shortcut icon" href={PASSAGE_BRAND.assets.favicon} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={PASSAGE_BRAND.assets.appleTouchIcon} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Passage" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}${PASSAGE_BRAND.assets.socialImage}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}${PASSAGE_BRAND.assets.socialImage}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: PASSAGE_BRAND.name,
              url: SITE_URL,
              email: PASSAGE_BRAND.supportEmail,
              description: DESCRIPTION,
            }),
          }}
        />
      </Head>
      <PassageErrorBoundary>
        <Component {...pageProps} />
      </PassageErrorBoundary>
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          background: #f6f3ee;
          color: #1a1916;
          font-family: ${PASSAGE_FONT.family};
          font-size: ${PASSAGE_TYPE.body.fontSize}px;
          line-height: ${PASSAGE_TYPE.body.lineHeight};
          letter-spacing: 0;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        * {
          box-sizing: border-box;
        }
        button,
        input,
        textarea,
        select {
          font: inherit;
          letter-spacing: 0;
        }
        h1,
        h2,
        h3,
        h4,
        p {
          letter-spacing: 0;
        }
      `}</style>
    </>
  );
}
