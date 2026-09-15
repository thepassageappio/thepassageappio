# Document-review UX spec (Milestone 1 P0)

**Owner:** Product Designer  
**Implementer:** Engineering  
**Date:** 2026-09-15  
**Surfaces:** Institution case detail `/app/requests/[id]` (reviewer/staff), evidence panels, RFI (ask for correction), decide controls  
**Hard bar:** Five-year-old words. Decide without reading full history.

## Goal

A reviewer reaches **decide** without reconstructing the story from activity history. One strip answers: what is missing, what is already checked, whether they can decide now.

## Document-review strip (above history, below orientation strip)

```
Documents and checks
[ Missing (n) ]  [ Checked (n) ]  [ Ready to decide? Yes/Not yet ]

Missing
• {item} — {who must fix it} — [ Ask for this ] or wait state

Checked
• {item} — Checked by the bank

[ Ask for something else ]   [ Review and decide ]  (decide only if Ready = Yes)
```

### Rules

1. **Missing before checked.** Missing list is first.  
2. **File received ≠ checked.** Receiving an upload is not “Checked by the bank.” Use: “Received — not checked yet” until a reviewer marks checked / accepted for review.  
3. **One ask at a time for demo.** Primary RFI: “Ask for this” on a missing row. Optional “Ask for something else” opens the existing clarification flow with plain prompt: “What do you need them to send or fix?”  
4. **Ready to decide?** Yes only when required documents/checks for this template are checked (existing domain rules — do not invent new policy). If not: “Not yet — finish the missing list.”  
5. **Decide controls** stay in the strip’s primary CTA when ready; otherwise CTA is disabled with the Not yet reason visible (not only a tooltip).  
6. History / activity stays in a collapsed details block labeled “Full history” — never competing visually with the strip.

## Copy dictionary

| Avoid | Use |
| --- | --- |
| evidence artifact | document / file |
| RFI | ask them to fix or send something |
| certify / certification (when scary) | “They confirmed their part” / keep legal term only with plain gloss |
| provenance | where this file came from |
| satisfy policy | meets the bank’s checklist |
| disclose / disclosure | what they agreed to share |

## Accept with limits (decision panel)

Keep three outcomes only:

1. Accept  
2. Accept with limits  
3. Reject  

For accept with limits:

- Show **Requested** vs **Allowed** as two plain lists (already a product rule).  
- Limits as short sentences a child understands: “They may get statement copies.” / “They may not move money.”  
- Require a reason (existing). Confirm button: “Save the bank’s answer” (not “Submit decision”).

## Negative paths (same strip language)

| Event | Strip status | Next |
| --- | --- | --- |
| Wrong role | “You cannot do this step.” | “Sign in with the right person” / go back |
| Stale page | “This page is old.” | “Refresh to see the current request” |
| Reused link | “This link already used.” | “Open the newest email” / “Ask for a new link” |
| Rejected / withdrawn / expired | Terminal per orientation currency | No active fix CTA that contradicts terminal state |

## Mobile

- Strip stacks: summary counts → missing list → checked list → CTA.  
- 44px targets; no horizontal overflow at 390 / 360 / 320.

## Out of scope (M1)

- Multi-institution requester wizard (after single-institution M1)  
- New policy authoring (POL1)  
- Recreating demo `PA-F39449782D`

## QA acceptance

- Reviewer demo path: open case → see missing/checked → ask one fix → see ready → accept with limits — without opening Full history.  
- Representative upload does not auto-mark “Checked by the bank.”  
- Three-party receipts still match after decide.
