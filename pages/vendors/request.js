// Passage — /vendors/request route seam (site-migration Slice 3).
// Calm-by-default: renders the calm VendorRequestApp (token mode, auth dashboard
// mode, and ?demo=1 sample mode all preserved inside it). Pass ?legacy=1 to fall
// back to the shipped legacy page during QA. SSR-safe: the legacy flag is read in
// an effect, never during render, so there are no hydration mismatches. ?token,
// ?demo=1, and the auth session reading all live inside VendorRequestApp.
import { useEffect, useState } from 'react';
import VendorRequestApp from '../../components/vendor/VendorRequestApp';
import LegacyVendorRequest from '../../components/vendor/LegacyVendorRequest';

export default function VendorRequestPage() {
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLegacy(new URLSearchParams(window.location.search).get('legacy') === '1');
  }, []);

  if (legacy) return <LegacyVendorRequest />;
  return <VendorRequestApp />;
}
