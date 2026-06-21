// Passage — /terms route seam (site-migration Slice 5).
// Calm-by-default: renders the calm TermsCalm on the design system + calm chrome.
// Pass ?legacy=1 to fall back to the shipped legacy page during QA (per-page
// rollback). SSR-safe: the legacy flag is read in an effect, never during render,
// so there are no hydration mismatches. SEO comes from _app.js PAGE_META['/terms']
// (indexable; no noindex added).
import { useEffect, useState } from 'react';
import TermsCalm from '../components/marketing/TermsCalm';
import LegacyTerms from '../components/legacy/LegacyTerms';

export default function TermsPage() {
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLegacy(new URLSearchParams(window.location.search).get('legacy') === '1');
  }, []);

  if (legacy) return <LegacyTerms />;
  return <TermsCalm />;
}
