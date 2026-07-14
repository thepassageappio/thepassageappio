// Passage — funeral-home B2B marketing page (rendered at "/funeral-home").
// Full UX + visual redesign onto the calm design system, matching the homepage
// (components/HomeCalm.js). Shares the calm header/footer + hc-* style language
// via components/calm/CalmPublicChrome. This is the primary B2B conversion
// target: the homepage hero "For funeral homes" links here.
//
// Threshold re-skin (2026-07-14): components/calm/CalmPublicChrome.js is NOT
// edited here -- it is also used by the homepage (components/HomeCalm.js), so a
// direct edit would silently re-skin the homepage too (the exact risk flagged in
// docs/redesign/12-threshold-rollout-tracker.md for this file). Instead, every
// hc-* class this page renders (header/footer/hero/section/card/trust) is
// overridden with a page-scoped <style> block (the same RawStyle mechanism this
// file already used for its own fhx-* classes) using Threshold bone/pine/clay
// tokens per docs/redesign/08-visual-craft-standard.md. Because that <style> tag
// is part of this page's own React tree, it mounts/unmounts with the page and
// never bleeds onto any other page that also uses CalmPublicChrome (e.g. the
// homepage) -- the same reasoning already proven safe by the prior fhx-*
// pattern on this file, just extended to cover the shared classes too. Zero
// state, effect, handler, route, or analytics changes.
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
import { supabase } from '../../lib/supabaseBrowser';
import { calendlyUrl } from '../../lib/scheduling';
import { trackEvent } from '../../lib/trackEvent';
import CalmPublicChrome, { RawStyle } from '../../components/calm/CalmPublicChrome';
import FuneralHomeLegacy from '../../components/funeralHome/FuneralHomeLegacy';
import {
  FH_BENEFITS,
  FH_STEPS,
  FH_TRUST,
  FH_CASE_PREVIEW,
} from '../../components/funeralHome/FuneralHomeData';

// Threshold tokens (docs/redesign/08-visual-craft-standard.md), same hex values
// already shipped on components/SiteChrome.js and every re-skinned page (e.g.
// pages/trust.js) so this page stays visually consistent with the rest of the
// site. Scoped to this file only -- lib/designSystem.js (the pre-Threshold
// sage/cream tokens CalmPublicChrome itself still uses) is deliberately left
// untouched, per the note above.
const T = {
  bg: '#FBF8F3',
  card: '#FEFDFB',
  ink: '#1C1917',
  mid: '#5A5348',
  soft: '#9A9081',
  border: '#E6DDCB',
  pine: '#245A4B',
  pineDeep: '#153A31',
  pineFaint: '#F2F6F3',
  clay: '#9A4F26',
  clayDeep: '#7A3D1C',
  clayFaint: '#F5E4D6',
  rose: '#B5622F',
  roseFaint: '#FBF0E7',
};

const BODY_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MOMENT_FONT = "'Fraunces', serif";
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');";

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
  const pageCss = `
        ${FONT_IMPORT}

        /* ---- Threshold overrides for the shared hc-* chrome/section language ----
           Page-scoped on purpose: this <style> tag lives inside this page's own
           React tree (mounted by CalmPublicChrome's {children}), so it only exists
           in the DOM while /funeral-home is the active route and never touches
           any other page that also uses CalmPublicChrome (e.g. the homepage). */
        .hc-root { background: ${T.bg}; color: ${T.ink}; font-family: ${BODY_FONT}; }

        .hc-header { padding-top: 20px; padding-bottom: 14px; }
        .hc-logo { color: ${T.pine}; font-weight: 700; }
        .hc-navlink { color: ${T.mid}; border-radius: 999px; }
        .hc-navlink:hover { color: ${T.ink}; }
        .hc-auth-link { color: ${T.pine}; }
        .hc-signin { color: ${T.pine}; background: ${T.card}; border: 1px solid ${T.border}; border-radius: 999px; box-shadow: 0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03); }
        .hc-signin:hover { background: ${T.pineFaint}; }

        .hc-hero { padding-top: 40px; padding-bottom: 44px; }
        .hc-eyebrow { color: ${T.pine}; font-family: ${BODY_FONT}; }
        .hc-h1 { font-family: ${MOMENT_FONT}; font-weight: 440; letter-spacing: -0.018em; color: ${T.ink}; }
        .hc-lede { color: ${T.mid}; }
        .hc-actions { margin-top: 30px; }
        .hc-btn { border-radius: 999px; font-family: ${BODY_FONT}; transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1), background .2s ease; }
        .hc-btn-primary { background: linear-gradient(155deg, ${T.pine}, ${T.pineDeep}); color: #fff; border: none; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 8px 16px -6px rgba(20,30,25,.35); }
        .hc-btn-primary:hover { background: linear-gradient(155deg, ${T.pine}, ${T.pineDeep}); transform: translateY(-1px); box-shadow: 0 2px 4px rgba(20,30,25,.18), 0 12px 22px -6px rgba(20,30,25,.4); }
        .hc-btn-secondary { background: ${T.card}; color: ${T.pine}; border-color: ${T.border}; }
        .hc-btn-secondary:hover { background: ${T.pineFaint}; transform: translateY(-1px); }
        .hc-reassure { color: ${T.soft}; }

        .hc-section-head { max-width: 680px; }
        .hc-kicker { color: ${T.pine}; font-family: ${BODY_FONT}; }
        .hc-h2 { font-family: ${MOMENT_FONT}; font-weight: 460; letter-spacing: -0.015em; color: ${T.ink}; }
        .hc-sub { color: ${T.mid}; }
        .hc-section { padding-top: 12px; padding-bottom: 64px; }

        .hc-grid { gap: 18px; }
        .hc-card { background: ${T.card}; border: 1px solid ${T.border}; border-radius: 20px; box-shadow: 0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10); transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1); }
        .hc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -6px rgba(20,30,25,.14), 0 24px 48px -20px rgba(20,30,25,.18); }
        .hc-card-title { color: ${T.ink}; font-weight: 700; }
        .hc-card-body { color: ${T.mid}; }

        .hc-trust { background: linear-gradient(160deg, ${T.pine}, ${T.pineDeep}); border-radius: 26px; }
        .hc-trust-kicker { color: #cfe0d2; }
        .hc-trust-h2 { font-family: ${MOMENT_FONT}; font-weight: 460; letter-spacing: -0.014em; color: #fff; }
        .hc-trust-sub { color: #e6ded4; }
        .hc-trust-grid { gap: 16px; }
        .hc-trust-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 20px; backdrop-filter: blur(10px) saturate(1.3); transition: background .2s ease, transform .25s cubic-bezier(.4,0,.2,1); }
        .hc-trust-card:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .hc-trust-label { color: #fff; }
        .hc-trust-body { color: #d9e6db; }
        .hc-pledge { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; color: #f0f4f0; }

        .hc-footer { border-top: 1px solid ${T.border}; }
        .hc-footlink { color: ${T.soft}; }
        .hc-footlink:hover { color: ${T.ink}; }

        /* Funeral-home page-scoped layout on top of the shared hc-* language. */
        .fhx-hero { padding-top: 40px; padding-bottom: 44px; }
        .fhx-hero-grid { display: grid; gap: 28px; align-items: start;
          grid-template-columns: minmax(0, 1.15fr) minmax(min(100%, 320px), 0.85fr); }
        .fhx-hero-copy { min-width: 0; max-width: 640px; }
        .fhx-h1 { font-family: ${MOMENT_FONT}; font-weight: 440; font-size: clamp(34px, 6.2vw, 56px); letter-spacing: -0.018em; line-height: 1.04; color: ${T.ink}; margin: 0 0 18px; }
        .fhx-lede { font-family: ${BODY_FONT}; font-size: clamp(16px, 2.2vw, 19px); line-height: 1.6; letter-spacing: -0.005em; color: ${T.mid}; margin: 0; max-width: 600px; }

        /* Hero proof panel - a calm "what a case shows" preview. */
        .fhx-proof { min-width: 0; box-sizing: border-box; background: ${T.card}; border: 1px solid ${T.border}; border-radius: 22px; padding: 24px; box-shadow: 0 8px 20px -6px rgba(20,30,25,.14), 0 24px 48px -20px rgba(20,30,25,.18); }
        .fhx-proof-kicker { font-family: ${BODY_FONT}; font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: ${T.pine}; margin: 0 0 6px; }
        .fhx-proof-head { font-family: ${BODY_FONT}; font-size: 18px; font-weight: 600; letter-spacing: -0.006em; color: ${T.ink}; margin: 0 0 14px; }
        .fhx-case { box-sizing: border-box; background: ${T.pineFaint}; border: 1px solid ${T.pine}33; border-radius: 18px; padding: 16px; }
        .fhx-case-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .fhx-case-name { font-family: ${BODY_FONT}; font-size: 16px; font-weight: 600; color: ${T.ink}; margin: 0; min-width: 0; }
        .fhx-pill { flex: 0 0 auto; font-family: ${BODY_FONT}; font-size: 11px; font-weight: 600; letter-spacing: .05em; color: ${T.pineDeep}; background: ${T.card}; border: 1px solid ${T.pine}44; border-radius: 999px; padding: 5px 11px; white-space: nowrap; }
        .fhx-case-row { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 10px; padding: 9px 0; border-top: 1px solid ${T.pine}22; }
        .fhx-case-row:first-of-type { border-top: 0; }
        .fhx-case-label { font-family: ${BODY_FONT}; font-size: 10px; font-weight: 600; letter-spacing: .05em; color: ${T.pineDeep}; align-self: start; }
        .fhx-case-value { font-family: ${BODY_FONT}; font-size: 13px; color: ${T.mid}; line-height: 1.5; min-width: 0; }
        .fhx-proof-note { font-family: ${BODY_FONT}; font-size: 13px; color: ${T.soft}; line-height: 1.55; margin: 14px 0 0; }

        /* Plan cards reuse hc-card; add price emphasis + a button row. */
        .fhx-plan { display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
        .fhx-plan-price { font-family: ${BODY_FONT}; font-size: 27px; font-weight: 700; letter-spacing: -0.01em; color: ${T.ink}; margin: 6px 0 2px; line-height: 1.05; }
        .fhx-plan-when { font-family: ${BODY_FONT}; font-size: 13px; color: ${T.soft}; margin: 0 0 6px; }
        .fhx-error { box-sizing: border-box; margin-top: 16px; background: ${T.roseFaint}; border: 1px solid ${T.rose}55; border-radius: 14px; padding: 12px 14px; font-family: ${BODY_FONT}; font-size: 13px; color: #8a3a3a; }

        @media (max-width: 860px) {
          .fhx-hero-grid { grid-template-columns: 1fr; gap: 24px; }
        }
        @media (max-width: 680px) {
          .fhx-case-row { grid-template-columns: 1fr; gap: 3px; }
          .fhx-hero { padding-top: 28px; padding-bottom: 32px; }
          .hc-card, .fhx-proof { border-radius: 16px; }
          .hc-trust, .hc-trust-card { border-radius: 18px; }
        }
      `;

  function goWalkthrough(e) {
    trackEvent('funeral_home_cta_clicked', { label: 'Book walkthrough', href: walkthroughHref });
    // Allow the native anchor (new tab) to proceed.
    void e;
  }

  return (
    <CalmPublicChrome session={session}>
      <RawStyle css={pageCss} />

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
                  style={{ color: T.pineDeep, fontWeight: 600 }}
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
