## QA: P0 fix verification + full fresh cross-persona sweep

Independent re-verification against `greenfield/passage-zero`'s live preview (deployment `thepassageappio-4b924grub`, commit `72a526b`, which merges PR #78). Everything below is from real hosted testing this pass — real sign-ins, real clicks, fresh screenshots — not a re-read of the prior report. Where I disagree with or add nuance to how the fix was described going in, I've said so.

### Headline: the P0 case-detail fix is real and confirmed live

Fresh sign-in as `dana-family-participant@passage.test` (active `continuity_participants` row, not the space owner) against `/case/c7b10001.../today`:

She now sees a correct, bounded case view — case name "Sofia Rivera," the current step ("Confirm the arrangement meeting with Maya Rivera," marked complete), and one recent update. No raw ids, no internal jargon. Screenshot: `screenshot-1786595228471-e6df29f8.jpg` (attached).

I verified three more identities against the same case/route to rule out both under- and over-correction:

| Identity | Result |
|---|---|
| Dana — active participant, `updates` scope | Bounded view, correct data (above) |
| Maya — continuity-space owner | Full, richer view (3 updates vs. Dana's 1) — unaffected by the fix |
| `qa-revoked-participant@passage.test` — revoked | "This case is not available to your account." — still correctly denied |
| Dana, pointed at an unrelated workflow id | Also correctly denied — confirms the fix is scoped per-case, not a blanket unlock |

Nav tabs for Dana are identical to the owner's: only "Today" is a real link, `Decisions/Tasks/Messages/Service/Costs` are non-interactive. Reload persistence holds. This is a clean, complete fix for the case-detail half of the P0.

### Messaging: not broken, not present — clarifying the earlier framing

`/case/c7b10001.../messages` on `greenfield/passage-zero` returns a clean 404, not an access denial. I checked because the original ask was to verify whether the messaging half of the P0 is still broken here. It isn't "still broken" — the messaging feature itself (PR #74) was never merged into this branch at all; it only exists on `release/10h-delivery`. PR #78's own description says this correctly ("this branch has no messaging feature yet"). So there's nothing to be broken on `greenfield/passage-zero` specifically. The messaging-side fix lives on the still-open PR #77 against `release/10h-delivery`, unmerged, per owner instruction not to merge it there while that branch has its own release train in flight. Worth keeping in mind for the PR #24 cutover call: whichever branch actually becomes `main` needs either messaging absent (fine, as here) or messaging present *and* PR #77 merged with it — not messaging present without the participant fix, which is the state that would reproduce the original P0.

### Fresh full sweep — public site, all 5 personas

No source review, no reuse of old screenshots. Everything below is from this pass.

**Public/marketing site** — homepage, "Choose what you need today" persona previews, and the `/family` anonymous demo builder all load cleanly, bounded (footer reached, no infinite scroll), consistent "preview/sample data" labeling throughout.

**Family persona** — covered above under the P0 verification; also confirms the flow generally (reload persistence, denial matrix, disabled tabs).

**Director persona** — Today dashboard, Team, Activity, and Urgent queue all functionally correct. Role gating re-confirmed live and incidentally: signed in as staff and hit `/director` directly, got a clean, honest denial screen ("This workspace is outside your role. Your funeral-home employee membership opens My work, not the director workspace.") rather than a generic error or silent redirect — good, human copy, not a bug.

**Staff persona** — work queue loads correctly (4 assigned, bounded), task detail/proof-history view renders full audit trail cleanly (submitted → verified, with actor names and timestamps). All 4 of this fixture's tasks were already complete from prior test cycles, so I didn't re-run a fresh assign→submit→verify loop this pass — that loop touches none of the code the P0 fix changed, and I verified it exhaustively in the prior sweep (PR #76), so I judged re-running it a low-value use of time versus the areas with actual code changes. Flagging the gap explicitly rather than silently claiming full re-coverage.

**Vendor/partner persona** — `/partner` (correct route; note it's `/partner`, not `/vendor`) loads cleanly for `vendor-cascade@passage.test`, shows only that org's requests, correct history rendering for a completed request. Cross-tenant denial re-confirmed fresh: signed in as `qaaudit-rogue-vendor@passage.test`, saw only its own org's (empty) queue — no leak of Cascade's data.

**Urgent/red persona** — ran the entire `/start/situation → /start/people → /start/next` wizard fresh, real clicks throughout, with a brand-new fixture person/contact. Client-side validation caught a missing required field correctly (clean inline error, not a silent failure). Clicked "Request a callback from Northstar Funeral Home" as a real mouse click on the actual button element. Confirmed via direct database read (not just trusting the UI's "Saved" confirmation) that this produced exactly the right row: `status='submitted'`, `wants_callback=true`, correct coordinator name/phone. This is the same submit path PR #71 fixed and I verified once before; re-verifying it fresh this pass still holds.

### Visual-quality pass — a real look, not just functional pass/fail

Steve asked specifically that this not be a "loads and works" rubber stamp — that I actually look at density, jargon, mobile usability, and scroll behavior against an Apple/Notion/Linear restraint bar. Here's what I found, with two honest caveats up front about the conditions I was working under.

**Tooling limitation, disclosed plainly:** partway through this pass, a `resize_window` call to test a mobile width caused the browser's virtual display to get stuck at a hard-capped 640×480 for the rest of the session — confirmed via `window.screen.width/height`, and every subsequent resize attempt (including back to the original working size) was rejected by the browser as out of bounds. I could not get a genuine 1440px desktop viewport or a precise 390px mobile viewport for comparison after that point. The screenshots attached to this report are real, live captures — not fabricated or reused from a prior session — but they're all constrained to that same ~640px-wide, unusually short window. I'm disclosing this instead of presenting it as a clean desktop/mobile comparison, because it isn't one. A genuine 375–390px mobile pass and a genuine ≥1400px desktop pass are still outstanding.

**Within that constraint, here's the real finding:** there's a visible two-tier design language in this app, and it's consistent enough to be worth naming. The family-facing and marketing surfaces (homepage, `/start/*` wizard, family `/today`) are genuinely restrained — large serif headlines, one focal card or question per screen, generous whitespace, minimal chrome. The `/start/situation` screenshot (`screenshot-1786595292539-98e16748.jpg`) is a good example: one question, one dropdown, nothing else competing for attention.

The operator-facing surfaces (director dashboard, staff task detail, activity log) are a different, denser pattern: small-caps-labeled metadata grids with 6–8 fields per card (on the director's Today view: Case, Owner, Waiting, Due, Visible To, How Passage Helps, Passage Prepared, Proof Destination — see `screenshot-1786594762783-59c6a345.jpg`, which shows the tail end of one such card at the constrained width). At the narrow width I had available, these fields stay in a cramped 2-column grid rather than stacking to one column, and multi-sentence field values wrap to 2–3 lines in each half-width column. This isn't broken or unreadable, and it's not the kind of misaligned/cluttered mess that would fail a basic bar — but it reads more like an operations spec sheet than Notion or Linear's restraint, and a director scanning "6 shown" tasks is doing a lot of small-text reading per card. I'd call this a real, specific gap against the stated bar rather than a pass — worth a design pass before this becomes the primary daily-use surface for directors, independent of anything else in this report.

**Recurring minor item, re-confirmed with fresh evidence:** `/director/team` still shows two different staff accounts — one revoked, one active — both displaying only as "Preview staff member" with no other distinguishing detail (`screenshot-1786595277858-42ec745f.jpg`, both sections visible in one frame). Same root cause as before (a shared generic fallback display name on these two specific fixture accounts), not fixed since the last pass, still low severity, but now with direct visual evidence rather than a description.

**No jargon or raw ids found anywhere in this pass** — case references use human framing ("Rivera family · Sofia Rivera," "NS-2051" styled like an order number, not a UUID), error and denial copy throughout is plain-language and specific to context (the role-gate denial above is a good example), and I didn't encounter any internal state names, environment flags, or database identifiers surfaced to any of the five personas.

**No unbounded/infinite scroll found** anywhere — every list I checked (director's "6 shown" tasks, staff's "4 assigned," vendor's request history, urgent queue's "4 shown") is explicitly bounded and labeled as such.

### What this report does not cover

A true side-by-side desktop (≥1400px) and mobile (375–390px) responsive comparison, for the reason disclosed above — the tooling failure happened partway through, after the family/P0 and public-site screenshots were already taken at a wider width but before I could do the same for director/staff/vendor at a genuinely different width. A fresh assign→start→submit→verify staff loop (judged low-value to re-run this pass; see staff persona section). Message-thread scroll-bound behavior (still not present on this branch at all, so not applicable here — would need testing on `release/10h-delivery` once PR #77 lands there).

### Bottom line

The P0 fix is real, live, and correctly scoped — confirmed with four identities, not just the one it was built for. No new regressions found anywhere in a genuine fresh sweep of the public site and all five personas. The one substantive new finding from this pass is the density gap between the restrained family/marketing surfaces and the spec-sheet-style operator surfaces — not a functional bug, but a real gap against the visual bar that was asked for, and worth a design pass before director/staff become daily-use surfaces at scale.
