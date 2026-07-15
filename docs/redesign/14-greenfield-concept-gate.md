# Passage greenfield concept gate — Cycle 1

Date: 2026-07-14  
Status: concept direction recommended; implementation gate remains open  
North star: enterprise-ready “death tech meets Apple empathy,” built for millennial and Gen-Z adults coordinating aging-parent and end-of-life responsibilities, and credible to funeral-home directors.

The current Threshold re-skins are a visual foundation, not the target architecture. A concept fails automatically if it preserves the current dashboard/card grid or estate panel stack under new styling.

## Recommended direction — Passage Briefing + Transfer Wallet

### Funeral-home director: first 30 seconds

The director opens to a calm operational briefing, not a dashboard grid.

- A case-flow horizon shows arrivals, active arrangements, pending family decisions, and transfers.
- The center presents one prioritized exception or commitment at a time.
- A persistent case drawer supplies context without abandoning the queue.
- The signature motif is a restrained continuity line connecting each case’s next commitment and handoff state.
- Risk, waiting party, owner, family-update health, and proof destination are legible immediately.

### Family: Share with a provider

The family uses a single-purpose Transfer Wallet.

1. Choose the receiving provider.
2. Review a plain-language, granular scope.
3. Choose an expiry.
4. Preview exactly what will be shared.
5. Generate the pass only after confirmation.
6. See QR, human-readable fallback code, recipient, scope, expiry, current status, and revoke control.
7. Receive a quiet audit receipt/timeline after view or acceptance.

The QR graphic is not the product. The product is a current, scoped, revocable, auditable share object controlled by the family.

## Supporting patterns, not blended concepts

### Case Chronicle

Use a chronological “happened / now / next” pattern for estate history, consent evidence, and audit comprehension. Do not use it as the director’s entire high-volume operating frame.

### Guided Rooms

Use focused, conversational rooms for first-time family onboarding and emotionally difficult decisions. Do not use rooms as the repeat-user director navigation model.

## Rejected direction

Do not create another generic SaaS dashboard with:

- a feature-equal sidebar;
- a grid of metrics and cards;
- family and staff surfaces sharing the same hierarchy;
- page-sized forms;
- palette-only red/green distinctions;
- marketing-page styling copied into operating software;
- decorative QR treatment that hides scope, expiry, status, or control.

## UX-06 greenfield acceptance gate

Every critical item must pass.

| Gate | Pass condition |
|---|---|
| Greenfield structure | Side-by-side evidence shows new IA, composition, and task flow—not a re-skin. |
| Director comprehension | Highest-priority case, reason, owner, waiting party, and next action are identifiable within 30 seconds. |
| Director action | The surfaced next action can be completed without hunting through global navigation. |
| Family comprehension | Before confirmation, a family user can explain who receives what and for how long. |
| Family control | Recipient, scope, preview, expiry, confirmation, fallback code, status, and revoke are understandable. |
| Shared continuity | Family and director views resolve to the same estate/pass/recipient/status truth. |
| Emotional quality | Calm, direct, respectful; never alarming, celebratory, euphemistic, or infantilizing. |
| Enterprise credibility | Loading, empty, stale, offline, partial-data, permission, expired, and revoked states are designed. |
| Accessibility | WCAG 2.2 AA essentials, keyboard paths, focus return, screen-reader status, zoom/reflow, and reduced motion pass. |
| Evidence | Desktop and mobile screenshots plus annotated task sequences cover both scenarios. |
| Claim safety | No unverified legal, medical, privacy, retention, or authority claim ships. |

## Required responsive and access behavior

- Verify at 360, 390, 768, 1024, and 1440 widths.
- Minimum 44×44 touch targets.
- No essential action requires hover, drag, swipe, or camera scan.
- Transfer Pass always supplies a readable manual-entry fallback.
- Never encode urgency, scope, or status through color alone.
- Preserve entered information through recoverable errors.
- Mobile director UI prioritizes scan, search, next commitment, and case contact—not a compressed desktop dashboard.

## Developer handoff required before implementation

- Annotated desktop/mobile frames for the director briefing and family Transfer Wallet.
- Clickable happy-path and failure/edge-state prototype.
- Component/state inventory.
- Route and information-architecture map resolving every view to one estate record.
- Data contract for estate, scope, recipient, token, expiry, acceptance, revocation, and audit events.
- Threshold 2.0 token and interaction specification.
- Plain-language copy deck with compliance-sensitive placeholders marked.
- Keyboard/screen-reader notes.
- Funnel and comprehension instrumentation.
- Screenshot/evidence matrix tied to each gate above.

## Decision

Advance Passage Briefing + Transfer Wallet into high-fidelity exploration. Use Case Chronicle beneath it for history and audit. Use Guided Rooms selectively for first-time family onboarding. Do not blend all three into a generalized dashboard.
