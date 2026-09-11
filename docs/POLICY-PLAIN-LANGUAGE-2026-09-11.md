# Clearer policy overview

September 11, 2026. Pending in PR 109; not live.

The policy overview spells out “power of attorney,” uses “Request rules” as its introduction, explains that the bank or credit union makes the decision, and replaces technical account-service and sign-in wording. Excluded actions remain separate from actions that may be requested. The page still says institution rules cannot be edited in Passage yet.

The saved-policy explanation now names the policy name/version reference stored with a request. It does not imply that the full immutable policy content and publication/rebase workflow are already integrated. Policy identifiers, accepted text, request history, permissions and database behavior are unchanged.

## Verification

The existing verifier passed eight real-page states, including missing selection, unsupported keys/versions, query failures and no membership. It checked the organization filter and kept private diagnostics out of the page. Browser checks passed 28 combinations at 1280, 390, 360 and 320 pixels with actual markup and styles, no horizontal overflow, keyboard focus on the retry button and a control height of at least 44px. The 320px selected-page screenshot was visually inspected.

Data is mocked in this verifier. This does not establish hosted authorization, a screen-reader audit, a measured reading age or a fresh presenter journey. All 229 domain tests, TypeScript, lint and the optimized build passed. No migration, provider send or production release occurred.

POL1 remains open. Continue the trusted registry, complete policy validation and transactional publication/request integration described in the [operational compatibility checkpoint](POLICY-OPERATIONAL-COMPATIBILITY-2026-09-11.md).
