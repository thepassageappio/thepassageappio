// Passage — redesigned public marketing homepage (rendered at "/").
// A full UX + visual redesign on the calm design system: one clear primary
// path, generous whitespace, a strong modern type scale, and outcome-focused
// copy that speaks to families first. SSR-safe and indexable. SEO title/desc
// come from PAGE_META['/'] in pages/_app.js.
//
// Preserved from the prior homepage: the auth slot (Sign in / My estate / Sign
// out via supabase session), every destination route, and the four analytics
// events — homepage_cta_clicked, homepage_sample_case_clicked,
// homepage_sample_vendor_clicked, homepage_panel_cta_clicked.
import { useEffect, useState } from 'react';
import { DS, TYPE, SANS } from '../lib/designSystem';
import { PASSAGE_BRAND } from '../lib/brand';
import { supabase } from '../lib/supabaseBrowser';
import { trackEvent } from '../lib/trackEvent';
import { HELP_CARDS, PERSONA_CARDS, TRUST_ITEMS } from './home/HomeData';

// Primary nav. Secondary items are de-emphasized and hidden on small screens.
const NAV = [
  ['Funeral homes', '/funeral-home', false],
  ['Care providers', '/care-providers', false],
  ['Pricing', '/pricing', false],
  ['Mission', '/mission', true],
  ['Our story', '/story', true],
  ['Resources', '/guides', true],
  ['Contact', '/contact', true],
];

const FOOTER_LINKS = [
  ['FAQ', '/faq'],
  ['Trust', '/trust'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Contact', '/contact'],
];

function CalmHeader({ session }) {
  return (
    <header className="hc-header">
      <a href="/" className="hc-logo" aria-label="Passage home">Passage</a>
      <nav className="hc-nav" aria-label="Primary">
        {NAV.map(([label, href, secondary]) => (
          <a key={href} href={href} className={`hc-navlink${secondary ? ' hc-nav-secondary' : ''}`}>{label}</a>
        ))}
      </nav>
      <div className="hc-auth">
        {session?.user ? (
          <>
            <a href="/estate" className="hc-navlink hc-auth-link">My estate</a>
            <button
              type="button"
              className="hc-signin"
              onClick={() => {
                supabase.auth.signOut().finally(() => {
                  if (typeof window !== 'undefined') window.location.assign('/');
                });
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <a href="/login" className="hc-signin">Sign in</a>
        )}
      </div>
    </header>
  );
}

function CalmFooter() {
  return (
    <footer className="hc-footer">
      <span style={{ ...TYPE.micro, color: DS.color.soft }}>
        Passage coordinates life-to-death transitions with care.
      </span>
      <nav className="hc-footer-nav" aria-label="Footer">
        {FOOTER_LINKS.map(([label, href]) => (
          <a key={label + href} href={href} className="hc-footlink">{label}</a>
        ))}
      </nav>
    </footer>
  );
}

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
    <div className="hc-root">
      <style>{`
        .hc-root { background: ${DS.color.page}; min-height: 100vh; font-family: ${SANS}; color: ${DS.color.ink}; overflow-x: hidden; }
        .hc-wrap { width: min(1120px, 100%); box-sizing: border-box; margin: 0 auto; padding-left: 24px; padding-right: 24px; }

        /* Header */
        .hc-header { width: min(1120px, 100%); box-sizing: border-box; margin: 0 auto; padding: 18px 24px 10px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
        .hc-logo { font-family: ${SANS}; font-weight: 700; font-size: 21px; letter-spacing: -0.01em; color: ${DS.color.sageDeep}; text-decoration: none; }
        .hc-nav { display: flex; gap: 18px; flex-wrap: wrap; flex: 1; min-width: 0; align-items: center; }
        .hc-navlink { font-family: ${SANS}; font-size: 14px; color: ${DS.color.mid}; text-decoration: none; white-space: nowrap; display: inline-flex; align-items: center; min-height: 36px; }
        .hc-navlink:hover { color: ${DS.color.ink}; }
        .hc-auth { display: flex; align-items: center; gap: 12px; }
        .hc-auth-link { font-weight: 600; color: ${DS.color.sageDeep}; }
        .hc-signin { font-family: ${SANS}; font-size: 14px; font-weight: 600; color: ${DS.color.sageDeep}; background: ${DS.color.card}; border: 1px solid ${DS.color.sage}55; border-radius: ${DS.radius.pill}px; min-height: 40px; padding: 0 16px; display: inline-flex; align-items: center; cursor: pointer; text-decoration: none; }
        .hc-signin:hover { background: ${DS.color.sageFaint}; }

        /* Hero */
        .hc-hero { padding-top: 40px; padding-bottom: 48px; max-width: 760px; }
        .hc-eyebrow { ${cssType(TYPE.label)} color: ${DS.color.sage}; margin: 0 0 18px; }
        .hc-h1 { font-size: clamp(34px, 6.2vw, 56px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; color: ${DS.color.ink}; margin: 0 0 20px; }
        .hc-lede { font-size: clamp(16px, 2.2vw, 19px); line-height: 1.55; color: ${DS.color.mid}; margin: 0; max-width: 620px; }
        .hc-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .hc-actions > * { min-width: 0; }
        .hc-btn { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; font-family: ${SANS}; font-size: 15px; font-weight: 600; border-radius: ${DS.radius.md}px; min-height: ${DS.tap.min}px; padding: 0 22px; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background ${DS.motion.fast} ${DS.motion.ease}, border-color ${DS.motion.fast} ${DS.motion.ease}; }
        .hc-btn-primary { background: ${DS.color.sageDeep}; color: #fff; }
        .hc-btn-primary:hover { background: #2f4c34; }
        .hc-btn-secondary { background: ${DS.color.card}; color: ${DS.color.sageDeep}; border-color: ${DS.color.sage}55; }
        .hc-btn-secondary:hover { background: ${DS.color.sageFaint}; }
        .hc-reassure { ${cssType(TYPE.small)} color: ${DS.color.soft}; line-height: 1.5; margin: 18px 0 0; max-width: 560px; }

        /* Section scaffolding */
        .hc-section { padding-top: 8px; padding-bottom: 48px; }
        .hc-section-head { max-width: 640px; margin: 0 0 26px; }
        .hc-kicker { ${cssType(TYPE.label)} color: ${DS.color.sage}; margin: 0 0 10px; }
        .hc-h2 { font-size: clamp(24px, 3.4vw, 32px); font-weight: 600; letter-spacing: -0.012em; line-height: 1.15; color: ${DS.color.ink}; margin: 0 0 10px; }
        .hc-sub { ${cssType(TYPE.body)} font-size: 16px; color: ${DS.color.mid}; margin: 0; }

        /* Card grids */
        .hc-grid { display: grid; gap: 16px; }
        .hc-grid-3 { grid-template-columns: repeat(3, minmax(min(100%, 260px), 1fr)); }
        .hc-grid-2 { grid-template-columns: repeat(2, minmax(min(100%, 300px), 1fr)); }
        .hc-card { box-sizing: border-box; min-width: 0; background: ${DS.color.card}; border: 1px solid ${DS.color.hair}; border-radius: ${DS.radius.lg}px; padding: 22px; box-shadow: ${DS.shadow.hair}; }
        .hc-card-title { ${cssType(TYPE.h2)} font-size: 17px; color: ${DS.color.ink}; margin: 0 0 8px; }
        .hc-card-body { ${cssType(TYPE.small)} color: ${DS.color.mid}; line-height: 1.55; margin: 0; }

        /* Persona cards (links) */
        .hc-persona { display: flex; flex-direction: column; box-sizing: border-box; min-width: 0; background: ${DS.color.card}; border: 1px solid ${DS.color.hair}; border-radius: ${DS.radius.lg}px; padding: 20px; min-height: ${DS.tap.min}px; text-decoration: none; color: inherit; box-shadow: ${DS.shadow.hair}; transition: border-color ${DS.motion.fast} ${DS.motion.ease}, transform ${DS.motion.fast} ${DS.motion.ease}, box-shadow ${DS.motion.fast} ${DS.motion.ease}; }
        .hc-persona:hover { border-color: ${DS.color.sage}66; box-shadow: ${DS.shadow.card}; transform: translateY(-2px); }
        .hc-persona-primary { background: ${DS.color.sageFaint}; border-color: ${DS.color.sage}55; }
        .hc-persona-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; ${cssType(TYPE.h2)} font-size: 16px; color: ${DS.color.ink}; margin: 0 0 8px; }
        .hc-persona-arrow { color: ${DS.color.sage}; font-size: 20px; line-height: 1; flex: 0 0 auto; }
        .hc-persona-body { ${cssType(TYPE.small)} color: ${DS.color.mid}; line-height: 1.5; margin: 0; }

        /* Trust band */
        .hc-trust { background: ${DS.color.sageDeep}; border-radius: ${DS.radius.xl}px; box-sizing: border-box; padding: clamp(24px, 4vw, 40px); margin-bottom: 8px; }
        .hc-trust-kicker { ${cssType(TYPE.label)} color: #b9d2bd; margin: 0 0 10px; }
        .hc-trust-h2 { font-size: clamp(22px, 3.2vw, 28px); font-weight: 600; letter-spacing: -0.012em; line-height: 1.18; color: #fff; margin: 0 0 8px; }
        .hc-trust-sub { ${cssType(TYPE.body)} color: #d8d0c7; margin: 0 0 22px; max-width: 580px; }
        .hc-trust-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(min(100%, 280px), 1fr)); }
        .hc-trust-card { display: flex; flex-direction: column; box-sizing: border-box; min-width: 0; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); border-radius: ${DS.radius.lg}px; padding: 18px; min-height: ${DS.tap.min}px; text-decoration: none; color: #fff; transition: background ${DS.motion.fast} ${DS.motion.ease}; }
        .hc-trust-card:hover { background: rgba(255,255,255,0.12); }
        .hc-trust-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; ${cssType(TYPE.h2)} font-size: 15.5px; color: #fff; margin: 0 0 6px; }
        .hc-trust-body { ${cssType(TYPE.small)} color: #cfe0d2; line-height: 1.5; margin: 0; }
        .hc-pledge { box-sizing: border-box; margin-top: 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); border-radius: ${DS.radius.md}px; padding: 16px 18px; ${cssType(TYPE.small)} color: #e8efe9; line-height: 1.55; }
        .hc-pledge strong { color: #fff; font-weight: 600; }

        /* Footer */
        .hc-footer { width: min(1120px, 100%); box-sizing: border-box; margin: 20px auto 0; padding: 22px 24px 36px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; border-top: 1px solid ${DS.color.hair}; }
        .hc-footer-nav { display: flex; gap: 18px; flex-wrap: wrap; }
        .hc-footlink { font-family: ${SANS}; font-size: 13px; color: ${DS.color.mid}; text-decoration: none; min-height: 36px; display: inline-flex; align-items: center; }
        .hc-footlink:hover { color: ${DS.color.ink}; }

        @media (max-width: 860px) {
          .hc-grid-3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .hc-nav-secondary { display: none; }
          .hc-grid-2, .hc-trust-grid { grid-template-columns: 1fr; }
          .hc-actions { flex-direction: column; align-items: stretch; }
          .hc-actions > * { width: 100%; }
          .hc-hero { padding-top: 28px; padding-bottom: 36px; }
        }
      `}</style>

      <CalmHeader session={session} />

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

      <CalmFooter />
    </div>
  );
}

// Serialize a TYPE token object into inline CSS declarations for the <style> block.
function cssType(t) {
  if (!t) return '';
  const map = {
    fontSize: (v) => `font-size: ${typeof v === 'number' ? v + 'px' : v};`,
    fontWeight: (v) => `font-weight: ${v};`,
    lineHeight: (v) => `line-height: ${v};`,
    letterSpacing: (v) => `letter-spacing: ${v};`,
    textTransform: (v) => `text-transform: ${v};`,
  };
  return Object.keys(t).map((k) => (map[k] ? map[k](t[k]) : '')).join(' ');
}
