// Passage — shared calm public chrome (header + footer + page shell styles).
// Extracted from HomeCalm so every public marketing page (home, funeral-home,
// future persona pages) shares ONE header/footer pattern, nav, auth slot, and
// the calm design-system styling. SSR-safe: session is passed in by the page
// (read in an effect), so this component renders identically on server + client.
//
// Usage:
//   <CalmPublicChrome session={session}>
//     <main>...page sections...</main>
//   </CalmPublicChrome>
//
// The shared <style> block defines the `hc-*` class language used by the page
// sections too (hero, sections, grids, cards, trust band), so pages can compose
// their layout with the same tokens without redeclaring chrome CSS.
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { supabase } from '../../lib/supabaseBrowser';

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

// Serialize a TYPE token object into inline CSS declarations for the <style> block.
export function cssType(t) {
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

export function RawStyle({ css }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export function CalmHeader({ session }) {
  return (
    <div className="hc-header-sticky-wrap">
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
                  supabase?.auth?.signOut?.().finally(() => {
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
    </div>
  );
}

export function CalmFooter() {
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

// The shared calm CSS for chrome + section/grid/card/trust primitives.
export function CalmPublicStyles() {
  const css = `
      .hc-root { background: ${DS.color.page}; min-height: 100vh; font-family: ${SANS}; color: ${DS.color.ink}; overflow-x: hidden; }
      .hc-wrap { width: min(1120px, 100%); box-sizing: border-box; margin: 0 auto; padding-left: 24px; padding-right: 24px; }

      /* Header -- sticky glass surface per docs/redesign/08-visual-craft-standard.md */
      .hc-header-sticky-wrap { position: sticky; top: 0; z-index: 40; padding: 10px 14px 0; }
      .hc-header { width: min(1120px, 100%); box-sizing: border-box; margin: 0 auto; padding: 10px 18px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; background: rgba(251,250,247,0.72); backdrop-filter: blur(14px) saturate(1.4); -webkit-backdrop-filter: blur(14px) saturate(1.4); border: 1px solid rgba(228,221,212,.6); border-radius: ${DS.radius.pill}px; box-shadow: ${DS.shadow.hair}, 0 10px 24px -14px rgba(20,30,25,.16); }
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
      .hc-btn { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; font-family: ${SANS}; font-size: 15px; font-weight: 600; border-radius: ${DS.radius.pill}px; min-height: ${DS.tap.min}px; padding: 0 22px; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background ${DS.motion.fast} ${DS.motion.ease}, border-color ${DS.motion.fast} ${DS.motion.ease}, transform ${DS.motion.fast} ${DS.motion.ease}, box-shadow ${DS.motion.fast} ${DS.motion.ease}; }
      .hc-btn-primary { background: linear-gradient(155deg, ${DS.color.sageDeep}, #223a26); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 8px 16px -6px rgba(20,30,25,.35); }
      .hc-btn-primary:hover { background: linear-gradient(155deg, #2f4c34, #1a2e1e); transform: translateY(-1px); box-shadow: 0 2px 4px rgba(20,30,25,.18), 0 12px 22px -6px rgba(20,30,25,.4); }
      .hc-btn-secondary { background: ${DS.color.card}; color: ${DS.color.sageDeep}; border-color: ${DS.color.sage}55; box-shadow: ${DS.shadow.hair}; }
      .hc-btn-secondary:hover { background: ${DS.color.sageFaint}; transform: translateY(-1px); box-shadow: ${DS.shadow.card}; }
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
      .hc-card { box-sizing: border-box; min-width: 0; background: ${DS.color.card}; border: 1px solid ${DS.color.hair}; border-radius: ${DS.radius.lg}px; padding: 22px; box-shadow: ${DS.shadow.hair}; transition: box-shadow ${DS.motion.fast} ${DS.motion.ease}, transform ${DS.motion.fast} ${DS.motion.ease}; }
      .hc-card:hover { box-shadow: ${DS.shadow.card}; transform: translateY(-2px); }
      .hc-card-title { ${cssType(TYPE.h2)} font-size: 17px; color: ${DS.color.ink}; margin: 0 0 8px; }
      .hc-card-body { ${cssType(TYPE.small)} color: ${DS.color.mid}; line-height: 1.55; margin: 0; }

      /* Persona / link cards */
      .hc-persona { display: flex; flex-direction: column; box-sizing: border-box; min-width: 0; background: ${DS.color.card}; border: 1px solid ${DS.color.hair}; border-radius: ${DS.radius.lg}px; padding: 20px; min-height: ${DS.tap.min}px; text-decoration: none; color: inherit; box-shadow: ${DS.shadow.hair}; transition: border-color ${DS.motion.fast} ${DS.motion.ease}, transform ${DS.motion.fast} ${DS.motion.ease}, box-shadow ${DS.motion.fast} ${DS.motion.ease}; }
      .hc-persona:hover { border-color: ${DS.color.sage}66; box-shadow: ${DS.shadow.card}; transform: translateY(-2px); }
      .hc-persona-primary { background: ${DS.color.sageFaint}; border-color: ${DS.color.sage}55; }
      .hc-persona-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; ${cssType(TYPE.h2)} font-size: 16px; color: ${DS.color.ink}; margin: 0 0 8px; }
      .hc-persona-arrow { color: ${DS.color.sage}; font-size: 20px; line-height: 1; flex: 0 0 auto; }
      .hc-persona-body { ${cssType(TYPE.small)} color: ${DS.color.mid}; line-height: 1.5; margin: 0; }

      /* Trust band */
      .hc-trust { background: linear-gradient(165deg, ${DS.color.sageDeep}, #223a26); border-radius: ${DS.radius.xl}px; box-sizing: border-box; padding: clamp(24px, 4vw, 40px); margin-bottom: 8px; box-shadow: ${DS.shadow.card}; }
      .hc-trust-kicker { ${cssType(TYPE.label)} color: #b9d2bd; margin: 0 0 10px; }
      .hc-trust-h2 { font-size: clamp(22px, 3.2vw, 28px); font-weight: 600; letter-spacing: -0.012em; line-height: 1.18; color: #fff; margin: 0 0 8px; }
      .hc-trust-sub { ${cssType(TYPE.body)} color: #d8d0c7; margin: 0 0 22px; max-width: 580px; }
      .hc-trust-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(min(100%, 280px), 1fr)); }
      .hc-trust-card { display: flex; flex-direction: column; box-sizing: border-box; min-width: 0; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16); border-radius: ${DS.radius.lg}px; padding: 18px; min-height: ${DS.tap.min}px; text-decoration: none; color: #fff; transition: background ${DS.motion.fast} ${DS.motion.ease}, transform ${DS.motion.fast} ${DS.motion.ease}, box-shadow ${DS.motion.fast} ${DS.motion.ease}; }
      .hc-trust-card:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); box-shadow: 0 10px 24px -10px rgba(0,0,0,.35); }
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
        .hc-header-sticky-wrap { padding: 8px 8px 0; }
      }
    `;

  return <RawStyle css={css} />;
}

// Full page shell: styles + header + children + footer, all inside .hc-root.
export default function CalmPublicChrome({ session, children }) {
  return (
    <div className="hc-root">
      <CalmPublicStyles />
      <CalmHeader session={session} />
      {children}
      <CalmFooter />
    </div>
  );
}
