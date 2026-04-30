import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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

  useEffect(() => {
    setParticipantDiscount(new URLSearchParams(window.location.search).get('participant') === '1');
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/pricing` } });
  }

  async function checkout(planId) {
    if (!user) {
      setMessage('Sign in first so Passage can attach the plan to your estate workspace.');
      return;
    }
    setBusy(planId);
    setMessage('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <nav style={{ maxWidth: 1060, margin: '0 auto', padding: '22px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: C.ink, textDecoration: 'none', fontSize: 24, fontWeight: 700 }}>Passage</Link>
        <div style={{ display: 'flex', gap: 14, fontSize: 13, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link href="/mission" style={{ color: C.mid, textDecoration: 'none' }}>Mission</Link>
          <Link href="/content" style={{ color: C.mid, textDecoration: 'none' }}>Resources</Link>
          <Link href="/contact" style={{ color: C.mid, textDecoration: 'none' }}>Contact</Link>
          {!user && <button onClick={signIn} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 10, padding: '8px 14px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>}
        </div>
      </nav>

      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '58px 22px 84px' }}>
        <div style={{ maxWidth: 760, marginBottom: 26 }}>
          <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14 }}>Pricing</div>
          <h1 style={{ fontSize: 48, lineHeight: 1.08, margin: '0 0 14px', fontWeight: 400 }}>Choose the plan that can carry your family.</h1>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.75, margin: 0 }}>Start with one trial estate to see how Passage feels. When you are ready, choose the number of estates your family needs protected. Urgent coordination stays separate at $79.99 per case.</p>
        </div>

        {participantDiscount && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}35`, borderRadius: 16, padding: 16, marginBottom: 18, color: C.mid, fontSize: 14, lineHeight: 1.7 }}>
            <strong style={{ color: C.sage }}>Participant pricing:</strong> if a participant discount is configured, Stripe will apply it automatically to eligible planning subscriptions at checkout. Urgent coordination and add-on estates stay separate.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(310px, 100%), 1fr))', gap: 14, marginBottom: 22 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 12, color: C.sage, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 800, marginBottom: 8 }}>Planning ahead</div>
            <div style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 8 }}>Start with one trial estate. Pick a plan when your family is ready.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.7 }}>Good for proactive planning, spouses, parents, and multi-estate families who want the system set before it is needed.</div>
          </div>
          <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 12, color: C.rose, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 800, marginBottom: 8 }}>Someone just passed</div>
            <div style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 8 }}>$79.99 urgent estate coordination</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.7 }}>A focused first-24-hours command center. Passage will match 15% toward a grief-support or memorial-impact donation.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {groups.map(group => (
            <section key={group.key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{group.label}</div>
                  <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.6 }}>{group.desc}</div>
                </div>
                <span style={{ color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '5px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{group.seats}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {group.options.map(([id, label, price, per]) => {
                  const disabled = price === 'Not offered';
                  return (
                  <button key={id} disabled={disabled || busy === id} onClick={() => !disabled && checkout(id)} style={{ ...moneyButtonStyle(false), opacity: disabled ? .55 : 1, cursor: disabled ? 'default' : 'pointer' }}>
                    <div style={{ fontSize: 12, color: C.soft, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 24, color: C.ink, fontWeight: 800 }}>{price}</div>
                    <div style={{ fontSize: 12, color: C.mid }}>{busy === id ? 'Opening checkout...' : per}</div>
                  </button>
                )})}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, color: C.mid, fontSize: 13.5, lineHeight: 1.75 }}>
          <strong style={{ color: C.ink }}>Add-on estates:</strong> available only after an active paid subscription, planned at $4.99/month or $39.99/year per additional estate. If a subscription is cancelled or past due, new add-ons stay hidden until access is active again.
        </div>
        {message && <div style={{ marginTop: 14, color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 13, padding: 14, fontSize: 13 }}>{message}</div>}
      </section>
    </main>
  );
}
