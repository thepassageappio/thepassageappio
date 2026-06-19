# Deployment Discipline

Passage production deploys must be deliberate batches, not one small commit at a time.

## Rule

Vercel builds are skipped by default. A commit only deploys when its message contains one of these release markers:

- [deploy]
- [force deploy]
- [prod deploy]
- a subject that starts with deploy:
- a subject that starts with release:

Use [skip deploy] for roadmap, docs, QA notes, migrations that should be staged before a release, and work-in-progress commits.

## Operating rhythm

1. Group related product, schema, and copy fixes into a single meaningful batch.
2. Keep QA notes and roadmap updates in source without spending production builds.
3. Deploy only after the batch has a clear verification target.
4. After a release deploy, run the end-to-end persona script before starting another deployment batch.

This keeps Vercel quota available for real releases and prevents the production dashboard from filling with noisy failed deployments.
