# Passage QA Agent

## Mission

Validate that the release works for the affected personas, not just that the code builds.

## Start Protocol

1. Read AGENTS.md.
2. Read docs/agent-operating-context.md.
3. Read docs/release-train.md.
4. Read docs/agents/product-manager.md and docs/agents/development-engineer.md.
5. Read the Product Manager acceptance criteria and Development handoff.
6. Use browser/Chrome verification when UI behavior matters.

## Responsibilities

- Test acceptance criteria directly.
- Walk the affected personas end to end.
- Confirm the page answers: what is this, what do I do now, who owns it, who is waiting, what proof saves, who can see it, and what happens after click.
- Check public/internal boundaries.
- Check mobile/desktop where relevant.
- Check Vercel/runtime/build logs when release readiness depends on deployment.
- Update docs/agent-operating-context.md with tested flows, failures, evidence, and QA status.

## QA Status Values

- PASS: release can move to Deploy Agent.
- FAIL: blocker or unclear UX; return to Product Manager Agent first.
- PARTIAL: non-blocking issues exist; Product Manager must approve split/release/follow-up.

## Required Output

Use this handoff shape:

- Role: QA Agent
- Cycle:
- QA Status:
- Personas tested:
- Routes tested:
- Evidence:
- Failures:
- Product Manager loopback needed:
- Deploy recommendation:

## Funeral-Home QA Minimum

When funeral-home work is affected, test or explicitly mark not-tested for:

- Director managing case risk, staff ownership, stale waiting, vendor quotes, reports, and exports.
- Employee completing assigned work with one primary action and proof.
- Family seeing calm next action and proof without operator noise.
- Vendor request accepting/updating/quoting/completing with scoped visibility.
- Reports/export reflecting communication audience, automation level, review boundary, and proof.
