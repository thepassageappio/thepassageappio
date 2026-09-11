# Closed request guidance

September 10, 2026. Implemented locally; not merged or deployed.

## Fixed

The institution request page could show evidence-review buttons, a pending response, and instructions to record a future decision after a request ended. Closed requests now explain their status, retain prior questions/files/activity as history, and suppress review buttons. A saved institution decision still appears with its original reason and receipt link. No decision is invented when none exists.

Participant summaries show the closed status ahead of old success notices and label the original scope “Requested actions.” Accepted requests still allow the representative to withdraw through the existing command.

This is a presentation change. It adds no cancellation command, receipt type, invitation access, database migration, or authorization rule.

## Evidence

- 169 existing domain tests passed; TypeScript, lint and optimized Next.js build passed.
- `node scripts/verify-closed-request-render.mjs`: 76 rendered-page cases passed using the actual two page components with isolated read fixtures. Six closed states, five institution roles, with/without an earlier decision, both participant roles, and four active-state controls.
- Fixtures include an unanswered question and pending evidence so obsolete controls cannot hide behind empty data. Saved activity and earlier receipt links are checked.
- This is server-render output verification with mocked reads, not authenticated browser, mobile, screen-reader, database mutation or full lifecycle replay. Those remain release work.

## WF1 remains open

The cancellation investigation found that participant receipts currently require an institution decision, and receipt-link reissue recognizes decision/lifecycle states but not cancellation. Adding a cancel button alone would leave an incomplete journey. See the [cancellation contract](PENDING-CANCELLATION-CONTRACT.md).

Local Docker control was denied in this session, so the existing Docker-based database fixture workflow could not run. Local Supabase HTTP remained reachable. No hosted migration was used as a substitute and no cancellation migration was applied.
