# Deployment Discipline

Passage production deploys must be deliberate batches, not one small commit at a time.

## Rule

Vercel builds are skipped by default. A commit only deploys when its message contains one of these release markers:

- [deploy] [qa-approved]
- [force deploy] [qa-approved]
- [prod deploy] [qa-approved]
- a subject that starts with deploy: and includes [qa-approved]
- a subject that starts with release: and includes [qa-approved]

Use [skip deploy] for roadmap, docs, QA notes, migrations that should be staged before a release, source batching, work-in-progress commits, and any update that does not need production runtime proof.

## Vercel quota facts

Official Vercel limits are hard limits. When a rate limit is hit, it resets only after its duration expires.

For the current Hobby-style operating assumption, Vercel documents:

- Builds per hour: 32 deployment builds every 3600 seconds. A Next.js deployment counts as a build.
- Deployments per day: 100 deployments every 86400 seconds.

Source: https://vercel.com/docs/limits#rate-limits

The Passage rule is intentionally stricter than the platform maximum. We preserve quota for real releases, repairs, and production verification instead of spending it on documentation churn or tiny deploy chains.

## Deploy budget

Default budget: one production deploy train per hour, and no more than four deploy-triggering commits per calendar day unless production is broken.

Batch size target: combine two or three compatible small/medium changes into one release candidate. Examples of compatible changes:

- Route/config fixes plus related QA proof paths.
- Copy/UX clarification across the same persona flow.
- A small bug fix plus the test or browser-QA enablement needed to prove it.

A release candidate is deploy-worthy only when it includes at least one of these:

- User-visible product behavior that needs production proof.
- Build, runtime, route, redirect, auth, or config repair.
- Security, privacy, compliance, or data-integrity fix approved under Agent Permissions.
- A coherent persona workflow slice that passed Product Manager -> Development Engineer -> QA.

Do not spend a deploy on:

- Documentation-only changes.
- Roadmap/context/handoff updates.
- QA notes or test-path documentation.
- Source-only setup that is not ready for production proof.
- One tiny cosmetic or copy fix that can safely wait for the next batch.

Small emergency deploys are allowed only when production is broken, a previous release needs immediate repair, or the owner explicitly approves a quota exception.

## Rate-limit response

If Vercel returns a build-rate-limit, deployment-rate-limit, quota, or upgrade-to-Pro status:

1. Stop creating deploy-triggering commits immediately.
2. Do not retry the same release in a loop.
3. Record the blocked commit, Vercel status/target URL, current production commit, and next action in docs/agent-operating-context.md.
4. Return to Product Manager to consolidate the next batch while waiting for reset, but keep all follow-up commits [skip deploy].
5. Wait for the documented reset window or explicit owner plan/quota approval before the next deploy attempt.
6. When quota clears, deploy the existing queued release if code has not changed; create a new [deploy] [qa-approved] commit only if the release candidate changed.

A rate-limit blocker is an external Deploy gate, not a reason to pause the entire release train. Product Manager may continue scoping, docs, source review, and QA preparation, but Deploy must not burn another production build slot until the gate clears.

## Canonical project

The GitHub repo is thepassageappio/thepassageappio. The canonical Vercel project is thepassageappio.

Canonical Vercel project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD.

Canonical Vercel team ID: team_X0ta3bEEbRVGNM9xOwdBtCga.

A duplicate Vercel project named you-are-working-on-a-production was previously attached to the same repo. The ignored-build script blocks known duplicate/non-canonical project contexts before it honors release markers. If another duplicate appears, disconnect Git deployments for the duplicate project so production releases only create one Vercel deployment.

## Operating rhythm

1. Group related product, schema, route/config, QA-enablement, and copy fixes into a single meaningful batch.
2. Keep QA notes, roadmap updates, context updates, and source-only prep in [skip deploy] commits.
3. Before any deploy-triggering commit, confirm no unresolved Vercel rate-limit gate is recorded in docs/agent-operating-context.md.
4. Deploy only after the batch has a clear verification target.
5. Run the Product Manager -> Development Engineer -> QA loop. Failed QA returns to Product Manager first.
6. Use a maximum of 3 cycles before splitting, de-scoping, or escalating the batch.
7. Deploy only with one release commit containing [deploy] [qa-approved].
8. After a release deploy, run the end-to-end persona script before starting another deployment batch.
9. If post-deploy proof is failed, partial, or fetch-only for hydrated/authenticated flows, immediately return to Product Manager to scope the smallest next cycle; do not wait for the owner just to restart the loop.
10. If post-deploy proof is PASS, return to Product Manager to scope the next highest-leverage batch.

This keeps Vercel quota available for real releases and prevents the production dashboard from filling with noisy failed deployments. It also prevents a repaired deploy from being mistaken for a completed release when persona QA is still unproven.
