# Wave1 Eng encode checklists — NY → PA → NJ → CT → MA

**Date:** 2026-09-15  
**Steve correction:** Build **beyond NY**. Honest **live claims** stay NY-only until each state is built and enabled. PA/NJ/CT/MA encode work is **active product** (Eng tickets), not archive. Multi-institution is in-scope for product. Counsel off unless a claim would be false.  
**Not legal advice. Not certification.** Passage = workflow + decision record only.

**Sources:** `FIFTY-STATE-REQUIREMENTS-MATRIX.md` Wave1 rows · `PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md` · `NY-ONLY-DEMO-TRUTH-PACK-2026-09-15.md`

**Shared for every Wave1 ticket**
- [ ] Jurisdiction gate: `US-XX` enable flag + overlay version + effective-date metadata (FI chooses enablement).
- [ ] Decision record: accept / accept-with-limits / refuse / pending_supplemental; actor; timestamps; append-only history.
- [ ] Receipt: materials reviewed + decision + policy/jurisdiction pack version; **never** “POA validated/created.”
- [ ] Multi-institution: requests/policies scoped per institution (Phase 0 promoting — coordinate Ops/Eng).
- [ ] Data: synthetic until demo-ready; no real PII in demo.
- [ ] Copy: plain language; no AI fluff; no multi-state “available” claims until enabled.

---

## ENG-JURIS-NY — New York (live — harden encode)

**Priority:** P0 (live)  
**Outcome:** NY pack is the reference implementation for timers + reason codes + affidavit path.

### Encode
- [ ] `jurisdiction=US-NY` pack versioned.
- [ ] `form_class`: statutory_short | non_statutory | unknown.
- [ ] Timers: **10 business days** (honor / written reject / request affidavit) then **7 business days** after response/affidavit — institution-configurable, recorded on request.
- [ ] Evidence: POA upload; attorney-certified-copy flag; full-force **affidavit** request/response object.
- [ ] Reason-code catalog (FI-editable overlay + NY theme codes): reasonable-cause examples; warn if refusal reasons are *only* “not our form” or age-alone for statutory short form.
- [ ] Refusal notice delivery fields: principal + agent addresses, method, timestamp.
- [ ] Revocation notice cue: office where account is located + recorded receipt time.
- [ ] Opinion-of-counsel / supplemental request hooks (optional).

### Leave to institution (do not auto-decide)
Validity, durability, scope, “doing business in NY,” final accept/refuse, IDV/fraud.

### Claims
May claim NY financial POA account-servicing workflow. Must not claim legal validation.

### Acceptance
Synthetic NY happy path + refuse + affidavit-request path; matching receipts; public copy NY-only.

---

## ENG-JURIS-PA — Pennsylvania (build; keep disabled until done)

**Priority:** P0 next after NY harden  
**Blocker for enablement:** dedicated §5601(d) Acknowledgment — **do not** reuse `representative_certification`.  
**Until shipped:** `US-PA` remains **unavailable**; no marketing as live.

### Encode
- [ ] Separate evidence type `pa_agent_acknowledgment`: agent name, signature present, execution date, statutory text version id, association to POA artifact, content hash / upload.
- [ ] Classification: applicable vs counsel/FI-approved exception code (institution-entered; Passage stores only).
- [ ] Timers: **7 BD** accept or request supplemental; **5 BD** after materials received.
- [ ] Supplemental request types: certification, translation, §5606 continuance affidavit, opinion of counsel.
- [ ] Refusal grounds catalog from §5608.1 themes (versioned codes + free text).
- [ ] Structured reviewer fields: acknowledgment complete / missing / exception; affixed/associated status.
- [ ] Receipt: requirement result + institution decision — **no** “POA legally valid.”
- [ ] Gate: enable `US-PA` only when acknowledgment workflow + synthetic matrix pass; default **off**.

### Leave to institution
Whether §5601(d) applies; exceptions; accept/refuse; IDV/fraud; out-of-state (§5611) treatment.

### Claims
“On validation roadmap; not launched.” Never imply live. Never label generic cert as PA compliance.

### Acceptance (synthetic, after build)
Complete ack → review; missing ack fail-closed; exception requires explicit classification; NY/NJ/CT/MA fixtures do not get PA requirement; policy version change preserves old evidence.

---

## ENG-JURIS-NJ — New Jersey

**Priority:** P1 (Wave1 #3)  
**Uncertainty:** freeze official consolidated text for banking §46:2B-13 before hardcoding reason codes (mark codes `verify_before_freeze`).

### Encode
- [ ] `jurisdiction=US-NJ` pack; default **off** until QA green.
- [ ] Policy **SLA timer** (reasonable time — not NY 10/7); FI-configurable.
- [ ] Evidence: instrument; agent **affidavit** of non-revocation/non-termination request/response; original vs certified-copy flags.
- [ ] Banking refusal theme reason codes (genuineness / death / revocation / disability-at-execution beliefs) + free text.
- [ ] Optional warning UX when refusal appears form-only or age-only (where statute themes support — soft warn, not auto-block).
- [ ] Receipt: decision + materials reviewed.

### Leave to institution
Validity under Revised Durable POA Act; whether banking path conditions met; stale-presentation judgment; accept/refuse; IDV.

### Claims
Not available until enabled. Roadmap language only.

### Acceptance
Synthetic NJ path with affidavit request; SLA timer recorded; cross-jurisdiction fixtures isolated.

---

## ENG-JURIS-CT — Connecticut (UPOAA template pilot)

**Priority:** P1 (Wave1 #4)  
**Note:** Best Wave1 candidate for **reusable UPOAA-family pack**.

### Encode
- [ ] `jurisdiction=US-CT` using UPOAA-template pack pattern.
- [ ] Timers: **7 BD** accept or request cert/translation/opinion; **5 BD** after receipt.
- [ ] Evidence: acknowledgment indicators (notary / commissioner); **Agent’s certification** (§1-352a); translation; opinion of counsel (require written reason for opinion request).
- [ ] `form_class`: statutory_short | statutory_long | other.
- [ ] Refusal-code catalog from §1-350s(b) themes; “may not require additional/different form” warning.
- [ ] Do not conflate Substitute Decision-Making Documents Act (§§1-360+) with financial POA pack.
- [ ] Receipt + disclaimer.

### Leave to institution
Whether POA is “acknowledged”; validity/authority; accept/refuse; abuse-report substance.

### Claims
Not available until enabled.

### Acceptance
UPOAA template fixtures: 7/5 timers, cert request, form-only refusal warning; isolated from PA ack requirement.

---

## ENG-JURIS-MA — Massachusetts

**Priority:** P1 (Wave1 #5)  
**Note:** Sparse statute → heavier FI policy layer; no confirmed mechanical clock.

### Encode
- [ ] `jurisdiction=US-MA` pack; default **off**.
- [ ] **Policy SLA timer** only (FI-defined); no fake statutory 7/5 clock.
- [ ] Lightweight reason codes + free text.
- [ ] Optional agent non-revocation affidavit evidence hook.
- [ ] `durability_language_claimed` flag (claim/metadata only — not validation).
- [ ] Training/disclaimer copy awareness of unreasonable-refusal damages theme — **not** a Passage legal conclusion.
- [ ] Receipt + disclaimer.

### Leave to institution
Whether DPOA valid/durable; what is “unreasonable”; accept/refuse; IDV/fraud.

### Claims
Not available until enabled.

### Acceptance
Synthetic MA path with SLA + optional affidavit; no mechanical clock implied in UI as “required by MA law.”

---

## Suggested Eng ticket order

1. **ENG-JURIS-NY** harden (reference pack)
2. **ENG-JURIS-PA** acknowledgment + gate (largest product gap)
3. **ENG-JURIS-CT** UPOAA template (reuse for Later UPOAA-family)
4. **ENG-JURIS-NJ** own-act SLA + affidavit
5. **ENG-JURIS-MA** own-act lightweight SLA

**Platform dependencies:** jurisdiction pack schema; evidence type registry; timer engine; reason-code catalogs; multi-inst policy snapshots (POL1 / Phase 0).

**Out of Wave1 Eng scope (still clarity only):** CA/TX/FL/IL R&D clocks; LA civil-law mandate; AK/AZ uncertain labels.
