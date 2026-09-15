# FIFTY-STATE REQUIREMENTS MATRIX — Passage Authority (FI POA / delegated-authority REQUEST workflows)

**Date:** 2026-09-15  
**Audience:** Internal product / engineering / compliance design (“Ash Ketchum” = map all 50)  
**Steve 2026-09-15:** Counsel engagement OFF active plan — this matrix exists for **encode vs leave-to-institution clarity**, not as a counsel-gated deliverable. Mark uncertainty honestly.  
**Hard product boundary:** Passage supports **workflow + saved decision record**. It does **NOT** create legal authority, validate POAs, move money, grant account access, or certify compliance. Not legal advice. Not counsel-approved packs.

**Build order (first BUILD):** NY → PA → NJ → CT → MA (= Wave1).  
**Wave2-R&D (internal only, not M1 product):** CA, TX, FL, IL.  
**M1 marketing claims:** **NY-only** until more states are built and enabled. Five-state language = validation roadmap, not availability.

**Statute-family methodology:** Prefer ULC + enacted code. Secondary lists (LawDistrict, LegalDesire, WPR, PRIORITY-STATES.md) **conflict** on PA/TX/AK/AZ/MD/DE and others — rows marked `uncertain` or `modified-UPOAA` when sources disagree. Do not invent.

**UPOAA model clock pattern (design template only):** typically accept or request certification/translation/opinion within **7 business days** of presentation; accept within **5 business days** after receipt of requested materials; often cannot require “our form only.” Controlling law is each state’s code.

**Sources reused:** `PRIORITY-STATES.md`, `FRAMEWORK.md`, `SOURCES.md`, `JURISDICTIONS-EXTENDED-DRAFT.md`, `NY-ONLY-DEMO-TRUTH-PACK-2026-09-15.md`, `STEVE-DECISIONS-2026-09-15.md`. Gap fills via WebSearch/WebFetch 2026-09-15 (.gov / legislature preferred).

---

## Legend

| Tag | Meaning |
|-----|---------|
| **UPOAA-family** | Secondary consensus that jurisdiction enacted UPOAA (or statute titled Uniform POA Act) with typical §119/§120-style acceptance themes |
| **modified-UPOAA** | ULC or secondary lists as adopter **or** statute is UPOAA-inspired, but local differences are material for product (or sources conflict toward “modified”) |
| **own-act** | Clear non-UPOAA / distinctive state act for FI acceptance modeling |
| **uncertain** | Secondary sources conflict; cite uncertainty — do not freeze pack label |

| Clock theme | Meaning |
|-------------|---------|
| **mechanical days** | Statute states numeric business/calendar-day accept/refuse/request clocks |
| **reasonable time** | Statute uses reasonableness / liability without a hard day count (FI policy SLA) |
| **hybrid** | Mix (e.g., reasonable + FI presumption days) |
| **unknown** | Acceptance clock not confirmed in this research pass |

| Build priority | Meaning |
|----------------|---------|
| **Wave1** | NY, PA, NJ, CT, MA — first build order |
| **Wave2-R&D** | CA, TX, FL, IL — internal modeling only; not M1 product claims |
| **Later** | Remaining states — clarity for encode vs leave-to-institution |

---

## A. Wave1 deep rows (NY → PA → NJ → CT → MA)

### NY — New York | Wave1 | **LIVE M1 claims only**

| Field | Content |
|-------|---------|
| Statute family | **own-act** |
| Primary cite | N.Y. GOL Title 15, esp. **§5-1504** — https://www.nysenate.gov/legislation/laws/GOB/5-1504 (also §§5-1501B, 5-1510) |
| Acceptance/refusal clock | **mechanical days** — honor / written reject / request affidavit **≤ 10th business day** after presentation of original or attorney-certified copy; after response/affidavit generally **7 business days** to honor or finally reject (§5-1504(3)) |
| Distinctive artifacts | **NY statutory short form**; full-force **affidavit** (§5-1504(7)); written rejection with **all reasons** to principal + agent addresses on POA; “not our form” / age alone often unreasonable for statutory short form; non-statutory short form acceptance **not required** (§5-1504(8)) |
| **Encode in Passage** | `jurisdiction=US-NY`; overlay version; `form_class` statutory_short / non_statutory / unknown; timers **10 BD / 7 BD**; evidence: instrument upload, attorney-certified-copy flag, affidavit request/response, opinion-of-counsel hooks; **reason-code catalog** mapped to §5-1504 reasonable-cause examples + FI custom; refusal notice delivery fields (addresses, method, timestamp); revocation actual-notice office cue; receipt fields: decision, actor, policy pack, clock deadlines; disclaimer always on |
| **Leave to institution** | Whether instrument is properly executed / durable / in scope; whether “doing business in NY” triggers overlay; accept/refuse; IDV/fraud; APS/SAR substance; choice of statutory vs non-statutory treatment |
| Notes / uncertainty | Edge: remote-only digital banks & “doing business”; grandfathered forms. **M1 marketing = NY only.** |

### PA — Pennsylvania | Wave1 | roadmap / not enabled

| Field | Content |
|-------|---------|
| Statute family | **modified-UPOAA** (ULC often lists adopter; statute is **20 Pa.C.S. ch. 56**, not titled UPOAA; material local differences — secondary conflict) |
| Primary cite | 20 Pa.C.S. **§§5601 et seq.**; acceptance/reliance **§5608**; liability for refusal **§5608.1** — https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056.008.000..HTM and https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056.008.001..HTM |
| Acceptance/refusal clock | **mechanical days** — accept **or** request affidavit/certification/translation/opinion **≤ 7 business days** after presentation; after receipt of requested item generally **≤ 5 business days** to accept (§5608.1) |
| Distinctive artifacts | **Agent Acknowledgment** under **§5601(d)** (prescribed content; agent has no authority until signed) — **must NOT reuse** generic `representative_certification`; notice under §5601(c); notary + 2 witnesses execution themes (post–Act 95); §5606 continuance affidavit |
| **Encode in Passage** | Separate evidence type `pa_agent_acknowledgment` (agent name/signature, execution date, statutory text version, association to instrument, artifact); timers **7 BD / 5 BD**; supplemental request types: certification, translation, §5606 affidavit, opinion of counsel; refusal grounds catalog from §5608.1(b); receipt fields recording acknowledgment on file vs missing; **gate: PA disabled until acknowledgment workflow shipped** |
| **Leave to institution** | Whether §5601 execution/acknowledgment satisfied; applicability/exceptions (§5601(e.1)/(e.2)); accept/refuse; IDV/fraud |
| Notes / uncertainty | Family tag disputed (ULC vs “own PEF Code”). Product gap documented 2026-09-08. Do not market PA as live. |

### NJ — New Jersey | Wave1 | roadmap / not enabled

| Field | Content |
|-------|---------|
| Statute family | **own-act** (Revised Durable Power of Attorney Act; **not** UPOAA) |
| Primary cite | N.J.S.A. **46:2B-8.1 et seq.** (durable POA; good-faith reliance **46:2B-8.6**); banking acceptance **46:2B-13** — e.g. https://law.justia.com/codes/new-jersey/title-46/section-46-2b-13/ (prefer official NJ statutes viewer for freeze). Proposed/related modernization bills historically referenced broader third-party acceptance — **confirm current consolidated text** before pack freeze. |
| Acceptance/refusal clock | **reasonable time** for banking decisions under **46:2B-13**; stale-presentation themes (e.g., first presented >10 years / inactive 10 years with relationship carve-outs — **verify current text**); no NY-style 10/7 BD statutory short-form clock confirmed |
| Distinctive artifacts | Agent **affidavit** of non-revocation/non-termination (46:2B-8.6); banking original-signature / certified-copy rules; FI may refuse on genuineness/death/revocation/disability-at-execution beliefs; written reasons themes when agent address provided (banking path) |
| **Encode in Passage** | `jurisdiction=US-NJ`; evidence: instrument, agent affidavit request/response, original vs certified copy flags; **policy SLA timer** (not hard statutory 10/7); reason codes for banking refusal themes; “not our form” / age-alone refusal warning (where statute forbids — verify); receipt: decision + materials reviewed |
| **Leave to institution** | Validity under Revised Durable POA Act; whether banking §46:2B-13 conditions met; accept/refuse; IDV; 10-year stale judgment |
| Notes / uncertainty | Secondary sources and bill text (e.g. S378) can outrun consolidated code — **mark NJ acceptance catalog uncertain until official text freeze**. Not UPOAA. |

### CT — Connecticut | Wave1 | roadmap / not enabled

| Field | Content |
|-------|---------|
| Statute family | **UPOAA-family** (Connecticut Uniform Power of Attorney Act) |
| Primary cite | Conn. Gen. Stat. **§§1-350 et seq.**; acceptance/reliance **§1-350r**; liability for refusal **§1-350s**; agent’s certification **§1-352a**; statutory forms **§1-352** — https://cga.ct.gov/current/PUB/chap_015c.htm |
| Acceptance/refusal clock | **mechanical days** — accept **or** request certification/translation/opinion **≤ 7 business days** after presentation; accept **≤ 5 business days** after receipt of requested item (§1-350s(a)); translation/opinion expense shift if request >7 BD after presentation (§1-350r(e)) |
| Distinctive artifacts | **Acknowledged** POA definition (notary / commissioner of Superior Court); optional **Agent’s certification** (§1-352a); statutory short/long forms (§1-352); 2 witnesses + acknowledgment execution (§1-350d); “may not require additional/different form” (§1-350s(a)(3)); APS-style report refusal ground (§1-350s(b)(6)) |
| **Encode in Passage** | UPOAA-template pack keyed `US-CT`; timers **7 BD / 5 BD**; evidence: acknowledgment indicators, agent certification, translation, opinion of counsel (with written reason for opinion request); refusal-code catalog from §1-350s(b); form_class statutory_short / long / other; receipt fields |
| **Leave to institution** | Whether POA is “acknowledged”; validity/authority; accept/refuse; good-faith invalidity belief; DSS abuse-report substance |
| Notes / uncertainty | CT also has Substitute Decision-Making Documents Act (§§1-360 et seq.) — separate from financial POA pack; do not conflate. |

### MA — Massachusetts | Wave1 | roadmap / not enabled

| Field | Content |
|-------|---------|
| Statute family | **own-act** (not UPOAA; MUPC durable POA provisions) |
| Primary cite | M.G.L. c. **190B §§5-501 to 5-507** — e.g. https://malegislature.gov/Laws/GeneralLaws/PartII/TitleII/Chapter190B/Section5-501 ; §5-506 unreasonable refusal damages; §5-507 good-faith third-party protection |
| Acceptance/refusal clock | **reasonable time / unknown mechanical** — **no** confirmed statutory 7-BD accept/refuse clock; liability theme for **unreasonable refusal** (§5-506) without enumerated ground list or fee-award regime like NY/UPOAA |
| Distinctive artifacts | Durability **language required** (not durable by default); agent may sue for damages on unreasonable refusal; good-faith reliance protection; common practice: agent non-revocation affidavit (often document-drafted, not a rich statutory form like IL/NY) — **none flagged as mandatory statutory short-form pack** |
| **Encode in Passage** | `jurisdiction=US-MA`; **policy SLA timer** (FI-defined); lightweight reason codes + free text; optional affidavit evidence hook; durability_language_claimed flag (claim only); receipt: decision + “unreasonable refusal awareness” training copy (not legal conclusion) |
| **Leave to institution** | Whether DPOA valid/durable; what is “unreasonable”; accept/refuse; IDV/fraud |
| Notes / uncertainty | UPOAA adoption historically proposed but **not** controlling — treat as own-act. Sparse statute → heavier FI policy layer. |

---

## B. Wave2-R&D deep rows (CA / TX / FL / IL) — internal modeling only

### CA — California | Wave2-R&D

| Field | Content |
|-------|---------|
| Statute family | **own-act** (Probate Code Div. 4.5) |
| Primary cite | Cal. Prob. Code **§§4000–4545**; third persons **§§4300–4310**; statutory form **§4406** — https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?division=4.5.&tocCode=PROB&targetLawCode=PROB |
| Clock | **reasonable time** (less mechanical than NY/TX/FL) |
| Distinctive artifacts | Statutory form path §4406; §4305 affidavit; fee exposure themes §4306/§4406; “not our form” alone unreasonable for statutory form |
| **Encode** | Reasonable-time SLA config; affidavit hooks; form_class; form-only refusal warning; CCPA/CPRA privacy flags |
| **Leave to institution** | Legal validity/durability/scope; accept/refuse decision; IDV/fraud/BSA; exception classification; APS/LE/SAR substance (code-only flags OK in Passage) |
| Notes | Do not market in M1. |

### TX — Texas | Wave2-R&D

| Field | Content |
|-------|---------|
| Statute family | **modified-UPOAA** (Estates Code ch. 751–752; UPOAA-style acceptance; often listed as adopter — do not inherit generic UPOAA pack blindly) |
| Primary cite | Tex. Est. Code **ch. 751–752**; §§751.201–751.212 — https://statutes.capitol.texas.gov/ |
| Clock | **mechanical days** — request cert/opinion ≤**10 BD**; accept ≤**7 BD** after receipt; translation request ≤**5 BD**; parties may **agree to extend** |
| Distinctive artifacts | Agent’s certification §751.203; opinion §751.204; translation §751.205; **11 enumerated refusal grounds** §751.206; written refusal §751.207; “other form” generally not condition §751.202 |
| **Encode** | Timers 10/7/5 BD + extension objects; 11-ground reason-code catalog; SAR-related **code only**; cert/opinion/translation workflows |
| **Leave to institution** | Legal validity/durability/scope; accept/refuse decision; IDV/fraud/BSA; exception classification; APS/LE/SAR substance (code-only flags OK in Passage) |
| Notes | Secondary “pure UPOAA” label inconsistent. |

### FL — Florida | Wave2-R&D

| Field | Content |
|-------|---------|
| Statute family | **modified-UPOAA** / Florida Power of Attorney Act (own ch. 709) |
| Primary cite | Fla. Stat. **§709.2119**, **§709.2120** — https://www.flsenate.gov/Laws/Statutes/2026/709.2119 ; https://www.flsenate.gov/Laws/Statutes/2026/709.2120 |
| Clock | **hybrid** — reasonable time; FI/BD **4 days excl. Sat/Sun/legal holidays** presumed reasonable for specified banking/investment paths when §709.2208 authority present |
| Distinctive artifacts | Affidavit/opinion/translation; **remote notarization electronic journal/record** request theme; written rejection reasons |
| **Encode** | 4-BD FI timer + transaction_class enum; e-journal evidence type; refusal catalog |
| **Leave to institution** | Legal validity/durability/scope; accept/refuse decision; IDV/fraud/BSA; exception classification; APS/LE/SAR substance (code-only flags OK in Passage) |
| Notes | Map which products fall under 4-day presumption with FI counsel later — not blocking this matrix. |

### IL — Illinois | Wave2-R&D

| Field | Content |
|-------|---------|
| Statute family | **own-act** (755 ILCS 45) |
| Primary cite | **755 ILCS 45/2-8** — https://www.ilga.gov/Documents/legislation/ilcs/documents/075500450K2-8.htm |
| Clock | **reasonable time** / liability-driven SLA (no NY-style hard clock confirmed) |
| Distinctive artifacts | Statutory **Agent’s Certification and Acceptance of Authority**; unreasonable- vs reasonable-cause lists; entity-as-agent themes; P.A. 104-609 / 103-994 text variants |
| **Encode** | Agent’s Certification template hooks; versioned cause-code lists by P.A. effective date; form-only refusal warning |
| **Leave to institution** | Legal validity/durability/scope; accept/refuse decision; IDV/fraud/BSA; exception classification; APS/LE/SAR substance (code-only flags OK in Passage) |
| Notes | **Effective-text uncertainty** (blanked grounds post-amendment) — flag before any IL enablement. |

---

## C. All 50 states (+ DC) — master table

NOTE_MATRIX_CONTINUES_IN_NEXT_CALL_DUE_TO_SIZE