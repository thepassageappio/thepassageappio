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
| Responsive reflow | Desktop, 390px, 360px, and a true 320 CSS-pixel linked-route audit has no page-level horizontal overflow | Pass |
| Page length | Supporting public pages remain about one to 2.6 mobile screens; the homepage was shortened from approximately 6.4–7 screens to 4.1 at 390px and 4.6 at 360px | Pass |
| Interaction targets | Navigation, primary actions, account header, legal header, and footer links use a 44px preferred minimum; no tested interactive element is below the WCAG 24px minimum | Pass |
| Keyboard focus | Public interactive styles use a visible 3px outline and offset | Pass by code review; full keyboard traversal remains |
| Contrast | Small muted and amber public labels were changed to color pairs meeting at least 4.5:1 in the reviewed backgrounds | Pass for reviewed pairs; automated full-page scan remains |
| Language | Linked marketing and account-entry routes do not expose database names, internal command names, raw identifiers, or internal event names | Pass |
| Metadata | Public routes have descriptive titles, descriptions, canonical paths, and social metadata; the public domain is the default metadata base | Pass |
| Discovery | Public sitemap and robots routes are generated; authenticated, participant, API, developer, and local-demo surfaces are excluded | Pass |
| Legal access | A compact footer links privacy, terms, and authorized-use pages from every marketing page | Pass |
| Error recovery | Route error handling plus a root error fallback provide a retry path without exposing internals | Pass |
| Browser security baseline | No-referrer, no-sniff, frame denial, restrictive camera/microphone/location policy, and HSTS headers are present in the production response | Pass |
| Release gates | 65 domain tests, TypeScript, ESLint, and the optimized Next.js build pass | Pass |

## Adjacent-product language review

Passage does not have a one-for-one category peer, so this review uses adjacent enterprise SaaS products as language and adoption benchmarks rather than claiming they are direct competitors.

| Benchmark | Useful pattern | Passage application |
| --- | --- | --- |
| Persona Workflows | Explains the product through a short trigger, consolidate, decide, act sequence and separates product benefit from technical detail | Lead with start, collect, review, decide; keep implementation terms out of participant pages |
| Alloy | States one institutional outcome, supports it with measurable operational proof, then explains orchestration | Lead with getting a POA request to a clear decision; add scale claims only after a measured load test |
| Permit.io | Separates authentication from authorization and pairs the buyer story with a concrete developer path | Explain that Passage coordinates the request while the institution decides; publish a hosted-first integration quickstart before claiming easy integration |
| Stripe and Plaid documentation | Offer a sandbox, a minimal quickstart, realistic sample data, explicit environments, and a visible next step | Provide resettable sample data, a five-minute quickstart, signed webhook example, environment boundary, and recovery instructions |

### Copy rules adopted

1. One outcome per heading; one next action per task panel.
2. Prefer “request,” “review,” “decision,” “receipt,” and “later changes” over “transaction,” “policy orchestration,” “decision snapshot,” and “lifecycle.”
3. Put receipt hashes, record versions, delivery attempts, and complete activity history behind clearly named secondary disclosures.
4. Label sample, evaluation, pilot, and production states explicitly.
5. Never describe an integration, security control, performance level, or certification as ready until the matching evidence exists.

## Required before a controlled pilot

1. Run automated accessibility testing plus manual keyboard and screen-reader checks across every persona.
2. Record production Core Web Vitals by mobile and desktop; target LCP at or below 2.5 seconds at the 75th percentile and investigate INP and CLS outliers.
3. Add and test a deployment-compatible Content Security Policy without breaking Next.js, Supabase Auth, or required integrations.
4. Enable production error monitoring, structured logs, alert ownership, and recovery runbooks.
5. Complete independent security, privacy, retention, backup, recovery, and legal reviews.
6. Validate copy, pricing, and claims with target bank and credit-union buyers before broad outbound selling.

## Truthful conclusion

The public site follows a strong controlled-MVP baseline and is suitable for continued UAT and design-partner discovery. It is not yet evidence of full WCAG conformance, enterprise security readiness, production performance, or authorization to accept live payments or real institution data.
