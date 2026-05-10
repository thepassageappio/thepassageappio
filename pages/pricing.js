import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseBrowser';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import { trackEvent } from '../lib/trackEvent';
import { recordOnboardingProgress } from '../lib/onboardingClient';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

const groups = [
  { key: 'individual', label: 'Individual', seats: '1 estate', desc: 'For one person or one loved one.', options: [
    ['single_monthly', 'Monthly', '$9.99', '/mo'],
    ['single_annual', 'Annual', '$79.99', '/yr'],
  ] },
  { key: 'couple', label: 'Couple', seats: '2 estates', desc: 'For partners, spouses, or two parents.', options: [
    ['couple_monthly', 'Monthly', '$14.99', '/mo'],
    ['couple_annual', 'Annual', '$119.99', '/yr'],
  ] },
  { key: 'family', label: 'Family', seats: '5 estates', desc: 'For families coordinating care across several loved ones.', options: [
    ['family_monthly', 'Monthly', '$24.99', '/mo'],
    ['family_annual', 'Annual', '$199.99', '/yr'],
  ] },
];

function discountedPrice(price, planId) {
  const participantRates = {
    single_monthly: '$7.49',
    single_annual: '$63.99',
    couple_monthly: '$11.24',
    couple_annual: '$95.99',
    family_monthly: '$18.74',
    family_annual: '$159.99',
  };
  return participantRates[planId] || price;
}

function participantRateLabel(planId) {
  return planId.includes('annual') ? '20% participant rate' : '25% participant rate';
}

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [participantDiscount, setParticipantDiscount] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [activeChoice, setActiveChoice] = useState('urgent');

  useEffect(() => {
    setParticipantDiscount(new URLSearchParams(window.location.search).get('participant') === '1');
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('passage_pending_pricing_checkout');
    if (!raw) return;
    let pending = null;
    try { pending = JSON.parse(raw); } catch { pending = null; }
    window.localStorage.removeItem('passage_pending_pricing_checkout');
    if (pending?.planId) {
      const pendingDiscount = pending.participantDiscount === true;
      if (pendingDiscount && !participantDiscount) setParticipantDiscount(true);
      checkout(pending.planId, pendingDiscount);
    }
  }, [user]);

  async function signIn() {
    trackEvent('pricing_sign_in_clicked', { participantDiscount });
    if (!supabase?.auth) {
      setMessage('Sign-in is not configured in this environment.');
      return;
    }
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/pricing${participantDiscount ? '?participant=1' : ''}` } });
  }

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
    setMessage('');
    setSelectedPlan('');
  }

  async function checkout(planId, participantDiscountOverride = participantDiscount) {
    trackEvent('checkout_clicked', { planId, participantDiscount: participantDiscountOverride, signedIn: Boolean(user) });
    setSelectedPlan(planId);
    if (!supabase?.auth) {
      setMessage('Sign-in is not configured in this environment.');
      return;
    }
    if (!user) {
      trackEvent('checkout_requires_sign_in', { planId, participantDiscount: participantDiscountOverride });
      window.localStorage.setItem('passage_pending_pricing_checkout', JSON.stringify({
        planId,
        participantDiscount: participantDiscountOverride,
        createdAt: new Date().toISOString(),
      }));
      setMessage(planId === 'urgent' ? 'Sign in once so Passage can open the urgent command center for you.' : 'Sign in once so Passage can attach the plan to your estate workspace.');
      await signIn();
      return;
    }
    setBusy(planId);
    setMessage('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (sessionData?.session?.access_token || ''),
        },
        body: JSON.stringify({ planId, userId: user.id, userEmail: user.email, participantDiscount: participantDiscountOverride }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Checkout could not be started.');
      await recordOnboardingProgress(supabase, 'checkout_started', { planId, participantDiscount: participantDiscountOverride });
      trackEvent('checkout_started', { planId, participantDiscount: participantDiscountOverride });
      window.location.href = data.url;
    } catch (err) {
      trackEvent('checkout_failed', { planId, message: err.message || 'Checkout could not be started.' });
      setMessage(err.message || 'Checkout could not be started.');
    } finally {
      setBusy('');
    }
  }

  const activeGroup = groups.find(g => g.key === activeChoice) || groups[0];
  const showingUrgent = activeChoice === 'urgent';
  const readiness = [
    ['After checkout', 'Passage opens the right workspace so next step, owner, and proof stay together.'],
    ['Nothing sends yet', 'Invites, packets, emails, and texts stay in review until someone chooses the exact action.'],
    ['Start small', 'Begin with one family record. Add people, documents, and provider handoffs when they matter.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignIn={!user ? signIn : null} onSignOut={user ? signOut : null} />
      <style>{`
        @media (max-width: 720px) {
          .pricing-hero-grid,
          .pricing-plan-grid,
          .pricing-option-grid {
            grid-template-columns: 1fr !important;
          }
          .pricing-page-section {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          .pricing-group-tabs {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .pricing-group-tabs button {
            flex: 1 0 auto;
          }
          .pricing-readiness-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <section className="pricing-page-section" style={{ maxWidth: 1080, margin: '0 auto', padding: '4px 22px 8px' }}>
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 13, boxShadow: '0 10px 28px rgba(55,45,35,.04)', display: 'grid', gridTemplateColumns: 'minmax(0,.68fr) minmax(360px,.92fr)', gap: 13, alignItems: 'start' }} className="pricing-hero-grid">
          <div style={{ alignSelf: 'center' }}>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>Pricing</div>
            <h1 style={{ fontSize: 'clamp(30px, 3.55vw, 44px)', lineHeight: .98, margin: '0 0 7px', fontWeight: 400 }}>Choose the plan that protects your family.</h1>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.36, margin: 0, maxWidth: 560 }}>Start urgent if someone just passed. Plan ahead by choosing the number of family records you need.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 6, marginTop: 10 }}>
              {[['urgent', 'Urgent help'], ...groups.map(g => [g.key, g.label])].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setActiveChoice(key)} style={{ border: `1px solid ${activeChoice === key ? (key === 'urgent' ? C.rose : C.sage) + '55' : C.border}`, background: activeChoice === key ? (key === 'urgent' ? C.roseFaint : C.sageFaint) : C.bg, color: activeChoice === key ? (key === 'urgent' ? C.rose : C.sage) : C.mid, borderRadius: 11, minHeight: 36, padding: '0 11px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', textAlign: 'left' }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 5, marginTop: 10 }}>
              {readiness.map(([label, body]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '108px minmax(0,1fr)', gap: 8, color: C.mid, fontSize: 12, lineHeight: 1.28 }}>
                  <strong style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</strong>
                  <span>{body}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: showingUrgent ? C.roseFaint : C.sageFaint, border: `1px solid ${(showingUrgent ? C.rose : C.sage)}35`, borderRadius: 17, padding: 14, display: 'flex', flexDirection: 'column', minHeight: 0, alignSelf: 'start' }}>
            {showingUrgent ? (
              <>
                <div style={{ fontSize: 11, color: C.rose, textTransform: 'uppercase', letterSpacing: '.17em', fontWeight: 900, marginBottom: 6 }}>Someone just passed</div>
                <div style={{ fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: .98, marginBottom: 7 }}>Get help now.</div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.34, marginBottom: 9 }}>A first-24-hours command center for calls, family notifications, owners, and proof.</div>
                <div style={{ display: 'grid', gap: 5, marginBottom: 10 }}>
                  {['Open one urgent family record', 'Choose the next call or waiting point', 'Review before anything sends'].map(item => (
                    <div key={item} style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.25, display: 'flex', gap: 7, alignItems: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: C.rose, opacity: .65, flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
                <button disabled={busy === 'urgent'} onClick={() => checkout('urgent')} style={{ width: '100%', border: selectedPlan === 'urgent' ? `2px solid ${C.ink}` : 'none', borderRadius: 13, padding: '12px 16px', background: C.rose, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', fontSize: 16 }}>
                  {busy === 'urgent' ? 'Opening checkout...' : 'Get help now \u2192 $79'}
                </button>
              </>
            ) : (
              <>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Planning ahead</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 13 }}>
                  <div>
                    <div style={{ fontSize: 30, lineHeight: 1.05 }}>{activeGroup.label}</div>
                    <div style={{ color: C.sage, fontSize: 13, fontWeight: 900, marginTop: 4 }}>{activeGroup.seats}</div>
                    <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.45, marginTop: 7 }}>{activeGroup.desc}</div>
                  </div>
                </div>
                <div className="pricing-option-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginTop: 18 }}>
                  {activeGroup.options.map(([id, label, price, per]) => (
                    <button key={id} disabled={busy === id} onClick={() => checkout(id)} style={{ textAlign: 'left', border: `1px solid ${selectedPlan === id ? C.sage : C.border}`, background: selectedPlan === id ? C.sageFaint : '#fff', borderRadius: 15, padding: 15, cursor: 'pointer', fontFamily: 'Georgia,serif', minHeight: 126 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 9 }}>{label}</div>
                      {participantDiscount ? (
                        <>
                          <div style={{ color: C.soft, fontSize: 15, textDecoration: 'line-through', marginBottom: 4 }}>{price}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 29, color: C.ink, fontWeight: 900, lineHeight: 1 }}>{discountedPrice(price, id)}</span>
                            <span style={{ color: C.sage, fontSize: 12, fontWeight: 900 }}>{participantRateLabel(id)}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 31, color: C.ink, fontWeight: 900, lineHeight: 1 }}>{price}</div>
                      )}
                      <div style={{ color: C.mid, fontSize: 12, marginTop: 5 }}>{busy === id ? 'Opening checkout...' : per}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {!user && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 14, padding: '11px 13px', marginBottom: 12, color: C.mid, fontSize: 13, lineHeight: 1.45 }}>
            <strong style={{ color: C.sage }}>Sign in once to checkout.</strong> Use the sign-in button above. Passage saves the plan to your estate workspace.
          </div>
        )}

        {participantDiscount && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 14, padding: 13, marginBottom: 12, color: C.mid, fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: C.sage }}>Participant pricing:</strong> monthly plans show the 25% participant rate; annual plans show the 20% participant rate.
          </div>
        )}

        <div style={{ marginTop: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: '9px 11px', color: C.mid, fontSize: 12, lineHeight: 1.35 }}>
          Add-on estates become available after an active paid subscription. Urgent coordination stays separate at $79 per case.
        </div>

        {message && (
          <div style={{ marginTop: 12, color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 13, padding: 13, fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{message}</span>
            {!user && <button onClick={signIn} style={smallButton(C.rose)}>Sign in to continue</button>}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function smallButton(background) {
  return { border: 'none', borderRadius: 10, padding: '9px 12px', background, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' };
}
