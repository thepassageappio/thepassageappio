# User-initiated, multi-institution submission: scope and architecture

**Status:** planning/spec only. Nothing in this document has been implemented. No schema in this document has been applied. This is the basis for a follow-up implementation plan, not a substitute for one.

**Author context:** written at Steve's request after he confirmed, following pushback, that a requester (his example: a person and their grandmother) submitting a single POA-backed request that fans out to multiple institutions at once (their own bank, plus an insurer, plus several other banks, plus a funeral home) is table stakes for Passage Authority going forward.

**Legal boundary, restated:** Passage does not create, validate, or determine the legal validity of a power of attorney. It coordinates workflow and institutional review. Every recommendation below is written to preserve that boundary — nothing here has Passage adjudicate identity, authority, or capacity. Where a design choice could be read as crossing that line, it is called out explicitly.

---

## 0. What exists today, and why it doesn't support this

Confirmed by reading the schema and the only request-creation code path in the repo:

- `authority_records` has a required, single `organization_id` FK (`not null references public.organizations(id) on delete restrict`). One row is one institution's case, by construction.
- `authority_institution_decisions.authority_record_id` is `unique` — at most one institution decision per record. This is enforced at the database level and is doing real work: it is the guarantee that one institution's decision can never be read as another's.
- The only way an `authority_records` row is created is `authority_private.create_authority_draft_v1`, callable only by an authenticated user with an **active organization membership** in the target org, with role `owner`, `admin`, `staff`, or `reviewer` (`authority_private.assert_authority_record_operator`). There is no path for an unauthenticated requester, or a principal/representative, to create a record themselves. `DraftRequestForm.tsx` confirms this at the UI layer: it's rendered inside `/app/requests/new`, which requires the caller to already be signed in as institution staff, and it submits directly with the org's own `organization_id` from session context.
- Principals and representatives only ever get in through `authority_participant_invitations` → a one-time, hashed-token `participant_session` bound to one `authority_record_id` and one role. They never authenticate as themselves in any durable sense — possession of the emailed link is the entire "identity" check. That is a reasonable design *today* because the institution's own staff typed in those email addresses — the institution already has a KYC'd relationship with the account holder and is vouching, by writing the address into the form, that it's really their customer's address. That trust anchor disappears the moment a requester who is a stranger to the institution is the one typing in the emails.
- `organization_type` is a plain `text` column with an inline `check (organization_type in ('regional_bank','credit_union','elder_law_firm','authorized_service_organization'))` — not a Postgres enum. That's good news for extensibility (see §3), but the same literal list is duplicated in `authority_private.create_organization_v1`'s validation and (very likely, not yet confirmed in client code) in form validation — all copies have to move together.
- `authority_records.allowed_action_keys` is *also* a hard-coded `check (... <@ array['receive_duplicate_statements','discuss_service_issues'])`, and `authority_requirements` are seeded by a trigger that inserts exactly three fixed rows (`power_of_attorney`, `representative_certification`, `identity_evidence`) regardless of template. Today there is exactly one template (`ny_financial_poa`, enforced by name in `select_template_v1`). This means the action vocabulary and evidence checklist are financial-POA-shaped all the way down, not just the `organization_type` label.
- Evidence (`authority_evidence_artifacts`) and disclosure/consent capture (`authority_disclosures`) are both scoped 1:1 to a single `authority_record_id`. There is no shared "upload once, use for N cases" primitive anywhere in the schema.
- `docs/PARTICIPANT-AUTHORITY-PORTFOLIO-STRATEGY-2026-09-08.md` (PR #101) is explicitly labeled "not implemented, not a V2 launch gate." It sketches a *sequential*, participant-initiated, one-institution-at-a-time nomination flow (Phase C: "Allow a permitted participant to invite or nominate a receiving institution. Passage creates a new case..."). That is real prior art for identity/consent reasoning — its "four truths" framing (source authority / Passage relationship / institution recognition / downstream access must never collapse into one badge) and its `consent_grant` object are worth reusing — but it is not the same problem as true one-submission-to-N-institutions fan-out, and its own evidence bar ("one participant securely claims two unrelated Passage cases... institution A's decision is never presented as institution B's decision... invite abuse, duplicate identity, lost-device, deceased/incapacitated principal, and account-recovery paths fail safely") is stricter than anything this document proposes shipping in Phase 0.

---

## 1. Identity and consent model

### The actual new risk

In the current flow, Passage never independently verifies anyone's identity — it doesn't need to, because the institution already did that work before it ever typed an email address into `DraftRequestForm`. The new flow removes that anchor: a requester who is a stranger to every institution on their list is now the first party entering everyone's information, including principal and representative contact details, for institutions that have never seen any of these people before.

This is the actual thing that's new, and it's why this isn't a UI tweak: **Passage becomes, for the first time, the party that collects and distributes PII and authority claims to third parties, rather than a workflow layer sitting inside a relationship the institution already has.**

The goal is not to make Passage the arbiter of whether the POA is real or whether the requester truly has authority — that would cross the legal boundary. The goal is to (a) reduce fraud/abuse surface at the one new point of public entry, and (b) get informed, specific consent from the principal before their information goes to a named list of institutions, since Passage — not the institution — is now the first mover.

### Recommended minimum viable model

1. **Requester identity binding (proof of control, not proof of authority).** The requester verifies control of their own email before doing anything else — reuse the existing pattern (`email_confirmed_at` gate mirrored from `authority_private.current_actor_id`). This says "we know who clicked submit." It says nothing about whether they legitimately hold a POA. Consider optional phone verification as a second channel specifically because, unlike today, no institution has already vetted this person.

2. **Requester attestation of authority basis.** At submission, the requester affirms (a durable, versioned attestation record, structurally identical to today's `representative_certification` pattern in `authority_attestations`) that they hold the authority they're claiming and are authorized to disclose the principal's information to the institutions they've named. Passage records the attestation; it does not evaluate it. Same posture as today's representative certification.

3. **Principal notice-and-independent-confirmation, preserved per institution.** The existing model already has a real consent gate that's easy to miss: today, *both* principal and representative get separate one-time links and each must independently engage (evidence, certification) before an institution can decide — the institution can't act on the representative's say-so alone. Preserve this exactly, per spawned case: even though there's one submission event, each institution's resulting case still requires the principal to open their own link for *that* institution and be shown, in plain language, who is asking and what is being disclosed to that specific institution. This is the practical, non-legal-determination version of "consent" — it's notice plus an opportunity to object or not engage, not Passage certifying that consent was valid.

4. **The hard case: principal can't independently confirm.** The scenario that motivates this feature in the first place — a grandmother with a POA in place — is often exactly the case where the principal can't or won't separately click a confirmation link. The V3 doc lists "deceased/incapacitated principal" as a fail-safe path requiring validation before any public claim, and it's right to. Recommendation for MVP: don't gate the submission on the principal responding (a real POA is, by definition, sometimes used precisely because the principal can't act) — but do always send the principal-facing notice to whatever contact was provided, log whether it was opened, and make that open/no-open status visible to both the requester and every receiving institution's reviewer. This is a transparency and fraud-deterrence measure, not a consent-adjudication mechanism. **This is a judgment call, not an engineering fact — flagged as an open question for Steve in §7.**

5. **Anti-abuse throttling.** Rate-limit submissions per requester email/IP, and cap the number of *unmatched* (never-before-seen-by-Passage) institutions a single submission can target before requiring manual review — a stranger fanning a claim out to twenty institutions in one shot is a different risk profile than fanning out to three.

6. **What Passage explicitly still does not do:** verify the POA document's legal sufficiency, confirm the representative's actual legal authority, confirm the principal's capacity, or represent any of the above to a receiving institution. Every institution decision is still made independently, on its own evidence review, exactly as today. Copy should reuse the existing boundary language verbatim (e.g., the receipt snapshot's `"Passage did not create legal authority or provide a legal opinion"`).

---

## 2. Data model

### Constraint to preserve, not relax

`authority_institution_decisions.authority_record_id unique` is correct and should not change. It is the mechanism that makes "institution A's decision never leaks into institution B's" true by construction rather than by application logic. The right design keeps this constraint completely untouched and instead adds a layer *above* `authority_records`, not a loosening of what's below it.

### New tables (additive; nothing below requires touching `authority_institution_decisions`)

**`authority_submission_groups`** — one row per requester submission event.
- `id`
- requester identity: `requester_name`, `requester_email_normalized`, `requester_relationship` (e.g. representative / principal-self / other), attestation fields (mirrors `authority_attestations` shape)
- shared participant fields captured once: `principal_name`, `principal_email_normalized`, `representative_name`, `representative_email_normalized`
- `status` (`draft`, `notice_sent`, `fanned_out`, `partially_decided`, `complete`, `withdrawn`)
- **not** owned by an `organization_id` — this spans institutions by design. Needs its own access model (see below).

**`authority_submission_group_targets`** — one row per institution the requester named.
- `id`, `group_id` FK → `authority_submission_groups`
- `organization_id uuid` — **nullable**. Populated only once matched to a real Passage organization.
- `target_label` (free text as typed, e.g. "Third National Bank") and `target_institution_type` (as the requester perceives it — not necessarily a real `organization_type` value yet)
- `match_status` (`matched`, `unmatched`, `invited_to_join`, `declined_to_join`) — this is the "unknown institution" holding state the prompt asked about; it exists as a first-class value from day one even if Phase 0's UI never exposes the unmatched path (see §5)
- `authority_record_id uuid` — **nullable**, populated only once a case is actually spawned for a matched target

**One new nullable column on the existing table:** `authority_records.origin_group_id uuid references authority_submission_groups(id)`. Existing institution-initiated records are unaffected (`null`); fan-out–spawned records point back to their group for traceability and for the "this case originated from a multi-institution submission" UI badge. This is the only change to `authority_records` itself — no change to its `organization_id not null` constraint, no change to its shape otherwise.

**`authority_submission_group_evidence`** — mirrors `authority_evidence_artifacts` but keyed to `group_id`, holding the one shared upload (POA document, identity evidence) the requester provides once.

### How evidence reuse works without weakening isolation

Recommended approach: **copy, don't share, at spawn time.** When a target is matched and a per-institution `authority_records` row is created, copy the relevant `authority_submission_group_evidence` row(s) into ordinary `authority_evidence_artifacts` rows scoped to that new `authority_record_id` (same underlying storage object reference, new metadata row). Each institution's reviewer then accepts/flags/redacts on its own independent copy exactly as today — no new cross-institution query surface, no new RLS policy that has to get the isolation boundary right under pressure. The cost is some storage-metadata duplication; the benefit is that every existing evidence-review, decision, and audit code path is completely untouched and the "don't let one institution's decision leak into another's" requirement is satisfied by the existing schema shape, not by new policy that could be gotten wrong.

### Access model for the new tables

Neither the requester nor the group has an `organization_memberships` row — this doesn't fit the existing RLS pattern (`authority_private.has_active_membership`). Two options:

- **Session-token pattern** (recommended for MVP, consistent with the zero-friction posture the product already has for principals/representatives): a hashed token bound to `group_id`, same shape as `authority_private.participant_sessions`. No new account type.
- **Lightweight `auth.users` account** for the requester, so `created_by` can work the way `organizations.created_by` does today. More durable, sets up the V3 portfolio vision naturally, but adds real signup friction to a flow whose entire pitch is "submit once instead of repeating intake everywhere."

Recommend starting with the session-token pattern and treating the account-based version as a Phase 3+ question, explicitly not foreclosed by anything in Phase 0's schema.

---

## 3. New institution types

The `organization_type` check is a plain inline `text` constraint, not an enum — extending the allowed list is a normal `alter table ... drop constraint ... add constraint ...` migration, not an enum-migration exercise. That part is cheap. But three things make "add insurance and funeral-home types" bigger than it looks:

1. **The list is duplicated.** `public.organizations`'s check constraint and `authority_private.create_organization_v1`'s inline `if p_organization_type not in (...)` validation both hard-code the same four values. Both have to move together or org creation for a new type will fail even though the table would accept the row. There is almost certainly a third copy in client-side form validation (not confirmed by reading, but consistent with how this codebase mirrors DB checks in app code) that also needs to move.
2. **The real cost isn't the type label — it's the action vocabulary.** `authority_records.allowed_action_keys` is hard-limited to two financial-account-specific actions (`receive_duplicate_statements`, `discuss_service_issues`), and `authority_requirements` are seeded by a trigger that inserts a fixed three-item checklist (POA document, representative certification, identity evidence) regardless of institution type. An insurer case needs different actions ("discuss claim status," "authorize release of policy information") and a funeral home case needs different ones still ("authorize release of remains," "select disposition options") — these aren't small copy changes, they're new template definitions with their own legally-reviewed action vocabulary and evidence checklist per institution type, plus a way to seed the right checklist for the right template (today `authority_private.seed_authority_requirements_v1` doesn't even branch on template — it always inserts the same three rows).
3. **Template selection is currently a single hard-coded whitelist entry.** `select_template_v1` explicitly checks `p_template_key <> 'ny_financial_poa'` and rejects anything else. Onboarding a new institution type means either extending that whitelist with a genuinely new, separately-reviewed template, or (cheaper, and viable for Phase 0/1) letting new-type institutions use the existing financial-POA template and action set as a placeholder, which is honest about scope but not a real insurer/funeral-home product yet.

**Recommendation:** treat "new institution types" as two separable pieces of work with very different cost. Extending `organization_type` to accept a new label is a small, mechanical migration. Giving that new type its own legitimate action vocabulary, evidence checklist, and template is a legal-content project as much as an engineering one — it needs the same kind of review the NY financial POA template presumably got, because "what can Passage legitimately ask a funeral home to treat as sufficient authority" is a materially different legal question from financial account access, with different state-law bases. Don't schedule the second piece as if it were the same size as the first.

---

## 4. Requester-facing UI

### New surface

A public, unauthenticated (or lightweight-verified) entry point outside `/app/*` — that path space is gated on organization membership and shouldn't be reused. A wizard:

1. Requester identity (email verification, optional phone).
2. Principal + representative details — same fields as today's `DraftRequestForm` (name/email pairs), reframed as "who you're requesting on behalf of."
3. Shared evidence upload (POA document, identity evidence) — reuse the existing upload component, storage bucket policy, and sha256-hashing pattern, pointed at the new group-level evidence table instead of a record-level one.
4. Institution list builder — search existing active Passage organizations by name (autocomplete against `public.organizations`), or add one not yet listed (free text + perceived type), which creates an `unmatched` target row.
5. Review-and-consent screen — same "minimum necessary disclosure" pattern already used in `authority_disclosures`, but explicit per named institution: exactly which fields go to exactly which institution, plus the requester's attestation from §1.
6. Submit → creates the `authority_submission_groups` row and its targets, and for every already-matched target, spawns a draft `authority_records` row in `awaiting_principal`/`awaiting_representative` status exactly as today, reusing the existing invitation and participant-session machinery unchanged per spawned case.

### Reuse vs. new build

Everything downstream of "a draft `authority_records` row now exists" is untouched: invitation issuance, participant sessions, evidence upload/review, representative certification, disclosure capture, institution decision recording, receipts, lifecycle (revoke/expire), the append-only event log. The multi-institution part lives entirely in the new front-door wizard and the two new grouping tables.

The one institution-side addition needed: a read-only banner on the existing case-detail/review screen, sourced off `authority_records.origin_group_id` — "this case is one of N institutions this requester submitted evidence to; this institution's decision is independent." No new decision logic, no new reviewer workflow.

**Explicitly out of scope for this phase:** a self-serve flow for an `unmatched` institution to onboard itself in response to being named by a requester. That's a sales/onboarding motion (mirrors the V3 doc's Phase C, "introduce another institution"), not a build-now item.

---

## 5. Phasing

**Phase 0 — smallest version that proves the mechanic.**
- Cap N institutions per submission at 2–3.
- Only allow targets that are already active Passage organizations — org search/autocomplete only, no free-text "institution not listed" path exposed in the UI. This sidesteps the entire "unknown institution" problem for v0 by construction.
- Build `authority_submission_groups`, `authority_submission_group_targets` (build the `match_status`/nullable-`organization_id` columns now even though the UI never sets them to `unmatched` yet — cheaper to include at table-creation time than to add later), and the single nullable `origin_group_id` column on `authority_records`. No change anywhere to `authority_institution_decisions`.
- Evidence: copy-on-spawn, one shared upload step in the wizard.
- Identity: requester email verification, requester attestation, principal notice email, and the existing dual-participant-session gate preserved per spawned case.
- All targets use the existing NY financial POA template and action vocabulary — no new institution types yet. This means Steve's own worked example (bank + insurer + funeral home) can't fully run in Phase 0; the fan-out *mechanic* can be proven end-to-end using "their own bank plus several other banks," which is most of the immediate value anyway.
- Rough effort: medium. One new public route plus wizard, two new tables and one new nullable column, roughly 90% reuse of existing invitation/evidence/decision code paths. Comparable in size to one of the existing gate migrations (e.g. `authority_representative_submission` or `authority_participant_access`) plus new frontend work.

**Phase 1 — unmatched institutions.**
- Expose the free-text "institution not listed" path in the wizard; add an ops-facing matching queue and requester-visible status ("we're reaching out to X — not yet a Passage institution"). Schema doesn't need to change if Phase 0 built the `match_status`/nullable columns as recommended above — this is mostly workflow and ops tooling, not new tables.
- Rough effort: medium, ops/workflow-heavy rather than schema-heavy.

**Phase 2 — new institution types.**
- The organization_type extension itself is small. The real work is template/action-vocabulary generalization: new legally-reviewed action vocabularies and evidence checklists per new type, a way to seed the right checklist for the right template (today's seeding trigger doesn't branch on template at all), and extending the template whitelist. This is as much a legal-content project as an engineering one.
- Rough effort: large, and gated on legal/compliance input, not just engineering time.

**Phase 3 — full vision.**
- Self-serve institution "claim your case" onboarding when named by a requester (V3 doc's Phase C). Reconsider whether the additive `origin_group_id` approach still holds at scale, or whether the V3 doc's fuller relational model (`institution_recognition_case`, `scope_snapshot`, `consent_grant`, `party`, `participant_account`) is warranted. The V3 doc's own evidence bar for this territory (duplicate-identity resolution, wrong-party denial, coercion/reporting recovery, account recovery) is explicitly unmet by anything in Phases 0–2 and would need to be met before any public claim about this capability.
- Rough effort: large, and speculative — the V3 doc itself labels this territory "not implemented, not a V2 launch gate."

---

## 6. Gate impact

Steve's standing rule: P1 (controlled outreach) and P2 (Stripe hardening, reconciliation, MFA, legal review) must **both** be done before any selling or demos.

This capability is not in scope of either P1 or P2 as described — it's new, customer-facing, legally-adjacent product surface, not part of controlled-outreach mechanics or the Stripe/reconciliation/MFA/legal-review hardening list. My recommendation, **for confirmation, not as a decision already made**: this should be sequenced **after** the P1+P2 gate closes, as its own explicit gate rather than folded into either existing one. Reasoning:

- It's the first time Passage collects PII and authority claims directly from an unvetted public party rather than from institution staff who already KYC'd their own customer. That's a materially different risk profile from anything currently gated by P2, and it's very unlikely that P2's "legal review" line item was scoped to cover a public multi-institution intake surface that didn't exist yet when that gate was defined — so even after P1+P2 close, this needs its **own** legal/compliance review pass specific to public-intake consent and fraud/abuse exposure, not an assumption that P2's review already covers it.
- Building this before P1 (controlled outreach) is proven risks exactly the failure mode the gate exists to prevent: new public-facing surface shipping or getting demoed before the more foundational trust and compliance work is validated.
- The V3 doc's own evidence bar for anything in this territory is stricter than P1/P2's checklist (duplicate-identity resolution, wrong-party denial, coercion/reporting, deceased/incapacitated-principal handling) — meeting P1+P2 doesn't automatically mean this feature's specific risks are covered.

**This is explicitly a recommendation, not an assumption that it "just slots in."** If Steve wants Phase 0 built or prototyped in parallel with P2 purely for internal design validation — not demoed, not sold, not shown to any prospect or pilot institution — that's a different and much lower-risk statement than "ship this before P1+P2 close," and worth saying explicitly rather than leaving ambiguous.

---

## 7. Open questions for Steve

- **Incapacitated-principal path.** Should Passage gate a spawned case on the principal opening their notice link, or only log open/no-open status without blocking? A real POA is often used precisely because the principal can't independently confirm anything — this is a product-and-risk judgment call, not something the schema can decide.
- **Caps.** What's the actual N-institution cap for Phase 0 (this doc assumes 2–3), and what's the anti-abuse rate limit per requester/IP?
- **Unmatched-institution outreach.** Should Phase 1's "we're reaching out to X" be an automated growth/marketing motion, or strictly manual ops review before any outreach happens? These have very different fraud and reputational-risk profiles.
- **Institution-type legal review.** Does the insurer/funeral-home action vocabulary and evidence checklist need a per-state legal review pass comparable to whatever the NY financial POA template went through, before Phase 2 starts, or can that happen concurrently with engineering work?
- **Requester account model.** Session-token (no account, matches today's zero-friction principal/representative UX) vs. lightweight `auth.users` account (more durable, sets up the V3 portfolio vision, adds signup friction to a flow whose whole pitch is reduced friction) — worth deciding before Phase 0's schema is finalized, since it changes the access-control shape of `authority_submission_groups`.
- **Billing.** `founding_pilot_billing_v1` exists and this document doesn't touch it, but multi-institution fan-out changes unit economics — is this priced per institution-decision, per requester submission, per organization, something else? Needs to be reconciled with finance before this capability is sold, separately from the engineering gate question in §6.
- **Gate sequencing confirmation.** Does Steve agree with treating this as its own post-P1+P2 gate (§6), or is there a narrower parallel-track version (internal prototyping only, not sold or demoed) he'd want considered instead?
