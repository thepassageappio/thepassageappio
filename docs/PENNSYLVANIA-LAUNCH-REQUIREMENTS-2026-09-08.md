# Pennsylvania launch requirements

**Date:** September 8, 2026  
**Status:** Engineering and product gap analysis for counsel review. Pennsylvania is not enabled or marketed. This is not a legal opinion.

## Determination from the current product

The current generic `representative_certification` does **not** capture the Pennsylvania agent Acknowledgment described in 20 Pa.C.S. § 5601(d).

The current command stores a Boolean confirmation, time, participant role, and text version `representative-certification-v1`. Its configured text says only that the representative must confirm the duty to act within the authority requested. It does not capture the agent's name or signature, a signed date, the substantially prescribed duties language, a copy of the executed acknowledgment, or evidence that the acknowledgment was affixed to the power of attorney.

The official Pennsylvania statute says an agent has no authority to act under the power of attorney until the agent first executes and affixes to it an acknowledgment substantially in the statutory form. That form identifies the agent, confirms the agent read the attached power of attorney, and states the duties to follow the principal's known reasonable expectations or otherwise best interest, act in good faith, and remain within the granted scope. Section 5601(e.1) and (e.2) contain exceptions that counsel and the institution must classify rather than Passage inferring automatically.

Primary sources:

- [20 Pa.C.S. § 5601 — General provisions](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056.001.000..HTM)
- [20 Pa.C.S. Chapter 56 — Powers of Attorney, including §§ 5601.3, 5608, and 5608.1](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.056..HTM)
- [Current consolidated Title 20 PDF](https://www.legis.state.pa.us/WU01/LI/LI/CT/PDF/20/20.PDF)

## Product requirement before Pennsylvania can be enabled

Pennsylvania needs a separate, versioned evidence requirement. Do not relabel the existing generic checkbox.

| Capability | Required behavior | Evidence retained |
| --- | --- | --- |
| Jurisdiction gate | `US-PA` remains unavailable until counsel approves the package and effective date | Approved policy version and counsel status |
| Acknowledgment classification | Institution records whether § 5601(d) applies or a counsel-approved statutory exception applies | Classification, exception code if applicable, reviewer, time, policy version |
| Executed artifact | When applicable, representative supplies the executed acknowledgment associated with the POA | Private artifact, content hash, uploader role, received time |
| Structured review | Reviewer records agent name, execution date, signature present, prescribed-content review, and affixed/associated status | Append-only review result and note |
| Receipt boundary | Receipt says what the institution reviewed and decided without declaring the POA legally valid | Requirement result, institution decision, policy version |
| Change control | Statutory text and workflow are versioned separately from generic certifications | Source URL, checked date, effective date, supersession history |

Passage should coordinate the evidence and preserve the institution's decision. It should not generate the statutory acknowledgment, electronically sign it for the agent, or decide that an exception applies unless counsel separately approves that capability.

## Counsel decisions required

1. Confirm which financial POAs in the intended pilot are governed by § 5601(d), including the relevant exceptions in § 5601(e.1) and (e.2).
2. Confirm whether Passage may accept an uploaded executed acknowledgment as institution-review evidence, and what proves that it was “affixed” to or adequately associated with the POA.
3. Approve the structured fields, participant instructions, reviewer prompts, receipt wording, retention period, and version/effective-date process.
4. Determine whether collecting the agent's in-product confirmation creates an electronic-signature or electronic-record obligation separate from the uploaded instrument.
5. Confirm how an out-of-state POA presented to a Pennsylvania institution should be classified under § 5611.

## Synthetic QA required after counsel approval

- Applicable Pennsylvania POA with a complete acknowledgment passes to institution review.
- Missing acknowledgment fails closed before submission.
- Missing signature, agent name, execution date, prescribed-content confirmation, or POA association fails closed.
- Approved exception requires its explicit classification and never silently bypasses the requirement.
- New York, New Jersey, Connecticut, and Massachusetts fixtures do not receive the Pennsylvania requirement.
- A policy version change preserves old evidence and receipts and applies only to new requests under the new effective version.
- Participant, reviewer, institution-decision, and receipt views agree on requirement status without stating legal validity.

## Launch status

Pennsylvania is now a defined validation package with a confirmed product gap. It is not launch-ready until counsel approves the package, the state-specific evidence workflow is implemented, and the synthetic matrix passes. Public and sales copy must continue to describe the live product as New York only and the expansion work as a five-state validation roadmap.
