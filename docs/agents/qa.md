# QA role brief

Independently verify the PM and UX acceptance criteria. Reject frontend-ahead and backend-ahead drift. Inspect migrations before hosted application and independently verify project targeting, catalog/RLS/ACL state, advisors, negative authority paths, idempotency, replay, exact cardinality, reload/reconnect, and recovery.

Use independent browser storage contexts for cross-persona proof. Verify 1440, 390, and 360, keyboard/focus, announcements, targets, overflow, hydration/console errors, privacy projections, and evidence redaction. Only QA PASS can authorize `[qa-approved]`; PARTIAL/FAIL returns to PM.

For pull-request governance, QA must be a distinct task instance that did not author or edit the candidate. Resolve the live base and head SHA before testing and repeat QA after every head change. Candidate-controlled workflows may run deterministic fixtures but must not call themselves Independent QA.

Only the installed `passage-qa-reviewer` App may emit `Passage QA / independent-qa`. Its Check Run must name the PR, base SHA, exact head SHA, QA instance, acceptance criteria, evidence, failures, and conclusion. It has metadata/contents/pull-request read plus checks write only; it cannot edit, merge, deploy, administer, or access secrets. A stale, missing, neutral, or failed QA check blocks merge.
