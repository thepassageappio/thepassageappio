# Participant access controls — September 11, 2026 UTC

Auditors could see fresh-link, resume-link and receipt-link send forms on the institution request page, despite being denied by the database operator guard. The page now hides these forms and their resend instructions from auditors while retaining participant addresses and status. Owners, administrators, staff and reviewers keep their existing permitted controls.

An initial review incorrectly grouped reviewers with auditors. Inspection of the live UAT `assert_authority_record_operator(uuid)` definition confirmed that reviewers are permitted operators for this command. The final change preserves that permission. This is a UI correction, not an authorization-policy change or a new delivery mechanism.

The render fixtures previously supplied no invitations, leaving these controls untested. They now include both participant invitations. Seventy role/state combinations cover five institution roles and fourteen request states, including first invitations, resume links, receipts and closed states without resend. Replaying the new fixture against the original page reproduces the auditor defect. The corrected page passes all 70 checks and the existing 76 closed-page checks. The 172 domain tests, TypeScript, lint and optimized build pass.

Verification renders the actual server page against isolated read fixtures. No email, database mutation, participant session or production deployment was performed for this change. Exact-candidate hosted verification and release remain pending in PR 109; the live application is still the independently verified PR 108 release.

Two read-only Gmail searches, including Spam and Trash from September 9 onward, returned no matching participant invitations. This result does not establish a delivery failure, diagnose a cause or verify the separate recipient inboxes. No messages were resent. The reliable fresh presenter walkthrough remains open; do not repeat these searches or provider sends without new evidence. Continue independent POL1 snapshot/publication work while that operational evidence is unavailable.
