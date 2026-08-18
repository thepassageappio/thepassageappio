# Passage — vision, current status, CRM map, and updated plan (2026-08-17)

Status: connective synthesis document. It does not create new vision, new success metrics, or a second roadmap — everything in sections 1-3 is quoted or directly derived from documents that already exist and were previously owner-approved. What's new here is putting them in one place, tying current implementation status to them with evidence, and giving one updated, prioritized plan. The canonical roadmap remains `docs/product/operational-readiness-roadmap.md`; this doc points into it rather than replacing it.

**Why this doc exists.** The founder asked directly whether the team is "fully clear on mapped product plan, product vision, every page/button/persona interaction, and end state — CRM in relation to the full end-to-end platform map and product function — what's the end state and our definition of success." The honest answer was: yes, all of that has already been articulated by the founder in separate sessions, but it was scattered across five documents that don't reference each other, and the one document meant to track "where are we against it" (the readiness scorecard) had gone stale relative to two full work cycles of shipped product. This doc closes that gap.

---

## 1. End state (already defined — not new)

From `docs/product/passage-product-direction-session.md` (owner-approved direction session):

> Passage is the person-centered continuity and proof layer for the transitions before, during, and after a death.

Passage follows the *person* and the *permitted purpose* across planning, care, funeral-home operations, service partners, disposition, and aftercare — it does not belong to one stakeholder. It becomes indispensable by removing repeated intake, missing context, invisible waiting, fragmented communication, and unproven completion — not by data lock-in.

Five properties define the category (not a funeral-home ERP, not a memorial site, not a checklist app, not a marketplace):

1. One continuity record with viewer-relative, permissioned projections.
2. One task/event/proof vocabulary across every persona and integration.
3. Purpose-bound handoffs with sender, recipient, scope, expiry, provenance, acceptance.
4. Human-reviewed prepared work that reduces effort without fabricating execution.
5. Visible proof and recovery: what happened, who did it, when, who can see it, what failed, who acts next.

The end-to-end journey the product is building toward (same doc, section 3):

```
planning individual -> care/hospice team prepares a bounded handoff -> family sees one next
action -> funeral home accepts at a named location -> director assigns commitments -> task-bound
updates/decisions/proof move between permitted people -> service partners receive bounded
requests -> family receives verified outcomes, not operational noise -> aftercare and later
estate work continue from the same history
```

## 2. Definition of success (already defined, two layers)

**Layer 1 — go/no-go bar for "ready to pilot."** From `docs/product/operational-readiness-roadmap.md:74`:

> Passage becomes pilot-operational when an allowlisted funeral home and family can complete a real, durable handoff across independently authenticated people with least-privilege access, visible ownership, task-bound communication, structured proof, failure recovery, and support evidence.

This is explicitly *not* the same as "demoable" — a path can look 94% guided-ready and still be 40% operationally ready (real identities, RLS, audit, delivery/recovery all separately proven). The roadmap deliberately keeps these two numbers apart so a good demo never gets mistaken for a pilot-safe product.

**Layer 2 — north-star behavioral measures**, i.e. what "working" looks like once live (`passage-product-direction-session.md`, section 7): time from funeral-home sign-in to a correctly owned first case; time from family handoff to named acceptance; family wait-time without a visible owner; % of active commitments with owner/waiting-party/audience/proof-destination set; % of required proofs verified or in named recovery; messages/calls avoided because a receipt was already visible; director/staff time saved *measured in pilot use, not estimated from screens*; and the plainest one — can the family state what happens next and who owns it, without help?

Neither layer sets a revenue or customer-count target. That's deliberate — `docs/product/v5-direct-acquisition-and-digital-continuity-strategy.md` explicitly frames willingness-to-pay, conversion, and retention as **hypotheses to validate through a paid pilot**, not numbers to assert in advance. If you want a hard business target (e.g. "3 paying pilot funeral homes by <date>") laid on top of these, that's a real founder call — flagging it as open rather than inventing a number.

## 3. Revenue priority — the wedge sequence (already ranked)

From the V5 strategy doc's stack-rank (condensed to the top 3, which is what's actually being built right now):

| Rank | What | Why it's the current focus |
| --- | --- | --- |
| 1 | **Passage Zero funeral-home operating SaaS** | Revenue-engine foundation. Real buyer, real problem, active build. Everything shipped this session (Phase K/L, tonight's UX-audit fixes) is here. |
| 2 | **Director Right Hand / Transition Brief** | Near-term retention moat for the same buyer — workload, waiting, proof gaps, recovery, in one operating view. |
| 3 | **Family continuity / Transfer Pass** | Retention + expansion — converts the operator relationship into multi-person continuity before/during/after the professional handoff. |

Vendor marketplace, the Digital Continuity Locker, provider-sponsored distribution, and the V4 consumer network are all explicitly ranked lower and, per that doc's own allocation table, several are marked **"do not fund yet."** CRM (below) is instrumentation for whichever of these is currently being funded — right now, that's rank 1 and 2's buyer: the funeral-home director/owner.

---

## 4. Current status against the roadmap's own scorecard — and a real gap in the scorecard itself

`docs/product/operational-readiness-roadmap.md`'s "Verified baseline" table (line 156) is the single official readiness scorecard. As of this doc, it still reads:

| Path | Guided | Operational | Last dated evidence entry |
| --- | ---: | ---: | --- |
| Funeral home | 94% | 40% | 2026-07-26 |
| Family / D2C | 85% | 25% | 2026-07-26 |
| Vendor/partner | *not scored* | *not scored* | flagged missing since 2026-07-25 |

**This table has not been updated since 2026-07-26.** Since then, two full work cycles shipped and deployed to production: Phase K (task orchestration spine), Phase L.1-L.4 (vendor-visibility unification, family self-serve task completion, draft-and-send email engine, D2C checklist seeding), and tonight's full UX audit + 8-item fix pass (`/receive` auth gap, `/director/intake` misleading link, `/family` sandbox labeling, 4 dropped-query-param bugs, `/guides` false-success bug, upgrade-now CTAs on all 3 trial walls, vendor Payouts nav link). None of that is reflected in the scorecard above.

This is the same pattern the founder already called out tonight ("why do we keep walking backwards") applied to a second document — `docs/product/frontend-backend-contracts.json` went stale after Cycle 8 for the same reason: real work shipped, the tracking document didn't get updated alongside it. **Recommendation, not yet done:** a dedicated PM-pass to re-score the table against current evidence is warranted before treating 94%/40%/85%/25% as current truth, and vendor/partner should finally get its own scored row — it has a real, adversarially-tested MVP and still has no score.

What's true today, evidence-based, without waiting for that formal re-score:

- **Funeral-home director/staff path:** materially further than 40% operational. Task assignment, proof review, vendor request origination/payment, location creation with real upgrade gating, staff invitations/revocation, and now the full audit-driven trust/bug fix pass are all live in production with idempotent RPCs and RLS. The two-session live-Chrome proof-review loop was independently verified twice (roadmap, 2026-07-26 entry).
- **Family/D2C path:** materially further than 25%. Self-serve task completion, unified vendor-request visibility, draft-and-send email to relatives, and D2C checklist seeding (L.1-L.4) are all live. Costs/Decisions/Service sub-pages remain unbuilt (nav correctly disables them, but a direct URL 404s rather than showing a branded "coming soon" — Tier-4 item 14 in the UX map).
- **Vendor/partner path:** has a real, adversarially-tested MVP (request/quote/deliver/payout loop, Stripe Connect payouts, trial gating) but genuinely has zero formal readiness score — an actual gap, not just a stale number.
- **One deliberately unaddressed product question:** how a family manages estate members — children, spouses, other individuals tied to a case. Raised directly by the founder tonight, explicitly deferred — not designed or built. This needs its own scoping conversation before it's sized, not a quick answer here.

## 5. Full end-to-end platform map — every page, every button

Ground truth: `docs/product/full-product-ux-map-2026-08-17.md` — 44 `page.tsx` routes, every button/link/form on each, traced to its actual server action/RPC and every error-code branch (not inferred from the rendered UI). That document is the source of truth for "if I click X, what happens" — this section is a pointer plus what changed tonight, not a restatement.

**Persona journeys it covers, matching the end-to-end journey in section 1:**
- **Marketing/acquisition** (`/`, `/mission`, `/pricing`, `/guides`, `/blog`) → **signup/invite** (`/organization/start`, `/partner/start`, `/invite/[token]`, `/family-invite/[token]`) → **family/D2C** (`/family/*` sandbox, `/case/[id]/{today,tasks,messages}`, `/account/billing`) → **director/staff operations** (`/director/*`, `/staff/*`) → **vendor/partner** (`/partner/*`).

**What the audit found and what's now fixed (tonight, this session):** 3 Tier-1 trust risks (sandbox pages reachable with zero auth or misleading links — all fixed), 4 dropped-query-param bugs (error states silently swallowed — all fixed), the `/guides` false-success bug (fixed), the vendor-category display bug (investigated — turned out already fixed by an earlier migration, only a stale type annotation remained, corrected), all 3 upgrade-required trial walls now show a real "Upgrade now" button (was 1 of 3, now 3 of 3), and the vendor Payouts nav link (added). Full list and commit-by-commit evidence: `docs/product/operational-readiness-roadmap.md`, entries dated 2026-08-17.

**Still open from that same audit (Tier 3/4, not yet done):** `/director/team` can't grant a *new* location to an existing staff member (only toggle an existing grant); `/admin/organizations/new`'s non-admin screen is a dead end with no way out; a vendor "claimed by another organization" screen has no action; `/` vs `/mission` route the same two intents to two different funnels; Case Room's family-invitation link is plain text while staff-invitation's equivalent is clickable; `/blog/[slug]` has no back-link; `/login` gives no resend/cooldown feedback. None of these are trust risks or broken flows — they're consistency gaps, correctly ranked lowest.

## 6. CRM (HubSpot) — how it fits the platform, end to end

HubSpot is the acquisition/lifecycle instrumentation layer for the two buyers currently being funded (section 3, ranks 1-2): the funeral-home director/owner, and secondarily the vendor and D2C family. It is not itself a product surface — no page in section 5 renders HubSpot data back to a user. It is Contacts, Companies, Deals, Notes, and Tasks, written from `lib/hubspot.ts`, tied to the same events already driving the platform (signup, checkout, invite-accept, guide-unlock).

**What it tracks, mapped to the actual trigger event** (full detail in the background audit; grouped by event here):

| Business event | What lands in HubSpot | Lifecycle stage | Blocking on the user? |
| --- | --- | --- | --- |
| Funeral-home self-serve signup | Company (+ `number_of_locations`), Contact, a **Deal** ("Pilot Active" trial stage), a founder-follow-up **Task** | `funeralHomeDirectorOrEmployee` | No — fire-and-forget |
| Admin-assisted org creation | Company, Contact | `funeralHomeDirectorOrEmployee` | No |
| Vendor self-serve signup | Company (+ `vendor_category`), Contact | `vendorOwnerOrEmployee` | No |
| Staff/director invite acceptance | Contact | `funeralHomeDirectorOrEmployee` | No |
| Family/participant invite acceptance | Contact | `participant` | No |
| B2B Stripe checkout completes | Contact, **Deal** (New Business → closedwon), Company billing city/state | `funeralHomeDirectorOrEmployee` | No — result discarded on failure |
| D2C subscription/one-time checkout | Contact, Deal (New Business) | `customer` | No |
| Subscription renews | Contact, Deal (Renewal/Upgrade/Downgrade) | `customer` | No |
| Subscription cancels | Contact, Deal (Churn → closedlost) | `churnedSubscriber` | No |
| Public contact form (`/contact`) | Contact + Note | — | **Yes** — user sees "could not send" if HubSpot fails |
| Guide unlock (`/guides`) | Contact + Note (category "Guide lead") | — | **Yes** — fixed tonight to actually check and surface failure |

**Deal pipeline confirms the wedge priority in practice, not just in strategy docs**: `createTrialDeal`/`createNewBusinessDeal`/`createRenewalDeal`/`createChurnDeal` exist and fire specifically off the funeral-home and D2C billing lifecycle — there is no equivalent Deal-tracking for vendors (vendors get a Contact/Company only, no pipeline stage), which matches the wedge ranking: vendor marketplace is instrumented for visibility, not yet treated as its own revenue-tracked motion.

**Real gaps found by the audit, not yet fixed:**
- **Deal de-duplication is fragile.** `subscriptions.hubspot_deal_id`/`hubspot_contact_id` are stored (`supabase/migrations/20260816080000_...sql:25-26`) but nothing reads them back before creating a new Deal — dedup relies entirely on the outer `stripe_webhook_events` idempotency table, not on checking "does this subscription already have a Deal." Low risk today (webhook idempotency covers the common case) but worth closing before volume makes a webhook-replay edge case costly.
- **Inconsistent failure visibility.** Every HubSpot call except the contact form and guide-unlock is silent-fail (`.catch(() => null)`) — by design, so CRM tracking never blocks a real signup or payment, which is the right call. But it also means a funeral-home signup, a B2B checkout, or a subscription cancellation can silently fail to reach HubSpot with zero visibility to anyone that it didn't — this is UX-audit finding #13 (Tier 3), still open. Worth deciding whether at least Deal-creation failures should log somewhere a human checks (not user-facing — an internal alert/log), since a missed Deal means a real paying customer is invisible to sales/success follow-up.
- **Dead code.** `lib/billing/legacy-plan.ts`'s `hubspotSubscriptionStatus()` is never called — `hubspot.ts` hardcodes the two status strings inline instead. Harmless, worth deleting.
- **One stale audit claim, now corrected:** the UX map (line 26) says `/guides`' failure path is unhandled — that was true when the audit was written and is fixed as of tonight's commit `9e58597`; the CRM audit independently confirmed current code already checks the result.

**Founder-decision items from the 2026-08-16 full-system audit, still genuinely open** (not something to silently resolve): the entire `stripe` schema (29 tables) has RLS disabled and is exposed to the anon key shipped in client JS — needs a founder call between "add real RLS policies" vs. "revoke anon/authenticated grants entirely"; HubSpot has 16 funeral-home Company leads sitting at stage `lead` (5 original + 11 added 2026-08-16, source unconfirmed) that are unworked; GitHub has a shipped-but-unmerged messaging feature (PR #74) awaiting a merge decision; Vercel env vars beyond what this session touched were never fully enumerated.

## 7. Updated plan (prioritized, reconciling everything above)

**Now (small, unblocks trust in the numbers):**
1. Formal PM re-score of the readiness table in `operational-readiness-roadmap.md` against everything shipped since 2026-07-26, including a first-ever scored row for vendor/partner.
2. Founder decision on the `stripe` schema RLS exposure (real security question, sitting open since 2026-08-16).
3. Founder decision on HubSpot's 16 stalled leads and GitHub PR #74's disposition.

**Next (contained fixes, no architecture change):**
4. Remaining Tier-3/4 UX items: location-grant-to-existing-staff, `/admin/organizations/new` dead end, vendor "claimed by another org" dead end, `/` vs `/mission` funnel split, Case Room invitation-link clickability, `/blog` back-link, `/login` resend/cooldown.
5. Decide whether HubSpot Deal-creation failures need an internal (non-user-facing) alert, and add Deal-dedup via the already-stored `hubspot_deal_id` before it's relied on at higher volume.
6. Retroactive migration backfill — every migration since Phase J was applied straight to Supabase and never committed to git; repo and live database have diverged. Flagged repeatedly, not yet started, and it's the largest single piece of technical debt in the stack.

**Needs its own scoping conversation, not a quick build:**
7. **Family/estate management of multiple individuals** (children, spouses, other people tied to a case) — the founder's own direct question tonight, explicitly unanswered. This is a real product-design decision (data model, permissions, UI) big enough to warrant its own session, not a bolt-on.
8. L.5 (Decisions, Service, Costs family pages) — nav already reserves the slots; Costs specifically needs its own design pass before building, per the roadmap's own note.

**Deliberately not funded yet (per the existing, owner-approved wedge strategy — restated, not changed):** V4 consumer-directed network, Digital Continuity Locker beyond isolated prototypes, paid creator/community acquisition, provider-sponsored distribution beyond research interviews. Nothing in this session's work changes that allocation.
