# Plain-language review

Owner request: make every website and platform screen clear, natural and easy to understand. The [writing standard](PLAIN-LANGUAGE-STANDARD.md) is now linked from AGENTS, CURRENT, the delivery plan and the memory index.

## Changes

Reviewed an inventory of 585 longer text passages from pages, components and articles. Rewrote confusing copy across the website, pricing/pilot pages, guides, onboarding, team/security screens, institution and participant requests, receipts, status/error notices and invitation emails. Kept concise text that already explained the task.

Examples: “Activation starts” becomes “Sending starts”; “account boundary” becomes “account covered”; “go-or-no-go readout” becomes a written account of what worked and what needs to change. Email text still distinguishes acceptance for sending from confirmed delivery.

Corrected the family-help article to say the institution starts the current Passage request. Future templates now explicitly say they are not available. Legal pages have separate plain-language guides; the three existing versioned legal articles are byte-equivalent after line-ending normalization. Saved policies, consent statements and historical records were not rewritten.

## Checks

- 169 domain tests pass, including email content/escaping, delivery state, role boundaries and receipt rules. Existing wording assertions were updated to match the new copy.
- TypeScript, ESLint and optimized production build pass.
- 20 public pages checked at 1280, 390 and 360 pixels: 60 viewport checks, no document overflow, zero browser page errors. Homepage and legal-page screenshots visually inspected.
- Local password/TOTP-authenticated owner, staff, reviewer and auditor workspace replay passes at all three widths. Synthetic fixtures removed.
- Legal article preservation checked directly against the prior Git commit.

## Scope and release

This is a broad editorial pass, not a measured reading-age result or proof that a first-time user needs no help. Technical API identifiers and necessary legal terms remain precise. Complete participant/lifecycle and accessibility replay remains part of the release plan. New policy or binding-consent wording must go through its versioned process.

Changes are on PR 108, not yet merged or live. No emails were sent and no hosted records were changed for this review.
