# Agent Operating Context — Addendum, 2026-07-14 (Run 15, Codex release train)

This addendum continues run 14 after the owner explicitly restarted the release train and clarified the north star:

> Build Passage as a fully greenfield, enterprise-ready “death tech meets Apple empathy” company: serious and sellable to funeral homes, designed for millennial and Gen-Z adults coordinating aging-parent and end-of-life responsibilities, complete across D2C and professional personas, with a separate resettable funeral-home director demo sandbox.

The owner further clarified that Passage has no customers and no current compatibility risk. Current UI, routes, components, and schema are evidence and salvageable domain knowledge only—not constraints. Safety, RLS, migration discipline, accessibility, QA, and compliance-copy review remain because they are foundations for scale.

## Verified incoming state

- Latest main commit at start: `f6c50b293557f852cc12fe7be4ea59c397f4a072` (run-14 docs update).
- Font unification already shipped at `3d881fde684fcc8cfdf5a828d2df87366364175a`; not repeated.
- Run-14 addendum, greenfield rebuild plan, Threshold tracker, UX brief, AGENTS.md, release train, and role briefs were read directly from GitHub.
- GitHub contained closed release PRs but no open greenfield sprint issue board.
- Local workspace has no repo checkout and `git`, `python`, and the Chrome-control runtime are unavailable. GitHub and Vercel connectors were used. No code or database changes were claimed.

## Role handoffs

### Product Manager Agent — COMPLETE

Distinct delegated role: `/root/pm_sprint`.

Cycle 1 sprint goal: stabilize or replace legacy defects, establish a hard greenfield concept gate, create an isolated/resettable demo environment, mechanically extract the dashboard, rebuild the director demo slice, and deliver QR Transfer Pass V1 through additive migrations and permission tests.

Product Manager converted the prose backlog into dependent workstreams and explicit release sequencing. GitHub Issues #8–#16 now hold the executable board:

- #8 greenfield concept gate
- #9 hydration diagnosis/fix
- #10 estate literal `??` defect
- #11 isolated demo sandbox
- #12 dashboard mechanical extraction
- #13 greenfield director/employee experience
- #14 Transfer Pass ADR/migrations/RLS
- #15 Transfer Pass V1
- #16 independent QA/deploy evidence gate

### UI/UX Review Agent — CONCEPT DIRECTION COMPLETE; IMPLEMENTATION GATE OPEN

Distinct delegated role: `/root/ux_gate`.

Three structurally distinct directions were defined. Recommendation:

- **Passage Briefing + Transfer Wallet** for the main operator/family experience.
- **Case Chronicle** as the underlying history/audit pattern.
- **Guided Rooms** only for first-time family onboarding.

The selected direction explicitly rejects the current card-grid dashboard and estate panel stack. Durable acceptance criteria are in `docs/redesign/14-greenfield-concept-gate.md`. UI implementation remains blocked until desktop/mobile concepts are inspectable and pass the UX-06 gate.

### Development Engineer Agent — IN PROGRESS

Distinct delegated role: `/root/stabilization_eng`.

Scope: source-backed investigation of issues #9/#10 only. Because the owner removed legacy-compatibility constraints, the engineering decision may be fix, delete, or replace; parity is not the goal. No guessed patch is authorized.

## Durable design/architecture artifacts

Branch: `codex/greenfield-sprint-1`.

- `docs/redesign/13-passage-system-dependency-maps.md`: current state, target state, and delivery dependency maps. Commit `7b951bed051ec731abec356a964e9614f683cd07`.
- `docs/redesign/14-greenfield-concept-gate.md`: recommended concept direction and pass/fail acceptance. Commit `30f7be2be2d2c0289b95617456f73bc34ce7a310`.

These replace ephemeral widget-only maps with durable repo artifacts. They do not claim target-state implementation exists.

## Live demo-environment audit

Vercel connector verified the team currently has exactly one project:

- Project: `thepassageappio`
- ID: `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`
- Team: `team_X0ta3bEEbRVGNM9xOwdBtCga`

Therefore the previously described “sandbox” was a preview/deployment inside the same Vercel project, not a separately isolated demo project. The latest production READY release remains the font-unification deployment for `3d881fde`; docs/branch commits were canceled by the skip-deploy gate as intended.

Issue #11 was updated with this evidence. DEMO-02 is real foundation work: separate Vercel project/config, separate non-production Supabase data target, deterministic seed/reset, and side-effect isolation. Supabase project audit remains pending because no Supabase connector or local credentials are available in this session.

## PM/UX decisions

- Current-state compatibility is not a goal.
- Do not spend the redesign preserving old page composition.
- Production stabilization work is independent and should be justified only where the affected surface remains useful before replacement.
- New persona UI waits for the greenfield concept gate.
- Mechanical extraction and environment foundation can run in parallel.
- Transfer Pass uses purpose-built token and append-only consent concepts unless the ADR finds contrary evidence; do not overload `provider_handoffs` merely because it exists.
- Exact legal/compliance claims remain owner-gated. Plain, non-legal feature copy may proceed.

## QA/deploy state

No app code, migrations, or production release were made in this batch. Documentation commits correctly triggered canceled Vercel builds because they use `[skip deploy]`.

Required evidence going forward:

- actual desktop and mobile screenshots;
- runtime console results;
- matching served commit;
- primary persona flow;
- responsive and accessibility proof;
- RLS/permission evidence where relevant;
- rollback or replacement plan.

## Next actions

1. Finish the stabilization engineering handoff and PM disposition: fix versus replace.
2. Produce inspectable desktop/mobile concept frames for Passage Briefing + Transfer Wallet and run the independent UX-06 gate.
3. Establish the truly separate demo environment and deterministic seed/reset.
4. Run dashboard mechanical extraction with parity proof only as a transitional engineering operation.
5. Build the approved greenfield director vertical slice.
6. Complete Transfer Pass ADR, sandbox migrations/RLS tests, then V1.
7. Deploy to the isolated sandbox and capture the owner’s funeral-home demo evidence before any production promotion.
