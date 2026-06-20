# Passage Site Migration Plan (calm DS rollout)

Last updated: 2026-06-20. Canonical execution plan for migrating the site onto the calm design system (lib/designSystem.js + components/calm/*). Read with AGENTS.md.

## Principles (guardrails)

1. Never repurpose a public route for an authed surface. `/` is public marketing; the authed family app lives at `/today`.
2. Never ship a stripped page. Parity is measured against the legacy FULL page (e.g. App.js CompactLanding), not against a reduced landing. Dropping user-facing functionality needs owner approval — deprecate/redirect, don't drop.
3. One slice = one route family. "No other route touched" check per release.
4. Mobile + web in tandem: every surface built and QA'd at desktop >=1366 and mobile 390 and 360 in the SAME slice; same status spine/components/copy, only layout adapts; zero horizontal overflow, taps >= DS.tap.min, no hydration warnings.
5. Real surfaces use AppShell frame="app"; frame="device" + noindex are /preview only.
6. Production stays gated (scripts/vercel-ignore-build.js): no [qa-approved] before the release-train loop passes; QA via throwaway-branch preview or npm run dev.
7. No internal vocab (ARR/sprint/QA/pilot/roadmap) on public/persona pages.

## Routing baseline (corrected 2026-06-20)

- `/` = full public marketing site (components/App). RESTORED after a wrong takeover.
- `/today` = calm family app (components/AppCalm): signed-in Family Today, signed-out calm sign-in.
- `/?legacy=1` retired once the calm `/` rebuild reaches parity.
- Post-auth `next` / emailRedirectTo should target `/today` (follow-up: AppCalm still uses `/`).

## Migration sequence (each = one verified release)

1. Homepage de-takeover (DONE this commit): `/`->App, family app->/today. NEXT within this slice: build components/HomeCalm.js to FULL parity with legacy CompactLanding (full public nav, hero + 3 CTAs Start urgent/Prepare during care/Plan ahead, reassurance note, sample-case + vendor-demo proof links, family pledge, 4 story panes How it works/Journey/Providers/Lifecycle + CTAs, calm footer FAQ/Trust/Privacy/Terms/Contact, homepage analytics events, indexable SEO) using preview/home + BrandHero as seeds, then repoint `/` to HomeCalm.
2. Family record `/estate` -> calm (decide whether it converges with `/today`).
3. Vendor family: /vendors, /vendors/login, /vendors/onboard, /vendors/request, /vendors/accept. Build from preview/scoped; preserve quote/payment/proof states, scoped privacy, and the homepage vendor-demo deep-link.
4. Participant family: /participating, /participants. Build from preview/scoped; preserve RoleActionStrip/StatusBadge semantics + scoped-request privacy.
5. Marketing pages: /mission /story /guides /blog(+[slug]) /pricing /contact /faq /trust /privacy /terms, plus /urgent /planning /care-providers /hospice /assisted-living /share /packet /accept /confirm /announce /status. Calm chrome/footer; keep all links, the /resources and /content redirects, and PAGE_META SEO.
6. Funeral-home operator: /funeral-home + /login /setup /dashboard /cases /staff /summary /sample-case /workspace-demo /pilot-proof, /partner/accept. Employee view from preview/my-work; director operator view. Preserve director risk/ROI + employee assigned-work-only scoping; keep demo surfaces (homepage links into them).
7. System admin: /system/admin + /system/admin/*. Last. Calm chrome only; keep saas-roadmap as the single canonical roadmap; keep /system/demo redirect.

Per slice: clean build + npm run agent:check, browser QA at 1366/390/360, [skip deploy] source batching, then one `release: ... [deploy] [qa-approved]` within budget (1 prod train/hr, <=4 deploy commits/day).

## Open decisions (owner)

- Family app route: `/today` (current) vs converging with `/estate`.
- Homepage hero copy: BrandHero canonical slogan vs legacy H1 "One calm place for the hardest family handoffs."
- When to retire `/?legacy=1` after calm `/` parity.
