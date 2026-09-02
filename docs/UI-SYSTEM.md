# Passage Authority UI system

> **Document status, August 27, 2026:** This controls visual and interaction principles. `PRODUCT-SOURCE-OF-TRUTH.md` and `IMPLEMENTATION-TRACEABILITY.md` control current routes, personas, access, pricing, screen actions, and build order.

## Product interaction model

The interface is a high-trust transaction, not a dashboard-first SaaS shell. It must keep one next action dominant while preserving enough context to answer who is acting, what they may do, who is waiting, what will be shared, what was saved, and what happens next.

The controlled MVP has six related surfaces:

- the commercial website explains the problem, wedge, template, pricing hypothesis, security boundary, and pilot;
- institution setup turns one governed template into a new request without engineering;
- the participant workspace is a guided, role-owned transaction;
- the institution workspace is a quiet multi-record queue that opens the same canonical record in reviewer context;
- the receipt explains the institution's decision and lifecycle without exposing system language;
- the developer workspace exposes deterministic scenarios, signed payloads, attempts, failures, and replay evidence.

They share product identity and status language but do not collapse into one generic dashboard. The financial power of attorney template is the only active template in this release. Future templates may be visible only as clearly labeled planned use cases.

## Research translated into product decisions

- Plaid Link and Stripe hosted onboarding demonstrate the value of a guided embedded flow that changes with requirements. Passage therefore keeps the persona workspace focused on the current owner and renders requirements from the canonical record.
- The GOV.UK task-list pattern pairs each task with a visible status and recommends short task names. Passage uses this for evidence requirements rather than a generic progress percentage.
- The GOV.UK check-answers pattern gives users a final review before submission and is specifically valuable when multiple people complete a transaction. Passage shows purpose, scope counts, evidence completion, and recipient before disclosure.
- The US Web Design System step indicator is intended for processes with three or more high-level chapters. Passage uses five short chapters: Confirm, Accept, Evidence, Review, and Decision. The receipt retains the detailed history.
- WCAG 2.2 requires visible focus and at least 24px targets or sufficient spacing. Passage targets 44px controls throughout, uses a three-pixel visible focus ring, and does not change context merely on focus.
- Consequential legal/financial actions require error-prevention affordances. Passage requires a reason plus a server-validated confirmation for institutional decisions and revocation.
- A requirement always shows its policy reason, owner, status, and acceptable next action. “Upload documents” is never used as an unexplained bucket.
- The illustrative power of attorney result shows its extracted scope, effective date, agent name, principal name, and page references. It is never labeled legally valid.
- The reviewer sees policy satisfaction and evidence provenance as separate dimensions; the interface never displays one unsupported authority score.
- The developer log treats retry and replay as product states, not hidden operational details.
- Human-facing copy uses plain terms such as "person granting authority," "representative," "institution reviewer," and "decision receipt." Raw status enums, internal event names, database keys, and fixture language stay out of non-developer surfaces.

## Toolkit decision

The controlled MVP uses semantic HTML, Server Actions, native checkboxes, select, textarea, and disclosure elements with owned CSS modules. It does not initialize shadcn/Tailwind in this slice because doing so would replace the existing styling foundation without adding a needed interaction primitive.

Adopt a headless/shadcn primitive only when the product needs behavior difficult to implement accessibly with native HTML:

- `AlertDialog` for a later two-step destructive confirmation;
- `Dialog` or `Sheet` for mobile evidence review without route navigation;
- `Popover`/`Command` for institution or policy lookup;
- `Tooltip` only for supplemental information, never required meaning;
- `Table` for a multi-record reviewer queue.

## Visual language

- Warm off-white canvas; white records; deep green for trust and active state; restrained amber for sandbox/attention; red only for prohibition or destructive outcomes.
- Editorial serif for outcome-level headings; neutral sans serif for controls and operational copy.
- Soft radius with clear borders; shadows establish hierarchy but never substitute for status or focus.
- No gradients, glass-heavy surfaces, fake device frames, celebratory animations, or decorative AI motifs.
- Status is always conveyed by text and structure, never color alone.

## Responsive contract

- Desktop keeps actor navigation left, transaction center, receipt right.
- Tablet moves the receipt below the primary transaction when necessary.
- Mobile turns actors into three equal participant controls, stacks content in reading order, and keeps the five-chapter progress list horizontally scrollable rather than shrinking text below legibility.
- The same commands, copy, status, and receipts exist at every viewport.
- Queue tables preserve request, status, owner, and action at narrow widths; secondary policy/scenario columns may collapse.
- Developer delivery rows stack payload and replay controls below the event on narrow screens.
- Commercial navigation and participant actions keep 44px minimum targets at 390px and 360px.

## Sources

- [Plaid Link](https://plaid.com/docs/link/)
- [Stripe Connect onboarding](https://docs.stripe.com/connect/onboarding)
- [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)
- [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/)
- [USWDS step indicator](https://designsystem.digital.gov/components/step-indicator/)
- [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
