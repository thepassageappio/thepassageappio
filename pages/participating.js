// Passage — /participating route seam (site-migration Slice 4).
// Calm-by-default: renders the calm ParticipantApp (OTP sign-in, authed
// participantContext with multi-estate selector, invite-token acceptance, and
// ?demo=1 sample mode all preserved inside it). Pass ?legacy=1 to fall back to the
// shipped legacy page during QA. SSR-safe: the legacy flag is read in an effect,
// never during render, so there are no hydration mismatches. ?estate, ?task,
// invite token, ?demo=1, emailRedirectTo, and the auth session all live inside
// ParticipantApp.
import { useEffect, useState } from 'react';
import ParticipantApp from '../components/participant/ParticipantApp';
import LegacyParticipating from '../components/participant/LegacyParticipating';

export default function ParticipatingPage() {
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLegacy(new URLSearchParams(window.location.search).get('legacy') === '1');
  }, []);

  if (legacy) return <LegacyParticipating />;
  return <ParticipantApp />;
}
