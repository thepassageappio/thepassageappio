# Entry text size and accessibility labels

Read-only checks on both live sites verified main `b207fb8bd60c84f73ddee326245064571fdfbae2` before testing. PR 109 remains the separate, unmerged policy branch. Hosted cancellation/schema evidence was reconciled from its existing record; no database query, migration, send or deployment was repeated.

`scripts/verify-entry-accessibility.mjs` passed 24 cases: six routes on two sites in two modes. Routes were home, workspace start, contact, signed-out sample entry, an invalid participant link and an unavailable receipt session. Modes were a 1280px viewport with computed font sizes and numeric line heights doubled, and a 320px viewport at normal text size. Values were captured before applying changes to avoid multiplying inherited text sizes repeatedly.

Each case had one main landmark, one level-one heading, a document language and accessible names for exposed links, buttons, text fields, checkboxes, selection controls and disclosure controls. No document overflow, detected hidden/clip overflow on links/buttons/disclosures or browser page errors occurred. No application write was attempted; non-read requests were blocked, including observed site analytics.

The Demo workspace-start screenshots at both sizes were visually inspected. Heading, labels, Google/email choices, guidance and next actions remained readable. The script passes its focused ESLint check. Raw proof and screenshots are in ignored `work/entry-accessibility-proof.json`, `work/entry-text-200.png` and `work/entry-reflow-320.png`.

## Limits and remaining work

This is injected text enlargement and narrow-viewport reflow, not native browser zoom. Chrome's accessibility tree verifies exposed structure and names; it does not prove spoken output, reading order or operation with a real screen reader. The clipping check covers explicit hidden/clip overflow on the listed controls and is not an exhaustive overlap or contrast audit. No authentication, form submission, saved transition, email delivery or first-person usability study was performed.

UX2 remains partial. Next: native zoom and screen-reader walkthrough, then authenticated first-use/recovery checks and the fresh timed inbox-to-receipt demonstration. The already-requested participant addresses and test-email authorization remain pending; no new permission request was sent.

Current checkpoint, memory index and delivery-plan introductions were consolidated to remove contradictory statements that PR 110's shipped UI was still pending in PR 109. Historical evidence remains in its dated files and Git history.
