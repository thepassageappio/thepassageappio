# Buyer one-pager review copy

Created `output/pdf/passage-authority-buyer-one-pager.pdf` from the existing [one-pager copy](ONE-PAGER-DRAFT-2026-09-10.md), preserving the original file. The new one-page layout uses readable type, four numbered steps, a highlighted evaluation scope, an institution-responsibility statement and a link to the existing contact page. Its footer explicitly says internal review draft and not cleared for distribution. No messages, attachments, CRM writes or public website changes were made.

## Claim review

| PDF claim | Evidence and limit |
| --- | --- |
| Request, review and decision in one place | [Hosted journey and receipt evidence](RELEASE-AND-DEMO-STATUS-2026-09-11.md); current UI release [PR 110](BUYER-DEMO-POLISH-LIVE-2026-09-11.md). This does not promise measured time savings. |
| Account holder and representative complete separate steps | Existing persona evidence; fresh first-use demonstration and actual invitation arrival still need verification. |
| Institution reviews files, asks questions and decides | Existing synthetic persona journey. Passage does not replace legal, identity or fraud review. |
| Matching receipt with accepted actions and limits | Existing receipt agreement and replay evidence. No claim of downstream access integration. |
| Fictional New York evaluation for statement copies and service discussions | Current supported scope in [CURRENT](agent/CURRENT.md). Other states, incapacity paths and policy authoring are not claimed. |
| Institution makes any account changes in its own systems | Preserves [AGENTS](../AGENTS.md) responsibility boundary. |

There are no compliance, certification, ROI, customer, pricing, universal acceptance or enterprise-readiness claims. The contact URL is a proposed CTA using an existing public route; using it in a draft is not sender or distribution approval. The draft is grounded in repository evidence, not a named opportunity or new CRM research.

## Verification

Generated with the reproducible `scripts/build-buyer-one-pager.py` builder and bundled ReportLab. Reopened with pypdf, confirmed exactly one letter-size page, extracted and reviewed the full text, checked the distribution label and contact link, and rendered with Poppler. The final page was visually inspected: no clipping, overlaps, missing glyphs or awkward page breaks. Embedded font subsets support portable rendering. This is visual and content QA, not PDF/UA or screen-reader certification.

## Next steps and standing limits

Finish the fresh inbox-to-receipt rehearsal, record a clean backup walkthrough, then review the one-pager against that exact demonstrated scope before release. Participant inbox addresses and invitation/receipt-email permission remain pending. This session has no usable native screen-reader/spoken-output control, so that test remains unverified; accessibility-tree checks are not a substitute. Do not repeatedly attempt unsupported screen-reader control or reopen cleaned-up hosted fixtures.

Both live version endpoints were rechecked at main b207fb8; PR 109 remained unmerged at 78e16f2 before this documentation/asset commit. Existing hosted cancellation and migration evidence was read without repeating SQL or migrations. No production deployment or new reconciliation day is claimed.
