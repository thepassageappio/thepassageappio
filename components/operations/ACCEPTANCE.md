# Passage Zero B2B acceptance

This handoff owns only the new App Router B2B surfaces and their local operations components.

## Routes

- `/director` — operational risk, family waiting, explicit ownership, blockers, and proof requirements. Selecting a ledger row changes the focused case and its continuity rail. Starting a commitment updates its proof state.
- `/staff` — one owned commitment at a time. Staff sees the minimum case boundary, blocker, expected proof, and next handoff. The demo interaction progresses from open → working → proof attached.
- `/receive` — empty pass-code entry. Active passes expose source, explicit family-selected scope, expiry, destination choice, acknowledgment, and an acceptance receipt.

## Receive demo states

- `PASS-RIVERA-7K4M` — active, reviewable, and acceptable.
- `PASS-CHEN-EXPIRED` — expired; no information opened.
- `PASS-BROOKS-REVOKED` — revoked by family; no information opened.
- `PASS-LEE-ACCEPTED` — already accepted with case receipt reference.
- Any other non-empty value — invalid.

## Product boundaries

- The continuity rail is the shared B2B primitive: handoff → case → owner → proof.
- The Director route prioritizes exceptions and judgment, not vanity metrics.
- The Staff route deliberately hides unrelated case information.
- Receive never mutates a case before explicit scope review, destination choice, and acknowledgment.
- Copy avoids legal, medical, privacy, or compliance guarantees.
- All content and records are synthetic.

## Visual and accessibility checks

- System sans only; scoped cool canvas, graphite, cobalt, lilac-blue, apricot, and success colors.
- No inherited Passage components, page layouts, palettes, or CSS.
- Compact 6–10px geometry, flat working panes, visible keyboard focus, semantic headings, fieldsets, tables, labels, and status output.
- Desktop split panes collapse into ordered mobile workflows without horizontal page overflow; wide Director ledger remains intentionally horizontally scrollable inside its own region.
- Reduced information density on staff and receive mobile routes is structural, not a scaled desktop treatment.

## Static verification performed

- All route/component/style paths exist.
- TSX delimiter counts balanced.
- CSS-module references checked; no missing classes.
- No TODO/FIXME/console statements or mojibake markers.
- Full TypeScript/build execution was not available because this workspace has no Node/npm executable.
