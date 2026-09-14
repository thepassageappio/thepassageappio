# Release and demo status — September 11, 2026 UTC

PR [108](https://github.com/thepassageappio/thepassageappio/pull/108) is merged and live at `c64299e5ed3fa49b43e7ca62278b9c5c59088264` on both `thepassageapp.io` and `demo.thepassageapp.io`. Hosted cancellation checks passed in Demo and UAT. Production verification passed 44 public routes, eight recovery states and 30 authenticated institution receipt views. Preview configuration and UAT preview access are repaired; deployment protection remains enabled.

## Release evidence

- Tested branch source: `67d20e6f24779c7d69bae445ccf8d5a8f4d6dd57`; both Vercel checks succeeded. GitHub returned no pull-request workflow runs; the repository has no GitHub Actions workflow directory.
- Merge source: `c64299e5ed3fa49b43e7ca62278b9c5c59088264`. Its full tree matches the tested branch tree. Clean `main` worktree provenance check passed. Both public version endpoints report GitHub, the intended repository, `main`, and this exact SHA.
- Demo production: `dpl_4FajpcXGcJvLQKjs4wmF5FygSmXQ`, Ready.
- UAT/production: `dpl_3NVKECgB2XHf7vFP3br4y4aujJU3`, Ready.
- Both releases came from the normal Git-triggered main deployment. Production environment variables were not changed.
- Existing team-MFA and cancellation migrations were already applied and verified in both databases; none was repeated during this release. See [database evidence](PENDING-CANCELLATION-HOSTED-2026-09-11.md).

## Hosted behavior

Owner, administrator and staff can cancel a request awaiting the account holder. Reviewer and auditor cannot. A stale submission preserves the entered reason and acknowledgment and focuses the error. Keyboard cancellation, exact POST replay and a reviewer POST denial passed. Each request recorded exactly one cancellation event and no institution decision. Five institution roles and both participant roles saw matching reasons and receipts, with no participant mutation forms or browser runtime errors. Layout checks passed at 1280, 390 and 360 pixels.

| Environment | Preview deployment | Request | Independently verified receipt SHA-256 |
| --- | --- | --- | --- |
| Demo | `dpl_Dy5F7C1k5MBp9DKnGpbn3tgKuWZE` | `cb7e791e-3e38-4c8b-b56d-2b774e8475f8` | `6319a8eff6272c973e5e330bf3058c6d1d147e8244b0fd0fcad24cd4ea0ff4fc` |
| UAT | `dpl_5wRz7Kgqx5dvVbfTZf4DEsgFLcGU` | `430dfe47-246b-48e7-9d2d-de384593bbd1` | `13dd2a9ee1dba9af565668be7aa8103963ad38751aba07f65f777a7af4fd8ea9` |

Independent replay hashes PostgreSQL's saved JSON text bytes. After production deployment, all five institution roles reopened their receipt at all three widths in both environments: 30 authenticated views, matching hashes and no page errors. Screenshots were inspected for readable mobile layout. This production pass reads the existing cancellation; the command/retry tests ran on the identical application tree in preview.

## Configuration and cleanup

Both preview environments lacked Supabase configuration. Nine branch-specific variables now supply the correct respective database, app URLs and disabled participant/team delivery. The service key is sensitive. Exported sensitive values were redacted; a rejected authentication probe caught the placeholder before fixture creation, and the actual existing project secret replaced it. No key was rotated or printed.

UAT preview access works through the authenticated Vercel project and its automation bypass. Browser requests attach that token only to the exact protected preview origin. Deployment protection remains on.

Two isolated synthetic organizations and ten synthetic password/TOTP users were used. No invitation emails, payments or real customer documents were sent. Both organizations are now closed, all ten users globally signed out and banned, and saved request/event/receipt history is preserved. Ignored `work/` files contain sensitive fixture and provider values and must never be committed or shared.

## What this closes and what it does not

This ships pending cancellation, clearer workspace and form guidance, draft recovery, native skip links, narrow-screen header fixes, JavaScript recovery instructions, accurate policy selection states and team MFA visibility. It closes the preview-access and hosted-cancellation release blockers.

The fixture started in an awaiting-account-holder state. It does not prove a presenter can prepare a fresh run, receive both invitations and finish the full acceptance/revocation story without developer assistance. Deterministic invitation arrival, a timed first-use run, full accessibility review and remaining P1/P2 requirements remain open. General policy configuration, principal-unable-to-participate support and real-data approval are not completed by this release.

September 11 internal reconciliation recorded a new clean day in both environments, with no billing, decision/audit or usage variances: **3/7** consecutive days. Run key `4c257503-abe1-c6ce-5d6f-c4a8e1f3397e`. This does not call live Stripe or HubSpot APIs. Four further real UTC days are required; September 15 UTC is the earliest possible seventh day if every run stays clean. That date is not a product-completion promise.

Next: [demo and first-sale execution plan](DEMO-TO-FIRST-SALE-2026-09-11.md). No outreach was sent.
