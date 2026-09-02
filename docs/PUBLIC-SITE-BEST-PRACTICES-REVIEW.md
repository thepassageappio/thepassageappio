# Passage Authority public-site best-practices review

**Review date:** September 2, 2026  
**Scope:** Linked public marketing, account-entry, and legal routes on `thepassageapp.io`  
**Boundary:** This is an engineering and usability review, not an accessibility certification, penetration test, legal approval, or performance guarantee.

## Standards baseline

- WCAG 2.2 reflow at 320 CSS pixels: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- WCAG 2.2 target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 2.2 focus appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- WCAG 2.2 text contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Next.js production checklist: https://nextjs.org/docs/app/guides/production-checklist
- Google Search title guidance: https://developers.google.com/search/docs/appearance/title-link
- Google Search sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Vercel Speed Insights: https://vercel.com/docs/speed-insights

## Implemented baseline

| Area | Evidence | Status |
| --- | --- | --- |
| Responsive reflow | Desktop, 390px, and 360px linked-route audit has no page-level horizontal overflow | Pass; 320px final production replay remains |
| Page length | Supporting public pages remain about one to 2.4 mobile screens; the homepage was shortened from five steps plus a redundant problem section to three stages | Pass pending production measurement |
| Interaction targets | Navigation, primary actions, account header, legal header, and footer links use a 44px preferred minimum | Pass pending production measurement |
| Keyboard focus | Public interactive styles use a visible 3px outline and offset | Pass by code review; full keyboard traversal remains |
| Contrast | Small muted and amber public labels were changed to color pairs meeting at least 4.5:1 in the reviewed backgrounds | Pass for reviewed pairs; automated full-page scan remains |
| Language | Linked marketing and account-entry routes do not expose database names, internal command names, raw identifiers, or internal event names | Pass |
| Metadata | Public routes have descriptive titles, descriptions, canonical paths, and social metadata; the public domain is the default metadata base | Pass |
| Discovery | Public sitemap and robots routes are generated; authenticated, participant, API, developer, and local-demo surfaces are excluded | Pass |
| Legal access | A compact footer links privacy, terms, and authorized-use pages from every marketing page | Pass |
| Error recovery | Route error handling plus a root error fallback provide a retry path without exposing internals | Pass |
| Browser security baseline | No-referrer, no-sniff, frame denial, restrictive camera/microphone/location policy, and HSTS headers are configured | Pass pending production header replay |
| Release gates | 65 domain tests, TypeScript, ESLint, and the optimized Next.js build pass | Pass |

## Required before a controlled pilot

1. Run automated accessibility testing plus manual keyboard and screen-reader checks across every persona.
2. Record production Core Web Vitals by mobile and desktop; target LCP at or below 2.5 seconds at the 75th percentile and investigate INP and CLS outliers.
3. Add and test a deployment-compatible Content Security Policy without breaking Next.js, Supabase Auth, or required integrations.
4. Enable production error monitoring, structured logs, alert ownership, and recovery runbooks.
5. Complete independent security, privacy, retention, backup, recovery, and legal reviews.
6. Validate copy, pricing, and claims with target bank and credit-union buyers before broad outbound selling.

## Truthful conclusion

The public site follows a strong controlled-MVP baseline and is suitable for continued UAT and design-partner discovery. It is not yet evidence of full WCAG conformance, enterprise security readiness, production performance, or authorization to accept live payments or real institution data.
