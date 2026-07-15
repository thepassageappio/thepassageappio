// Font family aligned to the Threshold design system
// (docs/redesign/08-visual-craft-standard.md): Inter for body/mechanism text.
// Previously hardcoded to the pre-Threshold Georgia serif system font -- this was
// the root cause of the site-wide font inconsistency documented in
// docs/redesign-diagnosis-2026-07-14.md. Every page/element that relies on this
// constant (directly, or via `fontFamily: 'inherit'` from the body default set in
// pages/_app.js) now renders Inter instead of Georgia. Headline-level "moment" text
// should use Fraunces explicitly at the call site, matching the pattern already
// shipped on pages/mission.js, pages/story.js, pages/trust.js, pages/planning.js,
// and components/SiteChrome.js. The Inter/Fraunces font files themselves are now
// loaded once, globally, in pages/_document.js.
export const PASSAGE_FONT = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  letterSpacing: 0,
};

export const PASSAGE_TYPE = {
  display: { fontSize: 52, lineHeight: 1.05, fontWeight: 400, letterSpacing: 0 },
  h1: { fontSize: 32, lineHeight: 1.14, fontWeight: 400, letterSpacing: 0 },
  h2: { fontSize: 24, lineHeight: 1.18, fontWeight: 400, letterSpacing: 0 },
  h3: { fontSize: 18, lineHeight: 1.24, fontWeight: 900, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 1.65, fontWeight: 400, letterSpacing: 0 },
  bodySmall: { fontSize: 14, lineHeight: 1.55, fontWeight: 400, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 1.45, fontWeight: 400, letterSpacing: 0 },
  eyebrow: { fontSize: 11, lineHeight: 1.2, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase' },
  meta: { fontSize: 10.5, lineHeight: 1.25, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' },
  nav: { fontSize: 14, lineHeight: 1.2, fontWeight: 400, letterSpacing: 0 },
  button: { fontSize: 15, lineHeight: 1.15, fontWeight: 900, letterSpacing: 0 },
  badge: { fontSize: 11.5, lineHeight: 1, fontWeight: 900, letterSpacing: 0 },
  logo: { fontSize: 26, lineHeight: 1, fontWeight: 900, letterSpacing: 0 },
  logoCompact: { fontSize: 23, lineHeight: 1, fontWeight: 900, letterSpacing: 0 },
};

export function typeStyle(name, overrides = {}) {
  return {
    fontFamily: PASSAGE_FONT.family,
    ...(PASSAGE_TYPE[name] || PASSAGE_TYPE.body),
    ...overrides,
  };
}
