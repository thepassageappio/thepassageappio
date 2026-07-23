# PR #32 hosted mission-repair Preview evidence — 2026-07-22

- Candidate: PR #32 at `9434e779628b3b20ed25b575b1ca3efa2ba7fc86`
- Base: `main@09ddb9e5601432f9dd2c36bbdbd829719dd66859`
- Preview: `dpl_3EDEQAJTQ3aGHN8yw7sMyAsvQTr6`
- Preview head: `a58d2c564110f5a38cc1e81e0f412ae5237521df`
- State/target: `READY` / non-production
- Collector: `/root`
- Independent Hosted QA: `/root/qa_pr32_hosted_preview` — PASS
- Window: 2026-07-22T23:57:36.4972916Z–2026-07-23T00:05:54.1127533Z

## Exact-tree proof

GitHub comparison proves the Preview head is the PR #32 candidate plus one throwaway commit changing only `vercel.json` by removing `ignoreCommand`. Application source is identical.

## Hosted matrix collected

All six incident routes were exercised by direct and client navigation at 1440, 390, and 360. The 36 cells record final URL, purpose/action, exact dimensions, overflow, console, page errors, unhandled rejections, failed requests, hydration/runtime signals, isolated session, timestamp, and replacement screenshot.

Collected result:

- 36/36 correct viewport cells
- 0 horizontal-overflow failures
- 0 console warnings/errors, page errors, unhandled rejections, failed requests, hydration errors, or runtime errors
- Vercel error-only build review reports completion in 26 seconds with no build error
- deployment-scoped Vercel warning/error/fatal runtime logs are empty for the QA window
- `/resources` redirected to `/guides` in all six applicable cells while preserving the query
- 36 timestamped replacement screenshots
- 17 direct/client pairs are byte-identical
- the `/mission` 1440 pair differs only because its documented 6.5-second path carousel advanced during collection; both visible states are readable and unobscured

The replacement `/mission` screenshots at 1440, 390, and 360 show `OUR MISSION` followed by `THE PROMISE`, proof, path controls, selected destination, and footer in normal document flow. No content is overlaid, clipped, or hidden.

## Current release truth

```text
Source QA: PASS
Hosted Preview QA: PASS
Independent Agent Review: REQUIRED
Development Head / Release Authority: REQUIRED
Owner Gate: NOT REQUIRED
Production Authorization: NOT REQUESTED
Production Deployment: NOT DEPLOYED
Production QA: NOT RUN
Overall release state: PREVIEW VERIFIED
```

Independent Hosted QA opened 21 unique screenshots, including all six `/mission` cells and all 18 non-mission direct cells; SHA-256 identity covered the remaining 15 client counterparts. No visual defect was found. The existing Production defect evidence remains retained and controlling until exact-head review, a separately authorized Production promotion, and complete post-deploy Production QA.
