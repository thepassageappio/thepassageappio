# Jurisdiction playbook

Load for state templates, legal claims, institution policy, acceptance/refusal, certification, or multi-state expansion.

## Validation footprint

1. New York (`US-NY`)
2. Pennsylvania (`US-PA`)
3. New Jersey (`US-NJ`)
4. Connecticut (`US-CT`)
5. Massachusetts (`US-MA`)

Current product and public copy are New York only. Use “five-state validation roadmap” until counsel approves each state package.

Pennsylvania determination, September 8: the existing `representative_certification` does not capture the statutory agent Acknowledgment required by 20 Pa.C.S. § 5601(d). It stores a Boolean generic confirmation and text version, but no agent signature/name, execution date, substantially prescribed content, executed artifact, or proof of association with the POA. Do not relabel or reuse it as Pennsylvania compliance evidence. Implement the separate requirement only after counsel approves applicability, exceptions, content, association, retention, and receipt wording. Read [../PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md](../PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md).

## Required per state

- Versioned jurisdiction, source citation, effective date, and counsel approval status.
- Institution-configured requirements and decision responsibility.
- Execution/acknowledgment and agent-certification inputs relevant to institution review.
- Acceptance/refusal timing, permitted follow-up requests, exceptions, and escalation.
- Receipt and lifecycle language.
- Synthetic fixtures plus positive, refusal, stale, revocation, and cross-jurisdiction QA.

Passage does not create, validate, or make a POA binding. Avoid “safe harbor” and automatic legal conclusions.

Primary starting sources are recorded in [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md). Counsel determines the operative requirements and approved product language.
