# Orientation checklist (Milestone 1 P0)

**Owner:** Product Designer  
**Implementer:** Engineering  
**Date:** 2026-09-15  
**Extends:** `docs/PLAIN-LANGUAGE-STANDARD.md`, `docs/PRODUCT-VISION-AND-ONBOARDING.md`, `docs/UI-SYSTEM.md`  
**Hard bar:** Five-year-old words. No AI fluff. Tooltips must never carry required meaning.

## 1. Every important screen must answer five questions

Visible **without hover**, above the fold on mobile (390 / 360 / 320):

1. **Where does this stand?** — one short status sentence  
2. **Who acts next?** — person name + plain role (or “waiting on the bank”)  
3. **What should they do?** — one primary button with a verb  
4. **What did the institution decide?** — accepted / accepted with limits / rejected / not decided yet  
5. **Is that decision still current?** — yes / no / no decision yet (see §4)

If any answer is missing, the screen fails demo-ready.

## 2. Always-visible orientation strip (spec)

### Placement

- Directly under page header / nav on: `/app`, `/app/requests/[id]`, `/app/requests/[id]/receipt`, participant overview/status/receipt routes, multi-institution case badge context when present.  
- Reuse existing “Where this stands” / “Your next step” where they already exist; **upgrade** them to include all five answers.

### Layout (desktop + mobile)

```
[ Status sentence                          ] [ Still current? chip ]
[ Next: {Name} ({role}) — {one-line ask}   ]
[ Primary CTA button                        ]
[ Decision line: {not decided yet | outcome + limits one-liner} ]
[ Chips row: Identity | Authority | Institution decision — see §3 ]
```

- One primary CTA only. Secondary actions stay below the strip.  
- Status is text + structure, never color alone (`UI-SYSTEM.md`).  
- Min tap target 44px. Serif only for outcome-level headings if already used on the page; strip body is sans.

### Copy patterns (examples — bind to real names/status)

| Situation | Status sentence | Next | CTA | Decision line | Currency |
| --- | --- | --- | --- | --- | --- |
| Draft | “This request is not sent yet.” | Staff — finish and send | “Send request” | “Not decided yet.” | “No decision yet.” |
| Waiting on account holder | “Waiting for {Name} to confirm.” | {Name} (account holder) | “Resend their link” (staff) / “Confirm request” (holder) | “Not decided yet.” | “No decision yet.” |
| Waiting on representative | “Waiting for {Name} to finish their steps.” | {Name} (representative) | Role-appropriate | “Not decided yet.” | “No decision yet.” |
| Ready for review | “The bank can decide now.” | Reviewer | “Review and decide” | “Not decided yet.” | “No decision yet.” |
| Accepted with limits | “The bank accepted this with limits.” | Anyone viewing | “Open receipt” | “Accepted with limits: {short limits}.” | “This is the current answer.” |
| Rejected | “The bank said no to this request.” | Anyone viewing | “Open receipt” | “Rejected: {short reason}.” | “This is the current answer.” |
| Later change (revoke/expire/withdraw) | “The bank’s answer changed later.” | Anyone viewing | “See what changed” | Show **original** outcome + “Later: {change}.” | “A later change was recorded. See history.” |

Forbidden in the strip: activation, lifecycle, entitlement, scope boundary, role-bound, downstream, operational fit, go-or-no-go, raw enums, IDs.

## 3. Chips — identity vs authority vs institution acceptance

Three separate chips. **Never combine into one “Verified” badge.**

| Chip label (UI) | Means | Must not imply |
| --- | --- | --- |
| **Who they are** | Institution checked identity (or “Not checked yet” / “Sample only”) | Permission to act; bank acceptance |
| **What they may ask for** | POA / certification / requested actions on file | Bank said yes |
| **Bank’s answer** | Accept / limits / reject / not decided | Login access or money movement |

Participant link-open is **not** “Who they are.” If needed, a fourth quiet note: “Opened their private link” — separate from identity.

States per chip: `Done` / `Needed` / `Not started` / `Sample only` — always with the label words above, not internal codes.

Multi-institution (production — Steve 2026-09-15): full clarity pack in `MULTI-INSTITUTION-CLARITY-P0.md`. On case detail, always show under the strip: “This request is one of several banks this family asked. Your bank’s answer is only for your bank.” Badge wording: “One of several banks” / “Asked with other banks” — never “spawned”, “fan-out”, or “origin group”. Same five questions and chips, for **this** bank only. No global “approved” for the group.

## 4. Loud “still current?” treatment

### Receipt and case views

Always show one of:

- **“This is the current answer.”** (green/neutral text chip — not color alone)  
- **“A later change was recorded.”** + one line what changed (ended / withdrawn / expired / updated limits) + control “See history”  
- **“No decision yet.”**

Place in the orientation strip **and** repeat at the top of the receipt body.

### After cancel / reject / withdraw / expire

Other personas must see the same currency line. No persona may still show an active “what to do next” that contradicts a terminal state (demo checklist).

### Policy / rules currency (honest)

Until POL1 snapshots are complete: do **not** say “these rules governed this decision” unless true. Prefer: “Sample checklist used for this practice request” or omit.

## 5. QA acceptance (orientation)

- Walk `/app` → case → receipt → participant receipt at 1280 and 390: all five questions answered without hover.  
- Chips never collapse identity + authority + acceptance.  
- Currency line matches across three parties after accept-with-limits and after revocation.  
- Hard-bar: no banned jargon in strip.

## 6. Related P0 specs

- `HARD-BAR-STRING-SCRUB-2026-09-15.md`
- `DOCUMENT-REVIEW-UX-SPEC.md`
- `MULTI-INSTITUTION-CLARITY-P0.md`
