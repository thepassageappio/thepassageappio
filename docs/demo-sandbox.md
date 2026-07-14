
# Demo Sandbox Branch

Persistent, non-production branch (demo-sandbox) pointed at the same commit as main (e3ff59f2, current production release) so it builds a stable Vercel preview deployment separate from production, per docs/redesign/06-admin-access-demo-instance.md's recommended "Vercel preview deployment pinned to a demo branch" approach.

No app code changed in this commit -- adding this doc file is what triggers the branch's first deployment. The commit message's [qa-approved] marker is honest here because the deployed content is byte-identical to already-QA'd, already-live production code; nothing new is being asserted as tested.

This branch is intentionally NOT a throwaway QA branch. It will not be deleted after this session, so its Vercel branch-alias URL stays a stable bookmark. Future sessions can push updates here (e.g. re-sync with main periodically) without affecting production.

Access note: this project's preview deployments sit behind Vercel's own account/team SSO wall (documented repeatedly in the dated agent-operating-context addenda). The owner, logged into vercel.com as the team owner, is not blocked by this -- it only blocks logged-out/outside visitors, which is correct for a non-public sandbox.

## What this sandbox is

Same codebase as production, deployed to a separate URL. Shows the live Threshold redesign work (all shipped Tier 0 and Tier 1 batches) exactly as production renders it, since it is production's code on a different deployment.

## How to see the funeral-home demo path without signing in

Append ?demo=1 (or ?demoTour=funeral-home) to /funeral-home/dashboard on this branch's URL. This flips the dashboard into a fully client-side demo mode (see demoPartnerContext / demoPartnerContextForPersona in pages/funeral-home/dashboard.js) that renders realistic sample case data with zero real Supabase reads, zero real auth, and zero real sends. Add &persona=staff to see the employee-scoped view instead of the director view.

## Real seeded demo orgs (for signed-in demo/pilot walkthroughs, separate from the ?demo=1 client-side mode)

Four organizations rows exist in the live Supabase project with type='funeral_home':
- "Rivera Funeral Home (Demo)" -- created 2026-07-13, demo-path seed data
- "Test Funeral Home" -- created 2026-07-13, demo-path seed data
- "Passage QA Funeral Home" -- created 2026-06-19, pilot/test
- "Willow Creek Funeral Home" -- created 2026-06-19, pilot/test

47 tasks rows and 8 workflows rows exist across these orgs (read-only check, 2026-07-13/14). These are real rows in the one production Supabase project -- there is no separate demo/staging database yet. Signing into this branch with credentials for one of these orgs shows real data, same as it would on production, because both point at the same Supabase project. This is a real gap flagged in 06-admin-access-demo-instance.md: a scoped DEMO_MODE env flag plus a one-command reseed script (recommended there) has not been built yet -- see the run-10 addendum for the honest gap analysis.

## What this sandbox is NOT

Not a separate Supabase project/database. Not gated by a DEMO_MODE env flag (that flag does not exist in the codebase yet). Not linked from any production nav -- there is no way for a real visitor to stumble onto this URL from thepassageapp.io.
