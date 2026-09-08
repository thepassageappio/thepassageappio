# Jurisdiction playbook

Load for state templates, legal claims, institution policy, acceptance/refusal, certification, or multi-state expansion.

## Validation footprint

1. New York (`US-NY`)
2. Pennsylvania (`US-PA`)
3. New Jersey (`US-NJ`)
4. Connecticut (`US-CT`)
5. Massachusetts (`US-MA`)

Current product and public copy are New York only. Use “five-state validation roadmap” until counsel approves each state package.

Pennsylvania-specific task: determine whether the existing `representative_certification` captures the statutory agent Acknowledgment required by 20 Pa.C.S. Chapter 56. Treat matching labels or general certification language as insufficient proof; compare the captured text, signature/affirmation, timing, attachment/association, and institution-visible receipt against the statute and counsel-approved requirements. Fix and re-run state-specific synthetic QA if any element is missing.

## Required per state

- Versioned jurisdiction, source citation, effective date, and counsel approval status.
- Institution-configured requirements and decision responsibility.
- Execution/acknowledgment and agent-certification inputs relevant to institution review.
- Acceptance/refusal timing, permitted follow-up requests, exceptions, and escalation.
- Receipt and lifecycle language.
- Synthetic fixtures plus positive, refusal, stale, revocation, and cross-jurisdiction QA.

Passage does not create, validate, or make a POA binding. Avoid “safe harbor” and automatic legal conclusions.

Primary starting sources are recorded in [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md). Counsel determines the operative requirements and approved product language.
