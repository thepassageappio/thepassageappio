# Authority types + configurable permissions — scoping brief

**Date:** 2026-09-15  
**Owner:** Compliance (coordinate Eng + Product Designer)  
**Steve ask:** Scope use cases beyond financial POA + permission catalog (standard + institution-custom, multi-select including select-all).  
**Status:** Internal product scoping. **Not legal advice. Not certification.**  
**Boundary (hard):** Passage = institution workflow + saved decision record. Does **not** create legal authority, validate instruments, grant account access, execute transactions, or move money.

**Builds on (do not contradict):**
- `docs/AUTHORITY-SCOPE-CATALOG-REQUIREMENTS-2026-09-08.md`
- `docs/INSTITUTION-POLICY-MANAGEMENT-REQUIREMENTS-2026-09-08.md`
- Wave1 jurisdiction encode checklists / 50-state matrix (financial POA first)
- Multi-institution Phase 0 (in-scope for product)

**Live claims today:** New York financial POA account-servicing only until other types/states are built and enabled.

---

## A) Use cases beyond financial POA

Each use case is a separate **authority type** with its own starter permission catalog, evidence set, and jurisdiction hooks. Same core engine: request → evidence → institution decision → receipt → lifecycle (revoke/expire).

### A0) Financial POA (current wedge — reference)

| Field | Content |
| --- | --- |
| Personas | Institution staff/reviewer; principal (account holder); representative (agent) |
| Evidence | POA instrument; identity evidence; representative certification / state-specific ack (e.g. PA §5601(d)); optional affidavit |
| Decision kinds | Accept / accept-with-limits / refuse / more-info; per-action + per-channel outcomes |
| Receipt | Requested vs accepted actions/channels; limits; policy+jurisdiction versions; lifecycle |
| State/compliance hooks | Wave1 NY→PA→NJ→CT→MA encode; 50-state matrix; acceptance clocks / reason codes |
| Encode | Jurisdiction packs; evidence types; timers; reason catalogs; action semantic keys |
| Institution decides | Validity/scope; final accept/refuse; IDV/fraud; entitlements in core banking |

---

### A1) Death certificate / decedent account servicing

**Why high value:** Branches already run “someone died — what do we need?” packets; high friction, high complaint risk, multi-doc.

| Field | Content |
| --- | --- |
| Personas | Institution staff; claimant (executor/administrator/surviving joint owner/payable-on-death beneficiary — **role typed**); optionally attorney |
| Evidence | Certified death certificate (or state-acceptable copy); claimant ID; letters testamentary / administration **or** small-estate affidavit / affidavit of heirship (jurisdiction-specific); relationship proof; account list |
| Decision kinds | Recognize claimant role for **named servicing acts**; refuse; more-info; refer-to-estate counsel (FI process) |
| Receipt | What role was recognized; which acts accepted/limited; docs reviewed; version stamps; no “estate closed” claim |
| State/compliance hooks | Probate vs small-estate thresholds; certified vs unofficial death proof; joint-account survivorship vs estate; retention of death docs; privacy of decedent/heirs |
| **Encode** | Authority type `decedent_servicing`; evidence types `death_certificate`, `letters_testamentary`, `letters_administration`, `small_estate_affidavit`, `heirship_affidavit`; role enum; jurisdiction flags for small-estate path availability; reason codes for incomplete probate docs |
| **Institution decides** | Whether death proof is sufficient; which estate path applies; whether claimant may act; core-system freeze/release |

**Starter permission examples:** receive statements; discuss service; claim POD/TOD where product allows; close/retitle **only if** FI product+policy allow; stop ACH; order records — **not** “disburse estate” as Passage entitlement.

---

### A2) Vehicle / car title authority (FI-adjacent + dealer/DMV handoff)

**Why high value:** Auto loans, title holding, payoff letters, release of lien — often a separate painful workflow from deposit POA.

| Field | Content |
| --- | --- |
| Personas | Institution (lender/servicer); owner/principal; agent under POA or other; sometimes dealer/title company (as **recipient of decision**, not Passage user at first) |
| Evidence | Vehicle POA or title POA form (state DMV forms vary); ID; VIN/title number; loan/account link; odometer/title status as FI requires |
| Decision kinds | Accept limited acts (payoff quote, lien release request packet, title docs release); refuse; more-info |
| Receipt | VIN/account bound; accepted acts; docs on file; disclaimer that Passage does not file with DMV |
| State/compliance hooks | State DMV POA forms; notary/witness for vehicle instruments; lienholder rules — **heavy leave-to-institution / do-not-auto-file** |
| **Encode** | Authority type `vehicle_title_authority`; evidence `vehicle_poa_or_dmv_form`, `title_or_registration_copy`; fields VIN, title#, lien status; permission keys for payoff letter, discuss loan, receive title docs, request lien release **packet** |
| **Institution decides** | Whether instrument is acceptable for title/lien acts; actual DMV/ELT filing; releasing title |

---

### A3) Executor / personal representative — estate banking

| Field | Content |
| --- | --- |
| Personas | Institution; executor/PR; optionally attorney; (principal deceased — no principal confirm path) |
| Evidence | Letters testamentary/administration; death certificate; PR ID; will excerpt if FI policy asks (careful retention) |
| Decision kinds | Open estate account / service existing accounts under PR powers — per FI product; refuse; more-info |
| Receipt | Role=executor/PR; accepted banking acts; letters version/date; no “will is valid” language |
| State/compliance hooks | Letters required vs small-estate; bond requirements (FI may ask); multi-state probate |
| **Encode** | Authority type `executor_estate`; evidence letters + death cert; **no principal participant step** (workflow variant); permission catalog skewed to estate admin banking |
| **Institution decides** | Probate sufficiency; account opening/retitle; investment powers |

---

### A4) Trustee authority (trust account servicing)

| Field | Content |
| --- | --- |
| Personas | Institution; trustee(s); possibly co-trustee; settlor if living (optional) |
| Evidence | Trust certificate / abstract / certification of trust (prefer over full trust); trustee ID; amendments if required by FI |
| Decision kinds | Recognize trustee for listed acts; dual-trustee rules; refuse; more-info |
| Receipt | Trustee identity; accepted acts; cert-of-trust on file; limits (e.g. no amend trust) |
| State/compliance hooks | Certification-of-trust statutes (many states); co-trustee unanimity; directed trusts |
| **Encode** | Authority type `trustee`; evidence `certification_of_trust`, optional `trust_instrument_excerpt`; co-trustee approval control; permission groups info/service/deposit/transfer/invest |
| **Institution decides** | Trust existence/powers; whether full instrument required; investment suitability |

---

### A5) Guardianship / conservatorship (court-appointed)

| Field | Content |
| --- | --- |
| Personas | Institution; guardian/conservator; court (as issuing authority — docs only) |
| Evidence | Letters of guardianship/conservatorship; court order pages for powers/limits; guardian ID; bond proof if FI requires |
| Decision kinds | Accept within **court-limited** powers; refuse acts outside order; more-info |
| Receipt | Court case id/date; powers accepted vs excluded per order; sunset/review date if any |
| State/compliance hooks | Court vs POA; annual accounting expectations (FI may want reminders — optional); highly sensitive |
| **Encode** | Authority type `guardianship_conservatorship`; evidence `letters_of_guardianship`, `court_order_powers`; hard UI: requested acts must map to order categories; **cannot** invent powers |
| **Institution decides** | Scope under order; whether act is authorized; IDV |

---

### A6) Optional later: insurance / claim beneficiary packet (FI-adjacent)

| Field | Content |
| --- | --- |
| Personas | Institution (as custodian/issuer adjacency) or partner; claimant |
| Evidence | Death cert; policy/claim form; beneficiary ID |
| Encode vs institution | Encode packet + decision record; institution/insurer decides claim payment — Passage never pays |

Include only if Commercial prioritizes; not Wave1.

---

## B) Permission catalog framework

Align with existing scope-catalog + policy-management docs. Extend to **all authority types**.

### B1) Layers (keep distinct)

1. **Requested powers** — what requestor multi-selects.
2. **Institution-approved actions** — subset accepted/limited/rejected.
3. **Channels** — branch, phone, view-only online, transactional online, mobile, API (representative’s **own** identity — never principal credentials).
4. **Controls** — limits, dual approval, duration, account boundary, escalation.

Provenance on every rule: `platform` | `jurisdiction` | `institution`.

### B2) Passage-standard action keys (financial POA starter — illustrative)

Stable semantic keys (labels editable; meaning locked until Passage semantic version bump):

| Group | Example keys |
| --- | --- |
| Information | `view_balances_transactions`, `receive_statements`, `receive_tax_documents`, `receive_notices` |
| Service | `discuss_service_issues`, `update_mailing_address_approved`, `order_records`, `meet_in_branch` |
| Deposits/cash | `make_deposits`, `withdraw_cash` |
| Payments/transfers | `pay_bills`, `transfer_between_owned_accounts`, `initiate_ach`, `initiate_wire_domestic`, `initiate_wire_international` |
| Checks/cards | `write_or_stop_checks`, `request_representative_card` |
| Account admin | `open_account`, `close_account`, `retitle_account` |
| Credit | `borrow_or_manage_credit` |
| Investments | `trade_or_manage_investments` |
| Digital channels | `channel_view_only_online`, `channel_transactional_online`, `channel_mobile`, `channel_phone` |

**Current hosted fixture** (`receive_duplicate_statements`, `discuss_service_issues`) remains valid synthetic evidence — not the launch catalog.

### B3) Institution admin: create / update / remove custom permissions

| Capability | Behavior |
| --- | --- |
| Activate/deactivate standard keys | Allowed; cannot change semantic meaning via label-only edit |
| Custom actions | Institution namespace; label, description, category, account/product types, risk tier, review guidance |
| Remove/deactivate custom | Soft-deactivate preferred; activated requests keep snapshot |
| Multi-select UX | Requestor selects many actions; **Select all** = all **currently offered** (active for that authority type + account/product), not hidden/locked items |
| Select-all clarity | UI must show count + plain list preview; “all” never includes jurisdiction-locked or institution-excluded acts |
| Publish | Immutable policy/catalog version; rebase rules per policy-management doc |

### B4) Per–authority-type catalogs

Each type (financial_poa, decedent_servicing, vehicle_title_authority, executor_estate, trustee, guardianship_conservatorship) has:
- its own starter standard keys;
- default exclusions (e.g. guardianship cannot request “amend trust”);
- evidence requirements binding;
- optional jurisdiction locks (Wave1 financial POA first).

### B5) Request + receipt invariants (carry forward)

- Snapshot catalog+policy versions on draft; lock on activation.
- Accepted ⊆ requested.
- Receipt lists requested vs accepted vs limited vs rejected + channels + limits + versions + lifecycle.
- Integration events distinguish `decision_recorded` vs `entitlement_requested` vs `entitlement_acknowledged`.

---

## C) Risks / disqualifiers

| Risk | Disqualifier / control |
| --- | --- |
| Looking like a legal validator | No “validated,” “certified POA,” “court order approved by Passage”; receipt = institution decision record |
| Creating authority | No document generation/execution of POA/trust/court forms as legal instruments (upload + review only unless separate future gate) |
| Granting account access | No core-banking entitlement execution inside Passage; channels are **requests**; FI systems remain authoritative |
| Credential sharing | Never instruct use of principal’s login; representative separate identity |
| Select-all smuggling | Select-all cannot include locked/excluded/high-risk acts institution turned off |
| Custom permissions washing legality | Custom keys cannot override jurisdiction locks or impersonate Passage standard keys |
| Death/guardianship sensitivity | Extra retention/privacy classes; minimize full will/trust upload when cert-of-trust/letters suffice |
| Multi-state overclaim | Enable per type×jurisdiction; live claims stay truthful (NY financial POA until more enabled) |
| Vehicle/DMV | Passage does not file titles or release liens — only records FI decision / packet readiness |
| Money movement | Withdraw/wire keys are **decision vocabulary**, not payment rails |

---

## D) Suggested build phases (after current Wave1 states + multi-inst)

Assumes Wave1 financial POA jurisdiction encode (NY harden → PA ack → CT UPOAA → NJ → MA) and multi-inst Phase 0 continue as committed product work.

| Phase | Focus | Exit signal |
| --- | --- | --- |
| **P0 (now)** | NY financial POA demo truth; synthetic data; multi-inst foundations | Honest NY-only demo E2E |
| **P1** | Configurable **financial POA** permission catalog (standard + custom + select-all) + policy publish/snapshot (POL1) | Owner publishes catalog; request uses it; receipts match; stale draft rebase |
| **P2** | Wave1 state packs on financial POA (PA acknowledgment gate, CT/NJ/MA) | PA enableable only with ack workflow; others gated until green |
| **P3** | Authority type #2: **decedent / death certificate** servicing (workflow variant without principal confirm) | Synthetic death-packet E2E + plain-language UX |
| **P4** | Authority type #3: **trustee** (cert-of-trust first-class evidence) | Catalog + dual-trustee control + receipt |
| **P5** | **Executor/estate** + **guardianship** (court letters; no invented powers) | Separate evidence packs; high-risk exclusions |
| **P6** | **Vehicle/title** adjacency (VIN-bound; no DMV filing) | Optional Commercial priority |
| **P7** | Later-state UPOAA-family reuse from CT template; Wave2 clock R&D (CA/TX/FL/IL) internal | Clarity → optional enable |

**Product Designer:** IA for authority-type picker; permission multi-select + select-all; plain-language previews per persona; death/guardian careful copy.  
**Engineering:** catalog schema per authority type; custom action namespace; snapshot/publish; workflow variants (no-principal); evidence registry extensions.  
**Compliance:** encode vs institution per type; claim guardrails; jurisdiction locks only where we have packs.  
**Commercial/Marketing:** no type advertised as live until Eng+QA enable flag is on.

---

## Hand-off checklist

- [ ] Eng: ticket skeleton from §B + §D P1 (catalog) and §A evidence types
- [ ] Product Designer: UX flows for multi-select/select-all + authority-type switcher
- [ ] CoS: file this brief in aggregate roadmap
- [ ] Repo: add to PR #116 or sequel docs PR when push path free
- [ ] Claims: unchanged — NY financial POA only until enablement
