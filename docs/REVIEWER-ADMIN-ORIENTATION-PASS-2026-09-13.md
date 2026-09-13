# Reviewer/admin orientation pass — September 13, 2026

**Scope:** every authenticated, non-external-participant screen (owner/admin/staff/reviewer/developer/auditor roles) under `src/app/app/**` and its direct equivalents, following up on the request-detail ("Where this stands") orientation fix shipped 2026-09-12 (`8476a5379cc5`, `9bcc664f5ee5`). Excludes the one-time magic-link principal/representative flows, which are a separate, already-simpler surface.

**Note on this file:** this is a dated companion doc, in the same pattern as `P1-P2-CONTINUATION-2026-09-10.md` and `GO-NO-GO-STATUS-CHECK-2026-09-12.md`. It does not rewrite `V2-DELIVERY-ROADMAP.md`'s ~82KB body in place — this session has no local git checkout, and the GitHub Contents API can only replace a file's entire content, not append to it, so reconstructing 82KB byte-for-byte with no way to verify the reconstruction was lossless before overwriting the only copy was judged too risky (the same reasoning recorded in `GO-NO-GO-STATUS-CHECK-2026-09-12.md`). Whoever next edits `V2-DELIVERY-ROADMAP.md` from a local checkout should fold this file in as a dated section.

## 1. Screens mapped

| Route | Purpose | Orientation pattern already present? |
|---|---|---|
| `/app` (`page.tsx`) | Workspace dashboard | Yes — "Your next step" panel with milestone tracker, added in an earlier pass (`687fbd9b3ac8`, Sept 10) |
| `/app/requests/[id]` | Case detail | Yes — fixed 2026-09-12 (this was the screen already done before this pass started) |
| `/app/requests/[id]/receipt` | Decision receipt | Yes — tooltips added 2026-09-12 as a follow-up to the same fix |
| `/app/requests/new` | New request draft | Yes — sectioned form, plain language throughout, no flat-hierarchy issue found |
| `/app/team` | People and access management | Yes — role-definitions already collapsed into a `.disclosurePanel`, "Your effective access" summary leads the page |
| `/app/organization` | Org admin overview + billing | Partial — leads with an "Evaluation readiness" score/checklist (functionally equivalent to "Where this stands"), but a past-due billing status was buried in a definition list below the fold with no top-of-page flag. **Fixed this session.** |
| `/app/policies` | Policy/workflow rules | Yes — already splits "what's covered" from "what's not," plain language |
| `/app/security` | Authenticator recovery | Yes — short, single-purpose screen, no hierarchy issue |
| `/team/accept` | New member invitation acceptance | Yes — short, single-purpose, not a status screen |

Screens deliberately **not** touched, and why:
- `/developer`, `/institution`, `/institution/new`, `/workspace/[id]` (and its `/receipt`) — all gated behind `isLocalAuthoritySandboxAvailable()`, which returns `notFound()` when the local authority sandbox isn't available. These are local-dev-only sandbox routes, not reachable on production (`www.thepassageapp.io`). Out of scope for a live-product UI pass.
- `src/app/app/evidence/[id]/route.ts` — an API route (file download), not a UI page.
- MFA, RLS, Stripe processing, and reconciliation logic — explicitly out of scope; nothing here touched them.

## 2. Why most of this surface didn't need the case-detail treatment

Commit history shows the request-detail/receipt pair was the only place with the specific "people, documents, decisions, and admin controls at the same visual level" flaw. The dashboard, team page, and organization page already had a next-step panel, a disclosure pattern, and a readiness summary respectively, added in earlier passes (`Clarify workspace next steps and adopt outreach delivery plan`, Sept 10; `Use plain language across website and product guidance`, Sept 10; `Add pending request cancellation with shared receipts and replay checks`, Sept 11). Re-applying the same restructuring to screens that already have it would have meant wrapping legitimate, already-scannable content in unnecessary `<details>` panels for no real benefit — cosmetic churn rather than a genuine fix.

## 3. Fixes shipped this session

1. **`src/app/app/page.tsx`** — commit [`999e2178`](https://github.com/thepassageappio/thepassageappio/commit/999e2178f11d272af779d3e0f8cf397bbd9ae479). Added native `title` tooltips to the "Evaluation usage" and "Complete results" dashboard metrics, matching the tooltip pattern already used on the receipt page. Text is sourced from the exact counting rules in `lib/authority/evaluation-progress.ts` (a draft doesn't count as "usage"; "complete" means a decision was recorded) rather than approximated.
2. **`src/app/app/organization/page.tsx`** — commit [`c7343be1`](https://github.com/thepassageappio/thepassageappio/commit/c7343be1de59394fa726b3d46d3656a57bfaed33). Added a prominent alert at the top of the page (below the header/nav, above the readiness panel) when the entitlement status is `past_due`, visible only to roles with `billing.view` capability. Previously this fact was only visible in the "Plan and billing" definition list two sections down — exactly the "important fact buried among unprioritized details" pattern the request-detail fix addressed elsewhere. Links to the hosted invoice when available, or billing support otherwise, reusing copy/links already present later on the same page.

Both changes are presentation-only: no data fetching, Server Actions, MFA, RLS, Stripe, or reconciliation logic changed.

## 4. QA-REPORT-2026-09-09.md cross-check against current `main`

- **Nested/ambiguous consent checkboxes (onboarding organization step, `src/app/onboarding/organization/page.tsx`):** now a single checkbox with a single combined attestation sentence — no longer implies two separate consents behind one control. **Resolved on current `main`.**
- **Evaluation-agreement step exposing only 2 of 3 checkboxes to the accessibility tree (`src/app/onboarding/terms/page.tsx`):** now three fully separate `<label>`-wrapped checkboxes (`termsAccepted`, `privacyAcknowledged`, `dataUseAttested`), each independently focusable and labeled. **Resolved on current `main`.**
- **Raw `supabase.co` confirmation-link domain:** per Steve, this is documented as a config-only fix (Supabase Auth redirect setting), not a code change — not independently re-verified in this session since it isn't a code-level artifact.
- **Public marketing nav mobile overflow:** per Steve, already fixed. Not independently re-verified in this session; this pass focused on the authenticated app surface, not the public marketing site.
- **MFA enrollment blocker (P0) and `authority_private` RLS exposure (P0/P1):** unrelated to this UI pass (MFA/RLS explicitly out of scope) and already tracked/addressed elsewhere per `AUTHORITY-PRIVATE-ACCESS-MODEL-2026-09-13.md` and `GO-NO-GO-STATUS-CHECK-2026-09-12.md`.

## 5. What I could not verify live

I don't have credentials for the role-gated production app, so none of the above was confirmed by clicking through a live authenticated session — findings are based on reading the current `main` source directly via the GitHub API, which reflects exactly what's deployed once Vercel's auto-deploy picks up these two commits. I did not visually confirm the rendered tooltip or alert in a browser.

## 6. Verdict

The reviewer/admin surface as a whole is closer to "simplest enterprise experience" than the initial framing of this task assumed. The case-detail page was a real, isolated gap that's now fixed; the rest of the app had already absorbed similar polish over the prior few days (Sept 10–11 passes), so a second full restructuring pass would have been busywork. The two gaps that were genuine and worth fixing — unexplained dashboard metrics, and a payment problem that could hide below the fold on the one screen a bank's finance/IT stakeholder is most likely to open during a trial — are fixed. What's still short of the bar is everything already flagged as out of scope or unverified above: the public marketing nav and the branded-link config aren't independently re-confirmed here, and nothing in this pass was checked against a real, logged-in browser session.
