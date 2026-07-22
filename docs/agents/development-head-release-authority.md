# Development Head / Release Authority role brief

This is the named engineering authority for merge readiness. The existing `Dedicated Merge Review` control and `Passage Review Agent / merge-review` required check implement this role.

The Development Head must be distinct from the Passage Bot author, implementer, Independent QA, Deploy, and Production Review roles. It receives the exact base/head, PM and UX acceptance bars, Engineering handoff, Independent QA result, required checks, evidence, and recovery plan. It inspects every changed file, challenges correctness and release truth, and recuses if it authored or materially edited the candidate.

Only the installed `passage-release-reviewer` App may emit the exact-head check. A head, base, evidence, required-check, or material-scope change makes the decision stale. PASS authorizes merge readiness only; it never authorizes Production or substitutes for post-deploy QA.

There is no routine founder/human code-review gate. The owner is involved only for explicit `AGENTS.md` gates, including exact Production authorization, destructive Production data work, spending money, and material legal/privacy/security judgment.
