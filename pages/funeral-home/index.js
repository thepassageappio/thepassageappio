// Passage — funeral-home B2B marketing page (rendered at "/funeral-home").
// Full UX + visual redesign onto the calm design system, matching the homepage
// (components/HomeCalm.js). Shares the calm header/footer + hc-* style language
// via components/calm/CalmPublicChrome. This is the primary B2B conversion
// target: the homepage hero "For funeral homes" links here.
//
// PRESERVED from the legacy page:
//   • SEO: PAGE_META['/funeral-home'] in pages/_app.js (pathname-based) is
//     unchanged, so title/description/canonical carry over automatically.
//   • Routes/CTAs: /funeral-home/setup, /funeral-home/login,
//     /funeral-home/sample-case, /pricing, the Calendly/contact walkthrough,
//     and the /api/checkout flow for signed-in customers.
//   • Analytics: funeral_home_cta_clicked, funeral_home_plan_start_clicked,
//     funeral_home_plan_cta_clicked.
//   • Auth slot behavior (supabase session) drives sign-in vs. workspace links.
//
// ROLLBACK SEAM: visiting /funeral-home?legacy=1 renders the extracted legacy
// page (components/funeralHome/FuneralHomeLegacy) so rollback is per-page. The
// flag is read in an effect (SSR-safe); the redesign is the default render.
import { useEffect, useState } from 'react';
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { supabase } from '../../lib/supabaseBrowser';
import { calendlyUrl } from '../../lib/scheduling';
import { trackEvent } from '../../lib/trackEvent';
import CalmPublicChrome, { cssType } from '../../components/calm/CalmPublicChrome';
import FuneralHomeLegacy from '../../components/funeralHome/FuneralHomeLegacy';
import {
  FH_BENEFITS,
  FH_STEPS,
  FH_TRUST,
  FH_CASE_PREVIEW,
} from '../../components/funeralHome/FuneralHomeData';

// Plan tiers preserved from the legacy page so signed-in checkout still works.
const PLANS = [
  ['Starter rollout', '$99.99/mo', 'after first 3 months', 'Guided setup on a small set of real cases, a co-branded family view, and the director workspace.', 'Start guided rollout'],
  ['Local account', '$249.99/mo', '', 'Unlimited active cases, staff queues, approved family updates, the full proof trail, and exports.', 'Compare fit'],
  ['Group account', '$349.99/mo', '', 'Multi-location controls, reporting, role scopes, onboarding support, and priority workflow setup.', 'Talk to Passage'],
];

function planForTier(index) {
  return index === 0 ? 'partner_pilot' : index === 1 ? 'partner_local' : 'partner_group';
}

const publicPlanLabels = {
  partner_pilot: 'starter rollout',
  partner_local: 'local account',
  partner_group: 'group account',
};

function contactHref(planId) {
  return calendlyUrl({ source: `Funeral home page - ${publicPlanLabels[planId] || 'guided rollout'}` });
}

export default function FuneralHomePage() {
  const [session, setSession] = useState(null);
  const [legacy, setLegacy] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // SSR-safe: read auth session + the ?legacy=1 rollback flag only in effects.
  useEffect(() => {
    let active = true;
    supabase?.auth?.getSession?.()
      .then(({ data }) => { if (active) setSession(data?.session || null); })
      .catch(() => {});
    const sub = supabase?.auth?.onAuthStateChange?.((_e, s) => setSession(s || null));
    return () => { active = false; sub?.data?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setLegacy(params.get('legacy') === '1');
    } catch { /* noop */ }
  }, []);

  const user = session?.user || null;

  async function startCheckout(planId) {
    trackEvent('funeral_home_plan_start_clicked', { planId, signedIn: Boolean(user) });
    setError('');
    if (!user) {
      if (typeof window !== 'undefined') window.location.href = contactHref(planId);
      return;
    }
    setBusy(planId);
    if (!supabase?.auth) {
      setError('Sign-in is not configured in this environment.');
      setBusy('');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ planId, userId: user.id, userEmail: user.email }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) {
      setError(json.error || 'Could not start checkout.');
      return;
    }
    if (typeof window !== 'undefined') window.location.href = json.url;
  }

  // Rollback seam: render the preserved legacy page unchanged.
  if (legacy) return <FuneralHomeLegacy />;

  const walkthroughHref = calendlyUrl({ source: 'Funeral home walkthrough' });

  function goWalkthrough(e) {
    trackEvent('funeral_home_cta_clicked', { label: 'Book walkthrough', href: walkthroughHref });
    // Allow the native anchor (new tab) to proceed.
    void e;
  }

  return (
    <CalmPublicChrome session={session}>
      <style>{`
        /* Funeral-home page-scoped layout on top of the shared hc-* language. */
        .fhx-hero { padding-top: 40px; padding-bottom: 44px; }
        .fhx-hero-grid { display: grid; gap: 28px; align-items: start;
          grid-template-columns: minmax(0, 1.15fr) minmax(min(100%, 320px), 0.85fr); }
        .fhx-hero-copy { min-width: 0; max-width: 640px; }
        .fhx-h1 { font-size: clamp(34px, 6.2vw, 56px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; color: ${DS.color.ink}; margin: 0 0 18px; }
        .fhx-lede { font-size: clamp(16px, 2.2vw, 19px); line-height: 1.55; color: ${DS.color.mid}; margin: 0; max-width: 600px; }

        /* Hero proof panel — a calm "what a case shows" preview. */
        .fhx-proof { min-width: 0; box-sizing: border-box; background: ${DS.color.card}; border: 1px solid ${DS.color.hair}; border-radius: ${DS.radius.xl}px; padding: 22px; box-shadow: ${DS.shadow.card}; }
        .fhx-proof-kicker { ${cssType(TYPE.label)} color: ${DS.color.sage}; margin: 0 0 6px; }
        .fhx-proof-head { ${cssType(TYPE.h1)} font-size: 18px; color: ${DS.color.ink}; margin: 0 0 14px; }
        .fhx-case { box-sizing: border-box; background: ${DS.color.sageFaint}; border: 1px solid ${DS.color.sage}44; border-radius: ${DS.radius.lg}px; padding: 16px; }
        .fhx-case-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .fhx-case-name { ${cssType(TYPE.h2)} font-size: 16px; color: ${DS.color.ink}; margin: 0; min-width: 0; }
        .fhx-pill { flex: 0 0 auto; ${cssType(TYPE.label)} letter-spacing: .04em; color: ${DS.color.sageDeep}; background: ${DS.color.card}; border: 1px solid ${DS.color.sage}55; border-radius: ${DS.radius.pill}px; padding: 5px 10px; white-space: nowrap; }
        .fhx-case-row { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 10px; padding: 9px 0; border-top: 1px solid ${DS.color.sage}33; }
        .fhx-case-row:first-of-type { border-top: 0; }
        .fhx-case-label { ${cssType(TYPE.label)} font-size: 10px; color: ${DS.color.sageDeep}; align-self: start; }
        .fhx-case-value { ${cssType(TYPE.small)} color: ${DS.color.mid}; line-height: 1.45; min-width: 0; }
        .fhx-proof-note { ${cssType(TYPE.small)} color: ${DS.color.soft}; line-height: 1.5; margin: 14px 0 0; }

        /* Plan cards reuse hc-card; add price emphasis + a button row. */
        .fhx-plan { display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
        .fhx-plan-price { font-size: 26px; font-weight: 700; letter-spacing: -0.01em; color: ${DS.color.ink}; margin: 6px 0 2px; line-height: 1.05; }
        .fhx-plan-when { ${cssType(TYPE.small)} color: ${DS.color.soft}; margin: 0 0 6px; }
        .fhx-error { box-sizing: border-box; margin-top: 16px; background: ${DS.color.roseFaint}; border: 1px solid ${DS.color.rose}55; border-radius: ${DS.radius.md}px; padding: 12px 14px; ${cssType(TYPE.small)} color: #8a3a3a; }

        @media (max-width: 860px) {
          .fhx-hero-grid { grid-template-columns: 1fr; gap: 24px; }
        }
        @media (max-width: 680px) {
          .fhx-case-row { grid-template-columns: 1fr; gap: 3px; }
          .fhx-hero { padding-top: 28px; padding-bottom: 32px; }
        }
      `}</style>

      <main>
        {/* Hero — confident B2B value prop + one primary path (start setup). */}
        <section className="hc-wrap fhx-hero">
          <div className="fhx-hero-grid">
            <div className="fhx-hero-copy">
              <p className="hc-eyebrow">For funeral homes</p>
              <h1 className="fhx-h1">Every family, every case, calmly under control.</h1>
              <p className="fhx-lede">
                Passage is the family-coordination layer that sits on top of how your
                house already works &mdash; so no detail slips, families stay informed,
                and your team always knows the next step, who owns it, and what&rsquo;s waiting.
              </p>

              <div className="hc-actions">
                <a
                  href="/funeral-home/setup"
                  className="hc-btn hc-btn-primary"
                  onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'Start setup', href: '/funeral-home/setup' })}
                >
                  Get started
                </a>
                <a
                  href="/funeral-home/sample-case"
                  className="hc-btn hc-btn-secondary"
                  onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'See sample case', href: '/funeral-home/sample-case' })}
                >
                  See a sample case
                </a>
                <a
                  href="/funeral-home/login"
                  className="hc-btn hc-btn-secondary"
                  onClick={() => trackEvent('funeral_home_cta_clicked', { label: 'Sign in', href: '/funeral-home/login' })}
                >
                  Sign in
                </a>
              </div>

              <p className="hc-reassure">
                Prefer a guided look first?{' '}
                <a
                  href={walkthroughHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={goWalkthrough}
                  style={{ color: DS.color.sageDeep, fontWeight: 600 }}
                >
                  Book a walkthrough
                </a>{' '}
                &mdash; no commitment, no system changes.
              </p>
            </div>

            {/* Proof panel — concrete "what a case shows". */}
            <aside className="fhx-proof" aria-label="What a case shows">
              <p className="fhx-proof-kicker">What a case shows</p>
              <p className="fhx-proof-head">The next step, the owner, the waiting point, the proof.</p>
              <div className="fhx-case">
                <div className="fhx-case-top">
                  <p className="fhx-case-name">{FH_CASE_PREVIEW.name}</p>
                  <span className="fhx-pill">{FH_CASE_PREVIEW.status}</span>
                </div>
                {FH_CASE_PREVIEW.rows.map(([label, value]) => (
                  <div className="fhx-case-row" key={label}>
                    <span className="fhx-case-label">{label}</span>
                    <span className="fhx-case-value">{value}</span>
                  </div>
                ))}
              </div>
              <p className="fhx-proof-note">
                A useful case always says what&rsquo;s happening, who owns it,
                what it&rsquo;s waiting on, and what proof exists.
              </p>
            </aside>
          </div>
        </section>

        {/* Outcome benefits — director priorities reframed as relief. */}
        <section className="hc-wrap hc-section">
          <div className="hc-section-head">
            <p className="hc-kicker">Why funeral homes choose Passage</p>
            <h2 className="hc-h2">Less chasing. Better handoffs. A record you can trust.</h2>
            <p className="hc-sub">
              Passage isn&rsquo;t a public directory and it won&rsquo;t replace your
              case-management system. It keeps people, tasks, updates, and proof
              from scattering across calls, inboxes, and memory.
            </p>
          </div>
          <div className="hc-grid hc-grid-2">
            {FH_BENEFITS.map((b) => (
              <div className="hc-card" key={b.id}>
                <h3 className="hc-card-title">{b.title}</h3>
                <p className="hc-card-body">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it fits / onboarding. */}
        <section className="hc-wrap hc-section">
          <div className="hc-section-head">
            <p className="hc-kicker">How it fits your house</p>
            <h2 className="hc-h2">Start small, change nothing you trust</h2>
            <p className="hc-sub">
              Passage adds the coordination layer most houses are missing &mdash;
              without asking you to rip out the tools your team already relies on.
            </p>
          </div>
          <div className="hc-grid hc-grid-3">
            {FH_STEPS.map((s) => (
              <div className="hc-card" key={s.id}>
                <h3 className="hc-card-title">{s.num}. {s.title}</h3>
                <p className="hc-card-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans — preserves checkout + plan analytics. */}
        <section className="hc-wrap hc-section">
          <div className="hc-section-head">
            <p className="hc-kicker">Plans</p>
            <h2 className="hc-h2">Simple plans that grow with you</h2>
            <p className="hc-sub">
              Begin with a guided rollout on a few real cases. When your team trusts
              the flow, expand locations, seats, and reporting.
            </p>
          </div>
          <div className="hc-grid hc-grid-3">
            {PLANS.map(([name, price, when, detail, cta], index) => {
              const planId = planForTier(index);
              return (
                <div className="hc-card fhx-plan" key={name}>
                  <div>
                    <p className="hc-kicker" style={{ marginBottom: 4 }}>{name}</p>
                    <p className="fhx-plan-price">{price}</p>
                    {when ? <p className="fhx-plan-when">{when}</p> : null}
                    <p className="hc-card-body" style={{ marginTop: 6 }}>{detail}</p>
                  </div>
                  <a
                    href={contactHref(planId)}
                    className={`hc-btn ${index === 0 ? 'hc-btn-primary' : 'hc-btn-secondary'}`}
                    style={{ width: '100%' }}
                    onClick={(event) => {
                      trackEvent('funeral_home_plan_cta_clicked', { planId, signedIn: Boolean(user) });
                      if (!user) return; // let the anchor route to the walkthrough/contact
                      event.preventDefault();
                      startCheckout(planId);
                    }}
                  >
                    {busy === planId ? 'Starting…' : cta}
                  </a>
                </div>
              );
            })}
          </div>
          {error ? <div className="fhx-error" role="alert">{error}</div> : null}
        </section>

        {/* Trust / proof band + final CTA. */}
        <section className="hc-wrap hc-section">
          <div className="hc-trust">
            <p className="hc-trust-kicker">See it for yourself</p>
            <h2 className="hc-trust-h2">Look inside before you commit</h2>
            <p className="hc-trust-sub">
              No sign-up and no sales call required. Walk through a real coordination
              record and see exactly how Passage keeps families informed without
              ever oversharing.
            </p>
            <div className="hc-trust-grid">
              {FH_TRUST.map((t) => (
                <a
                  key={t.id}
                  href={t.href}
                  className="hc-trust-card"
                  onClick={() => trackEvent(t.event, { label: t.eventLabel, href: t.href })}
                >
                  <span className="hc-trust-label">
                    {t.label}
                    <span aria-hidden="true" className="hc-persona-arrow" style={{ color: '#b9d2bd' }}>&rsaquo;</span>
                  </span>
                  <span className="hc-trust-body">{t.body}</span>
                </a>
              ))}
            </div>
            <div className="hc-pledge">
              <strong>Ready when you are.</strong>{' '}
              Create your workspace and bring in a few real cases, or{' '}
              <a href={walkthroughHref} target="_blank" rel="noreferrer" onClick={goWalkthrough} style={{ color: '#fff', fontWeight: 600 }}>book a walkthrough</a>{' '}
              and we&rsquo;ll set it up with you.
            </div>
          </div>
        </section>
      </main>
    </CalmPublicChrome>
  );
}
