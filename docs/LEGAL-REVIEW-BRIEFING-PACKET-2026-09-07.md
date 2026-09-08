# Legal review briefing packet

**Date:** September 7, 2026
**Prepared for:** Outside/engaged counsel, ahead of P2 (production-hardening gate)
**Prepared by:** Product/engineering, from the repository's own documentation and source code
**Status:** Prep packet only. No legal review has occurred. Nothing in this document is a legal opinion, a compliance determination, or a substitute for counsel's own review of the product, its documents, and its target jurisdictions.

This packet exists so that once Steve engages outside counsel, counsel can start from an accurate, source-cited picture of what Passage Authority does, what it explicitly does not do, and the specific open legal questions P2 requires answered — rather than spending its first hours reconstructing product scope from scratch. Every factual claim below is cited to a file in the `thepassageappio/thepassageappio` repository (branch `agent/founding-pilot-billing` as of this packet's date) so counsel or Steve can verify it directly.

---

## 1. What Passage Authority is, and is not

### 1.1 What it does

Passage Authority is a workflow-coordination product and API used by a bank or credit union to run a single financial power-of-attorney (POA) account-servicing request from intake through decision. The institution creates the request identifying the account holder (principal) and the person acting on the account holder's behalf (representative). Each party completes their step through a private, expiring, single-use secure link: confirming or accepting the request, supplying the POA document, and completing any certification or identity-evidence requirements the institution has configured. The institution then runs its own identity, document, fraud, and policy review and records a decision — accept, accept-with-limits, or reject. Passage produces a "decision receipt": an immutable, participant-readable record of exactly what was accepted, any limits, the policy version, dates, lifecycle state, and an append-only history, shared consistently with all parties.

(`docs/BUILD-CONTRACT.md`, canonical objects section; `docs/PRODUCT-VISION-AND-ONBOARDING.md`)

The current product wedge is narrow and explicit: **New York financial power-of-attorney account-servicing requests only.** No other jurisdiction, authority type (e.g., guardianship, trustee, executor/estate), or use case is live.

(`docs/SALES-ONE-PAGER-2026-09-05.md`: "Passage is starting with New York financial power of attorney"; `docs/PRODUCT-VISION-AND-ONBOARDING.md`: "one New York financial-POA workflow")

### 1.2 What it explicitly does not do — the product's own established boundary

This boundary is not something this packet is proposing; it is already built into the product's public copy and internal source-of-truth documents, consistently, across every customer-facing surface. Counsel should treat the quotes below as the starting representation of the product's own claims about itself — subject to counsel's independent verification, not as a substitute for it.

**Homepage** (`src/app/page.tsx`):
> "Passage keeps the request moving. It does not verify identity, approve the power of attorney, grant account access, or move money. The financial institution keeps those responsibilities."

> "Does not create or notarize a power of attorney." "Does not declare a document legally valid." "Does not perform or replace identity, legal, fraud, or policy review." "Does not grant account access or move customer funds."

**Security page** (`src/app/security/page.tsx`):
> "A private link protects access. It does not prove identity."

> "It does not prove the person's legal identity." "It does not validate the power of attorney document." "It does not approve the representative." "It does not grant account credentials or permission to move money."

> "Passage does not claim a completed certification, independent audit, or identity integration until it can be supported with evidence."

**Authorized Use Attestation** (`src/app/legal/authorized-use/page.tsx`):
> "Passage will not be treated as making the institution's final legal or authority decision."

> "Confirming this attestation does not prove legal authority for any individual request."

**Product source of truth** (`docs/PRODUCT-SOURCE-OF-TRUTH.md`, §3.1 Category):
> "Passage Authority is an authority acceptance workflow and API. It is not a document generator, electronic signature provider, remote notary, identity provider, estate-administration suite, family monitoring product, case-management system, or universal authority registry."

Same document, §1:
> "The product does not make universal legal decisions. The receiving institution retains its decision authority."

Same document, §11.9 (literal in-product reviewer-workspace copy):
> "Passage organizes evidence. It does not decide legal validity."

**Product vision** (`docs/PRODUCT-VISION-AND-ONBOARDING.md`):
> "It does not create a power of attorney, replace legal review, or decide whether an institution must accept one." "It does not move money, open accounts, create legal documents, automate legal judgment, replace a core system, or guarantee acceptance."

**Sales one-pager** (`docs/SALES-ONE-PAGER-2026-09-05.md`):
> "What Passage does not do — Passage does not create or notarize a power of attorney, declare a document legally valid, replace the institution's identity or fraud controls, grant account credentials, approve transactions, or move money. The institution keeps the final decision."

The product deliberately avoids a generic "not a law firm / not legal advice" disclaimer in favor of naming the specific things it does not do (does not validate, does not decide, does not notarize, does not grant access). No occurrence of "law firm" or "legal advice" language was found anywhere in the reviewed docs or site copy — worth flagging to counsel as a deliberate choice to confirm, not an oversight.

This is the **workflow-coordination-only boundary** referenced in the P2 gate: Passage moves the request and its evidence between parties and produces a receipt of what was decided; it does not itself determine whether a POA is legally valid, properly executed, or entitled to be honored under the law of any state. That determination remains the institution's, informed by its own legal, compliance, and fraud functions.

---

## 2. Open legal questions for counsel

These are the specific questions P2 requires resolved before Passage accepts real institution POA, participant, account, or authority data, or begins live-business onboarding (`docs/V2-DELIVERY-ROADMAP.md`, P2 gate and "Real-data enterprise pilot approval" row). None of them have been answered internally; product/engineering is not positioned to answer them, which is why this is a counsel-gated item rather than an engineering task.

### 2.1 State-specific POA formality requirements

Passage's only live jurisdiction is New York. New York has its own statutory power-of-attorney form and execution requirements (General Obligations Law Article 5, Title 15). Open questions for counsel:

- Does Passage's evidence-intake flow (upload of a POA document as a PDF/image, reviewed by the institution) need to enforce or check for any New York-specific formality (e.g., the statutory short-form language, required notarization, required witness signatures) before an institution can rely on a decision receipt, or is that entirely the institution's own review responsibility as the product's copy currently claims?
- The product's data model includes a `jurisdiction` field on its policy-template object, and internal roadmap notes describe "jurisdiction expansion process, insurance, liability, regulatory review" as future counsel-gated work (`docs/PRODUCT-SOURCE-OF-TRUTH.md`, §16.4; `docs/V2-DELIVERY-ROADMAP.md`) — but no state-by-state formality logic exists in the product today, and none is planned before P2. Counsel should confirm whether shipping a single-state (New York) product without that logic is acceptable for a P2 pilot, or whether even one state requires more than "the institution reviews the uploaded document."
- Section 3 below now walks through New York plus four candidate expansion states in more detail; treat it as the starting point for this question, not a resolution of it.

### 2.2 E-signature / ESIGN Act compliance for the evidence-upload flow

Passage does not collect an electronic signature on the POA instrument itself — it collects an uploaded document (the POA, however it was originally executed) plus separate in-product actions: a principal "confirmation," a representative "acceptance," and various certifications and attestations completed through the private link flow (`docs/BUILD-CONTRACT.md`; `src/app/legal/authorized-use/page.tsx`).

- Do any of those in-product actions (principal confirmation, representative acceptance, the Authorized Use Attestation) constitute an "electronic signature" or "electronic record" under the federal ESIGN Act or New York's Electronic Signatures and Records Act (ESRA), triggering consent, retention, or disclosure obligations Passage does not currently implement?
- No mention of "ESIGN," "electronic signature," or e-signature compliance obligations was found anywhere in the reviewed docs or source code. This appears to be a genuine gap rather than a considered "out of scope" decision — the product's own category definition disclaims being an "electronic signature provider," but that disclaimer addresses signing the POA document, not the in-product attestations and acceptances participants complete. Counsel should determine whether that distinction holds.

### 2.3 Notarization requirements Passage doesn't currently check

Passage's copy repeatedly states it "does not create or notarize a power of attorney" and "does not validate the power of attorney document." In practice, this means: if New York law requires notarization (or a specific attestation) for a particular POA to be valid, and the institution's own review process misses that, Passage has no independent check and produces a decision receipt regardless of the underlying document's validity.

- Is that acceptable given the product's positioning ("the institution keeps the final decision"), or does counsel see a duty-of-care, aiding-and-abetting, or UPL (unauthorized practice of law) exposure in producing a receipt that *looks* authoritative even though it explicitly disclaims legal validity?
- Should the receipt's language, the reviewer workspace copy, or the Authorized Use Attestation be strengthened, and if so, what specific language does counsel want in each of those three places (all three are cited in §1.2 above with exact current copy and file paths for redlining)?

### 2.4 Institution decision responsibilities and product-claims review generally

Beyond the three items above, the P2 gate calls for "counsel-led review of product claims, target-state POA formalities, institution decision responsibilities, and applicable electronic-signature/record requirements" (`docs/V2-DELIVERY-ROADMAP.md`). This packet has not attempted that broader claims review — it has surfaced the existing claims (§1.2) for counsel to evaluate, not validated them. Counsel's engagement should include a pass over every "does not" / "does" statement quoted above to confirm it is both accurate today and durable as the product evolves.

### 2.5 If Passage ever creates or executes a POA instrument

The roadmap already flags this as a separate, harder gate, not part of P2: "If Passage ever creates or executes a POA instrument, that capability requires a separate jurisdiction-specific legal gate before release" (`docs/V2-DELIVERY-ROADMAP.md`). Nothing in the current product does this — it is included here only so counsel has the full scope boundary in view, in case a pilot institution asks for it.

---

## 3. State-by-state POA formality gameplan

**This section is prep material only. It is not legal advice, not a legal opinion, and not a substitute for counsel's own review.** It was built from general web research into each state's publicly available statutes and secondary legal-reference sources (cited per state below), not from a licensed attorney's analysis, and not from Westlaw/Lexis primary-source verification. Statutes change, secondary sources can be stale or state law incorrectly, and only counsel licensed in each state can confirm current requirements and how they apply to Passage's specific product. Treat every statement below as "here is what a first pass found, please verify" — not as settled fact.

### 3.0 Why these five states

No `docs/P1-TARGET-ACCOUNT-LIST-2026-09-07.md` file exists in the repository as of this packet's date — it was not found under `docs/` or `docs/research/`. The closest thing that exists is `docs/SALES-OUTBOUND-LAUNCH-PLAN-2026-09-05.md`, which confirms the entire P1 discovery list is **20 New York community banks and credit unions** ("Build a first list of 20 New York community banks and credit unions..."). New York is therefore not just the primary state — as of today it is the *only* state with a named target account.

Since P2 legal prep should not be scoped one state narrower than a founding pilot might actually need, this gameplan covers New York plus four adjacent states chosen as reasonable near-term expansion candidates, on the reasoning that New York-headquartered community banks and credit unions frequently have branches, members, or account holders across state lines into neighboring markets: **New Jersey, Connecticut, Massachusetts, and Pennsylvania**. This selection is a judgment call by product/engineering, not a confirmed sales target — Steve and sales should confirm or correct it once a real multi-state target list exists, and counsel's engagement should not be limited to only these five if the pilot's actual institution operates elsewhere.

### 3.1 New York (primary — the only current live wedge and P1 target state)

- **Statute:** New York General Obligations Law ("GOL") Article 5, Title 15, including the 2021 short-form revisions — cited by secondary sources as GOL §§ 5-1501B, 5-1513.
- **Notarization:** Required. The principal's signature must be notarized.
- **Witnesses:** Required — two witnesses who are not named as agents in the document. A notary public may serve as one of the two witnesses, meaning in practice only one additional witness is needed beyond the notary.
- **Statutory form:** New York has an official statutory short-form POA; use of nonconforming language has historically been a source of institution rejection risk, which the 2021 amendments were intended to soften (secondary sources describe a "substantial conformity" standard replacing strict conformity, but counsel should confirm current statutory text rather than rely on this summary).
- **Agent-side signing:** Secondary sources indicate the agent (or all co-agents) must also sign before a notary.
- **How Passage's evidence flow does/doesn't support institution review here:** Passage's evidence-upload flow accepts a POA document as an uploaded PDF or image (requirement type `power_of_attorney` in the schema) with no structured fields capturing whether notarization or the required two-witness signatures are present in that document — the reviewer must visually inspect the uploaded file themselves, and record any judgment only in a freeform `reviewer_note` text field, not a structured checklist. Passage does not check for the statutory short-form language or "substantial conformity" either; that is entirely on the institution's own reviewer. This matches the product's stated boundary ("does not validate the power of attorney document") but means an institution's reviewer gets no product-level prompt or checklist item for New York's specific two-witness-plus-notary and form requirements — a manual, judgment-dependent step today.
- **Open questions for counsel:** Does New York law or Passage's own risk posture require the product to prompt reviewers with a state-specific checklist (e.g., "confirm notarization present," "confirm two witness signatures present," "confirm statutory short-form language or substantial conformity") rather than leaving it to an unprompted freeform note? Is the 2021 "substantial conformity" standard something Passage should reflect in reviewer guidance copy?

### 3.2 New Jersey

- **Statute:** N.J.S.A. 46:2B-8.9 (Revised Durable Power of Attorney Act).
- **Notarization:** Required — the principal's signature must be acknowledged before a notary.
- **Witnesses:** Sources conflict. Some secondary sources state New Jersey has no witness requirement for a financial POA once notarized; others describe a two-witness-plus-notary practice. This is a genuine open question that needs primary-source verification by counsel, not something this packet can resolve from web research alone.
- **Statutory form:** No mandatory statutory short form identified in the sources reviewed (unlike New York).
- **How Passage's evidence flow does/doesn't support institution review here:** Same structural gap as New York — the uploaded document is reviewed visually by institution staff with no structured, state-specific prompt for notarization or witness presence. Because the witness requirement itself is unsettled in the sources reviewed, this is a state where counsel's answer will directly determine what (if anything) a reviewer checklist should ask for.
- **Open questions for counsel:** Resolve the witness-requirement conflict from primary sources. Confirm whether any New Jersey-specific institution notice or acceptance-refusal-liability provisions (common in revised UPOAA-family statutes) create obligations Passage's decision-receipt language should account for.

### 3.3 Connecticut

- **Statute:** Connecticut Uniform Power of Attorney Act, Connecticut General Statutes § 1-350d (Chapter 15c).
- **Notarization:** Not strictly required by statute, but strongly recommended — a notarized signature carries a statutory presumption of genuineness, which is materially useful to an institution deciding whether to honor the document.
- **Witnesses:** Required — two witnesses, physically present at signing, who print and sign their names, are not the person receiving the power, and are not related to that person.
- **Statutory form:** Connecticut has adopted the Uniform Power of Attorney Act framework (unlike New York, New Jersey, and Massachusetts, per the sources reviewed), which generally does not mandate a single statutory form but does define required agent duties and institution-acceptance provisions.
- **How Passage's evidence flow does/doesn't support institution review here:** Same structural gap as above (no structured capture of witness/notarization status). Connecticut is notable because the *absence* of notarization is not disqualifying — a reviewer needs to know that an un-notarized-but-properly-witnessed Connecticut POA can still be valid, which is a piece of state-specific knowledge Passage's current generic evidence-review screen does not surface anywhere in reviewer-facing copy.
- **Open questions for counsel:** Confirm whether Connecticut's UPOAA-based institution-acceptance and liability provisions (a common UPOAA feature — a duty to accept or a defined refusal process, sometimes with a response-time obligation) create any process obligation Passage's decision-receipt or notification flow should reflect.

### 3.4 Massachusetts

- **Statute:** Massachusetts has **not** adopted the Uniform Power of Attorney Act; general durable POA requirements come from the Massachusetts Uniform Probate Code and related case law, not a single POA-specific statute in the way New York or Connecticut have one.
- **Notarization:** Not required by statute for a general/durable financial POA. Required only for POAs used in real estate transactions or recorded with a registry of deeds.
- **Witnesses:** Not required by statute for a general/durable financial POA. Two witnesses plus notarization are required specifically for real-estate POAs.
- **Statutory form:** No mandatory statutory short form identified in the sources reviewed.
- **Practical note:** Sources indicate banks and other institutions commonly *request* notarization as a practical safeguard even though state law doesn't require it for a general financial POA — meaning Passage may be intake-ing documents that are legally valid under Massachusetts law but that a particular institution's own internal policy nonetheless rejects for lack of notarization. That is an institution-policy question, not a legal-validity one, but it is worth flagging so reviewer-facing copy doesn't conflate "not legally required" with "this institution will accept it."
- **How Passage's evidence flow does/doesn't support institution review here:** Because Massachusetts has the lightest formal requirements of the five states reviewed, the product's current "just review the uploaded document" posture is arguably the best fit here — there's comparatively little state-mandated formality for a structured checklist to check. The open risk is more about institution-specific policy variance than state law.
- **Open questions for counsel:** Confirm the general/durable vs. real-estate distinction and whether Passage needs to ask, at intake, what the POA will be used for (since that changes the applicable formality rules) — today's evidence-upload flow does not ask what the POA's scope or intended use is beyond the free-text `purpose`/`account_boundary` fields already in the schema.

### 3.5 Pennsylvania

- **Statute:** 20 Pa. Cons. Stat. § 5601 et seq., for POAs executed on or after January 1, 2015.
- **Notarization:** Required.
- **Witnesses:** Required — two witnesses, each over 18, none of whom may be the notary or a named agent.
- **Statutory form:** Pennsylvania requires specific statutory notice language in the POA document itself, separate from witnessing/notarization.
- **Agent-side requirement — the distinctive Pennsylvania feature:** Pennsylvania requires the agent to sign a separate statutory "Acknowledgment" before the agent has any authority to act. This is materially different from the other four states reviewed and is the single most important state-specific fact in this packet: **an agent (representative) in Pennsylvania has no legal authority to act until this acknowledgment is signed, independent of whether the institution has decided to honor the POA.**
- **Engineering determination, September 8:** the current `representative_certification` is a Boolean generic attestation using text version `representative-certification-v1`. It does not capture the agent's name or signature, execution date, the substantially prescribed § 5601(d) content, an executed acknowledgment artifact, or evidence that the acknowledgment was affixed to or associated with the POA. It is not an adequate substitute for the Pennsylvania artifact and must not be presented as one.
- **Open questions for counsel:** Confirm applicability and exceptions, the consequence of omission, acceptable electronic or uploaded execution evidence, how Passage should evidence association with the POA, retention and receipt wording, and how § 5611 affects out-of-state instruments. The complete decision record and QA matrix are in `docs/PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md`.

### 3.6 Cross-state pattern and product-wide open question

Across all five states, the same structural fact holds: Passage's evidence-upload flow (`authority_evidence_artifacts`, requirement types `power_of_attorney`, `representative_certification`, `identity_evidence`) captures an uploaded file plus generic metadata (filename, media type, size, a content hash, and a freeform reviewer note) — it does not capture structured, state-aware fields like "notarization present," "witness count," "statutory form used," or (for Pennsylvania specifically) "agent Acknowledgment signed." Every state-specific formality check today depends entirely on the institution's own reviewer knowing what to look for, unprompted by the product. This is consistent with Passage's stated boundary that it "does not validate the power of attorney document" — but as the target-state list grows beyond New York, that boundary places an increasing knowledge burden on each institution's reviewer, who may not have New Jersey or Pennsylvania-specific POA expertise the way a New York-focused reviewer might.

**The core open product-and-legal question for counsel and Steve together:** should Passage remain purely state-agnostic (uploaded document, freeform review, no state-specific prompts — the current design), or should expansion beyond New York come with state-specific reviewer guidance or checklist prompts, and if so, is *providing* such a checklist itself a step toward the kind of legal-judgment role the product's boundary language currently disclaims? This is exactly the kind of product-claims-and-scope question §2.4 above asks counsel to review, now made concrete against five specific states.

---

## 4. Summary of relevant existing docs

For counsel's orientation, in the order the repository's own document register recommends (`docs/DOCUMENT-REGISTER.md`):

- **`docs/PRODUCT-SOURCE-OF-TRUTH.md`** — the authoritative, ~90-page product definition: mission, wedge, pricing, personas, screens, and provider boundaries. Section 3.1 (category) and section 1 contain the core "does not decide legal validity" boundary language quoted above. Section 16.4 discusses evidence/identity/signature/notary providers as third parties Passage may orchestrate but does not build.
- **`docs/CURRENT-STATE-GAP-MAP.md`** — gate-by-gate tracker of what's built versus what the source-of-truth target requires. Flags "counsel-approved production documents" as an open gap on the Terms/onboarding surface, and lists remaining commercial-foundation and enterprise-control gaps generally. Does not separately track ESIGN/notarization/state-formality work as its own line item today — that risk currently exists only implicitly, via the "jurisdiction expansion... regulatory review" note in the source-of-truth doc.
- **`docs/V2-BEST-PRACTICE-REVIEW.md`** — evidence-backed best-practices review (onboarding, tenancy, pricing, security posture, accessibility) with a "Passage decision" against each. Its security recommendations (OWASP ASVS-scoped control matrix, MFA, RLS, subprocessor/DPA material, independent penetration test before production data) inform the companion vendor-risk packet but do not address POA legal-formality questions.
- **`docs/V2-DELIVERY-ROADMAP.md`** — the active delivery contract. Defines the P0–P3 gate sequence; P2 ("qualify a real-data pilot") is the gate this packet supports, and its exit evidence explicitly requires the counsel-led review described in §2 above before Passage accepts customer data or begins live-business onboarding. This packet's companion, `docs/VENDOR-RISK-ASSURANCE-PACKET-2026-09-07.md`, and this document are both referenced from the roadmap as ready for counsel handoff.
- **`docs/BUILD-CONTRACT.md`** — defines the canonical objects (authority record, decision receipt, evidence artifact, etc.) referenced in §1.1 above.
- **`docs/SALES-ONE-PAGER-2026-09-05.md`** and **`docs/PRODUCT-VISION-AND-ONBOARDING.md`** — external-facing and onboarding statements of the same boundary, useful for confirming the claims are consistent across audiences (they are, as quoted in §1.2).

---

## 5. What this packet is not

This is a prep document assembled by product/engineering from the product's own source code and internal documents, supplemented in Section 3 by general web research into public secondary sources on state POA law. It is not a legal review, not a compliance determination, and not a representation that the product's current claims — or the state-law summaries in Section 3 — are legally accurate or sufficient. Outside counsel review of the items in Section 2 and Section 3 has not happened as of this packet's date (September 7, 2026) and must occur before Passage accepts real institution POA, participant, account, or authority data, or begins live-business onboarding, per the P2 gate in `docs/V2-DELIVERY-ROADMAP.md`.

## 6. Sources used for Section 3 (state POA formality research)

General web research, not primary-source (Westlaw/Lexis) verification. Counsel should confirm all of the below against the actual current statutory text.

- New York: [Nolo — New York Power of Attorney Laws](https://www.nolo.com/legal-encyclopedia/new-york-power-of-attorney-laws.html); [NYSBA — New York's New Power of Attorney Law: An Update](https://nysba.org/new-yorks-new-power-of-attorney-law-an-update/); [Bousquet Holstein — Legal Alert on New POA Regulations](https://www.bhlawpllc.com/new-york-state-enacts-new-requirements-for-power-of-attorney-regulations/)
- New Jersey: [PL Law Firm — Does a POA Have to Be Notarized in New Jersey?](https://www.pllawfirm.com/2025/01/28/does-a-power-of-attorney-have-to-be-notarized-in-new-jersey/); [Beck, Lenox & Stolzer — Do I Need Witnesses for a Power of Attorney?](https://beckelderlaw.com/do-i-need-witnesses-for-a-power-of-attorney/); [LawDistrict — New Jersey Power of Attorney Requirements](https://www.lawdistrict.com/articles/new-jersey-power-of-attorney-requirements)
- Connecticut: [Connecticut General Statutes § 1-350d (Justia)](https://law.justia.com/codes/connecticut/title-1/chapter-15c/section-1-350d/); [CGA — Chapter 15c, Connecticut Uniform Power of Attorney Act](https://cga.ct.gov/2022/sup/chap_015c.htm); [Nolo — Connecticut Power of Attorney Laws](https://www.nolo.com/legal-encyclopedia/connecticut-power-of-attorney-laws.html)
- Massachusetts: [Nolo — Massachusetts Power of Attorney Laws](https://www.nolo.com/legal-encyclopedia/massachusetts-power-of-attorney-laws.html); [Jordan White LLC — Massachusetts Power of Attorney Requirements Explained](https://jordanwhitellc.com/massachusetts-power-of-attorney-requirements/); [Middlesex Notary Co — Does a POA Always Need to Be Notarized?](https://middlesexnotary.com/does-a-power-of-attorney-always-need-to-be-notarized)
- Pennsylvania: [Pennsylvania General Assembly — 20 Pa.C.S. § 5601](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056.001.000..HTM); [Pennsylvania General Assembly — Chapter 56](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056..HTM)
