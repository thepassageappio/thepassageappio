# Policy action and evidence validation

`compilePolicyRules` now validates the action/evidence portion of a future institution policy against a supplied trusted catalog. It returns an explicitly partial `action-evidence-only` result. It is not connected to policy editing, publication or request activation.

## What it enforces

- Standard actions retain their semantic key, meaning, category, account types, risk tier and review guidance. Institution overrides may only change the display label or enabled state. An action marked unavailable by the catalog cannot be enabled.
- Locked required evidence cannot be removed. Optional evidence can become required. Standard collection purpose, method, retention class, reviewer role and lock source cannot be rewritten through the override form.
- Custom actions and evidence require a code under `institution:<organization UUID>:<name>`. Standard codes and another organization's namespace are rejected. Custom action metadata includes meaning, category, account types, risk tier and review guidance; custom evidence requires purpose, collection method, retention class and an owner/admin/reviewer role.
- Each effective rule retains its definition source and the separate source of label and availability/requirement changes. Custom rules are marked institution-defined.
- Unknown fields, unknown standard codes, duplicates, contradictory catalog rules, malformed booleans, hidden control characters and unsafe JSON fail closed. Errors include a field path and a plain explanation. Catalog/rule order is normalized, and inputs are detached before overrides are applied.

The catalog argument must come from a trusted, versioned server source. Validating its structure does not make a browser-supplied catalog trustworthy. The future publication command must resolve its own catalog and jurisdiction package; it must never accept a user's replacement catalog or declared lock values as authority.

## Limits that remain

Custom metadata and namespace checks do not prove that a custom action is compatible with legal restrictions or the institution's products. Text cannot establish semantic equivalence or legal permission. Category/account-type/retention references still need resolution against governed catalogs. Conditional evidence, provider compatibility, channels, typed limits, disclosures, exceptions, rule dependencies and jurisdiction applicability are not handled in this slice. Unknown channel/control fields are rejected so they cannot silently disappear during compilation.

The partial result must not be treated as a publishable complete policy or used to enable request actions. No state-specific legal rule or approval was created. Tests use fictional restrictions. Authentication, owner/admin AAL2, publication version checks, concurrency, idempotency, audit history, request binding and explicit rebase remain separate integration requirements.

## Evidence and next step

Thirteen focused tests cover allowed edits, lock enforcement, custom ownership and required metadata, unknown/duplicate fields, catalog contradictions, invalid types, input isolation, stable ordering and snapshot hashes, and plain field errors. All 196 domain tests, TypeScript, lint and optimized build pass.

Complete the remaining compiler sections and resolve trusted source versions, then connect the result to transactional immutable publication and request-revision storage. Migration `20260911072009` remains local only, with no local migration-history row; do not repeat it blindly. No migration, provider send, daily reconciliation rerun or deployment occurred in this slice. Both prior Vercel checks passed at `a12658422353f7d962387efe24912173666e25a8`; new commits need their own checks. Production remains independently verified at `c64299e5ed3fa49b43e7ca62278b9c5c59088264`.
