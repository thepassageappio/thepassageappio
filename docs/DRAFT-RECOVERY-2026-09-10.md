# Draft form recovery

## Behavior

Before this change, the draft server action redirected errors to a fresh form. Entered details and selected actions could be lost. The form now keeps them in page memory, shows a plain error, and focuses that message. While saving, controls are disabled and the button says Saving. Successful saves still use the same authenticated command and redirect to the saved draft.

The action keeps the existing idempotency key through retries. It maps known validation errors to useful messages without exposing raw database errors. The browser submits through an explicit transition so React does not reset checkbox selections after a failed action. Entries are not added to URLs or browser storage. Navigating away or reloading before saving is not durable autosave.

## Verification

`scripts/verify-draft-recovery.mjs` runs only against local Supabase on port 55321 and the local app on port 3100. It uses real password/TOTP authentication and actual server-action POSTs.

- Same-email validation keeps names, emails, account details, selected actions and the command key.
- A database-rejected end date keeps the corrected email and date.
- Keyboard submission focuses the error; 1280/390/360 layouts contain their content. Phone screenshot inspected.
- Correcting the date saves one draft and one append-only event. Replaying the exact POST still leaves one of each.
- Draft saving uses no evaluation allowance.
- A reviewer cannot create a draft through the direct server action but can see the saved draft through their own authenticated session.
- Zero owner-page browser errors. The successful local replay record is `9decf9c8-16c5-41aa-ad12-d334e7f59aee`. Its test organization was closed and fixture users banned after verification. Local append-only evidence is retained; no hosted records, invitations or payments were created.

This verifies draft saving and recovery, not request activation or a completed decision receipt. The complete workflow release replay and remaining form recovery remain open.

Final code checks: 169 domain tests, TypeScript, ESLint and optimized production build passed. This is implemented and locally verified on PR 108; it is not merged or live.
