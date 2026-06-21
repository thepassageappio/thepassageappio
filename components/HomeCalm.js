// Passage — redesigned public marketing homepage (rendered at "/").
// A full UX + visual redesign on the calm design system: one clear primary
// path, generous whitespace, a strong modern type scale, and outcome-focused
// copy that speaks to families first. SSR-safe and indexable. SEO title/desc
// come from PAGE_META['/'] in pages/_app.js.
//
// Chrome (calm header + footer + the shared hc-* style language) now lives in
// components/calm/CalmPublicChrome.js and is reused by every public marketing
// page (home, funeral-home, ...). This file owns only the homepage sections.
//
// Preserved from the prior homepage: the auth slot (Sign in / My estate / Sign
// out via supabase session), every destination route, and the four analytics
// events — homepage_cta_clicked, homepage_sample_case_clicked,
// homepage_sample_vendor_clicked, homepage_panel_cta_clicked.
import { useEffect, useState } from 'react';
import CalmPublicChrome from './calm/CalmPublicChrome';
import { PASSAGE_BRAND } from '../lib/brand';
import { supabase } from '../lib/supabaseBrowser';
import { trackEvent } from '../lib/trackEvent';
import { HELP_CARDS, PERSONA_CARDS, TRUST_ITEMS } from './home/HomeData';

export default function HomeCalm() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;
    supabase?.auth?.getSession?.()
      .then(({ data }) => { if (active) setSession(data?.session || null); })
      .catch(() => {});
    const sub = supabase?.auth?.onAuthStateChange?.((_e, s) => setSession(s || null));
    return () => { active = false; sub?.data?.subscription?.unsubscribe?.(); };
  }, []);

  function goCta(label, href) {
    trackEvent('homepage_cta_clicked', { label, href });
    if (typeof window !== 'undefined') window.location.href = href;
  }

  const slogan = PASSAGE_BRAND.slogan || "The operating system for life's hardest logistics.";

  return (
    <CalmPublicChrome session={session}>
      <main>
        {/* Hero — one human promise, one primary path. */}
        <section className="hc-wrap hc-hero">
          <p className="hc-eyebrow">{slogan}</p>
          <h1 className="hc-h1">When the hardest days come, you don&rsquo;t have to hold it all alone.</h1>
          <p className="hc-lede">
            Passage turns the overwhelming list of what-comes-next into one calm,
            shared path &mdash; so families, funeral homes, and helpers always know
            the next step, who has it, and that nothing is being missed.
          </p>

          <div className="hc-actions">
            <a
              href="/urgent"
              className="hc-btn hc-btn-primary"
              onClick={(e) => { e.preventDefault(); goCta('Start urgent path', '/urgent'); }}
            >
              Start urgent path
            </a>
            <a
              href="/pricing"
              className="hc-btn hc-btn-secondary"
              onClick={(e) => { e.preventDefault(); goCta('Plan ahead', '/pricing'); }}
            >
              Plan ahead
            </a>
            <a
              href="/funeral-home"
              className="hc-btn hc-btn-secondary"
              onClick={(e) => { e.preventDefault(); goCta('For funeral homes', '/funeral-home'); }}
            >
              For funeral homes
            </a>
          </div>

          <p className="hc-reassure">
            Nothing sends and nothing shares on its own. The family approves before
            Passage ever reaches outside the record.
          </p>
        </section>

        {/* How Passage helps families — outcome-focused reassurance. */}
        <section className="hc-wrap hc-section">
          <div className="hc-section-head">
            <p className="hc-kicker">How Passage helps</p>
            <h2 className="hc-h2">A calmer way through, for the people carrying it</h2>
            <p className="hc-sub">
              You shouldn&rsquo;t have to become a project manager in the middle of grief.
              Passage quietly keeps the work organized so you can focus on each other.
            </p>
          </div>
          <div className="hc-grid hc-grid-3">
            {HELP_CARDS.map((c) => (
              <div className="hc-card" key={c.id}>
                <h3 className="hc-card-title">{c.title}</h3>
                <p className="hc-card-body">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Persona entry cards — the router. */}
        <section className="hc-wrap hc-section">
          <div className="hc-section-head">
            <p className="hc-kicker">Find your starting point</p>
            <h2 className="hc-h2">Wherever you are, there&rsquo;s a clear first step</h2>
            <p className="hc-sub">
              Passage meets families, providers, helpers, and vendors where they are &mdash;
              each with a private, role-appropriate view of the same shared record.
            </p>
          </div>
          <div className="hc-grid hc-grid-3">
            {PERSONA_CARDS.map((p) => (
              <a
                key={p.id}
                href={p.href}
                className={`hc-persona${p.tone === 'primary' ? ' hc-persona-primary' : ''}`}
                onClick={() => trackEvent('homepage_panel_cta_clicked', { label: p.label, href: p.href, pane: p.id })}
              >
                <span className="hc-persona-label">
                  {p.label}
                  <span aria-hidden="true" className="hc-persona-arrow">&rsaquo;</span>
                </span>
                <span className="hc-persona-body">{p.body}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Trust / proof band. */}
        <section className="hc-wrap hc-section">
          <div className="hc-trust">
            <p className="hc-trust-kicker">See it for yourself</p>
            <h2 className="hc-trust-h2">Built to be trusted on the hardest day</h2>
            <p className="hc-trust-sub">
              No pressure and no sign-up. Look inside real examples, and see exactly
              how Passage keeps people informed without ever oversharing.
            </p>
            <div className="hc-trust-grid">
              {TRUST_ITEMS.map((t) => (
                <a
                  key={t.id}
                  href={t.href}
                  className="hc-trust-card"
                  onClick={() => trackEvent(t.event, { href: t.href })}
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
              <strong>The Passage family pledge:</strong>{' '}
              10% of proceeds support grief and family-care work, and each paid urgent
              family record funds a remembrance tree dedication.
            </div>
          </div>
        </section>
      </main>
    </CalmPublicChrome>
  );
}
