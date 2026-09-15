# FIFTY-STATE SUMMARY — Passage Authority product requirements clarity

**Date:** 2026-09-15  
**Companion:** `FIFTY-STATE-REQUIREMENTS-MATRIX.md`  
**Steve 2026-09-15:** Counsel engagement OFF active plan. Full-50 map = encode vs leave-to-institution clarity (“Ash Ketchum”), **not** simultaneous enablement and **not** a counsel-sign-off prerequisite for the document to exist.  
**Hard boundary:** Passage = workflow + saved decision record. Does **not** create legal authority, validate POAs, move money, grant account access, or certify compliance. Not legal advice.

**M1 marketing pointer:** Live product claims remain **New York only** until more states are built and enabled. See `NY-ONLY-DEMO-TRUTH-PACK-2026-09-15.md`.

---

## 1. Headcounts (working tags — secondary uncertainty acknowledged)

| Tag | 50 states | + DC |
|-----|-----------|------|
| **UPOAA-family** | 28 | 29 |
| **modified-UPOAA** | 5 (PA, TX, FL, DE, MD) | 5 |
| **own-act** | 15 | 15 |
| **uncertain** | 2 (AK, AZ) | 2 |
| **Total** | **50** | **51** |

| Build priority | Jurisdictions | Count |
|----------------|---------------|-------|
| **Wave1** (build order) | NY → PA → NJ → CT → MA | 5 |
| **Wave2-R&D** (internal only) | CA, TX, FL, IL | 4 |
| **Later** | All others (+ DC) | 42 (+ DC in Later) |

**Caveat:** ULC enactment map was **not** archived as an authoritative snapshot this session. Secondary lists (LawDistrict, LegalDesire, WPR, prior PRIORITY-STATES notes) **conflict** especially on PA, TX, AK, AZ, MD, DE. Tags prefer honesty (`modified` / `uncertain`) over false precision. Reconcile before any production pack freeze.

---

## 2. Common encode dimensions (what Passage should model everywhere)

Reusable config / evidence / receipt surface (from `FRAMEWORK.md` + matrix §D):

1. **Jurisdiction gate** — `jurisdiction_code`, overlay version, effective-date metadata, enable flag (FI chooses).
2. **Statute-family template** — UPOAA-family reuse vs own-act custom packs.
3. **Clocks** — mechanical business-day timers **or** FI policy SLA; start event = presentation; optional extension objects (TX).
4. **Decision record** — accept / refuse / pending_supplemental; actor; timestamps; append-only history.
5. **Reason-code catalogs** — jurisdiction lists + FI custom; free text; **no SAR narratives**.
6. **Evidence types** — instrument upload; certified-copy / original flags; agent affidavit / certification; opinion of counsel; translation; remote-notary journal (FL); **PA §5601(d) Acknowledgment as its own type**.
7. **Notice delivery** — principal/agent addresses, method, time (NY-critical).
8. **Form class** — statutory short form vs non-statutory vs unknown; “not our form” warning where statute flags that refusal as unreasonable.
9. **Escalation flags** — legal / fraud / BSA / APS (process support only).
10. **Receipt + disclaimer** — materials reviewed, decision, policy pack; always: Passage does not create/validate authority.
11. **Privacy / retention hooks** — role ACL, retention class metadata (tenant-configured; not a national number).

**Leave to institution (every state):** legal validity, durability, scope, execution sufficiency, exception classification, final accept/refuse, IDV/fraud, APS/LE/SAR substance, choice-of-law when multi-state.

---

## 3. Wave1 deep notes (build order)

### 1) NY — New York (**M1 live**)
- **Own-act** GOL Title 15 / §5-1504.
- **Encode:** 10 BD then 7 BD timers; statutory short-form class; full-force affidavit; multi-reason written refusal + delivery fields; reasonable-cause reason codes; revocation office-notice cue.
- **Institution:** execution/validity/scope; “doing business in NY”; accept/refuse; IDV/fraud.
- **Claim rule:** Only jurisdiction that may be marketed/demoed as live today.

### 2) PA — Pennsylvania (roadmap; **disabled**)
- **Modified-UPOAA** (ULC often lists; PEF Code ch. 56 differs).
- **Encode:** 7 BD / 5 BD; supplemental cert/translation/affidavit/opinion; **dedicated `pa_agent_acknowledgment` evidence** (§5601(d)) — do **not** reuse `representative_certification`.
- **Blocker for enablement:** acknowledgment workflow (gap documented 2026-09-08).
- **Claim rule:** Say “on validation roadmap; not launched” — never imply live.

### 3) NJ — New Jersey (roadmap)
- **Own-act** Revised Durable POA Act (46:2B-8.1 et seq.) + banking **46:2B-13**.
- **Encode:** policy SLA (reasonable time); agent affidavit; original vs certified-copy flags; banking refusal themes; form/age refusal warnings where statute supports.
- **Uncertainty:** confirm consolidated official text vs older bill commentary before reason-code freeze.

### 4) CT — Connecticut (roadmap)
- **UPOAA-family** C.G.S. §§1-350 et seq. (official: cga.ct.gov ch. 15c).
- **Encode:** classic **7 BD / 5 BD**; acknowledged-POA gate; Agent’s certification; statutory short/long forms; §1-350s(b) refusal catalog; no additional/different form requirement.
- Best Wave1 candidate for **UPOAA template reuse**.

### 5) MA — Massachusetts (roadmap)
- **Own-act** M.G.L. c.190B §§5-501–5-507; **not** UPOAA.
- **Encode:** FI policy SLA (no confirmed mechanical clock); lightweight reasons; optional affidavit; durability-language **claim** flag; §5-506 unreasonable-refusal awareness as training copy only.
- Sparse statute → heavier institution-policy layer.

---

## 4. Wave1 encode checklist (engineering)

Use when implementing packs in order NY → PA → NJ → CT → MA:

| # | Encode item | NY | PA | NJ | CT | MA |
|---|-------------|----|----|----|----|-----|
| 1 | Jurisdiction pack + version + enable flag | ● live | ○ off | ○ off | ○ off | ○ off |
| 2 | Disclaimer on create/decide/export | ● | ● | ● | ● | ● |
| 3 | Decision record (accept/refuse/pending) | ● | ● | ● | ● | ● |
| 4 | Mechanical timers | 10/7 BD | 7/5 BD | — | 7/5 BD | — |
| 5 | Policy SLA timer (when no mechanical clock) | optional stricter | optional | ● | optional | ● |
| 6 | Form class (statutory short / other) | ● | ○ | ○ | ● | ○ |
| 7 | Agent affidavit / certification evidence | affidavit | cert + §5606 | affidavit | §1-352a cert | optional |
| 8 | **PA §5601(d) Acknowledgment** distinct type | — | **● required** | — | — | — |
| 9 | Opinion of counsel request | ● | ● | ○ | ● | ○ |
| 10 | Translation request | policy | ● | ○ | ● | ○ |
| 11 | Written refusal reasons + delivery fields | **● required** | ● | banking themes | ● | recommended |
| 12 | Reason-code catalog (versioned) | §5-1504 | §5608.1 | 46:2B-13 themes | §1-350s(b) | lightweight |
| 13 | “Not our form” / age-alone warning | ● | policy | where statute | ● | policy |
| 14 | Receipt fields (actor, materials, policy, clocks) | ● | ● | ● | ● | ● |
| 15 | Never auto-decide without FI actor | ● | ● | ● | ● | ● |

● = encode for pack; ○ = not primary / N/A; — = not applicable.

---

## 5. False-claim guardrails (executive)

| Do | Do not |
|----|--------|
| “NY financial POA account-servicing workflow” | “Multi-state ready” / “50-state compliant” |
| “Five-state validation roadmap” | “PA/NJ/CT/MA available” |
| “Passage organizes evidence; institution decides” | “Passage validates / certifies / creates POA” |
| “Internal requirements matrix (not legal advice)” | “Counsel-approved” / “safe harbor” (counsel OFF plan) |
| Separate Wave2 R&D from product set | Market CA/TX/FL/IL in M1 |
| Keep PA acknowledgment as its own evidence type | Relabel generic certification as PA §5601(d) |

---

## 6. Top uncertainties (escalate later; do not invent now)

1. **ULC adopter map** — secondary conflict; archive dated ULC snapshot before pack freezes.
2. **PA family label** — ULC vs distinctive PEF Code; product treats as modified + acknowledgment-critical.
3. **TX / MD / DE** — UPOAA-influenced vs own naming; use state code, not generic pack blindly.
4. **AK / AZ** — tagged **uncertain** until code-confirmed.
5. **NJ** — banking/third-party acceptance catalog needs official consolidated freeze.
6. **IL** — P.A. 104-609 blanked “reasonable cause” items.
7. **LA** — civil-law mandate; do not reuse UPOAA template.
8. **Later-wave 7/5 BD assumption** — model pattern only until each state’s acceptance section is extracted.
9. **Multi-state “doing business” / situs** — FI selects overlay per case; Passage records who chose/why.

---

## 7. Pointers

| Doc | Role |
|-----|------|
| `FIFTY-STATE-REQUIREMENTS-MATRIX.md` | Full 50 (+DC) rows with encode vs institution split |
| `PRIORITY-STATES.md` | Prior P0 research (CA/NY/TX/FL/IL) |
| `FRAMEWORK.md` | Compliance modeling dimensions |
| `NY-ONLY-DEMO-TRUTH-PACK-2026-09-15.md` | M1 claim bar |
| `STEVE-DECISIONS-2026-09-15.md` | Counsel off; map-all-50; build order |
| `SOURCES.md` | Bibliography |

---

*Internal product requirements clarity only. Not certification. M1 claims = NY only.*
