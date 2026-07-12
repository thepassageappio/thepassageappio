# End-to-End Flow Map — every persona, every screen, every click

Added 2026-07-12. This is the connective tissue the individual wireframe docs don't show on their own: for each persona, the literal path from entry to exit — which screen leads to which, what triggers the transition, and what state carries forward. Every node below maps to a real screen in `04-wireframes-annotated.md` and, where a visual mockup exists, the file it lives in. No screen is an island; every arrow is a real click, notification, or handoff.

Legend: `[screen]` = a mapped screen · `→` = a direct click/nav action · `⇢` = an async trigger (notification, email, webhook) that brings the user back in · `(file)` = mockup file, where one exists.

## 1. Family — first-time, urgent flow

```
[Landing] (hero-screens-mockup.html, Screen 1)
   → click "Something happened recently"
[Create Account — urgent path] (auth-flow-mockups.html)
   → minimal form submit (name, relationship, contact)
[Family Dashboard] (hero-screens-mockup.html, Screen 2)
   → next-action card "Review draft"
[Messages — review obituary draft] (messages-notifications-settings-mockups.html)
   → approve
[Family Dashboard] (back, task now shows Done)
   → nav: People
[Contacts / People] (family-record-sections-mockups.html)
   → "Invite" button
[Invite] (funeral-home-demo-path-mockups.html, family-copy variant of A4)
   → invite sent
   ⇢ invitee accepts (async) → [Contacts] updates their status chip
   → nav: Documents
[Documents] (funeral-home-demo-path-mockups.html, A5 — family variant hides operator-only actions)
   → nav: Estate / Medical / Wishes as needed, same record shell
[Notifications] (messages-notifications-settings-mockups.html)
   ⇢ daily digest email → click-through returns to [Family Dashboard]
```
Exit: service completed → workflow status `completed` → Dashboard next-action card is replaced with an archive/keep prompt (see `03-journey-maps.md` §1 exit stage — not yet a dedicated mockup, flagged in Open Items below).

## 2. Family — planning ahead

```
[Landing] → click "I'm planning ahead"
[Create Account — persona picker] (auth-flow-mockups.html)
   → select persona_type (standard/spouse/parent/business_owner)
[Create a Passage — wizard] (family-record-sections-mockups.html)
   → step through, save-and-exit available at every step
[Family Dashboard] (planning-mode variant: no urgent next-action card, shows setup checklist instead)
   → nav through Timeline / Contacts / Estate / Medical / Wishes to fill in over time
[Settings → Who has access] (messages-notifications-settings-mockups.html)
   → add activators/witnesses for the eventual trigger
```
Exit: this journey has no hard exit — periodic [Notifications] digest brings the user back to review staleness.

## 3. Family — returning / mid-process

```
⇢ notification (email/SMS/in-app) → [Family Dashboard]
   → orient via next-action card + Today panel
   → act on 1 task → [Messages] or [Documents] or [Estate], depending on task section
   → back to [Family Dashboard], task now Done
```
This is the shortest loop in the system by design — see `05-task-spine-coordination-logic.md`'s "digest over drip" principle.

## 4. Funeral-home professional (director/staff)

```
[Funeral Home Portal — case list] (hero-screens-mockup.html, Screen 3)
   → click a case row
[Passage Record — Today] (funeral-home-demo-path-mockups.html, A3 shell, Today tab)
   → nav: Tasks
[Tasks — full table] (funeral-home-demo-path-mockups.html, A3)
   → click unowned row(s) → bulk "Assign to..." → row updates, case-list "unowned" count decrements
   → click a task row → right-side drawer (detail, no full nav)
   → nav: People
[Invite] (funeral-home-demo-path-mockups.html, A4)
   → send invite ⇢ family accepts (async) → chip updates
   → nav: Documents
[Documents] (funeral-home-demo-path-mockups.html, A5)
   → "Request from family" → creates a task → visible back in [Tasks]
   → nav: Messages
[Messages — draft] (messages-notifications-settings-mockups.html)
   → draft → approve → send (stepper, matches messages.status)
   → back to [Funeral Home Portal case list] via "Back to cases"
```
Exit (per case): service completed → case drops out of "needs attention" grouping in the case-list stat row, moves to a completed/reporting view (Reporting nav item — not yet a dedicated mockup, flagged below).

## 5. Vendor

```
⇢ notification: new request → [Vendor Portal Dashboard] (admin-and-vendor-portal-mockups.html, Screen B)
   → click a request card → quote form (not yet a dedicated mockup — inline in the card today, flagged below)
   → submit quote ⇢ funeral home/family accepts (async) → payment tracker advances
   ⇢ payment collected → tracker advances again
   → mark fulfilled → tracker reaches "Paid out"
```
Vendor never navigates outside this one scoped view — no cross-links to family record, by design (RLS-enforced, see `00-system-findings.md`).

## 6. Admin / internal (support)

```
[Admin Portal — Case Support search] (admin-and-vendor-portal-mockups.html, Screen A, empty state)
   → search a user/org
   → "View as" → banner appears, record renders read-only
[Passage Record — read-only, as the viewed user would see it]
   → "End view" → banner clears, grant logged
   → nav: Recent grants → audit list (not yet a dedicated mockup, flagged below)
   → nav: Platform Ops → Roadmap / Pilot health / etc. (existing System Admin pages per AGENTS.md, out of scope for this redesign — Admin Portal links to them, doesn't rebuild them)
```

## Cross-persona connective points (where paths intersect)
- **Family ↔ Funeral Home:** an Invite sent from either side lands the other party directly in the shared record shell (family-styled vs operator-styled skin on the same components) — this is the single most important connective seam and the reason the record is built once per `02-information-architecture.md`.
- **Funeral Home ↔ Vendor:** a task in the funeral home's Tasks table ("Send vendor quote") is the same underlying row a vendor sees as a request card in their Portal — status changes on either side propagate to both views via the same `vendor_requests.status` field.
- **Admin ↔ everyone:** "View as" renders the exact family or operator screen a real user would see, reusing the same components — the Admin Portal has no separate rendering path, only a read-only wrapper.

## Open items — screens referenced above with no dedicated mockup yet
- Family Dashboard "archive or keep" exit prompt (end of urgent journey)
- Family Dashboard "planning mode" variant (setup checklist instead of next-action card)
- Funeral Home Reporting view (post-completion case view)
- Vendor quote-submission form (currently inline-implied on the request card)
- Admin "Recent grants" audit list detail view

These are small, well-scoped additions. Status as of 2026-07-12: the batch referenced above (auth-flow-mockups.html, family-record-sections-mockups.html, messages-notifications-settings-mockups.html) has shipped — every non-open-item screen in this map now has a real mockup file. These 5 remain the only gap. See `10-handoff-next-steps.md` for the plan to close them and for the first real production deploy.
