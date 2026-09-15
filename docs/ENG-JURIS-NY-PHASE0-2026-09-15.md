# ENG-JURIS-NY Phase 0 — shipped scaffolding (2026-09-15)

**Issue:** [#124](https://github.com/thepassageappio/thepassageappio/issues/124)  
**Source checklist:** `docs/WAVE1-ENG-ENCODE-CHECKLISTS-2026-09-15.md`  
**Status:** Phase 0 only. **Not** full NY harden.

## Product boundary (unchanged)

Passage = workflow + decision record. Does **not** validate POAs or create authority. Live claims stay **NY-only**. No AI fluff. Never recreate `PA-F39449782D`. Do not regress strips / invite / draft-edit / participant receipt.

## What this PR ships

1. Versioned `jurisdiction_packs` catalog with seeded `us_ny_financial_poa` / `2026.1` (`US-NY`), including 10 BD then 7 BD default timer fields.
2. `jurisdiction_reason_codes` structure + NY theme seed codes (including sole-refusal warn codes). FI overlay placeholder only.
3. Request pin columns: `jurisdiction_code`, pack key/version, `form_class`, recorded timer days. Evidence hook: `attorney_certified_copy` on artifacts. Affidavit request/response table + service-only stub RPC.
4. Org settings table for institution-configurable timer defaults.
5. Minimal staff UI: pack version shown on `/app/policies` (plain language).
6. TypeScript helpers + migration/unit tests.

## Remaining checklist items (follow-up PRs — do not claim done)

- [ ] Wire timers into UI clocks / SLA surfaces (beyond recorded metadata).
- [ ] Refusal notice delivery fields: principal + agent addresses, method, timestamp.
- [ ] Revocation notice cue: office where account located + receipt time.
- [ ] Full staff affidavit request/response UI (RPC stub exists).
- [ ] FI-editable reason-code overlay authoring + sole-refusal soft-warn in decision UI.
- [ ] Opinion-of-counsel / supplemental request hooks end-to-end.
- [ ] Synthetic NY happy / refuse / affidavit-request acceptance matrix with matching receipts.
- [ ] Pin pack on new draft creation RPC (today: backfill + settings; creation path still uses `ny_financial_poa` template).
- [ ] Show pack version on decision receipt / case surfaces (policies page only in Phase 0).
- [ ] POL1 full policy snapshot body (separate track).

## Non-claims

- This PR does **not** finish ENG-JURIS-NY.
- This PR does **not** enable PA/NJ/CT/MA.
- Timers are recorded institution-configurable metadata; not Passage legal determinations.
