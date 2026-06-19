# Passage Agent Release Train

This is the required collaboration loop for Passage agents. It keeps product judgment, implementation, QA, and deployment from collapsing into one rushed step.

## Why This Exists

Passage is aiming for an enterprise-grade funeral-home coordination SaaS that can support a $300k ARR business within one year. The product is sensitive, multi-persona, and operationally complex. Agents must preserve the vision, reduce confusion, and prove flows before deployment.

The required loop is:

Product Manager Agent -> Development Engineer Agent -> QA Agent -> Deploy Agent -> repeat.

Dedicated role briefs live here:

- docs/agents/product-manager.md
- docs/agents/development-engineer.md
- docs/agents/qa-agent.md
- docs/agents/deploy-agent.md

If QA fails or development uncovers a scope gap, the loop returns to the Product Manager Agent first.

## Magic Phrase

Use this exact phrase in any fresh Codex conversation:

`Passage Release Train: start the loop.`

That phrase means:

1. Read AGENTS.md, docs/agent-operating-context.md, and this file before doing work.
2. Start as Product Manager Agent and assess vision, roadmap, objective, scope, risks, and acceptance criteria.
3. Create or update the PR handoff using the release train template when code work begins.
4. Move to Development Engineer Agent only after scope is clear.
5. Move to QA Agent only after development handoff is complete.
6. Move to Deploy Agent only after QA is PASS or Product Manager approves a PARTIAL as non-blocking.
7. Update docs/agent-operating-context.md before handoff, deploy, or final response.

A shorter acceptable version is: `Start the Passage release train.` If the exact phrase is present, treat it as the stronger instruction.

## Required Start Loop

Every agent starts by reading:

1. AGENTS.md
2. docs/agent-operating-context.md
3. docs/release-train.md
4. the dedicated role brief in docs/agents/ for the role being played
5. pages/system/admin/saas-roadmap.js when roadmap, sprint, product priority, or persona scope changes
6. docs/deployment-discipline.md when deployment is possible

Every agent finishes by updating docs/agent-operating-context.md with what changed, what was tested, what failed, deployment state, and next action.

## Product Manager Agent

Owns scope, priority, acceptance, and business fit.

Before development starts, the Product Manager Agent must define:

- Objective.
- Roadmap item or reason for off-roadmap work.
- Personas affected.
- User problem and expected product behavior.
- Acceptance criteria.
- Risks, owner approval gates, and non-goals.
- Whether this is a deployable release batch or source-only setup.

If development finds a new gap, confusing UX, broken dependency, or risky expansion, work returns here before more coding. The Product Manager decides whether to fix, split, de-scope, rewrite acceptance, or escalate.

## Development Engineer Agent

Owns implementation against the Product Manager scope.

The Development Engineer Agent must:

- Implement only the scoped batch.
- Keep changes consistent with existing product architecture.
- Avoid new public/internal boundary leaks.
- Update docs/agent-operating-context.md with files changed, key decisions, and known gaps.
- Send any unplanned product question back to the Product Manager Agent instead of silently expanding scope.

## QA Agent

Owns validation, persona clarity, and release confidence.

The QA Agent must test against acceptance criteria and the persona affected by the batch. For funeral-home work, this includes director, employee, family, vendor, and reporting/export proof when relevant.

QA must mark one status:

- PASS: acceptance met, no blocker, release can move to deploy decision.
- FAIL: blocker or unclear UX; return to Product Manager Agent with specific defects.
- PARTIAL: non-blocking issues exist; Product Manager decides whether to split or release with known follow-up.

QA failures do not go straight back to development. They go to Product Manager first.

## Loop Limit

A release batch gets a maximum of 3 Product Manager -> Development Engineer -> QA cycles.

- Cycle 1 failure: Product Manager re-scopes or clarifies, Development fixes, QA retests.
- Cycle 2 failure: Product Manager narrows scope or splits risky work from the release.
- Cycle 3 failure: stop deployment. Product Manager must split, de-scope, or escalate before another release attempt.

Do not deploy a batch that has failed QA three times. Do not keep patching without re-scoping.

## Deploy Agent

Owns release hygiene and production verification.

The Deploy Agent can deploy only when:

- Product Manager scope is complete.
- Development handoff is complete.
- QA Status is PASS or Product Manager has explicitly approved a PARTIAL with non-blocking follow-up.
- docs/agent-operating-context.md is updated.
- The single website roadmap is updated if priority, sprint, milestone, or product doctrine changed.
- Vercel project is canonical.
- The release commit uses [deploy] [qa-approved].

After deployment, the Deploy Agent must record Vercel status, production URL/status, tested flows, failures, and next action in docs/agent-operating-context.md.

## PR Requirements

Each meaningful batch should use a PR with the Passage release train template. The PR remains unapproved until these are true:

- Product Manager scope completed.
- Development handoff completed.
- QA handoff completed.
- QA Status: PASS.
- Deploy Decision: APPROVED.
- Cycle is 1, 2, or 3.
- Agent context updated.

Direct commits to main should be reserved for mechanical setup, emergency build repair, or the current remote-only workflow. Even then, update docs/agent-operating-context.md and use [skip deploy] until the release is QA-approved.

## Failure Handling

When QA fails, record:

- What failed.
- Persona affected.
- Expected behavior.
- Actual behavior.
- Severity.
- Whether it blocks deploy.
- Product Manager decision: fix now, split, de-scope, or escalate.

When development discovers a gap, record:

- Gap.
- Why it matters.
- Whether it changes acceptance criteria.
- Product Manager decision before more implementation.

## Best-Practice Bias

Prefer larger coherent release batches over tiny deploys. Prefer explicit role handoffs over ambiguous agent memory. Prefer one source of truth over scattered roadmaps. Prefer proof over claims.
