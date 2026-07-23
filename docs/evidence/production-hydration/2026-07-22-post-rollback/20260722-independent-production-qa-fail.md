# Independent Production QA — FAIL — 2026-07-22

- Reviewer: `/root/qa_release_truth`
- Production alias: `https://www.thepassageapp.io`
- Deployment: `dpl_5GVpgdmZ6oqLkVeWcgcrwSpGPNmj`
- Commit: `09ddb9e5601432f9dd2c36bbdbd829719dd66859`
- Browser: isolated Headless Chrome 150 on Windows
- Matrix coverage: 36/36 evidence cells

## Verdict

Thirty-two visual cells pass and four fail. The failing cells are `/mission` at 390 and 360 in both direct and client navigation. The `THE PROMISE` panel overlays and obscures the `OUR MISSION` panel. At 390, underlying mission copy remains visibly sliced behind it; at 360, mission content is effectively hidden.

Exact binding, redirect behavior, final URLs, purpose/actions, width equality, browser isolation, zero console/page/rejection/request/hydration/runtime errors, and direct/client screenshot hash parity were verified. Those automated signals do not override the responsive visual failure.

```text
Source QA: PASS
Hosted Preview QA: PASS
Independent Agent Review: PASS
Development Head / Release Authority: APPROVED
Owner Gate: NOT REQUIRED
Production Authorization: APPROVED
Production Deployment: DEPLOYED
Production QA: FAIL
Overall release state: INVALIDATED/REOPENED
```

Preserve the four failing screenshots. Repair-forward must add timestamped replacements, prove `/mission` direct and client navigation at 1440/390/360, and repeat the complete incident regression before any verified claim.
