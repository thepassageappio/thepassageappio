# Cycle 7A hosted authority evidence (redacted)

Recorded: 2026-07-18 (America/Los_Angeles)

Scope: isolated Supabase project `uyacxqtsiwlvtmhxvoxr` and Vercel Preview for branch `greenfield/passage-zero` only. Production Supabase project `qsveqfchwylsbncsfgxe` was not used. Invitation credentials, account passwords, private share URLs, and service credentials are intentionally omitted.

## Runtime and session proof

- Replacement verification commit: `072b37df3a97714872bfdf5e89c75cda8d00d937`.
- Replacement Vercel deployment: `dpl_5jaw5SMPekKLEPbzzRgjRJePiKMW`, `READY`, Preview target, exact branch and canonical project. Its build log states that the owner-authorized Passage Zero verification Preview was allowed.
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

## Corrected projection re-verification

- `2026-07-18T13-10-00-0700-director-team-reverify-1440.jpg`: corrected top-of-page content captured while the browser viewport was configured to 1440 x 900. The browser encoded the page-content raster as JPEG at 1425 x 891 after excluding browser chrome/scrollbar.
- `2026-07-18T13-10-00-0700-director-team-reverify-390.jpg` and `2026-07-18T13-10-00-0700-director-team-reverify-390-active-staff.jpg`: corrected pending and active-staff content captured at a configured 390 x 844 viewport; each encoded JPEG is 375 x 812.
- `2026-07-18T13-10-00-0700-director-team-reverify-360.jpg` and `2026-07-18T13-10-00-0700-director-team-reverify-360-active-staff.jpg`: corrected pending and active-staff content captured at a configured 360 x 800 viewport; each encoded JPEG is 345 x 767.
- Every corrected viewport showed `0 pending`, `No pending invitations.`, `1 active`, the linked Portland staff account, and `0` active commitments before Cycle 7B. Document scroll width equaled client width, visible functional targets were at least 48 pixels, and browser warning/error logs were empty.
- The configured viewport dimensions and live `innerWidth`/`clientWidth`/`scrollWidth` measurements are the viewport proof; the JPEG dimensions above are stated separately and are not represented as the viewport size. File extensions now match the actual JFIF bytes.
- A hosted reload preserved the corrected projection. Deployment-scoped Vercel error, warning, and fatal logs were empty.
- The original three screenshots remain committed as defect evidence; they were not replaced or rewritten.

## Release disposition

Cycle 7A's hosted authority transaction and final Team projection correction are proven on the replacement Preview. The exact pre-Cycle-7B cardinality above was re-read and retained before the Cycle 7B fixture was applied. Operational-readiness scores remain unchanged; Cycle 7A proof does not by itself establish pilot-operational or full-production readiness.
