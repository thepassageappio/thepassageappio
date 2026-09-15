# NY-only demo truth pack — Milestone 1

**Date:** 2026-09-15  
**Status:** Approved for M1 build / demo / sales talk-track under Steve roadmap approval  
**Authority:** Repo `docs/agent/JURISDICTIONS.md` + LEGAL-REVIEW materials; not legal advice; not certification

Hard product boundary (always on): Passage is the institution’s workflow and saved decision record for requests to act for another person. It does **not** create legal authority, validate POAs, move money, or grant account access.

---

## 1. What may be claimed (demo-ready / pilot-sellable)

### Product truth
- Live jurisdiction and evaluation fixtures: **New York financial power-of-attorney account-servicing** only.
- Passage keeps the request moving and produces a **decision receipt**: who decided, what was reviewed, accept / accept-with-limits / refuse, policy version, timestamps, append-only history.
- The **financial institution** keeps identity, fraud, legal, and policy review and the final accept/refuse decision.
- Demo uses a **fixed New York** synthetic policy (two non-transactional example actions such as duplicate statements / discuss service issues) unless a later build ships more.
- Five-state work is a **validation roadmap**, not availability: New York, Pennsylvania, New Jersey, Connecticut, Massachusetts.

### Safe phrasing examples
- “New York financial POA account-servicing workflow.”
- “One institution decision, with a clear record of what was decided.”
- “Passage organizes evidence. The institution decides.”
- “We are validating additional states; today the live product is New York only.”

### UX / copy bar (Steve)
- Plain language a five-year-old can follow.
- No AI fluff / slop on website or external surfaces.

---

## 2. What must stay off (false if claimed)

| Claim / behavior | Why off |
| --- | --- |
| Pennsylvania (or NJ/CT/MA) is live / available / supported | Not enabled; PA has a confirmed product gap |
| “Five-state support” or “multi-state ready” as a product claim | Roadmap only until counsel packages + implementation |
| Passage validates / certifies / creates / notarizes a POA | Explicit non-claim across product SoT |
| Passage grants account access or moves money | Explicit non-claim |
| Generic `representative_certification` = Pennsylvania § 5601(d) Acknowledgment | Documented engineering determination — do not relabel |
| CA / TX / FL / IL availability or “compliant in those states” | Separate R&D wave only; not product set |
| “Counsel-approved,” “safe harbor,” “legally valid,” “certified POA” | Would be false without counsel + evidence |
| Auto legal conclusions from timers or checklists | Institution decides; Passage records |

### Pennsylvania (explicit demo rules)
- **Disabled** in product gates and fixtures.
- **Gap documented:** statutory agent Acknowledgment under 20 Pa.C.S. § 5601(d) is not captured by current `representative_certification`.
- Demo/sales: say “Pennsylvania is on the validation roadmap; not launched” if asked — never imply live.
- Source of truth: `docs/PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md`.

---

## 3. Five-state product set vs R&D wave (keep separate)

| Layer | States | Use in M1 |
| --- | --- | --- |
| **Product / demo / Commercial** | NY (live), PA (gap), NJ, CT, MA (roadmap) | Claims, fixtures, JURISDICTIONS.md |
| **Enterprise R&D only** | CA, TX, FL, IL (+ NY clock research overlap) | Internal modeling of acceptance clocks; never market in M1 |

Do not swap ICP or demo presets to CA/TX/FL/IL.

---

## 4. M1 build: do not block on counsel — unless the claim would be false

### Ship without waiting on counsel
- NY-only demo + identical E2E paths.
- Boundary copy and receipt language already in product SoT.
- PA remains unavailable; no PA UI path that implies compliance.
- Placeholder “roadmap” language for five states (not availability).
- Internal docs: this truth pack + counsel question queue.

### Must wait / refuse if it would make a false claim
- Enabling `US-PA` or marketing PA/NJ/CT/MA as live.
- Labeling generic certification as PA Acknowledgment.
- “Counsel-approved jurisdiction package” badges without counsel.
- Any “validated POA” / “creates authority” wording.
- Shipping CA/TX/FL/IL as live jurisdiction packs.

### Optional NY modeling (illustrative, watermarked — not “NY law compliance”)
Research notes GOL §5-1504-style clocks (~10 business days honor / written reject / affidavit; then ~7). May appear only as **institution-configured timers** or **demo presets clearly labeled illustrative** — never as Passage legal determination.

---

## 5. Demo QA checklist (compliance)

- [ ] Public/sales copy: New York only.
- [ ] No PA enablement; PA fixtures do not receive NY-only requirements incorrectly labeled as PA.
- [ ] Receipt and reviewer copy: organizes evidence / does not decide legal validity.
- [ ] No “safe harbor,” “validated,” “certified POA,” multi-state available.
- [ ] Synthetic happy path + refuse path complete with matching receipts.
- [ ] Plain-language bar on external surfaces.

---

## 6. Owners

- **Compliance:** truth pack + counsel queue + JURISDICTIONS extension draft.
- **Engineering:** land docs PR; keep jurisdiction gate NY-only.
- **Commercial:** cite five-state roadmap; no overclaim.
- **QA:** verify demo truth checklist.
- **Chief of Staff:** aggregate; hold counsel Qs for Steve brief.
