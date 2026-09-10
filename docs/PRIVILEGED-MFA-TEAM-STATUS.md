# Privileged MFA enrollment inventory

The Sign-in security page lets an active Owner or Administrator with an AAL2 session inspect verified TOTP enrollment counts for active privileged members of their own active, ready organization. This is a read-only observation, not a state transition; it creates no domain event and changes no factors, memberships, requests, or sessions.

The authenticated public RPC is SECURITY INVOKER. Its private SECURITY DEFINER implementation verifies the email-confirmed actor, exact organization membership, role, organization readiness, and signed MFA assurance claim before reading Auth. Anonymous execution is denied. The result contains only membership ID, display name, membership email, role, verified TOTP count, and capture time. Factor IDs and credentials are never returned.

Zero factors means enrollment needed; one means backup enrollment needed; two or more means a backup is enrolled. Counts exclude unverified enrollment attempts. Counts do not establish current session assurance, separate physical devices, working recovery, or overall compliance. Revoked and nonprivileged members are excluded. Missing, malformed, or failed results display unavailable rather than claiming full coverage. Refresh performs a new authenticated page read.

All-factors-lost recovery remains a separate open gate. This feature does not permit an administrator to remove another user's authenticator or bypass MFA.

## Verification — September 10, 2026 UTC

- Local migration applied successfully to the existing development database.
- `supabase/tests/privileged_mfa_team_status.sql`: 11 assertion groups passed, transaction rolled back. Owner/admin AAL2 positive paths; AAL1, foreign organization, staff, revoked admin, suspended organization, incomplete onboarding and unverified email denials; minimal payload and verified-only counts.
- Existing public security boundary suite: 14 assertions passed locally after the migration.
- 164 domain tests passed; TypeScript, ESLint and optimized Next.js build passed.
- Actual local Supabase password sign-in, TOTP enrollment/challenge and signed AAL2 cookie reached the authenticated page. Three synthetic members rendered counts 2/1/0. Browser checks passed at 1280, 390 and 360px, with no document overflow, a 44px refresh control, keyboard submission and zero page errors. A temporary local RPC execute denial rendered unavailable; restoring the grant and refreshing restored the inventory. Screenshots were visually inspected at 360px.
- Browser fixture cleanup initially encountered the automatically created entitlement. The exact test entitlement, organization and three users were subsequently removed; remaining test-user count was zero. No hosted users or factors changed.
- Local server logs include the existing Supabase session-user warning from factor inspection. Authorization uses verified claims and the independently guarded database RPC; this change does not authorize from session user metadata.

Reproduce the browser check with a local Supabase stack on ports 55321/55322 and the app on 3100 using those same local public settings. Set `LOCAL_SUPABASE_PUBLISHABLE_KEY`, `LOCAL_SUPABASE_SECRET_KEY`, and optionally `PLAYWRIGHT_MODULE` to an installed Playwright module, then run `node scripts/verify-privileged-mfa-team.mjs`. The script uses loopback only, creates isolated synthetic users, and restores the RPC grant and removes fixtures in its cleanup block. It writes screenshots under `work/`.
