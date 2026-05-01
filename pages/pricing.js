import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

const groups = [
  { key: 'individual', label: 'Individual', seats: '1 estate', desc: 'For your own plan or one parent.', options: [
    ['single_monthly', 'Monthly', '$9.99', '/mo'],
    ['single_annual', 'Annual', '$79.99', '/yr'],
  ] },
  { key: 'couple', label: 'Couple', seats: '2 estates', desc: 'For spouses, partners, or two parents.', options: [
    ['couple_monthly', 'Monthly', '$14.99', '/mo'],
    ['couple_annual', 'Annual', '$119.99', '/yr'],
  ] },
  { key: 'family', label: 'Family', seats: '5 estates', desc: 'For adult children coordinating a wider family.', options: [
    ['family_monthly', 'Monthly', '$24.99', '/mo'],
    ['family_annual', 'Annual', '$199.99', '/yr'],
  ] },
];

function moneyButtonStyle(active) {
  return {
    textAlign: 'left',
    border: `1px solid ${active ? C.sage : C.border}`,
    background: active ? C.sageFaint : C.card,
    borderRadius: 13,
    padding: 14,
    fontFamily: 'Georgia,serif',
    cursor: 'pointer',
    minHeight: 92,
  };
}

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [participantDiscount, setParticipantDiscount] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

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
      setMessage(planId === 'urgent' ? 'Sign in first so Passage can open the urgent command center for you.' : 'Sign in first so Passage can attach the plan to your estate workspace.');
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

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignIn={!user ? signIn : null} onSignOut={user ? signOut : null} />

      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '12px 22px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 390px)', gap: 14, alignItems: 'end', marginBottom: 12 }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Pricing</div>
          <h1 style={{ fontSize: 'clamp(28px, 3.2vw, 36px)', lineHeight: 1.04, margin: '0 0 8px', fontWeight: 400 }}>Choose the plan that can carry your family.</h1>
          <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.5, margin: 0 }}>Start with one trial estate. When you are ready, choose the number of estates your family needs protected.</p>
        </div>
        <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}35`, borderRadius: 18, padding: 16, boxShadow: '0 14px 38px rgba(80,45,45,.06)' }}>
          <div style={{ fontSize: 10.5, color: C.rose, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 800, marginBottom: 7 }}>Someone just passed</div>
          <div style={{ fontSize: 23, lineHeight: 1.12, marginBottom: 7 }}>Get immediate help now - $79</div>
          <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>A focused first-24-hours command center for calls, family notifications, owners, and proof.</div>
          <button disabled={busy === 'urgent'} onClick={() => checkout('urgent')} style={{ width: '100%', border: selectedPlan === 'urgent' ? `2px solid ${C.ink}` : 'none', borderRadius: 12, padding: '12px 14px', background: C.rose, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>
            {busy === 'urgent' ? 'Opening checkout...' : 'Someone just passed - start now'}
          </button>
        </div>
        </div>

        {participantDiscount && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 16, padding: 16, marginBottom: 18, color: C.mid, fontSize: 14, lineHeight: 1.7 }}>
            <strong style={{ color: C.sage }}>Participant pricing:</strong> choose the planning subscription that fits your family. Monthly participant plans use the 20% code and annual participant plans use the 25% code when the matching Stripe promotion is configured. Checkout will also show a promo-code field if you need to enter a code manually.
          </div>
        )}

        {!user && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 14, padding: '12px 14px', marginBottom: 12, color: C.mid, fontSize: 13, lineHeight: 1.45, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span><strong style={{ color: C.sage }}>Sign in once to checkout.</strong> Passage attaches the plan to your estate workspace.</span>
            <button onClick={signIn} style={{ border: 'none', borderRadius: 10, padding: '9px 12px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in to continue</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(310px, 100%), 1fr))', gap: 10, marginBottom: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 12, color: C.sage, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 800, marginBottom: 8 }}>Planning ahead</div>
            <div style={{ fontSize: 20, lineHeight: 1.18, marginBottom: 6 }}>Start with one trial estate. Pick a plan when your family is ready.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>For proactive planning, spouses, parents, and multi-estate families.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {groups.map(group => (
            <section key={group.key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{group.label}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45 }}>{group.desc}</div>
                </div>
                <span style={{ color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '5px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{group.seats}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {group.options.map(([id, label, price, per]) => {
                  const disabled = price === 'Not offered';
                  return (
                  <button key={id} disabled={disabled || busy === id} onClick={() => !disabled && checkout(id)} style={{ ...moneyButtonStyle(selectedPlan === id), opacity: disabled ? .55 : 1, cursor: disabled ? 'default' : 'pointer' }}>
                    <div style={{ fontSize: 12, color: C.soft, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 24, color: C.ink, fontWeight: 800 }}>{price}</div>
                    <div style={{ fontSize: 12, color: C.mid }}>{busy === id ? 'Opening checkout...' : per}</div>
                  </button>
                )})}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, color: C.mid, fontSize: 13, lineHeight: 1.55 }}>
          <strong style={{ color: C.ink }}>Add-on estates:</strong> available only after an active paid subscription, planned at $4.99/month or $39.99/year per additional estate. If a subscription is cancelled or past due, new add-ons stay hidden until access is active again.
        </div>
        {message && (
          <div style={{ marginTop: 14, color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 13, padding: 14, fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{message}</span>
            {!user && <button onClick={signIn} style={{ border: 'none', borderRadius: 10, padding: '9px 12px', background: C.rose, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in to continue</button>}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
