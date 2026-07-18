# Cycle 7A hosted authority evidence (redacted)

Recorded: 2026-07-18 (America/Los_Angeles)

Scope: isolated Supabase project `uyacxqtsiwlvtmhxvoxr` and Vercel Preview for branch `greenfield/passage-zero` only. Production Supabase project `qsveqfchwylsbncsfgxe` was not used. Invitation credentials, account passwords, private share URLs, and service credentials are intentionally omitted.

## Runtime and session proof

- Replacement verification commit: `f56f1fbf9ad8cd71f612db045d3eb0d1b2f019e5`.
- Replacement Vercel deployment: `dpl_F5J8DoQJhd2oKtm99PQ44gr4fTPs`, `READY`, Preview target, exact branch and canonical project.
- Two independent hosted browser sessions were maintained on separate deployment hostnames: one synthetic director and one synthetic staff account.
- Director created one Portland location-scoped staff invitation. A same-request replay returned the original invitation identifier and persisted creation time without a second secure link or duplicate row/event.
- The wrong signed-in account was denied acceptance with no mutation. The exact invited staff account inspected and accepted the invitation.
- The accepted staff session opened `/staff`, retained the accepted membership after reload, and was denied `/director` with the role-boundary recovery view.
- The accepted receipt replay (`?receipt=accepted`) remained stable across reload and did not render another acceptance action.
- Vercel Preview runtime error/fatal logs were empty after the complete replacement flow.

## Exact isolated cardinality after acceptance

| Durable projection | Count / value |
| --- | --- |
| Synthetic organization | 1 |
| Synthetic location | 1 |
| Active organization memberships | 2 (`director: 1`, `staff: 1`) |
| Active location grants | 2 |
| Organization invitations | 1 |
| Accepted invitations | 1 |
| Invitation-location rows | 1 |
| Invitation command events | 2 |
| Event kinds | `organization_invitation.created`, `organization_invitation.accepted` |
| Workflows | 0 |
| Tasks | 0 |

The event table's generic `event_type` remains `other`; the semantic command kind is stored in `metadata.event_kind`. The two rows are server-authored append-only proof for the one creation and one acceptance.

## Responsive evidence and parity finding

- `2026-07-18-director-team-desktop-1440.png`: 1440 x 900, document width 1440, no horizontal overflow.
- `2026-07-18-director-team-mobile-390.png`: 390 x 844, document width 390, no horizontal overflow.
- `2026-07-18-director-team-mobile-360.png`: 360 x 800, document width 360, no horizontal overflow.
- No browser console or page errors were returned during these exact viewport checks.
- These screenshots intentionally preserve a QA finding from the deployed replacement Preview: the accepted invitation still rendered inside the section titled `PENDING INVITATIONS`. Source was corrected immediately so the Team page derives and renders only live pending rows. `scripts/test-frontend-backend-parity.js` now rejects a return to mapping the unfiltered invitation collection.

## Release disposition

Cycle 7A's hosted authority transaction is functionally proven, but the final source correction has not been republished or visually reverified on a newer Preview. The hosted release gate is therefore **PARTIAL**, not `[qa-approved]`. Operational-readiness scores remain unchanged. The Cycle 7B hosted workload fixture was not applied during this handoff close.
