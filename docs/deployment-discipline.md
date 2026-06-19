# Deployment Discipline

Passage production deploys must be deliberate batches, not one small commit at a time.

## Rule

Vercel builds are skipped by default. A commit only deploys when its message contains one of these release markers:

- [deploy] [qa-approved]
- [force deploy] [qa-approved]
- [prod deploy] [qa-approved]
- a subject that starts with deploy: and includes [qa-approved]
- a subject that starts with release: and includes [qa-approved]

Use [skip deploy] for roadmap, docs, QA notes, migrations that should be staged before a release, and work-in-progress commits.

## Canonical project

The GitHub repo is thepassageappio/thepassageappio. The canonical Vercel project is thepassageappio.

Canonical Vercel project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD.

A duplicate Vercel project named you-are-working-on-a-production is also attached to the same repo. The ignored-build script blocks known duplicate/non-canonical project contexts before it honors release markers. The dashboard-side cleanup is still required: disconnect Git deployments for the duplicate project so production releases only create one Vercel deployment.

## Operating rhythm

1. Group related product, schema, and copy fixes into a single meaningful batch.
2. Keep QA notes and roadmap updates in source without spending production builds.
3. Deploy only after the batch has a clear verification target.
4. Run the Product Manager -> Development Engineer -> QA loop. Failed QA returns to Product Manager first.
5. Use a maximum of 3 cycles before splitting, de-scoping, or escalating the batch.
6. Deploy only with a release commit containing [deploy] [qa-approved].
7. After a release deploy, run the end-to-end persona script before starting another deployment batch.
8. If post-deploy proof is failed, partial, or fetch-only for hydrated/authenticated flows, immediately return to Product Manager to scope the smallest next cycle; do not wait for the owner just to restart the loop.
9. If post-deploy proof is PASS, return to Product Manager to scope the next highest-leverage batch.

This keeps Vercel quota available for real releases and prevents the production dashboard from filling with noisy failed deployments. It also prevents a repaired deploy from being mistaken for a completed release when persona QA is still unproven.
