// Passage — /privacy route seam (site-migration Slice 5).
// Calm-by-default: renders the calm PrivacyCalm on the design system + calm chrome.
// Pass ?legacy=1 to fall back to the shipped legacy page during QA (per-page
// rollback). SSR-safe: the legacy flag is read in an effect, never during render,
// so there are no hydration mismatches. SEO comes from _app.js PAGE_META['/privacy']
// (indexable; no noindex added).
import { useEffect, useState } from 'react';
import PrivacyCalm from '../components/marketing/PrivacyCalm';
import LegacyPrivacy from '../components/legacy/LegacyPrivacy';

export default function PrivacyPage() {
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLegacy(new URLSearchParams(window.location.search).get('legacy') === '1');
  }, []);

  if (legacy) return <LegacyPrivacy />;
  return <PrivacyCalm />;
}
