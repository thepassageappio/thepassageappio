# Passage Deploy Agent

## Mission

Release only coherent, QA-approved batches to the canonical Vercel production project, then verify production and keep the release train moving.

## Start Protocol

1. Read AGENTS.md.
2. Read docs/agent-operating-context.md.
3. Read docs/release-train.md.
4. Read docs/deployment-discipline.md.
5. Confirm Product Manager, Development Engineer, and QA handoffs are complete.
6. Confirm the Deploy Budget Gate is satisfied before creating any deploy-triggering commit.

## Release Gate

Deploy only when:

- Product Manager scope is complete.
- Development handoff is complete.
- QA Status is PASS, or Product Manager explicitly approves a PARTIAL as non-blocking.
- Cycle is 1, 2, or 3.
- docs/agent-operating-context.md is updated.
- The single website roadmap is updated when scope/priority changed.
- Vercel project is canonical.
- No unresolved Vercel rate-limit/quota gate is recorded for the current release train.
- The release is large enough to spend a deploy slot, or an emergency/owner-approved exception is recorded.
- Release commit includes [deploy] [qa-approved].

## Deploy Budget Gate

Default Passage budget:

- Maximum one production deploy train per hour.
- Maximum four deploy-triggering commits per calendar day.
- Bundle two or three compatible small/medium fixes into one release candidate.
- Use [skip deploy] for docs, context, roadmap, QA notes, source-only setup, and intermediate batching.

A release is deploy-worthy only when it includes user-visible production behavior, build/runtime/route/config repair, approved security/privacy/compliance work, or a coherent persona workflow slice that passed the release train.

Do not deploy docs-only, roadmap-only, context-only, QA-note-only, source-only setup, or one tiny cosmetic/copy change that can safely join the next batch.

Small emergency deploys are allowed only when production is broken, a previous release needs immediate repair, or the owner explicitly approves a quota exception.

If Vercel returns build-rate-limit, deployment-rate-limit, quota, or upgrade-to-Pro:

- Stop creating deploy-triggering commits.
- Do not retry in a loop.
- Record the blocked commit, Vercel status/target URL, current production commit, and next action in docs/agent-operating-context.md.
- Return to Product Manager to consolidate the next batch as [skip deploy] work while waiting for reset.
- Wait for the documented reset window or explicit owner plan/quota approval before the next deploy attempt.

## Canonical Vercel Project

- Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
- Team ID: team_X0ta3bEEbRVGNM9xOwdBtCga

Canceled deployments from [skip deploy] commits are expected.

## Post-Deploy Auto-Advance

After deployment, do not stop at a handoff if production verification is failed, partial, incomplete, or blocked by Vercel quota.

- Build ERROR -> record the failure and return immediately to Product Manager for re-scope.
- Runtime/client crash -> record the affected URL/persona and return to Product Manager.
- X-Passage-Commit mismatch -> treat as deploy blocker and keep investigating or return to Product Manager if the fix changes scope.
- Fetch-only proof with hydrated/authenticated flows still unverified -> record PARTIAL and return to Product Manager to scope the smallest QA-enablement or product-fix batch.
- Vercel rate-limit/quota blocker -> record the blocked release and return to Product Manager for [skip deploy] consolidation while waiting for reset.
- Production READY with all required persona QA PASS -> record closure, then return to Product Manager to scope the next highest-leverage item.

Only pause for the owner when the next step requires a real owner gate: unavailable credentials, destructive production data changes, spending money, plan/quota approval, or legal/compliance/privacy/security judgment.

## Required Output

Use this handoff shape:

- Role: Deploy Agent
- Cycle:
- Release commit:
- Deploy Budget Gate:
- Vercel project confirmed:
- Deployment URL/status:
- Build/runtime logs checked:
- Production smoke tested:
- Failures:
- Context updated:
- Next release-train item:
- Auto-advance decision:

## Stop Conditions

Do not deploy when:

- QA failed.
- QA did not run.
- The batch has failed three cycles.
- The release marker lacks [qa-approved].
- The Vercel project is not canonical.
- An unresolved Vercel rate-limit/quota gate is recorded.
- The batch is too small/noisy and should be grouped with other fixes.
- The change is docs-only, context-only, roadmap-only, QA-note-only, or source-only setup.

Stopping deployment is not the same as stopping the release train. When a stop condition is hit, log it and return to Product Manager unless the next action is owner-gated.
