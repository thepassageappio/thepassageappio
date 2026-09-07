# Vendor-risk assurance packet

**Date:** September 7, 2026
**Prepared for:** Bank/credit-union procurement and vendor-risk review, and outside counsel, ahead of P2 (production-hardening gate)
**Prepared by:** Product/engineering, from the repository's own source code, database migrations, and internal documents
**Status:** Prep packet only. This is a self-assessment built directly from the current codebase, not a third-party audit, penetration test, or certification. Every control claimed below is cited to a specific file, migration, or table so it can be independently verified — nothing here should be represented to a buyer as certified or independently attested until the gaps in Section 3 are closed.

This packet exists so that once a pilot institution's procurement or vendor-risk team asks "what security controls does Passage actually have," there is an accurate, source-cited answer ready — separate from what's still outstanding. Section 2 documents what is real and verifiable in the codebase today. Section 3 is an explicit, non-euphemistic gap list. Section 4 is the scoped privacy review. Nothing in Section 2 should be read as a claim that these controls have been independently tested or certified — only that they exist in the code as described.

---

## 1. Scope and method

This review covers the `thepassageappio/thepassageappio` repository, branch `agent/founding-pilot-billing`, as of September 7, 2026. Findings come from direct inspection of Supabase/Postgres migration files (`supabase/migrations/`), application source (`src/app`, `src/lib`), and the product's own public security page (`src/app/security/page.tsx`), which is itself a useful cross-check — the product's public copy already states plainly what is and isn't done today, and this packet agrees with that page's own gap list rather than contradicting it.

No infrastructure scan, penetration test, or third-party control testing was performed to produce this packet. It is a code and configuration review only.

---

## 2. Security controls confirmed in place today

### 2.1 Authentication

**Institution/organization users** (owner, admin, staff, reviewer, developer, auditor roles) authenticate through Supabase Auth:
- Default path is email one-time-password / magic link (`requestSignInAction` in `src/app/account-actions.ts`, calling `supabase.auth.signInWithOtp`).
- Google OAuth is available as an alternate path, gated behind an environment flag (`isGoogleSignInEnabled()`, `src/lib/supabase/config.ts`) and handled at `src/app/auth/confirm/route.ts`.
- No password-based authentication exists in the codebase — this removes an entire class of credential-stuffing and password-reuse risk by design, not by policy.
- A database-level gate additionally requires a confirmed email (`auth.users.email_confirmed_at is not null`) before any privileged database function will execute on a user's behalf (`authority_private.current_actor_id()`, migration `20260828211255_authority_gate_1_foundation.sql`).

**Principals and representatives** (the account holder and the person acting for them, who never create accounts) authenticate through single-use, expiring, role-bound invitation links rather than passwords or Supabase sessions:
- A random 32-byte token is generated per invitation; only its SHA-256 hash is ever stored in the database (`authority_private.participant_invitation_secrets.token_hash`), so the raw token cannot be recovered from a database compromise (migrations `20260829054002_authority_participant_access.sql`, `20260829050156_authority_trial_activation.sql`).
- Invitation links expire after 72 hours.
- Once redeemed, a separate session token is minted (also stored only as a hash) and capped at 30 minutes, bound to the specific request record and the specific participant role.
- The database's anonymous access role is restricted to exactly four security-definer functions — an anonymous request cannot query application tables directly, only pass through those four narrow, purpose-built entry points (migration `20260902023000_authority_participant_anon_boundary.sql`).
- This mechanism is accurately described in the product's own public copy: "A private link protects access. It does not prove identity" (`src/app/security/page.tsx`) — the link authenticates *possession of the invitation*, not the participant's real-world identity. Identity verification remains the institution's responsibility, consistent with the product boundary in the companion legal-review packet.

### 2.2 Row-level security (RLS)

RLS is enabled and forced (`force row level security`) on the core application tables, with named policies confirmed in the migrations, including:

- `organizations_member_select`
- `memberships_authorized_select` (the same policy referenced in the September 6 persona-audit fix in `docs/V2-DELIVERY-ROADMAP.md`)
- `invitations_manager_select`
- `terms_documents_public_select`, `terms_acceptances_authorized_select`
- `template_selections_member_select`
- `audit_events_authorized_select`
- `authority_requirements_member_select`, `authority_evidence_member_select`, `authority_attestations_member_select`
- `organization_entitlements_member_select`, `authority_usage_events_authorized_select`, `authority_participant_invitations_authorized_select`

Tables with confirmed RLS policies include: `organizations`, `organization_memberships`, `organization_invitations`, `terms_documents`, `organization_terms_acceptances`, `organization_template_selections`, `organization_audit_events`, `authority_requirements`, `authority_evidence_artifacts`, `authority_attestations`, `organization_entitlements`, `authority_usage_events`, and `authority_participant_invitations`.

Base table privileges are also revoked and selectively re-granted (`revoke all on all tables in schema public from anon, authenticated`), so RLS policies are not the only layer — a policy misconfiguration would not by itself expose data to a role that was never granted table access in the first place. Most writes additionally route through `security definer` functions in a separate, locked-down `authority_private` schema (`revoke all on schema authority_private from public, anon, authenticated`) that enforce role checks such as `authority_private.assert_member_manager` — a second, independent enforcement layer beyond RLS.

### 2.3 Encryption

- **In transit and at rest (platform-provided):** The product runs on Supabase/Postgres and Vercel, both of which provide TLS in transit and disk-level encryption at rest by default. This is platform-provided infrastructure security, not something Passage built — it should be represented to a buyer as "inherited from Supabase/Vercel's platform security," not as a Passage-built control.
- **Application-level:** No column-level or field-level encryption of PII was found. The only application-level cryptographic control is one-way SHA-256 hashing of bearer tokens (invitation tokens, session tokens) before storage — appropriate for verifying possession of a secret, but not a substitute for encrypting stored personal data, and not claimed as one anywhere in the code.
- Uploaded POA and identity-evidence documents are not separately encrypted at the application layer; they rely on Supabase Storage's platform-level protections plus the access controls described in Section 2.5.
- The product's own security page already lists "Encryption and key-management review" under work required before a production pilot (`src/app/security/page.tsx`) — this packet confirms that self-assessment rather than contradicting it.

### 2.4 Audit logging

Two append-only event logs exist and are populated today:

1. `public.organization_audit_events` (migration `20260828211255_authority_gate_1_foundation.sql`) — records organization- and admin-level actions: `organization.created`, `membership.activated`, `membership.invited`, `membership.role_changed`, `membership.revoked`, `evidence.source_viewed` (logged on every evidence view, not just uploads), `evidence.source_accepted`, and institution decisions. Read access is RLS-restricted to owner/admin/auditor roles (`audit_events_authorized_select`).
2. `public.authority_events` — a record-level activity timeline visible to participants and staff according to role, covering events like `participant.access_established` and `evidence.source_received`.
3. Delivery-tracking activity events (`membership.invitation_submitted` / `_delivered` / `_delivery_failed` / `_delivery_delayed`) are real, coded event types (`src/lib/authority/role-capabilities.ts`), not just planned — consistent with the September 6 delivery-tracking work described in `docs/V2-DELIVERY-ROADMAP.md`.

This is real, working audit logging for access and administrative actions today — the gap (Section 3) is in *exporting* and *retaining* that log, not in generating it.

### 2.5 File and document storage

Uploaded POA documents and identity-evidence files are stored in a dedicated, **private** (non-public) Supabase Storage bucket, `authority-evidence`, with a 10 MB file-size limit and a MIME-type allow-list restricted to `application/pdf`, `image/jpeg`, and `image/png` (migration `20260830210000_authority_evidence_foundation.sql`).

- Storage paths follow a fixed, server-enforced pattern (`{authority_record_id}/{artifact_id}/source.{ext}`), validated both in the database function that records an upload and independently in application code (`src/lib/authority/evidence.ts`).
- Direct client access to storage objects is blocked entirely (`revoke all on storage.objects from anon, authenticated`). Reads are only possible through `authority_private.authorize_evidence_view_v1`, a function that checks the requester holds an active membership with an authorized role (owner/admin/staff/reviewer/auditor) and logs an `evidence.source_viewed` audit event on every access.
- Document metadata (filename, media type, size, a SHA-256 content hash, review status, reviewer) is stored separately in the RLS-protected `authority_evidence_artifacts` table from the file content itself.
- **Not independently confirmed in this review:** the exact code path that turns an authorized `authorize_evidence_view_v1` call into a time-limited signed URL for the actual file bytes. The access-control checks described above are confirmed; the final signed-URL issuance step should be verified directly with engineering before this claim is repeated to a buyer as complete end-to-end.

---

## 3. Gap list — what is not yet in place

This section states plainly what a bank or credit union's vendor-risk review will ask about and Passage cannot yet answer affirmatively. Several of these are already acknowledged in the product's own public security page (`src/app/security/page.tsx`), which lists them under "required before a production pilot" — this packet is not surfacing anything the product is trying to hide from its own users.

| Gap | Current state | Source |
| --- | --- | --- |
| SOC 2 / ISO 27001 certification | None. No certification, audit engagement, or scoping work exists in the repository or docs. | `src/app/security/page.tsx`: "Passage does not claim a completed certification, independent audit, or identity integration until it can be supported with evidence." |
| Independent security assessment / penetration test | Not performed. No pentest artifacts, vendor engagement, or scheduling found. | `src/app/security/page.tsx`; confirmed absent elsewhere in `docs/` and `src/` |
| Encryption and key-management review | Not performed. Current encryption is platform-provided only (Section 2.3); no formal review of key management has occurred. | `src/app/security/page.tsx` |
| Data retention, deletion, backup, and recovery testing | Not implemented. No retention policy, scheduled deletion, TTL, or soft-delete pattern found on any table holding participant or evidence data. No backup/recovery test evidence found. | `src/app/security/page.tsx`; `docs/CURRENT-STATE-GAP-MAP.md` lists "retention and recovery controls" as a remaining gap |
| Audit log export | Not implemented. Audit events are captured (Section 2.4) but there is no export function for an institution's own compliance/audit team. | `docs/CURRENT-STATE-GAP-MAP.md`: "Organization-wide access and administrative audit export" tracked as a remaining item under Gate 5 and pilot hardening |
| Privileged-account MFA | Not confirmed implemented as of this review; the roadmap lists "privileged MFA" as pilot-hardening evidence still outstanding. | `docs/V2-DELIVERY-ROADMAP.md`, P2 gate exit evidence |
| Signed-URL issuance for evidence files | Access-control checks are confirmed (Section 2.5); the specific signed-URL generation step was not independently located in this review and should be verified with engineering. | This review |
| Formal incident-response plan / evidence | Not found in this review. | This review |
| Subprocessor list / data-processing agreement material | Not found in this review; `docs/V2-BEST-PRACTICE-REVIEW.md` recommends this as part of a security-readiness baseline but it has not been produced. | `docs/V2-BEST-PRACTICE-REVIEW.md` |

None of these gaps should be represented to a buyer as "in progress" unless engineering confirms active work is underway. As of this packet's date, they are open items, not scheduled deliverables — Steve and counsel should decide which of these are conditions of any founding-pilot agreement versus items disclosed as a forward roadmap.

---

## 4. Scoped privacy review

### 4.1 What personal and sensitive data the app collects and stores

Based on schema, table, and column names found in the reviewed migrations and code:

- **Institution staff:** email address (via Supabase Auth), normalized email, display name, and role, in `organization_memberships` and `auth.users`.
- **Principal (the account holder granting authority):** name and normalized email, in `authority_records` (`principal_name`, `principal_email_normalized`).
- **Representative (the person acting under the POA):** name and normalized email (`representative_name`, `representative_email_normalized`).
- **Authority/POA scope data:** purpose, account boundary, allowed and prohibited action keys, validity dates, and a reference code describing what the POA covers.
- **Identity and evidence documents:** actual uploaded POA documents, representative certifications, and identity-evidence files (PDF/JPEG/PNG), stored as file content in the private `authority-evidence` storage bucket, with metadata (filename, media type, byte size, SHA-256 hash, reviewer note) in `authority_evidence_artifacts`.
- **Compliance metadata:** IP address and user-agent string captured at the moment an organization accepts platform terms (`organization_terms_acceptances`).

**No Social Security number, date of birth, or other structured government-ID field was found anywhere in the reviewed schema.** Identity evidence is handled as an uploaded document image or PDF (e.g., a photo ID or the POA instrument itself), not as structured PII fields. This is a confirmed absence in what was reviewed — it is not a guarantee that no such field exists anywhere unreviewed, and it does not mean the uploaded documents themselves don't contain an SSN or DOB in their content (a driver's license image, for instance, would).

### 4.2 Where it's stored

All of the above lives in a single Supabase project (Postgres database plus Supabase Storage) associated with this branch's deployment. Structured data (names, emails, scope fields, metadata) is in Postgres tables under RLS as described in Section 2.2. Uploaded documents are in the private `authority-evidence` storage bucket described in Section 2.5. No evidence was found of personal data being copied to a third-party analytics, marketing, or logging platform — Stripe and HubSpot integrations are explicitly scoped in the roadmap to exclude participant data (`docs/V2-DELIVERY-ROADMAP.md`, "Provider rules": "No participant identity, evidence, request content, account reference, decision, or receipt content enters Stripe or HubSpot").

### 4.3 Retention and deletion

There is currently no retention or deletion story. No scheduled deletion job, retention policy, storage lifecycle rule, or soft-delete pattern was found for principal data, representative data, or uploaded evidence documents. Data persists indefinitely by default today. This is a confirmed gap (also listed in Section 3) rather than an intentional "retain forever" decision documented anywhere — Steve and counsel should decide what retention period is appropriate (likely driven by the institution's own recordkeeping obligations for POA-related account actions) before a real-data pilot begins, since building deletion after real customer data exists is materially harder than building it before.

### 4.4 Exposure assessment

Based on the RLS policies, storage access controls, and anonymous-role restrictions confirmed in Section 2, the review did not find evidence of data being unnecessarily exposed:

- Anonymous (unauthenticated) database access is limited to four specific functions, not general table access.
- Evidence files require an authenticated, role-checked function call to view, with every view logged.
- Cross-organization data access is blocked by RLS policies scoped to organization membership.

The two exposure-relevant items worth flagging to counsel and to a buyer's security team are: (1) the unverified signed-URL issuance step noted in Section 2.5 — worth confirming end-to-end before claiming complete evidence-access control, and (2) the absence of field-level encryption on principal/representative PII (Section 2.3), which means a full database compromise (as opposed to an RLS bypass) would expose that data in plaintext, mitigated only by Supabase's platform-level disk encryption.

---

## 5. What this packet is not

This is a self-assessment built by product/engineering directly from the codebase, not an independent audit, penetration test, or certification. It should not be presented to a bank or credit union's procurement team as evidence of certified compliance. Its purpose is to give Steve and outside counsel an accurate starting picture — what's real, what's platform-provided, and what's an open gap — before engaging any third-party assessment the P2 gate requires. The security and privacy review called for in `docs/V2-DELIVERY-ROADMAP.md`'s P2 exit criteria ("buyer-specific assurance and vendor-risk evidence; privacy and scoped security review") has not yet been performed by an independent party as of this packet's date, September 7, 2026.
