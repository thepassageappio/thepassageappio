import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [participantDiscount, setParticipantDiscount] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [activeGroup, setActiveGroup] = useState('individual');

  useEffect(() => {
    setParticipantDiscount(new URLSearchParams(window.location.search).get('participant') === '1');
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/pricing${participantDiscount ? '?participant=1' : ''}` } });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setMessage('');
    setSelectedPlan('');
  }

  async function checkout(planId) {
    setSelectedPlan(planId);
    if (!user) {
      setMessage(planId === 'urgent' ? 'Sign in once so Passage can open the urgent command center for you.' : 'Sign in once so Passage can attach the plan to your estate workspace.');
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
        body: JSON.stringify({ planId, userId: user.id, userEmail: user.email, participantDiscount }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Checkout could not be started.');
      window.location.href = data.url;
    } catch (err) {
      setMessage(err.message || 'Checkout could not be started.');
    } finally {
      setBusy('');
    }
  }

  const group = groups.find(g => g.key === activeGroup) || groups[0];

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignIn={!user ? signIn : null} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '12px 22px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .72fr) minmax(360px, 1fr)', gap: 14, alignItems: 'stretch', marginBottom: 12 }}>
          <div style={{ alignSelf: 'center' }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Pricing</div>
            <h1 style={{ fontSize: 'clamp(30px, 3.7vw, 42px)', lineHeight: 1.02, margin: '0 0 8px', fontWeight: 400 }}>Choose the plan that protects your family.</h1>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.5, margin: 0 }}>Start with one trial estate. Upgrade when you are ready for full orchestration.</p>
          </div>
          <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}45`, borderRadius: 22, padding: 18, boxShadow: '0 18px 48px rgba(80,45,45,.08)' }}>
            <div style={{ fontSize: 11, color: C.rose, textTransform: 'uppercase', letterSpacing: '.16em', fontWeight: 900, marginBottom: 7 }}>Someone just passed</div>
            <div style={{ fontSize: 'clamp(30px, 3.6vw, 42px)', lineHeight: 1.02, marginBottom: 8 }}>Get immediate help now.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.45, marginBottom: 13 }}>A first-24-hours command center for calls, family notifications, owners, and proof.</div>
            <button disabled={busy === 'urgent'} onClick={() => checkout('urgent')} style={{ width: '100%', border: selectedPlan === 'urgent' ? `2px solid ${C.ink}` : 'none', borderRadius: 14, padding: '15px 16px', background: C.rose, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', fontSize: 17 }}>
              {busy === 'urgent' ? 'Opening checkout...' : 'Someone just passed - $79'}
            </button>
          </div>
        </div>

        {!user && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 14, padding: '11px 13px', marginBottom: 12, color: C.mid, fontSize: 13, lineHeight: 1.45 }}>
            <strong style={{ color: C.sage }}>Sign in once to checkout.</strong> Use the sign-in button above. Passage saves the plan to your estate workspace.
          </div>
        )}

        {participantDiscount && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 14, padding: 13, marginBottom: 12, color: C.mid, fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: C.sage }}>Participant pricing:</strong> eligible participant plans apply the configured Stripe discount at checkout.
          </div>
        )}

        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, boxShadow: '0 14px 38px rgba(55,45,35,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 5 }}>Planning ahead</div>
              <div style={{ fontSize: 22, lineHeight: 1.15 }}>Pick the number of estates.</div>
            </div>
            <div style={{ display: 'flex', gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 4 }}>
              {groups.map(g => (
                <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{ border: 'none', borderRadius: 10, padding: '8px 11px', background: activeGroup === g.key ? C.sage : 'transparent', color: activeGroup === g.key ? '#fff' : C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', fontSize: 12.5 }}>{g.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.55fr) minmax(0,1fr)', gap: 12, alignItems: 'stretch' }}>
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}25`, borderRadius: 15, padding: 14 }}>
              <div style={{ fontSize: 21, fontWeight: 800 }}>{group.label}</div>
              <div style={{ color: C.sage, fontSize: 12.5, fontWeight: 800, margin: '4px 0 8px' }}>{group.seats}</div>
              <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.55 }}>{group.desc}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              {group.options.map(([id, label, price, per]) => (
                <button key={id} disabled={busy === id} onClick={() => checkout(id)} style={{ textAlign: 'left', border: `1px solid ${selectedPlan === id ? C.sage : C.border}`, background: selectedPlan === id ? C.sageFaint : '#fff', borderRadius: 15, padding: 15, cursor: 'pointer', fontFamily: 'Georgia,serif', minHeight: 112 }}>
                  <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 9 }}>{label}</div>
                  <div style={{ fontSize: 29, color: C.ink, fontWeight: 900, lineHeight: 1 }}>{price}</div>
                  <div style={{ color: C.mid, fontSize: 12, marginTop: 5 }}>{busy === id ? 'Opening checkout...' : per}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: 13, color: C.mid, fontSize: 13, lineHeight: 1.5 }}>
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
