# Jurisdiction playbook

Load for state templates, legal claims, institution policy, acceptance/refusal, certification, or multi-state expansion.

**Compliance M1 note (2026-09-15):** Steve approved roadmap. Live claims = New York only. See `docs/COMPLIANCE-ROADMAP-DEMO-ENTERPRISE-2026-09-15.md` and the NY-only demo truth pack (Compliance agent filing). Not legal advice; not certification. Passage does not create, validate, or make a POA binding.

## Validation footprint

1. New York (`US-NY`) — **live** (product + public copy)
2. Pennsylvania (`US-PA`) — **validation roadmap; not enabled** (documented gap)
3. New Jersey (`US-NJ`) — validation roadmap; not enabled
4. Connecticut (`US-CT`) — validation roadmap; not enabled
5. Massachusetts (`US-MA`) — validation roadmap; not enabled

Current product and public copy are New York only. Use “five-state validation roadmap” until counsel approves each state package.

### Separate enterprise R&D wave (not product set)

Internal modeling only — **do not market or enable in M1:** California, Texas, Florida, Illinois (acceptance/refusal clock research). Keep separate from the five-state validation footprint above.

Pennsylvania determination, September 8: the existing `representative_certification` does not capture the statutory agent Acknowledgment required by 20 Pa.C.S. § 5601(d). It stores a Boolean generic confirmation and text version, but no agent signature/name, execution date, substantially prescribed content, executed artifact, or proof of association with the POA. Do not relabel or reuse it as Pennsylvania compliance evidence. Implement the separate requirement only after counsel approves applicability, exceptions, content, association, retention, and receipt wording. Read [../PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md](../PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md).

## Demo-ready vs enterprise-ready (M1)

| | Demo-ready / M1 | Enterprise-ready |
| --- | --- | --- |
| Claims | NY-only; five-state = roadmap language only | Per-state counsel packages enabled |
| PA | Disabled; gap documented | Separate acknowledgment workflow post-counsel |
| Timers / checklists | Optional illustrative NY presets, watermarked | Counsel-gated reason codes + clocks |
| Policy | Fixed synthetic NY policy OK | POL1 authoring + immutable snapshots |
| Counsel | Queue for Steve; do not block M1 unless claim would be false | Required before real-data / state enablement |

## Required per state

- Versioned jurisdiction, source citation, effective date, and counsel approval status.
- Institution-configured requirements and decision responsibility.
- Execution/acknowledgment and agent-certification inputs relevant to institution review.
- Acceptance/refusal timing, permitted follow-up requests, exceptions, and escalation.
- Receipt and lifecycle language.
- Synthetic fixtures plus positive, refusal, stale, revocation, and cross-jurisdiction QA.

Passage does not create, validate, or make a POA binding. Avoid “safe harbor” and automatic legal conclusions.

## Encode vs leave to institution

| Passage supports | Institution decides |
| --- | --- |
| Jurisdiction gate + versioned package metadata | Whether to enable a state for their org |
| Locked statutory evidence requirements (when counsel-defined) | Exception classification; accept/refuse |
| Optional counsel-approved reviewer prompts | Legal validity |
| Configurable acceptance clocks / follow-up types | Escalation outcomes |
| Receipt wording that records review + decision | Final decision |
| Retention class metadata / export hooks | Retention / legal hold policy |

Primary starting sources are recorded in [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md). Counsel determines the operative requirements and approved product language.

Counsel questions for Steve are queued separately (Compliance M1) and must not block NY-only demo build unless a proposed claim would be false.
