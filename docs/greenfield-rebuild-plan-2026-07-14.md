# Greenfield Rebuild Plan -- 2026-07-14

Owner directive this covers: "It's ok to break things, the backend needs to follow the frontend, I gave it greenfield permission, as long as we are clear on what needs to be done backend to keep up let's make sure it's clear... I want this greenfield now, redo the whole thing, I'm not happy." Plus the design-direction refinement (warm + modern/millennial/Gen-Z + funeral-home-credible, not literal dark-mode-tech) and the QR Transfer Pass feature request. Also covers the quality bar set immediately after: "enterprise grade, end to end seamless... an experience fully mapped out with dependencies and how this puzzle picture fits together."

This is a plan. Nothing described below as "proposed" has been built. Per the owner's own condition on backend authorization -- "let's make sure it's clear" -- every schema change below is listed with what it is and why before any migration is applied.

## 1. System map

A visual end-to-end persona/dependency map was generated and shown this session (title: `passage_persona_journey_dependency_map`), covering Family red path, Family green path, Funeral Home Director, Funeral Home Employee, Vendor, and Participant, with the cross-lane dependencies between them and the QR Transfer Pass arc threading Hospice -> Funeral Home -> Cemetery -> Vendors -> Estate. Key dependencies it makes explicit:

1. A family cannot reach "funeral home connected" until a director approves the request on their end -- that is a real handoff, not automatic.
2. A vendor only ever sees the one scoped request a director or family task creates -- never the family record, never other cases.
3. Green-path records stay dormant (wishes/docs only) until two trusted contacts confirm activation -- that confirmation is what turns a planning record into an urgent/red-path record.
4. A funeral-home employee's proof-save is the only thing that flips a family-visible task from "waiting" to "handled" -- there is no separate family-side completion action.

This map should be treated as the reference architecture for sequencing the rebuild below: pages/components that sit on more than one lane (the estate record, task spine, notification log) are the highest-leverage rebuild targets because fixing them once improves every persona that depends on them.

## 2. Frontend rebuild scope (supersedes the re-skin approach)

Per `docs/redesign-diagnosis-2026-07-14.md`, the re-skin approach (byte-identical content, new colors/fonts/shadows only) is retired for remaining work. Remaining Tier 2 surfaces get real IA rebuilds:

| Surface | Current state | Rebuild target |
|---|---|---|
| `pages/estate.js` (313KB) | 5+ simultaneous panels visible on load, pre-Threshold cards | One record, one primary next-action visible by default, stage grid/notification log/prepared-outputs moved behind progressive disclosure (tap to expand), matching the IA doc's "drawer, not full navigation" instruction |
| `pages/urgent.js` (76.3KB) | Good progressive-disclosure question flow, but pre-Threshold visuals, siren-red "Minutes" card | Keep the proven one-question-at-a-time pattern; apply Threshold visual system in full (Fraunces, real shadows, clay not rose for urgent framing) |
| `pages/planning.js` | 12-field wall in one screen despite Threshold tokens already present | Break into 2-3 field steps (name + one trusted contact first), rest genuinely deferred to "inside the estate" as the page's own copy already promises |
| `pages/funeral-home/dashboard.js` (449KB) | 156 hardcoded Georgia instances, duplicate stat block, staff/director views nearly indistinguishable | Real extraction (punch list from run 9 still valid, verified to exist this session via targeted grep) into `components/funeral-home/dashboard/*.js`, Threshold re-skin, de-duplicated stat block, visually distinct staff-first queue vs. director console |
| `components/App.js` (335KB) | Live/dead status still unverified since run 2 | First action: confirm whether this is live-routed anywhere; if dead, remove; if live, PM-scope like the others |

**Tooling constraint, stated plainly:** this session has no working code-execution shell (`mcp__workspace__bash` confirmed unavailable, multiple attempts, multiple sessions). Files under roughly 100KB can be fetched, edited, and rewritten directly through the GitHub API (proven this session: `lib/typography.js`, `pages/_document.js`, `AGENTS.md`). Files at estate.js/dashboard.js/App.js scale cannot have their full modified content produced in a single response -- the safe path for those three specifically is a GitHub Actions-based extraction (a real Node environment with no context-window limit), which was scoped but not completed this session; recommending it be the first concrete engineering task of the next session focused on Tier 2.

## 3. Backend schema changes -- explicit list, per the owner's "let's make sure it's clear" condition

Checked against the live schema via the Supabase MCP (project `qsveqfchwylsbncsfgxe`, 58 tables in `public`) before proposing anything, so this isn't guessed:

| Change | What | Why the frontend needs it | Status |
|---|---|---|---|
| `estate_access.role` add `support_view` | New enum value | Admin Portal "view/impersonate as" flow from `docs/redesign/06-admin-access-demo-instance.md` needs a role that grants read access with audit logging, distinct from `operator` | Not started -- needs a real migration via Supabase MCP `apply_migration`, plus the impersonation UI and audit log to actually use it |
| QR Transfer Pass: expiring handoff tokens | New table, tentatively `transfer_pass_tokens` (id, workflow_id, issued_by, scope/what's-shared, expires_at, redeemed_by, redeemed_at, revoked_at) | Nothing in the current schema stores a short-lived, scoped, family-issued token. `provider_handoffs` (existing, 0 rows) is adjacent but is FK'd to `workflow_id`/`organization_id`/`requested_by` only -- it models an internal handoff request, not a family-controlled expiring credential a third party scans | Not started -- see Section 4 |
| QR Transfer Pass: consent/audit trail | New table, tentatively `transfer_pass_consents` (id, token_id, actor, action [issued/viewed/accepted/revoked/modified], recipient_org_id, occurred_at, note) | Owner's own requirement: "tracks consent/changes over time." `activation_requests`/`activation_confirmations`/`activation_witnesses` exist but are scoped to the warm-to-red activation trigger, a different concept -- reusing them would conflate two different consent flows | Not started -- see Section 4 |
| `provider_handoffs` -- extend, don't replace | Add columns for scope/expiry if the hospice-side of QR Transfer Pass reuses this table | Avoids a duplicate concept for the hospice -> funeral-home leg specifically, since `provider_handoffs` already exists for that relationship | Needs a real decision: reuse-and-extend vs. new table, made before migration, not during |

No migrations have been applied. This table is the "what and why" list the owner asked to see before anything runs.

## 4. QR Transfer Pass -- PM scope

**What it is, per the owner:** a family-controlled, portable record families bring to a funeral home (or hospice, cemetery, vendor, estate admin) for fast, accurate intake without repeated storytelling. The differentiator is not the QR mechanism -- it's a trusted, consented, portable record that tracks changes over time and surfaces only what's still missing, continuing across Hospice -> Funeral Home -> Cemetery -> Vendors -> Estate.

**V1 scope (owner's own words):** expiring QR code/handoff token, family approval/consent flow, mobile funeral-director scanning view, downloadable standardized intake packet. Framed as pilot-ready with a handful of funeral homes, not a full expensive integration build.

**Proposed flow:**
1. Family (from inside their estate record) selects "Share with a provider," picks what's included (contact info, service preferences, documents, medical/authority context -- granular, not all-or-nothing), and generates an expiring token + QR code. This writes one row to `transfer_pass_tokens` and one `issued` row to `transfer_pass_consents`.
2. Funeral-home staff scan the code from a mobile-first scanning view (new route, e.g. `/funeral-home/transfer-pass/scan`). Scanning logs a `viewed` consent event; accepting the handoff logs `accepted` and links the token to their case/workflow.
3. The intake packet (downloadable, standardized) is generated from the same estate-record fields the family already granted, not re-entered -- this is the "no repeated storytelling" promise.
4. Any later change to the shared scope (family revokes, adds, or the token expires) writes a new consent-trail row, so the funeral home always knows if what they have is current.
5. The same token/consent model is designed to extend to cemetery, vendors, and estate admin (per the owner's "continuing across" framing), but V1 ships funeral-home-only per his own "pilot-ready, not full integration build" scope note.

**Acceptance criteria (draft, for the next PM Sprint Brief):**
- A family can generate a scoped, expiring token from their estate record and see exactly what's included before sharing.
- A funeral-home staff member can scan/accept the token on a mobile view and see the shared intake packet immediately, with no separate account needed for the family side.
- Every issue/view/accept/revoke/expire event is visible in an audit trail the family can see.
- Nothing is shared until the family actively generates and shares the token -- no passive/automatic sharing.
- The V1 packet download works without requiring the cemetery/vendor/estate-admin legs to exist yet.

## 5. Compliance flags -- QR Transfer Pass copy is NOT cleared to ship yet

Per AGENTS.md's Agent Permissions section, "material legal, compliance, privacy, security, medical, or funeral-director claim changes" is an explicit owner-gate. Checked the owner's own claims against current authoritative sources before letting any of this reach product copy:

**HIPAA and funeral directors -- the owner's claim is directionally correct, with real nuance that matters for exact copy:**
- HHS's own guidance (45 CFR 164.512(g)) confirms covered entities may disclose PHI to funeral directors, "consistent with applicable law," as necessary to carry out their duties -- including disclosures made *before* death, in reasonable anticipation of it. This is a real, narrow exception, not a blanket "funeral homes can access medical records" rule.
- The 50-year post-mortem protection period the owner cited is accurate per HHS.
- Funeral homes themselves are generally **not automatically HIPAA covered entities** -- the exception above applies to what a covered entity (e.g. a hospice, hospital) may disclose *to* a funeral director, not a blanket status for the funeral home. Any product copy implying "we are HIPAA compliant" or "this is HIPAA-authorized sharing" needs to be precise about which party's obligation is being described.
- Beyond the funeral-director exception, further disclosure needs written HIPAA authorization from the decedent's personal representative -- meaning QR Transfer Pass's own consent flow (family generates and scopes the share) is doing real legal work here, not just UX -- it should be built to actually function as that authorization, not just gesture at consent.
- Sources: [HHS.gov -- Health Information of Deceased Individuals](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/health-information-of-deceased-individuals/index.html), [HHS.gov -- Decedents FAQ](https://www.hhs.gov/hipaa/for-professionals/faq/decedents/index.html), [Bricker Graydon -- 164.512(g) decedents](https://www.bricker.com/insights/resources/key/HIPAA-Privacy-Regulations-Uses-and-Disclosures-for-Which-an-Authorization-or-Opportunity-to-Agree-or-Object-is-Not-Required-Decedents-164-512-g).

**Authority to act / disposition permits -- the owner's caution is confirmed correct and this is a real, live legal-risk area:**
- Who has legal authority to make funeral/disposition decisions is genuinely state-specific. Many states use a priority order (person named in a signed written instrument, then spouse, then next of kin by degree), and several states impose real time limits on that authority (commonly ~10 days for a spouse, ~7 days for other next of kin, before rights can expire/pass to the next person in line).
- Disposition (burial/cremation) generally requires a permit issued by a local/state authority plus a signed death certificate -- these are jurisdiction-specific government processes Passage does not replace and must not imply it replaces.
- QR Transfer Pass must not imply that generating a token or completing intake constitutes legal authorization to act, a valid disposition permit, or a substitute for the funeral home's own required identity verification and contracts. It is a communication/intake tool, not a legal-authority tool.
- Sources: [Funeral Consumers Alliance -- State by State: Assigning an Agent to Control Disposition](https://www.funerals.org/your-rights/state-by-state-rights/state-by-state-assigning-an-agent-to-control-disposition/), [Tulip Cremation -- Who Decides? State Laws Vary on Next of Kin](https://www.tulipcremation.com/articles/tulip-expert-guides/death-resources/who-decides-state-laws-vary-on-next-of-kin.html).

**What this means for shipping:** the feature (token generation, scan/accept flow, packet download, consent audit trail) can be built now -- none of that requires unverified legal claims. The exact marketing/product copy describing *what the sharing legally means* (any sentence resembling "this satisfies HIPAA," "this authorizes the funeral home to act," or naming a specific state's time limits) needs a named-attorney or compliance review before it ships, not just this session's web research. Recommending the copy default to plain, non-legal language ("the family chooses exactly what to share, and can see who's seen it and when" rather than any compliance-standard claim) until that review happens.

## 6. Reporting standard going forward

Per the owner's explicit instruction: every future progress report on this initiative includes real screenshots of what shipped, not just a verified-live claim in text.

## Next actions, in order

1. Own the tracker: add QR Transfer Pass and the retired-re-skin-approach note to `docs/redesign/12-threshold-rollout-tracker.md`.
2. `estate.js` IA rebuild (highest-leverage single page per the system map -- both family paths depend on it).
3. `provider_handoffs` reuse-vs-new-table decision for QR Transfer Pass, then the two new tables via a real Supabase migration.
4. `funeral-home/dashboard.js` extraction via a GitHub Actions-based approach (script/workflow scoped, not yet executed).
5. QR Transfer Pass V1 build: token generation UI (family side) + scan/accept UI (funeral-home side) + packet download, with compliance-safe copy per Section 5.
