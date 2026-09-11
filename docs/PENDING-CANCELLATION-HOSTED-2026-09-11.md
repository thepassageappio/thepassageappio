# Hosted cancellation checkpoint

Code is published on PR 108 at `ccbbc8531b2a7703cfda32301e2c9a37a85e60e9`. Both Vercel Git status checks succeeded. The PR remains unmerged; this is not a production release.

## Database evidence

Source migration `20260910230516_pending_request_cancellation.sql` was applied once through the Supabase migration tool to both approved environments. Provider history assigns Demo (`bklrclpertdtmhycpqlz`) version `20260911011138` and UAT (`ywlrxdjibngroycwnujg`) version `20260911011200`. Preserve this mapping; do not repeat the migration to align timestamps.

The pending cancellation, terminal/recovery and reviewer-boundary SQL suites passed in both environments. All six runs used rollback fixtures and retained no synthetic test records. This adds hosted database evidence to the existing local browser, concurrency, receipt and replay evidence.

The six changed private function definitions match the tested local database after normalizing carriage returns. The initial raw hash difference was line endings. Normalized definition MD5 values, identical in local, Demo and UAT:

| Function | Hash |
| --- | --- |
| cancel_pending_request_v1 | 8afed0a73f936e5fbc6e6d4386928d71 |
| exchange_participant_invitation_v1 | 8998b7f90164133d954cbe387a84ca19 |
| get_authority_notification_status_v1 | d16296dc575f75be2f2d8fb3d4753e6a |
| get_participant_cancellation_v1 | b1343bed3d3f200e00ee1afbfcefae46 |
| preview_participant_invitation_v1 | 8a84c4165ffd52192b9bdec8fc5835ab |
| reissue_participant_invitation_v1 | 0f14ad94c7447e5210f2fcd39f0378fd |

Hosted security advisors still report four existing authenticated security-definer wrappers and disabled leaked-password protection. The private tables have 22 informational default-deny policy notices. Do not describe hosted security advisors as clean or treat local CLI advisor output as equivalent.

## Release work remaining

Vercel's connected account lists the expected team but returns no projects and cannot retrieve the deployments referenced by GitHub status checks. Green checks alone do not verify preview source provenance or the hosted browser journey. Resolve deployment visibility, verify the exact candidate, then follow the Git-triggered main release and production replay gate. Last independently verified production SHA remains `42976b096b7569174f3b290419a20610ea3ea638`.

The PR description update was refused twice, including after the owner's approval: the tool requires approval while the session approval policy is never. Its old title/body are stale. Code publication succeeded separately. Local Git metadata remains outside the writable workspace; do not bypass that restriction.

Next product work remains UX2 accessibility and first-use verification, POL1 institution policy publication, and the broader lifecycle/state/resilience gaps. P1/P2 remain open, reconciliation remains 2/7 verified days, and no outreach or real-data pilot was released. This checkpoint is included in the following documentation-only branch commit; the tested application code remains ccbbc8531b2a7703cfda32301e2c9a37a85e60e9.


## Full-access follow-up, 01:53 UTC

September 11, 01:53 UTC: full access restored normal Git operations. Local branch now matches the published code with only documentation changes pending. PR 108 title/body updated successfully. Demo preview dpl_BEHhSRiY2j1NbdyqqfETQk1N2Gx4 is Ready and /api/version verifies ccbbc8531b2a7703cfda32301e2c9a37a85e60e9 on the intended branch. UAT preview dpl_32JXKTNZUTXrkDLAXnTJZb5CQST6 is Ready, but its version endpoint redirects to Vercel SSO even through vercel curl. Deployment protection remains enabled. Production /api/version still verifies main 42976b096b7569174f3b290419a20610ea3ea638. Hosted authenticated browser replay remains open; no release or outreach was performed.

Demo preview: https://passage-authority-demo-92zc08avd-thepassageappio-7018s-projects.vercel.app

UAT preview: https://passage-authority-d7zwb7gjw-thepassageappio-7018s-projects.vercel.app

The earlier Git and PR metadata restrictions are resolved. Normal git fetch and a mixed reset synchronized the existing branch to its already-published commit without changing working files. Only the seven intended evidence/roadmap files differ. Next loop should use the verified Demo candidate for hosted browser verification and resolve UAT authenticated preview access without disabling deployment protection. Any new documentation commit has its own preview checks; do not attribute the earlier version response to a later commit.
