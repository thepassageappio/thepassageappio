# Production hydration post-rollback evidence — 2026-07-22

- Production alias: `https://www.thepassageapp.io`
- Deployment: `dpl_5GVpgdmZ6oqLkVeWcgcrwSpGPNmj`
- Commit: `09ddb9e5601432f9dd2c36bbdbd829719dd66859`
- Project: `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`
- Browser: Headless Chrome 150 on Windows, isolated session
- Collector: `/root`
- Independent Production QA: `/root/qa_release_truth` — FAIL
- Timestamp window: 2026-07-22T23:18:38Z–2026-07-22T23:20:58Z

## Matrix result collected

The required six routes were exercised by direct navigation and client navigation at 1440, 390, and 360. All 36 cells rendered the intended purpose and an available action, with:

- 0 horizontal-overflow failures
- 0 console warnings or errors
- 0 page errors
- 0 unhandled rejections
- 0 failed requests
- 0 hydration or runtime errors
- 36 timestamped screenshots
- 18 direct/client screenshot pairs with identical SHA-256 content

`/resources` correctly redirects to `/guides` while preserving the QA query string. Its initial redirect response does not expose the deployment commit header; the final rendered artifact, matching client-navigation row, and before/after Vercel alias binding identify the same deployment.

## Independent visual QA finding

Independent Production QA reviewed all 36 screenshots. Thirty-two visual cells pass. Four fail:

- direct `/mission` at 390 and 360
- client `/mission` at 390 and 360

The `THE PROMISE` panel overlays and obscures the `OUR MISSION` panel. At 390, underlying mission copy is visibly sliced behind it; at 360, mission content is effectively hidden. Width equality and empty browser-error arrays did not detect this visual occlusion.

## Release truth

- Source QA: PASS
- Hosted Preview QA: PASS
- Production Deployment: DEPLOYED
- Production QA: FAIL
- Overall release state: INVALIDATED/REOPENED

This evidence preserves the defect and invalidates the collector's automated PASS. The exact Production artifact must not be marked `PRODUCTION VERIFIED`. Repair-forward must retain these screenshots, add timestamped replacement screenshots, and repeat the required hosted and post-deploy matrices.
