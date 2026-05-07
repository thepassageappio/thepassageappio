# OpenAI Integration Migration Plan

Status: no active OpenAI integration exists in this repository today.

## Audit Result

- No `openai` package dependency.
- No OpenAI model strings.
- No Chat Completions, Responses API, Assistants API, Agents SDK, Realtime API, streaming, tool-calling, or structured-output code paths.
- No OpenAI-specific tests or fixtures.

## Recommended Future Path

Use the Responses API first for Passage task orchestration because the product need is server-side, auditable, structured output: draft an obituary, prepare a funeral-home packet, produce a call script, summarize a message thread, or suggest the next task.

Do not add client-side model calls. Every AI action should run through a server-side adapter that records:

- estate or workflow id
- task id when applicable
- actor
- prompt template version
- model
- structured output
- proof/audit event
- whether the family approved, copied, sent, or discarded the output

Use Agents SDK later only if Passage needs multi-step tool orchestration across several internal tools. Use Realtime API only if a future voice/call-coach experience requires low-latency speech.

## Implementation Sequence

1. Add a server-only AI adapter with one default model setting and one feature flag.
2. Create strict schemas for each Tier 1 output type: obituary draft, family message, funeral-home prep packet, bank/government packet, task next-step summary.
3. Add prompt fixtures and golden-output tests before exposing UI.
4. Wire one low-risk task output first: obituary draft or message rewrite.
5. Record every generation in the task/status/audit spine.
6. Add approval UI: copy, save draft, send through Passage, or discard.
7. Add cost/error logging and fallback copy for unavailable AI.

## Risk Notes

- AI output cannot be presented as legal, medical, financial, emergency, funeral-directing, or religious advice.
- Human approval remains required before any outbound message or document is sent.
- Generated content must stay scoped to the estate/task and never leak across users, participants, vendors, or funeral-home organizations.
- Existing public interfaces should not change until the task-output contract is proven.

## Validation Plan

- Unit tests for prompt builders and structured-output parsers.
- Fixture tests for each Tier 1 task output.
- API tests proving unauthenticated users cannot call AI endpoints.
- QA checks proving generated outputs create task activity and can be copied/saved/sent/discarded.
- Manual review checklist for legal-sensitive tasks before pilot demos.
