# Passage Zero - Agent Operating Context

## Public and Steve demo atomic recovery - Engineering handoff - 2026-08-12 17:51 -07:00

Status: **ENGINEERING GATES PASS / DISTINCT EXACT-HEAD SOURCE QA REQUIRED / HOSTED PREVIEW FAIL / NON-PRODUCTION**.

- **Role and received handoff:** distinct Development Engineer `/root/eng_public_demo_atomic_repair` received the PM FIX NOW and existing binding UX acceptance against exact clean public/demo base `ab430f2369c4b8cbba2d8ab489dff1b6993a45e7` in collision-safe worktree `.release-train-clean/.public-demo-build`. The unrelated untracked `({tag` file was preserved and excluded. The prior hosted verdict for Preview deployment `MzsuJ1wdeNP1cF8uFLyEz8DESmyH` is **INVALIDATED / FAIL** because failure injection proved false activation success, false close state, and missing configured team entry.
- **Activation correction:** `TransferComposer` now attempts its session save before issuing any handoff command. A blocked save returns before dispatch or navigation, keeps the editable choices, shows that no handoff was created or saved, retains retry, and focuses a visible persistent recovery status. A new atomic sandbox dispatch writes browser persistence before committing React or in-memory state. If that write fails, the command does not become visible as successful and the incomplete session copy is removed or a truthful reset instruction is shown.
- **Close correction:** `ActivePass` now verifies session cleanup before issuing the close command. A blocked cleanup returns before dispatch, leaves the handoff active, preserves the confirmation and both retry choices, states that nothing changed, and focuses the visible recovery. The close command uses the same atomic sandbox dispatch. If its durable browser write fails, the active in-memory state remains and the prior session copy is restored when possible. Closed copy and the closed heading render only after both persistence steps succeed.
- **Source-proven dependency:** `lib/sandbox/provider.tsx` adds `dispatchAtomic` alongside the existing in-memory-fallback `dispatch`. Only handoff activation and close use the atomic path. Reset and the other browser-demo actions retain their existing safe in-memory fallback behavior.
- **Team demo boundary:** Director, Staff, and Vendor remain a separate Deploy configuration obligation. They must use the existing `startPreviewDemo`, isolated synthetic accounts in project `uyacxqtsiwlvtmhxvoxr`, real role routes, and existing Auth/RLS. No browser-local operator fallback, Auth bypass, source credential, Supabase change, or Production configuration was added. Deterministic Steve demo acceptance still requires functional family, director, staff, and vendor entries on the replacement branch-only Preview.
- **Files changed:** `components/family/TransferComposer.tsx`, `components/family/ActivePass.tsx`, `components/family/FamilyJourney.module.css`, `lib/sandbox/provider.tsx`, `scripts/test-public-conversion.js`, and this living context only. No migration, roadmap, pricing, Auth, database, environment, Vercel, trusted governance, or Production file changed.
- **Local browser proof:** fresh failure injection covered activation and close at 1440 by 900, 390 by 844, and 360 by 800. Activation remained on `/demo/family`, showed the exact recovery, focused it instead of `BODY`, kept retry, and had zero horizontal overflow. Close remained on the active `/demo/family/pass` view with `Ready for the handoff`, retained `Keep open` and `Yes, close it`, focused the recovery instead of `BODY`, and had zero horizontal overflow. No page error or console error was observed. Development-server informational and refresh logs were not counted as hosted runtime proof.
- **Engineering verification:** public conversion PASS; participant invitation P1/P2 `37/37` PASS; workflow messaging `23/23` PASS; parity `19/19` plus Server Actions PASS; persona language PASS; context PASS; release governance PASS; operational route gate PASS; runtime isolation PASS; deploy gate PASS; TypeScript PASS; optimized Next.js 16.1.6 build PASS with the complete route inventory; diff check PASS. The only build warning was the known multiple-lockfile workspace-root warning.
- **Roadmap classification:** **NO**. This is a bounded defect correction that restores the already-approved public/demo recovery contract. It changes no product direction, persona coverage, milestone order, architecture, readiness doctrine, or score.
- **Owner gate:** **NONE**. No owner prompt is permitted for source QA, branch-only Preview configuration, isolated synthetic demo accounts, Deploy, or hosted verification.
- **Source QA:** ENGINEERING GATES PASS / DISTINCT EXACT-HEAD QA NOT RUN.
- **Hosted Preview QA:** FAIL on stale deployment `MzsuJ1wdeNP1cF8uFLyEz8DESmyH`; replacement Preview QA NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** ACTIVE REPAIR / SOURCE PARTIAL / HOSTED FAIL / NON-PRODUCTION / NOT QA-APPROVED.
- **Atomic next handoff:** freeze one Passage Release Bot `[skip deploy]` head and send it to distinct Source QA. If exact-head Source QA passes, Deploy configures the three isolated team demo sessions, publishes one replacement branch-only Preview, and distinct hosted QA reruns the complete family/team and responsive failure matrix. Production remains prohibited.

## Product Lane A - Public conversion and Steve demo - QA-return Engineering correction - 2026-08-10 15:57 -07:00

Status: **ENGINEERING CORRECTION COMPLETE / SOURCE AND 390-PIXEL RECOVERY JOURNEY PASS / DISTINCT EXACT-HEAD QA REQUIRED / NON-PRODUCTION**.

- **Role and received handoff:** bounded Development Engineer `/root/eng_public_demo_8ff_return` received the fresh QA rejection of exact Bot-authored head `8ff74afceb4847a5cb1070d7ec7100008c76b240` on branch `feature/public-demo-launch`, worktree `.release-train-clean/.public-demo-build`. QA proved that the real `/start` to `/start/situation` to `/start/people` journey reached an unavailable `/start/next` state at 390 pixels with no recovery control. QA also found em dash characters in five reachable urgent sources. The prior Source QA verdict for `8ff74af...` is rejected. No hosted claim or owner gate exists.
- **Bounded correction:** the unavailable `/start/next` state now states that the save and callback step cannot open, that the browser-held answers remain available, and that nothing was sent or saved. A native `Review your details` link returns to `/start/people`. Its exact rendered size at 390 pixels is 358 by 48 CSS pixels. The recovery preserves the entered coordinator name and phone and leaves zero horizontal overflow.
- **Language correction:** em dash characters were replaced with direct sentences in `app/start/next/UrgentNextClient.tsx`, `app/start/actions.ts`, `lib/urgent/hosted.ts`, and `lib/urgent/situations.ts`. The unavailable server component no longer renders an internal runtime-configuration reason. `scripts/test-public-conversion.js` now requires the `/start/people` recovery destination, its literal label, its 48-pixel target floor, and absence of U+2013 and U+2014 from every reachable `/start` source named by the guard.
- **Files changed:** `app/start/next/page.tsx`, `app/start/Start.module.css`, `app/start/next/UrgentNextClient.tsx`, `app/start/actions.ts`, `lib/urgent/hosted.ts`, `lib/urgent/situations.ts`, `scripts/test-public-conversion.js`, and this living context. The unrelated untracked zero-byte file `({tag` was preserved and excluded. No migration, database, Auth, Vercel, environment, Production, pricing, governance, or roadmap file changed.
- **Source verification:** public conversion PASS; participant invitation P1/P2 `37/37` PASS; workflow messaging `23/23` PASS; parity fixture/integration `19/19` PASS; Server Action export guard PASS; persona-language PASS; release-governance PASS; operational-route PASS; runtime-isolation PASS; deploy-gate PASS; TypeScript PASS; optimized Next.js 16.1.6 build PASS with all public, demo, and urgent routes compiled; and the known multi-lockfile root warning only.
- **Local browser verification:** a fresh built-server session at 390 by 844 completed `/start`, `/start/situation`, `/start/people`, and `Continue` to `/start/next`. The unavailable result rendered one H1, the enabled `Review your details` link, no framework overlay, no browser errors, no console output, and zero overflow. Activating the link returned to `/start/people` with `Jordan Morgan` and `555-010-1111` preserved. The link measured 358 by 48 CSS pixels. Browser and server were closed after the check.
- **React and Next.js review:** the recovery remains a Server Component link and adds no client state, effect, hydration boundary, request, or bundle dependency. The changed client control remains a native form button. Existing server-side authentication and urgent RPC authority are unchanged.
- **Roadmap classification:** **NO**. This correction restores an already-required recovery path and copy gate. It changes no direction, milestone order, persona scope, architecture, readiness doctrine, or score. The canonical roadmap does not need a new entry.
- **Source QA:** ENGINEERING GATES PASS / DISTINCT EXACT-HEAD QA NOT RUN.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / LOCAL ONLY / NON-PRODUCTION / NO READINESS CREDIT.
- **Atomic handoff:** freeze the Bot-authored `[skip deploy]` head containing this entry and hand it immediately to a fresh distinct QA role. QA must rerun source and build gates plus the real 390-pixel unavailable and recovery journey before any non-production Preview is authorized. No owner prompt is required.

## Product Lane A - Public conversion and Steve demo - Engineering implementation handoff - 2026-08-10 15:31 -07:00

Status: **ENGINEERING COMPLETE / SOURCE AND LOCAL BROWSER GATES PASS / DISTINCT EXACT-HEAD QA REQUIRED / NON-PRODUCTION**.

- **Role and handoff:** Development Engineer `/root/pm_public_demo_build_r2/eng_public_demo_launch` received the completed PM brief at `ddc3fe341609cf01bb2a0144139950af64ca6ecd` on isolated worktree `.release-train-clean/.public-demo-build`, branch `feature/public-demo-launch`. The implementation base was current product head `02a743e3adfa4c7bfaf8db14750dab9be15d6496`. Prior six-item UX FAIL was binding. UX planning was not repeated.
- **Bounded restoration:** Engineering restored only the PM allowlisted deleted public files from historical reference `9a95d825dec5c21df2127a10e0f94d647179b828`, then adapted them. No historical release, migration, governance file, participant file, messaging file, urgent file, vendor file, director file, staff file, database state, Auth state, Vercel state, or Production state was restored or changed.
- **Implemented result:** `/`, `/funeral-home`, `/pricing`, `/guides`, the first guide, `/story`, `/trust`, `/care-providers`, and `/demo` are present. `/blog` and `/resources` redirect to `/guides`; `/our-story` and `/mission` redirect to `/story`. Every canonical public page has one H1 and a page-specific available action. Five unavailable guide cards render noninteractive `Coming soon` labels.
- **Family and real-help boundary:** the Family demo card opens `/demo/family` with `Try the family demo`; a separate `Get help now` link opens `/start`. The family path remains browser-only and says it creates no real record, contact, message, purchase, or payment. Director, staff, and vendor remain Preview-only Server Action forms.
- **Visible reset and failure truth:** `DemoReset` restores the canonical family example, clears family intent and handoff session state, focuses its announced result, and states that shared director, staff, and vendor activity was not reset. Sandbox read, cleanup, write, and reset return typed persistence results and preserve a usable in-memory example. Family intent read/write, handoff session save, activation, clipboard copy, close, and cleanup each report the exact failed effect and safe recovery. Copy success appears only after Clipboard success; rejection selects the visible code for the device Copy command.
- **Focus and literal copy:** close confirmation focuses its heading. Escape and `Keep open` return focus to `Close this handoff`. Completed close focuses the closed H1. All related controls retain the 48 CSS pixel floor. Family timing now asks `How long should they have access?`; review says `Review who can open what.` No em dash or en dash renders in the restored public/demo packet.
- **Source-proven additional dependency:** `components/core/TopShell.tsx` was outside the initial allowlist but is the sole shell imported by `/demo`. Local browser inspection proved its old global `CHANGES STAY ON THIS DEVICE` label falsely described the hosted team forms. The one-line replacement now says the family example stays in this browser while team example activity is shared. No structural shell behavior changed.
- **Local fonts:** `@fontsource/cormorant-garamond` and `@fontsource/montserrat` 5.3.0 replace `next/font/google`. The clean optimized Next.js 16.1.6 build compiled every required public/demo route without a Google font request. The only build warning was the known multiple-lockfile workspace-root warning.
- **Focused and regression results:** public conversion and adversarial source guard PASS; participant invitation P1/P2 `37/37` PASS; workflow messaging `23/23` PASS; parity fixture/integration `19/19` PASS; Server Action export guard PASS; persona-language PASS; agent-context PASS; release-governance PASS; operational-route PASS; runtime-isolation PASS; deploy-gate PASS; direct TypeScript PASS; optimized build PASS; and `git diff --check` PASS.
- **Local browser results:** fresh built-server direct navigation at 1440 by 900, 390 by 844, and 360 by 800 covered every required public/demo/start route and all four redirects. Every cell rendered one H1, meaningful content, local Montserrat, the correct final URL, and zero horizontal overflow. A deterministic 200 percent text run first found 129 pixels of public footer overflow; Engineering changed the footer to one column below 1040 pixels, rebuilt, and the complete primary route rerun returned zero overflow. Family and real-help links reached their separate destinations. Reset focus and result passed. The full family choose, review, activate, copy, confirm, Escape, and close story passed. Completed close focused the closed H1. The local shared-team configuration failure returned `/demo?demo=configuration` and said no team session opened and no record changed. Browser page errors and console output were empty after the interaction story.
- **Diff isolation:** intended product changes are limited to the restored public route packet, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, the named family components, `lib/demo.ts`, sandbox persistence result handling, local font dependencies and lockfile, focused public test, canonical roadmap, living context, and the source-proven one-line TopShell boundary correction. `supabase/migrations/` is untouched.
- **Roadmap classification:** **YES, planned persona coverage restoration**. The canonical roadmap and living context are updated together. Product direction, pricing, architecture, milestone order, and readiness doctrine are unchanged.
- **Source QA:** ENGINEERING GATES PASS / DISTINCT EXACT-HEAD QA NOT RUN.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / LOCAL ONLY / NON-PRODUCTION / NO READINESS CREDIT.
- **Next role:** distinct Source and accessibility QA verifies the frozen Bot-authored head, followed by distinct Independent Agent Review and Development Head. If they pass, Deploy publishes one branch-only non-production Preview and distinct hosted QA runs the complete matrix. No owner prompt is required.

## Product Lane A - Public conversion and Steve demo launch integration - PM Sprint Brief - 2026-08-10

Status: **PM COMPLETE / PRIOR UX FAIL RECEIVED AS BINDING FIX LIST / ENGINEERING AUTHORIZED / SOURCE ONLY / NON-PRODUCTION**.

### Role, handoff, and exact integration boundary

- Product Manager: `/root/pm_public_demo_build_r2`, distinct from the prior public implementer, prior UX reviewer, new Engineering, QA, Independent Agent Reviewer, Development Head, Deploy, hosted QA, and Production roles.
- Prior handoff received: the read-only Product Lane A audit from `/root/product_lane_public_demo` and the exact six-item UX FAIL from `/root/product_lane_public_demo/ux_public_demo_launch` against older public candidate `9a95d825dec5c21df2127a10e0f94d647179b828`.
- Current hosted truth received: Preview head `d80c9f7` has no usable public/conversion package; `/pricing` and `/demo` return 404. The older public candidate passed its source/build/parity and local three-width browser checks, but it is not launch ready because the six UX blockers below remain.
- Exact clean implementation base: `02a743e3adfa4c7bfaf8db14750dab9be15d6496`, the Bot-authored participant P2 source candidate, on isolated worktree `.release-train-clean/.public-demo-build`, branch `feature/public-demo-launch`.
- Historical reference only: `9a95d825dec5c21df2127a10e0f94d647179b828`. It is an ancestor of the current combined candidate, but later integration deleted its public routes. Engineering may inspect or restore only the exact deleted public files named below. It must not cherry-pick the historical 81-file combined release, restore the full tree, revert current participant/messaging/urgent/vendor work, or copy historical governance and migration changes.
- Material Product Direction or Scope Change: **YES, planned persona coverage restoration**. This packet does not change Passage strategy, pricing doctrine, architecture, or milestone order, but it materially restores public/conversion and demo coverage to the current candidate. Engineering must update the canonical roadmap and this living context in the same packet. No readiness score may move from source work.
- UX Review: prior exact six-item FAIL is accepted as the complete binding UX translation. A second UX planning loop is not required before Engineering because the fixes, copy, focus behavior, failure states, route destinations, and responsive matrix are already explicit. Fresh distinct UX or accessibility review remains part of exact-head QA.
- Owner gate: **NONE**. This is ordinary product, source, test, non-production Preview, and hosted QA work. It changes no Production project, Production alias, destructive data, pricing, spend, or material legal/privacy/security judgment.
- Governance scope: **NONE**. Do not modify trusted-review scripts, repository protection, merge identity, release attestation, Production gates, or R25/R26 work in this lane.
- Certified whole-platform checkpoint: **0**. This packet earns no operational credit until its exact hosted artifact and the complete cross-domain checkpoint matrix pass.

### Sprint goal

Ship one coherent, pitch-usable public website and truthful demo entry on top of the current product candidate. A family, funeral-home buyer, care provider, or Steve must be able to understand Passage, choose the correct next step, enter the private family example or a hosted team example, reset the local example, recover from blocked browser capabilities, and leave every page without guessing. The packet must preserve the current participant P2, urgent, messaging, director, staff, and vendor contracts.

### Fix-now requirements from the completed audit and UX FAIL

1. **Restore the public route set without the historical combined release.** The current candidate must serve `/`, `/funeral-home`, `/pricing`, `/guides`, `/guides/first-funeral-home-conversation`, `/story`, `/trust`, `/care-providers`, and `/demo`. `/blog` and `/resources` permanently redirect to `/guides`; `/our-story` and `/mission` permanently redirect to `/story`. Every destination must have truthful metadata, one H1, a clear next action, and no public path may expose a protected persona route without its existing authorization boundary.
2. **Separate family demo from real help.** The Family card on `/demo` opens `/demo/family` with a literal label such as `Try the family demo`. A separate `Get help now` action opens `/start`. No label may say `Start without signing in` and then enter the real urgent flow. The family demo must continue to say that it uses example information in this browser and does not contact anyone, create a real record, send a message, make a purchase, or process a payment.
3. **Add one visible deterministic local reset.** `/demo` must include `Reset the family demo`. It restores the canonical browser sandbox, clears the family intent and handoff session state, reports what was reset, moves focus to the result, and leaves a usable in-memory canonical example if storage is blocked. It must also say plainly that this reset affects the family example in this browser only. Hosted director, staff, and vendor examples use shared saved example activity and are not reset by this control. Do not claim a complete hosted seed/reset mechanism that does not exist.
4. **Make every browser failure truthful.** Family intent restore/save, sandbox read/cleanup/write/reset, handoff activation, copy, and close must catch blocked or failed browser storage and clipboard operations. Each error names what did not happen, what remained unchanged, and the next safe action. No control may remain stuck in a pending label. Copy success appears only after `clipboard.writeText` succeeds. Copy failure selects the visible read-only code and tells the user to use the device Copy command. A failed close must not claim access closed. A failed persistent save may continue as an explicitly in-memory example without claiming it will survive reload.
5. **Complete close-confirm focus.** When `Close this handoff` reveals confirmation, focus moves to the confirmation heading or the first safe action, the new state is announced once, Escape or `Keep open` closes it, and focus returns to the trigger. After verified close, focus moves to the closed-state heading. All controls remain at least 48 by 48 CSS pixels.
6. **Give every public page a specific next step.** `/story`, `/trust`, and `/care-providers` end with a visible action that names its destination and expected result. `/guides` links the available first guide and labels every unavailable card `Coming soon`; unavailable cards are not links or buttons. Guides ends with an available next step. Global header navigation does not substitute for these page-specific actions.
7. **Use literal family instructions.** Replace `How long should the bridge stay open?` with `How long should they have access?`. Replace `One receiver. A clear boundary.` with `Review who can open what.` Continue removing abstract marketing phrasing where a direct sentence can explain the action. No em dash, en dash, mojibake, raw identifier, internal release language, or generated-sounding filler may render.
8. **Keep hosted team entry honest.** Director, staff, and vendor forms remain Preview-only and use the existing branch-scoped demo credentials through `startPreviewDemo`. Sign-out, credential, configuration, and sign-in failures return to `/demo` with a specific human recovery state. The page says no team session opened and no record changed when that is what is known. It never claims that opening a shared example reset its durable state. Family remains browser-local and never invokes hosted credential login.
9. **Remove the external font build dependency.** Adapt the reviewed local `@fontsource/cormorant-garamond` and `@fontsource/montserrat` package pattern from the historical candidate so optimized builds do not depend on a Google font request. Preserve Passage Zero typography and verify computed family at all widths. This closes the exact combined-head font-fetch infrastructure cell only if a fresh optimized build passes on the new exact head.

### Exact implementation file packet

Engineering may restore these deleted files from the historical reference and must then adapt them to the current head:

- `app/blog/page.tsx`
- `app/care-providers/page.tsx`
- `app/demo/actions.ts`
- `app/demo/family/page.tsx`
- `app/demo/family/pass/page.tsx`
- `app/demo/page.tsx`
- `app/favicon.ico`
- `app/funeral-home/page.tsx`
- `app/guides/first-funeral-home-conversation/page.tsx`
- `app/guides/page.tsx`
- `app/icon.svg`
- `app/mission/page.tsx`
- `app/our-story/page.tsx`
- `app/pricing/page.tsx`
- `app/resources/page.tsx`
- `app/story/page.tsx`
- `app/trust/page.tsx`
- `components/public/PublicPage.module.css`
- `components/public/PublicPage.tsx`
- `components/public/PublicShell.module.css`
- `components/public/PublicShell.tsx`
- `lib/presentation/demo-expiry.d.ts`
- `lib/presentation/demo-expiry.js`
- `scripts/test-public-conversion.js`

Engineering may change these current files only for the named integration need:

- `app/page.tsx`: replace the internal sample gateway with the public home.
- `app/layout.tsx`, `package.json`, and `pnpm-lock.yaml`: local font packages and metadata only.
- `app/globals.css`: public/demo comprehension, focus, target, and responsive support only; do not restyle operational personas.
- `lib/demo.ts`: family route/copy and team demo labels only.
- `app/demo/DemoReset.tsx` and a focused colocated CSS module if needed: new visible local reset and result/focus handling.
- `components/family/FamilyIntentJourney.tsx`, `TransferComposer.tsx`, `ActivePass.tsx`, `FamilyJourney.module.css`, and `types.ts`: only the six UX fixes, literal copy, storage/clipboard truth, focus, and responsive recovery.
- `lib/sandbox/provider.tsx` and `lib/sandbox/repository.ts`: safe read, cleanup, write, reset, in-memory fallback, and typed result only. Do not change authority logic or canonical example facts.
- `scripts/check-persona-language.js`, `scripts/test-operational-route-gate.js`, `scripts/test-use-server-exports.js`, and `scripts/test-frontend-backend-parity.js`: only if required to classify and test the restored reachable files. No broad exclusion or weakening is permitted.
- `docs/product/frontend-backend-contracts.json`, `docs/product/operational-readiness-roadmap.md`, and `docs/agent-operating-context.md`: parity, roadmap status, and exact Engineering handoff only.

Any additional file requires a source-proven dependency recorded in the Engineering handoff before it is changed. `supabase/migrations/`, Production configuration, current participant P2 files, messaging schema, urgent schema, vendor schema, and trusted governance files are outside this packet.

### Frontend and backend contract matrix

| Surface and action | Reachable UI | Command or query | State and authority | Proof, replay, and recovery |
| --- | --- | --- | --- | --- |
| Public learning and conversion | `/`, `/funeral-home`, `/pricing`, `/guides`, `/story`, `/trust`, `/care-providers` through `PublicShell` and `PublicPage` | Server-rendered public route navigation only | No Auth, database row, RLS predicate, message, purchase, or lead write | Browser history and final destination are the only result. Broken destination or misleading label is FAIL. |
| Canonical redirects | `/blog`, `/resources`, `/our-story`, `/mission` | Next.js `permanentRedirect` to canonical public route | No durable product state | Final URL and page-specific action must be correct on direct load and client navigation. |
| Family demo entry | Family card on `/demo` to `/demo/family`; separate real-help link to `/start` | Public navigation only | Family example is browser-local; real urgent help retains its current signed-in server contract | Wrong route mixing is FAIL. Back, reload, missing state, and reset remain usable and truthful. |
| Family example choices and activation | `FamilyIntentJourney` and `TransferComposer` | Browser-local sandbox command plus local/session storage attempt | No Supabase command, RLS grant, outbound effect, family record, or durable server proof | Success must distinguish saved in this browser from in-memory only. Storage failure keeps a usable example or explicit retry and never strands pending state. |
| Copy example handoff code | `ActivePass` | Clipboard API only | No message, server request, token grant, or navigation | Copied appears only after success. Failure selects the visible value and gives manual Copy recovery. |
| Close example handoff | `ActivePass` confirmation | Browser-local `revoke_transfer_pass` sandbox command and session cleanup | Local example only; no real access or server record changes | Close state appears only after in-memory command completion. Cleanup failure is reported separately and recovery remains available. |
| Reset family demo | `DemoReset` on `/demo` | Browser-local `reset_sandbox` plus bounded local/session cleanup | Restores canonical local example. It does not reset hosted director, staff, vendor, isolated database, Auth users, or Production | Result names exactly what reset. Blocked persistence uses honest in-memory state. Repeat reset is stable. Focus moves to result. |
| Open hosted director, staff, or vendor example | `/demo` persona form to `startPreviewDemo` | Preview-only Supabase Auth sign-out/sign-in using existing branch-scoped credentials | Downstream page authority remains the existing authenticated membership and RLS contract in isolated project `uyacxqtsiwlvtmhxvoxr` | Successful Auth redirects to the role route. Failure opens no claimed session, changes no claimed record, returns a specific recovery state, and offers retry or family demo. No hosted data reset is claimed. |

No new database command, table, RLS policy, event, migration, invitation, message, purchase, lead, or outbound delivery belongs in this packet. Existing role routes must retain their current authority and denial behavior. Public/browser-only rows may be classified truthfully in the parity ledger but may not be called `implemented` as durable operations.

### Source and build acceptance

- `scripts/test-public-conversion.js` is rewritten as a focused current-head contract, not copied as a false-green historical suite. It asserts every canonical route and redirect, family `/demo/family` routing, separate `/start` help, reset boundary and result, page-specific closing actions, Guides availability labels, literal family copy, truthful failure states, local fonts, one H1 per page, target-size/focus styles, and prohibited-copy exclusions.
- Add focused adversarial tests for blocked localStorage/sessionStorage read, write, remove, and reset; clipboard rejection; activation failure; close cleanup failure; malformed stored demo state; repeated reset; direct `/demo/family/pass` with no saved handoff; and hosted Auth/configuration/sign-out/sign-in failure mapping.
- Run `pnpm test:public-conversion`, `pnpm test:participant-invitation`, `pnpm test:messaging-security`, `pnpm test:parity`, `pnpm test:server-actions`, `pnpm test:persona-language`, `pnpm test:agent-context`, `pnpm test:release-governance`, `pnpm test:operational-route-gate`, `pnpm test:runtime-config`, `pnpm test:deploy-gate`, `pnpm typecheck`, a clean `pnpm build`, and `git diff --check` on one exact head.
- Inspect every restored diff against `02a743e`. The final file list must show a bounded public/demo package, not the historical 81-file release. Current participant, urgent, messaging, vendor, director, and staff behavior must retain their focused source tests.
- Optimized build must complete without a network request for Google Fonts. Compiled route inventory must contain all canonical public/demo routes and redirects.

### Local and hosted browser acceptance

Fresh browser QA must run direct navigation and applicable client navigation at `1440 x 900`, `390 x 844`, and `360 x 800`, then deterministic 200 percent text zoom for every restored public/demo route. At minimum, cover `/`, `/funeral-home`, `/pricing`, `/guides`, `/guides/first-funeral-home-conversation`, `/story`, `/trust`, `/care-providers`, `/demo`, `/demo/family`, `/demo/family/pass`, `/start`, and all four redirects.

For each applicable cell record final URL, rendered purpose, unique H1, primary/page-specific action and destination, header and mobile-menu behavior, `document.scrollWidth` versus `document.clientWidth`, focus order, visible focus, skip-link transfer, 48 by 48 enabled targets, text wrapping, computed fonts, console warnings/errors, hydration errors, page errors, unhandled rejections, failed requests, and runtime logs. There must be no horizontal overflow, clipped confirmation, inaccessible action, focus loss, stale success, raw identifier, mojibake, em dash, en dash, or internal QA/deploy wording.

Required interaction stories:

1. From `/demo`, Family opens `/demo/family`; `Get help now` separately opens `/start`.
2. Family chooses a path, recipient, categories, and access duration; activation works with storage and falls back honestly when storage is blocked.
3. Clipboard success and rejection produce different truthful states. Rejection selects the visible code.
4. Close confirmation receives focus, safe exit restores trigger focus, Escape restores trigger focus, verified close moves focus to the closed heading, and a cleanup failure never claims closure.
5. Reset restores the family example on first use and replay, announces the result once, and states that shared hosted team activity was not reset.
6. Director, staff, and vendor demo entry succeeds only under the exact approved Preview configuration. Misconfiguration and Auth failure return to human recovery without a false session or reset claim.
7. Story, Trust, Care Providers, and Guides each end with one working page-specific next step. Unavailable guide cards say `Coming soon` and are not interactive.

### Hosted plan and evidence truth

- Engineering freezes one Bot-authored `[skip deploy]` source head. Distinct Source QA and Independent Agent Review verify that exact head before Development Head review.
- After exact-head source and build PASS plus Development Head approval, Deploy publishes one branch-only non-production Preview using the canonical Vercel project and existing isolated project `uyacxqtsiwlvtmhxvoxr`. Preserve the owner's signed-in Vercel and Supabase tabs and all branch-only Preview configuration.
- Distinct hosted QA repeats the full route, interaction, 1440/390/360, 200 percent text, console, hydration, runtime, focus, overflow, reset/replay, blocked storage, blocked clipboard, and Auth failure matrix against the exact deployment. Commit only timestamped screenshots and redacted evidence. Do not capture credentials, raw tokens, cookies, request headers, emails beyond synthetic labels, UUIDs, or secrets.
- `[qa-approved]` remains prohibited before exact hosted PASS. Vercel `READY`, HTTP 200, source tests, local screenshots, or empty logs do not substitute for hosted browser proof.
- Production project `qsveqfchwylsbncsfgxe`, Production configuration, Production alias, Production data, and external communications remain untouched.

### Risks and recovery

- Restoring historical public files can silently overwrite newer product and security work. Recovery: restore only the deleted allowlist, inspect every diff against `02a743e`, and rerun all participant, messaging, urgent, vendor, route, and parity gates.
- A local reset can be mistaken for a hosted data reset. Recovery: label it `Reset the family demo`, state its browser-only boundary before and after action, and never describe shared team state as canonical after reset.
- Storage APIs can fail independently. Recovery: treat read, write, remove, and clipboard as separate fallible operations, preserve usable in-memory state, and report exactly which result persisted.
- Server redirects can collapse distinct hosted Auth failures into vague copy. Recovery: map only safe public failure codes to specific human states and keep credentials and provider diagnostics server-only.
- Restoring local fonts can alter layout. Recovery: verify computed fonts, CLS, wrapping, target sizes, and overflow at all widths and zoom before hosted approval.
- Public pages can look complete while pointing to missing or protected destinations. Recovery: crawl every enabled link and assert final route, status, heading, and expected boundary.

### Non-goals

- No wholesale cherry-pick of `9a95d825`, `e1996f5`, or any historical combined release.
- No new Supabase project, demo environment, schema, migration, seed RPC, admin reset endpoint, credential rotation, Production setting, or external communication.
- No numeric pricing, checkout, payment, lead-capture form, CRM integration, care-provider account, new guide inventory, SEO campaign, or legal/privacy claim expansion.
- No redesign of current director, staff, vendor, urgent, messaging, participant P2, or invitation flows.
- No claim that the shared hosted team examples are deterministically reset by the browser control.
- No readiness increase, Production launch, merge, or deploy authorization from this PM brief.

### Exit criteria and next roles

- Every required public/demo route exists on the exact current product head and every enabled action reaches the named result.
- All six UX blockers are closed in source and proven in the complete local browser matrix.
- Public, family demo, and hosted team boundaries are literal and cannot be confused with real help, Production, or a durable hosted reset.
- All source, security, parity, TypeScript, local-font optimized build, route, language, and diff gates pass on one clean exact head.
- Distinct Source QA, accessibility/UX QA, Independent Agent Review, and Development Head approval follow Engineering. Deploy and distinct hosted QA then own the single non-production Preview.
- Source QA: NOT RUN on this new packet.
- Hosted Preview QA: NOT RUN.
- Production Deployment: NOT DEPLOYED.
- Production QA: NOT RUN.
- Overall release state: PM COMPLETE / ENGINEERING AUTHORIZED / SOURCE ONLY / NON-PRODUCTION / NO READINESS CREDIT.
- Auto-advance target: distinct Engineering receives this exact brief now and implements the bounded file packet on `.public-demo-build`. No owner prompt and no governance detour are permitted.

## Product Lane B - Participant invitation P2 reachable lifecycle controls - PM Sprint Brief - 2026-08-09

Status: **PM COMPLETE / UX REVIEW PASS WITH BINDING CONDITIONS / ENGINEERING AUTHORIZED / SOURCE ONLY / NON-PRODUCTION**.

### Role, input, and product decision

- Product Manager: `/root/pm_participant_p2_build`, distinct from the P1 implementer, future P2 UX, Engineering, QA, Independent Agent Reviewer, Development Head, Deploy, and Production roles.
- Prior handoff received: the owner-approved 2026-08-09 launch-delivery recovery controls and exact clean combined participant head `12939632aeaaebb00cc066d7468448321cae9c7c` on `integrate/participant-87c-combined`.
- Exact PM worktree: `.release-train-clean/.participant-p2-plan` on branch `plan/participant-p2-lifecycle`, created from that exact clean head. This worktree may change only the living context for the PM handoff.
- Material Product Direction or Scope Change: **NO**. This implements the already-queued P2 participant lifecycle in the canonical roadmap. No roadmap or readiness-score change is authorized.
- UX Review: **PASS WITH BINDING CONDITIONS** by distinct `/root/pm_participant_p2_build/ux_participant_p2` against exact PM head `55e76585e96ce48e7d8b5618925524e8bd7e0f15`. The reviewer changed no file, branch, database, or deployment.
- Owner gate: **NONE**. This uses existing isolated non-production authority, changes no pricing, spend, Production data, or material legal/privacy/security decision, and requires no routine founder review.
- Certified whole-platform checkpoint: **0**. This packet earns no credit until the applicable complete checkpoint matrix passes.

### Completed P1 findings that control P2

- P1 is incorporated in the exact base. Its secure raw-link exchange, server-held httpOnly invitation intent, exact-user acceptance, bounded multi-space participant projection, owner-only raw case authority, append-only invitation events, RLS denials, and corrected SQL artifacts must not regress.
- The combined P1 source gates passed except that the exact combined-head optimized build remained PARTIAL because the restricted runner could not fetch the configured Google fonts. Hosted Preview QA remains NOT RUN on this base. P2 cannot inherit or restate a hosted or build PASS from another head.
- The existing schema already provides all four required lifecycle commands: `public.rotate_participant_invitation_idempotent`, `public.decline_participant_invitation`, `public.revoke_participant_invitation`, and `public.revoke_continuity_participant_idempotent`.
- Those commands already bind the authenticated actor, coordinator or invited-email authority, row locks, terminal-state constraints, idempotency or stable replay behavior, and append-only `workflow_events` proof.
- The owner projection already distinguishes `available`, `accepted`, `declined`, `revoked`, and `expired`, and returns active and revoked participant history. The participant, bounded case-update, and message predicates already require an active participant row.
- PM decision: **no migration is justified for this packet**. Engineering must begin with the existing RPCs and must not modify `supabase/migrations/`. If an exact source or SQL test proves a missing server guarantee, Engineering stops, records the table/function change, frontend reason, skipped-change breakage, reversibility, grants, RLS impact, and isolated test plan before creating any migration.

### Sprint goal

Give the family coordinator and invited participant complete, plain-language control over an invitation after creation: replace a lost or expiring link, decline without joining, cancel a pending invitation, and end active participant access. Every action must show what changes, what does not change, what proof was saved, who can see the result, and how to recover. A committed access revocation must remove participant update and message authority on the next request without exposing or reconstructing the raw invitation bearer.

### Bounded requirements

1. A coordinator can replace an `available` or `expired` invitation from `/family/people`. The first successful rotation shows one new copyable link. The previous link becomes unusable immediately. A same-request replay returns the saved replacement without another raw token or duplicate rows/events.
2. The exact verified invited account can decline an `available` participant invitation from `/invite/continue`. Decline creates no `continuity_participants` grant. The UI replaces both Accept and Decline controls with a verified saved receipt for the current interaction.
3. A coordinator can cancel an `available` invitation from `/family/people`. Cancellation grants no access, moves the invitation into history, removes all waiting controls, and makes the old link disclose no protected invitation detail.
4. A coordinator can end an active participant's access from `/family/people`. The participant row becomes revoked, earlier invitation and activity history remain append-only, and the next participant request loses bounded family updates and message list/post authority.
5. Every mutation rechecks the signed-in user and server authority inside the RPC. Client state, hidden identifiers, displayed lifecycle text, and browser history are never authorization.
6. The raw invitation token may exist only in the existing server-held intent and the one-time successful create or rotation receipt. It must never be bound into a Server Action argument, form field, query string, login return, OAuth redirect, OTP redirect, rendered anchor, log, analytics event, error, history row, or replay receipt. The one-time client receipt may construct a non-navigation copy value exactly as P1 does.
7. Coordinator controls render only for their valid lifecycle states. Accepted invitations cannot rotate or cancel. Revoked or declined invitations cannot rotate. Revoked participants cannot be restored in this packet.
8. User-facing copy contains no raw enum, UUID, token hint, event key, infrastructure narration, readiness language, em dash, en dash, or vague generated prose. Buttons name the action and consequence.

### Components and Server Actions

Engineering may change only the following product surface unless a source-proven dependency is recorded first:

- `app/family/people/page.tsx`: render lifecycle-appropriate controls in Waiting, Invitation history, and People with access. Keep raw identifiers out of visible copy.
- `app/family/people/ParticipantLifecycleControls.tsx` as a new client component: own rotation, cancellation, and access-ending pending, success, conflict, and recovery states; show one-time copy fallback without a navigation link; suppress stale controls after success.
- `app/family/people/actions.ts`: add `rotateParticipantInvitation`, `cancelParticipantInvitation`, and `endParticipantAccess`. Validate UUIDs, request IDs, expiry choice, and fixed bounded action reasons; verify the current user; call only the existing public RPCs; inspect exact receipts; revalidate `/family/people` and affected dynamic persona paths; never accept or return a bearer except the first rotation receipt returned by the RPC.
- `app/family/people/People.module.css`: accessible responsive action groups, confirmations, receipts, error focus, and at least 48 by 48 CSS-pixel enabled targets.
- `app/invite/continue/ParticipantInvitationDecision.tsx` as a new client component: own Accept and Decline together so a successful decline removes every acceptance control immediately and presents the saved result.
- `app/invite/[token]/actions.ts`: add `declineParticipantInvitation` that reads the raw token only through `readInvitationIntent`, rechecks participant type and available state, uses the fixed private decline reason below, calls the existing decline RPC, verifies stable replay against the same receipt, and returns typed state without placing the token or reason in a URL.
- `app/invite/continue/page.tsx`: render the unified participant decision component only for an actionable participant invitation; retain minimum-safe terminal states and existing staff behavior.
- `lib/auth/invitations.ts` and `lib/continuity/participants.ts`: add only receipt/projection types needed by the controls. Do not widen participant data or return protected identifiers to visible copy.

Action contracts:

| User action | Server Action | Existing authoritative command | Exact durable result | Append-only proof |
| --- | --- | --- | --- | --- |
| Replace secure link | `rotateParticipantInvitation` | `public.rotate_participant_invitation_idempotent(p_invitation_id, p_expires_at, p_request_id)` | Old invitation revoked with reason `Replaced with a new secure link`; one new invitation linked by `rotates_invitation_id`; raw token returned once | One `participant_invitation.rotated` event for the old row and one `participant_invitation.created` event for the replacement |
| Decline invitation | `declineParticipantInvitation` | `public.decline_participant_invitation(p_raw_token, p_reason)` | Invitation revoked by the exact invited user; zero participant grant | One `participant_invitation.declined` event |
| Cancel pending invitation | `cancelParticipantInvitation` | `public.revoke_participant_invitation(p_invitation_id, p_reason)` | Pending invitation revoked by the coordinator; zero participant grant | One `participant_invitation.revoked` event |
| End active access | `endParticipantAccess` | `public.revoke_continuity_participant_idempotent(p_participant_id, p_reason, p_request_id)` | Active participant row changes to revoked with actor, time, and reason; invitation acceptance history remains | One `continuity_participant.revoked` event |

The reasons are fixed server-side product text and are never accepted from a visible or hidden form: decline uses `Invited person declined the invitation`; cancellation uses `Family coordinator canceled the invitation`; access ending uses `Family coordinator ended participant access`. Human history translates the outcome and never displays the stored reason text.

### Frontend and backend parity ledger

Engineering adds these contracts to `docs/product/frontend-backend-contracts.json` as `source_partial` only after the reachable UI and exact Server Action exist:

- `participant.coordinator.rotate_invitation`
- `participant.invited.decline_invitation`
- `participant.coordinator.cancel_invitation`
- `participant.coordinator.revoke_access`

Each row must name the route/component, action state, exact RPC signature, `participant_invitations`, `continuity_participants`, and `workflow_events` cardinality, actor predicate, event key, retry/conflict behavior, privacy projection, and evidence references. Engineering also updates `participant.invited.open_shared_updates` and `m3.shared.workflow_messages` to bind the committed-revocation denial evidence. No row becomes `implemented` from source existence alone.

P2 must preserve this deliberate P1 boundary:

- `/participant` is the participant's reachable bounded case-update surface through `public.list_participant_family_updates()`.
- `/case/[id]/today` remains an owner-authorized raw case projection and is not widened to participants merely to manufacture a positive revocation test.
- Message authority is separately provided by `passage_private.can_message_workflow`. The current `/case/[id]/messages` loader first performs a workflow SELECT through the owner-only predicate, so participant browser reachability is not proven by P1. P2 must not claim that route as a working participant feature. For this packet, QA proves message authority loss through the exact list/post RPCs using the isolated synthetic workflow and proves any stale direct browser request reveals no message. A later PM packet must resolve participant message discovery and a non-UUID route if that capability remains in the product contract.

### SQL lifecycle and cardinality evidence

Add one rollback-only, idempotent test at `supabase/tests/participant_invitation_lifecycle_p2.sql`. It must run only against isolated project `uyacxqtsiwlvtmhxvoxr`, reject Production ref `qsveqfchwylsbncsfgxe`, verify the exact prerequisite migration names and function catalog/ACL state, use reserved synthetic identities, and end in unconditional rollback.

Required per-scenario deltas:

- Rotation: one old invitation changes from available to revoked, one replacement invitation is added with `rotates_invitation_id = old.id`, and exactly two events are added, `participant_invitation.rotated` and replacement `participant_invitation.created`. Same request ID and same expiry adds zero rows/events and returns no token. Same request ID with changed expiry returns conflict and adds zero rows/events.
- Decline: the invitation becomes revoked by the exact invited user, exactly one `participant_invitation.declined` event is added, and participant-row delta remains zero. Same actor and reason replay adds zero rows/events. Wrong email, wrong user, expired, accepted, cancelled, and altered-reason replay all fail without a partial write.
- Pending cancellation: the invitation becomes revoked by the coordinator, exactly one `participant_invitation.revoked` event is added, and participant-row delta remains zero. Same reason replay adds zero rows/events. Unrelated owner, participant, vendor, staff, accepted invitation, and altered-reason replay fail without a partial write.
- Active-access revocation: exactly one existing participant row changes from active to revoked and exactly one `continuity_participant.revoked` event is added. Same request ID and reason adds zero rows/events. Changed reason conflicts. Unrelated coordinator, participant self-revocation, staff, and vendor fail without a partial write.
- After committed revocation, the revoked account receives zero rows from `list_participant_continuity_spaces`, `list_continuity_participant_projection`, and `list_participant_family_updates`; receives `42501` or the exact documented denial from both message list and post RPCs; and cannot read the five raw workflow/task/event/proof/review relations. The coordinator still sees the revoked participant and terminal invitation history.
- Old-link denial after rotation, decline, or cancellation must return the correct terminal state from the bounded inspection command, reject acceptance and decline mutations as applicable, and suppress inviter, family, relationship, purpose, scope, email, token metadata, case, and message detail from the terminal persona response.

SQL QA must also run the retained P1 invitation, advisor-hardening, participant-update, messaging, RLS, race, reversibility, ACL, and Supabase advisor checks. Do not edit a historical migration to make the test pass. Current Supabase breaking-change review on 2026-08-09 found no change to these existing RPC signatures. The Data API default now requires explicit grants in applicable projects, so the test must continue to assert exact authenticated execute grants and denied direct table access rather than relying on platform defaults.

### Source, concurrency, and regression tests

- Extend `scripts/test-participant-invitation-security.js` for all four UI/action/RPC bindings, lifecycle-state control suppression, one-time token containment, fixed reason bounds, old-link denial copy, protected terminal-field exclusion, and no raw token in form/action/auth/navigation paths.
- Extend `scripts/test-use-server-exports.js` so all four new Server Actions are exported, server-only, and reachable from the intended components.
- Extend parity fixtures and `scripts/test-frontend-backend-parity.js` for the four new ledger rows plus revocation denial updates.
- Add focused race coverage for rotate versus accept, rotate versus cancel, decline versus accept, cancel versus accept, and participant message post begun after committed revocation. Each race must prove one valid terminal result, exact event counts, no duplicate participant, and no orphan replacement.
- Run `pnpm test:participant-invitation`, `pnpm test:parity`, `pnpm test:server-actions`, `pnpm test:messaging-security`, `pnpm test:persona-language`, `pnpm test:agent-context`, `pnpm test:release-governance`, `pnpm test:operational-route-gate`, `pnpm test:runtime-config`, `pnpm test:deploy-gate`, `pnpm typecheck`, `pnpm build`, and `git diff --check` on the exact candidate.
- The exact combined-head font/build failure remains a named QA-infrastructure cell. A clean authorized Preview builder must produce a fresh optimized build PASS for the P2 exact head. Prior-head build evidence cannot close it.

### Hosted multi-session plan at 1440, 390, and 360

Deploy may publish only a reviewed non-production Preview bound to isolated project `uyacxqtsiwlvtmhxvoxr` with branch-only Preview configuration. Preserve existing signed-in owner Vercel and Supabase tabs. Do not touch Production project `qsveqfchwylsbncsfgxe`, Production configuration, or Production aliases.

Use at least four clean storage contexts at every viewport: family coordinator, exact invited participant, wrong invited account, and unrelated coordinator. Use a deterministic reset between viewport matrices and retain redacted row/event cardinality.

For each of 1440, 390, and 360:

1. Create an available invitation, open the old link in the participant context, rotate it in the coordinator context, and prove the coordinator receives one new copyable link. Reload and POST against the old link to prove generic denial with no Accept or Decline control. Open the replacement link and prove the exact invited account can inspect it. Deny clipboard permission once and prove manual copy recovery without navigation.
2. Create a second invitation. Prove the wrong account cannot decline. Switch to the exact verified account without losing the server-held intent, decline, and prove a saved receipt, zero grant, coordinator history, terminal reload, stable replay, and no protected terminal details.
3. Create a third invitation, cancel it as coordinator, and prove it leaves Waiting, appears in history, creates no grant, and the old participant tab loses all actionable detail on its next request.
4. Accept a fourth invitation. Prove `/participant` reconstructs the bounded update from durable state in a second session. Establish the pre-revocation message RPC positive result against the isolated workflow, end access as coordinator, then on the participant's next request prove `/participant` is closed, the bounded case-update projection is empty, message list/post are denied, a stale direct message route shows no message body, and reload or reconnect restores no access.
5. At every state, record direct and applicable client navigation, final URL, heading and purpose, primary/destructive action, result, proof destination, visibility boundary, recovery instruction, keyboard order, focus after validation or success, 48-pixel targets, 200% zoom where applicable, scroll width versus client width, console warnings/errors, hydration/runtime errors, unhandled rejections, failed requests, and Vercel runtime logs.

Commit only timestamped replacement screenshots and redacted database/audit evidence. Raw tokens, emails beyond synthetic labels, UUIDs, cookies, request headers, and secrets must be removed from evidence.

### Acceptance criteria

- All four controls are reachable only in their valid state and complete through their existing authoritative RPC.
- Every success is verified from a durable receipt and append-only event before the UI claims completion.
- Rotation makes the old link unusable, never reconstructs a token, and reveals a new token only once.
- Decline creates no participant access. Cancellation creates no participant access. Revocation removes participant updates and message authority on the next request.
- Replay, conflict, wrong-user, wrong-owner, expired, accepted, cancelled, former-participant, staff, vendor, and unrelated-organization paths preserve exact cardinality and reveal no protected detail.
- Frontend/backend parity rows, source gates, exact SQL lifecycle matrix, advisors, optimized build, and the complete three-viewport multi-session hosted matrix all pass on one exact head.
- Source QA, Hosted Preview QA, Production Deployment, Production QA, and Overall release state are reported separately. `[qa-approved]` remains prohibited until exact hosted PASS.

### Binding UI/UX Review handoff

The distinct UI/UX Review verdict is **PASS TO ENGINEERING WITH CONDITIONS**. These conditions are acceptance requirements, not optional polish:

- Use inline disclosures, not browser confirmation prompts or mobile modals. The trigger is a native button with `aria-expanded` and `aria-controls`. Only one confirmation is open at a time. Safe exit precedes the committing action in DOM and visual order. Escape closes the disclosure and returns focus to its trigger.
- Replacement uses low-saturation purple. Decline, cancellation, and access ending use muted red only for the final committing action. Accept remains primary; Decline appears below it as a lower-emphasis secondary action on every viewport.
- Pending disables the complete related action set. No row moves and no success appears before the durable receipt is verified.
- A first rotation receipt must live in a stable page-level client region outside the Waiting row so revalidation cannot unmount and destroy the only raw replacement link. The link appears in a read-only input, never an anchor. Clipboard failure focuses and selects the input for manual copying. Reload, back restoration, reconnect, or navigation removes the raw link.
- Add a `Past access` section using revoked rows already returned by `list_owned_continuity_participant_projection`. No new RPC or migration is required. It shows human name, relationship, access-began time, access-ended time, former category labels, and `Access ended`, with no restore control.
- Invitation history distinguishes `Invitation accepted`, `Invitation declined`, `Invitation canceled`, `Invitation expired`, and `Invitation replaced`. It never displays stored reason text or raw lifecycle enums.
- Minimum-safe terminal copy after rotation, decline, or cancellation is `This invitation is no longer available.` followed by `Ask the family coordinator if you still need access.` Expiry and access-ended states keep their separately named recovery. No terminal screen exposes inviter, family, relationship, purpose, scope, email, account identity, reason, case, message, or token metadata.
- Opening a confirmation keeps focus on the trigger, with the disclosure next in DOM order. Cancel returns focus to the trigger. Verified mutation moves focus to a stable receipt heading with `tabIndex={-1}`. Error moves focus to a persistent `role="alert"` summary. Use one concise polite live region for pending and success, never on the raw-link receipt itself.
- At 1440 by 900, keep one restrained content column and attach controls to the relevant record. At 390 by 844 and 360 by 800, use one column, stack fact labels over values, stack safe and committing actions full width, wrap all long values, contain the read-only link, and prohibit sticky actions or horizontal overflow. At 200 percent text zoom, all content and focus remain available by vertical scrolling and `document.scrollWidth` equals `document.clientWidth`.

Required action language:

| Control | Confirmation heading | Safe action | Commit action | Success heading |
| --- | --- | --- | --- | --- |
| Replace link | `Create a replacement link for {name}?` | `Keep current link` | `Create replacement link` | `Replacement link created.` |
| Decline | `Decline this invitation?` | `Go back` | `Decline invitation` | `Invitation declined.` |
| Cancel | `Cancel {name}'s invitation?` | `Keep invitation` | `Cancel invitation` | `Invitation canceled.` |
| End access | `End {name}'s access?` | `Keep access` | `End access` | `Access ended.` |

Error copy must distinguish three truths: known failure before mutation says nothing changed; stale race says the invitation changed in another session and requires reload; verification uncertainty says Passage could not confirm the saved result and must not claim nothing changed.

### Risks and mitigations

- Rotation can expose a second bearer. Mitigation: one-time action receipt only, no anchor/prefetch, no replay token, old digest terminal immediately, token-containment source guard, and redacted evidence.
- Destructive controls can be pressed accidentally. Mitigation: explicit consequence copy, secondary visual treatment, confirm step within the component, pending lock, verified receipt, and no optimistic removal.
- Open tabs can look stale after revocation. Mitigation: dynamic no-cache persona routes, server recheck on every command/query, revalidation after coordinator mutation, and next-request browser proof.
- Decline and accept can race. Mitigation: existing row lock and terminal constraints plus a committed race test with exact event/cardinality assertions.
- The current participant messaging contract overstates browser reachability. Mitigation: do not widen raw case RLS or claim participant message UI in P2; prove backend message revocation and create a later bounded reachability packet.
- Existing source contains mojibake in historical copy. P2 may correct touched user-facing strings but must not expand into a repository-wide copy rewrite.

### Non-goals and classification

- **Fix now:** four P2 lifecycle controls, their parity rows, exact SQL lifecycle/race evidence, three-viewport hosted proof, and any defect that lets a revoked identity retain participant update or message authority.
- **Follow-up product packet:** participant message discovery and a non-UUID, least-privilege route; participant self-leave; reinstatement; scope editing; real email/SMS delivery; delivery/open tracking; notifications; bulk access management; and general history export.
- **Non-goals:** new tables or RPCs without source proof, broad workflow RLS for participants, raw case-detail access, new category scopes, Production data/configuration, pricing, external communications, legal/privacy policy decisions, roadmap-score changes, public launch, or governance-validator work.

### Handoff and release truth

- Next role: a fresh Development Engineer creates `.release-train-clean/.participant-p2-build` on `feature/participant-p2-lifecycle` from this exact Bot-authored PM and UX context head, which descends directly from `12939632aeaaebb00cc066d7468448321cae9c7c`.
- Engineering must not edit the combined-candidate, root, P1 participant, R25 gateway, loop-recovery, or migration worktrees. It must inventory branch/head/status before editing and stop on overlap.
- Deploy plan: source integration uses `[skip deploy]`. After exact-head Source QA, Data QA, Independent Agent Review, and Development Head approval, one reviewed non-production Preview may be published for the hosted matrix. Production is not authorized.
- Customer-visible capability delta: none in this PM-only packet.
- Hosted output: `No hosted output`. This packet defines the product slice but changes no hosted artifact.
- Source QA: NOT RUN for future P2 implementation.
- Hosted Preview QA: NOT RUN.
- Production Deployment: NOT DEPLOYED.
- Production QA: NOT RUN.
- Overall release state: PM AND UX HANDOFF COMPLETE / ENGINEERING AUTHORIZED / SOURCE ONLY / NON-PRODUCTION / NO READINESS CREDIT.

### Development Engineer handoff - 2026-08-09 20:34 -07:00

- Role instance: distinct Development Engineer `/root/pm_participant_p2_build/eng_participant_p2`. Prior handoff received: the complete Product Lane B PM Sprint Brief and binding UX acceptance bar at exact Bot-authored head `f57cb7787c0f9c5cfcf01b46fa9e11ba8df385f9`, descended from clean combined participant head `12939632aeaaebb00cc066d7468448321cae9c7c`.
- Isolated implementation: `.release-train-clean/.participant-p2-build` on `feature/participant-p2-lifecycle`. The worktree was clean at the required head before implementation. No combined-candidate, root, P1, R25, governance, or existing migration worktree was edited.
- Material Product Direction or Scope Change: **NO**. This implements the canonical roadmap's already-scoped P2 participant lifecycle. The roadmap and whole-platform readiness score remain unchanged.
- Engineering decision: the existing four authoritative RPCs satisfy the frozen acceptance criteria, so no migration was created or modified. Source research used the current official Supabase RLS, database-function, and breaking-change guidance plus the current Next.js Server Action security model. It confirmed that every action must authenticate internally and that explicit function grants and row-level authority remain required; no current platform change alters the retained RPC signatures.
- Implemented reachable controls: `/family/people` now supports replacement-link rotation, pending invitation cancellation, active access ending, human invitation history, and `Past access`; `/invite/continue` now owns participant Accept and Decline in one action group. Rotation returns a raw bearer only in the first verified client receipt, never as an anchor or replay token, and clears it on reload, navigation, back restoration, or reconnect. Decline, cancel, and access-ending reasons are fixed only in Server Actions. The staff invitation branch and P1 server-held raw intent remain unchanged.
- UX acceptance implementation: confirmations are inline disclosures with one open state, safe action before commit, Escape and cancel focus recovery, complete pending lock, verified receipt focus, persistent alert focus, plain-language outcomes, 48-pixel responsive action targets, muted replacement and destructive treatments, and mobile one-column containment. The React best-practices review found no blocking issue: Server Actions re-authenticate, RLS/RPC authority stays server-side, client props are bounded, action pending state uses React action state, and the page-scoped global listeners have cleanup.
- Files changed: `app/family/people/actions.ts`, `app/family/people/page.tsx`, `app/family/people/ParticipantLifecycleControls.tsx`, `app/family/people/People.module.css`, `app/invite/[token]/actions.ts`, `app/invite/continue/page.tsx`, `app/invite/continue/ParticipantInvitationDecision.tsx`, `app/login/Auth.module.css`, `lib/auth/invitations.ts`, `lib/continuity/participants.ts`, `docs/product/frontend-backend-contracts.json`, `scripts/check-frontend-backend-parity.js`, `scripts/test-frontend-backend-parity.js`, `scripts/test-participant-invitation-security.js`, `scripts/test-use-server-exports.js`, `scripts/test-participant-invitation-lifecycle-races.mjs`, and `supabase/tests/participant_invitation_lifecycle_p2.sql`.
- Durable evidence added: four `source_partial` parity rows bind the reachable UI, Server Actions, exact RPCs, tables, actor predicates, append-only events, replay/conflict behavior, and privacy projections. The retained message and shared-update rows now bind committed-revocation denial. The rollback-only guarded P2 SQL source covers exact cardinality, replay, conflict, wrong-persona denial, old-link terminal behavior, zero-grant decline/cancel, owner history, and post-revocation update/message/raw-relation denial. A separate ordinary-JWT race harness covers rotate versus accept, rotate versus cancel, decline versus accept, cancel versus accept, and message post after committed revocation.
- Source QA executed on this Engineering worktree: `pnpm typecheck` PASS; `pnpm test:participant-invitation` PASS 37/37; `pnpm test:parity` PASS 19/19 with 9 participant Server Actions; `pnpm test:server-actions` PASS; `pnpm test:messaging-security` PASS 23/23; `pnpm test:persona-language` PASS; `pnpm test:agent-context` PASS before this context update; `pnpm test:release-governance` PASS; `pnpm test:operational-route-gate` PASS; `pnpm test:runtime-config` PASS; and `pnpm test:deploy-gate` PASS. Final context, diff, and targeted regression gates are rerun after this entry.
- Optimized build: **PARTIAL / ENVIRONMENT BLOCKED**. `pnpm build` reached Next.js optimized compilation and failed only because the restricted runner could not connect to Google Fonts for the existing `Cormorant Garamond` and `Montserrat` imports in `app/layout.tsx`. This exact head has no optimized build PASS. A clean authorized Preview builder remains the named recovery path.
- Data QA: **NOT RUN**. Neither the rollback-only P2 SQL file nor the ordinary-JWT race harness was executed against Supabase in this role. No database apply occurred. Independent Data QA must run them only against isolated project `uyacxqtsiwlvtmhxvoxr` with deterministic reset and retained cardinality/advisor evidence.
- Hosted output: `No hosted output`. Hosted Preview QA: **NOT RUN**. Production Deployment: **NOT DEPLOYED**. Production QA: **NOT RUN**. Overall release state: **ENGINEERING IMPLEMENTED / SOURCE QA PARTIAL / BUILD ENVIRONMENT BLOCKED / DATA QA NOT RUN / HOSTED PREVIEW QA NOT RUN / NON-PRODUCTION / NO READINESS CREDIT**.
- Failures and queued work: no product-source gate failed. The only executed failure is the restricted font-fetch build cell. Fresh QA must challenge the exact committed head, execute the rollback-only SQL and race harness in the isolated project, rerun all source gates on that head, and then hand off separately to Independent Agent Review, Development Head, and non-production Deploy for the 1440, 390, and 360 hosted matrix. `[qa-approved]` remains prohibited.
- External assistance: no Claude-in-Chrome or external agent assistance was used. The train auto-advances to fresh QA through the parent PM after the bounded `[skip deploy]` commit; no owner gate exists.

Last updated: 2026-08-09 (America/Los_Angeles)

This is the living handoff for the greenfield Passage rebuild. Read `AGENTS.md` first, then this file, then `docs/product/persona-action-architecture.md` before changing product code, data contracts, or deployment state.

## Fresh-chat kickoff

Paste this into a new Codex chat:

> Passage Release Train: start the loop. Continue Passage Zero on `greenfield/passage-zero`, draft PR #24, from the latest recorded head and dirty-state inventory. Read `AGENTS.md`, `docs/agent-operating-context.md`, `docs/release-train.md`, the canonical roadmap, persona architecture, and role briefs completely. Passage Zero is the sole feature lane; Threshold/main is reviewed P0/P1 maintenance only. Never push directly to `main`. Agents author only through the dedicated Passage GitHub App/Bot. A distinct Independent Agent Reviewer challenges the exact head; a separate Development Head / Release Authority approves or rejects it through `Passage Review Agent / merge-review`; reversible Production promotion separately requires exact-head authorization from the distinct Production Reviewer. There is no routine founder or human review gate. Ask the owner only for destructive Production data work, spending, or material legal/privacy/security judgment. Preserve the proven Cycle 7A/7B isolated authority/work evidence and unchanged legacy readiness scores, but do not award a whole-platform checkpoint until the complete six-domain matrix passes. Enforce the seven-question plain-language gate, truthful Demo versus Secure Preview labels, human event/status copy, and 1440/390/360 comprehension. Continue without asking Steve except for explicit `AGENTS.md` owner gates.

## Founder mandate

Build Passage as an enterprise-grade coordination operating system for the period before, during, and after a death. The product should combine Apple-like clarity and empathy with serious funeral-home operational depth.

This is a genuine greenfield rebuild. There are no customers and no meaningful migration risk in the current sandbox. Do not preserve old layouts, components, information architecture, terminology, or schema merely because they exist. Preserve only validated product truth and rebuild everything else around the target experience.

The product must be sellable to funeral homes, immediately understandable to directors and employees, calm enough for families in crisis, efficient for vendors, and credible as a scalable company. It must not feel like a checklist app, memorial microsite, generic CRM, or cosmetic wrapper over the legacy application.

### Primary product wedge

The funeral-home director experience is the primary excellence bar and distribution wedge. Passage should become the director's right hand:

- A family walks in with a QR Transfer Pass.
- The director scans it and sees exactly what the family approved for this purpose.
- Passage verifies the handoff, creates the case, assigns the operating location and lead, surfaces the first commitment, and queues future system synchronization.
- If the family has no pass, the director creates a minimal case using only the person and family contact; missing information becomes guided work rather than intake friction.
- No surprises: every action shows actor, recipient or waiting party, timestamp, status, visibility, proof destination, and next action.

The long-term integration goal is to sync this case into existing funeral-home systems through adapters without changing the simple intake UX.

## Experience doctrine

- Zero hand-holding: every persona should understand the menu, next action, status, owner, and outcome immediately.
- No text-heavy pages. Prefer progressive disclosure, clear actions, compact operational summaries, and proof.
- One continuity record connects the family, funeral home, employees, hospice/care providers, cemetery, vendors, participants, estate professionals, support, and system administration.
- Communication belongs to the related task, order, approval, or handoff, not a detached chat stream.
- Families see reassurance, privacy boundaries, one next action, and who is handling what.
- Directors see case flow, risk, ownership, waiting points, staff load, family-update health, vendor state, proof gaps, and recommended action.
- Employees see assigned work, case context, one primary action, prepared communication, proof capture, and escalation.
- Vendors see only scoped opportunities/orders, negotiation, scheduling, payment readiness, and proof, not the broader family record.
- Multi-location organizations need effortless workspace/location switching, employee invites, roles, routing, assignment, templates, reporting, and audit history.
- Visual direction is "warm precision": empathetic, modern, restrained, trustworthy, and enterprise clean. Avoid clinical cobalt, literal dark-tech branding, funeral cliches, card soup, and decorative sentimentality.

## Canonical persona and action architecture

Source: `docs/product/persona-action-architecture.md`.

The target map covers the complete lifecycle and these primary actors:

- Person planning or receiving care
- Family coordinator and additional family members
- Hospice, hospital, senior-living, and care-provider staff
- Funeral-home owner/director
- Funeral-home location manager and employee
- Cemetery/crematory
- Product and service vendors
- Clergy, officiants, celebrants, and other participants
- Estate attorney, executor, financial and property professionals
- Passage support/operations
- System administration and integration actors

Permissions are an intersection of identity, organization, case, role, explicit grant, data category, purpose, workflow state, and time. A role label alone never grants broad case access.

Every meaningful action follows one contract:

1. Actor and authority
2. Case/person context
3. Intended audience or waiting party
4. Minimum data scope
5. Human action and Passage-prepared work
6. State transition
7. Timestamped proof and audit record
8. Clear next action

## Current greenfield implementation

Repository: `thepassageappio/thepassageappio`

Branch: `greenfield/passage-zero`

Draft PR: https://github.com/thepassageappio/thepassageappio/pull/24

Current verified code commit: `5a6f06e23bac3fd13702ec4a8f6a31d639674a62`

Current evidence commit: `5a6f06e23bac3fd13702ec4a8f6a31d639674a62`

Canonical Vercel project:

- Project ID: `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`
- Team ID: `team_X0ta3bEEbRVGNM9xOwdBtCga`

Verified READY deployment: `dpl_6dJnC8jHuqDEzENrV9FwEWm7BK3v`

Shareable sandbox root (token may expire):

`https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app/?_vercel_share=IlVB6d874l2GTiIjlTezoSTFGpbJBaaF`

Director intake:

`https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app/director/intake?_vercel_share=IlVB6d874l2GTiIjlTezoSTFGpbJBaaF`

### Implemented surfaces

- Persona gateway/root
- Funeral director operating view
- Employee work view
- Family coordination journey
- Family Transfer Pass wallet
- Mobile funeral-director Receive/scan experience
- Walk-in director intake at `/director/intake`
- Responsive operations shell and shared warm-precision visual tokens

### Functional walk-in intake slice

The canonical demo record is Sofia Rivera, coordinated by Maya Rivera.

Transfer Pass: `PASS-RIVERA-7K4M`

Created funeral-home case: `NS-2051`

QR path:

1. Open/scan pass.
2. Verify Sofia Rivera, Maya Rivera, expiration, and the four approved information categories.
3. Select operating location and lead director.
4. Create the case.
5. Show the case receipt, first commitment, owner, source, and queued integration state.

No-pass path:

1. Enter the person and family contact only.
2. Select operating location and lead.
3. Create a minimal case.
4. Route missing information into guided case work.

Important boundary: this is a functional client-side sandbox flow. The durable database event model, real authentication/RLS, and external funeral-home-system synchronization are not wired yet. "Sync queued" is demo UI, not a real external integration.

## Visual system

The current palette is "warm precision":

- Canvas `#f7f5f4`
- Surface `#fffcfa`
- Ink `#242128`
- Muted `#6e6671`
- Elderberry/iris signal `#4f46a5`
- Human coral `#e79b80`
- Calm mineral `#bfdce0`
- Success `#2d715e`
- Danger `#a43f46`

Primary contrast checks passed. Coral and mineral are for human/decorative emphasis and soft backgrounds, not white-text action fills.

## Verification evidence

Evidence directory:

https://github.com/thepassageappio/thepassageappio/tree/c4e01c88ae859dbe148fe1274f1d5c612e1d62f1/docs/evidence/passage-zero

Verified:

- Desktop at 1440x1000
- Mobile at 390x844
- QR pass intake through created-case receipt
- No-pass minimal intake
- Director, staff, receive, family, and family-pass mobile regression
- No application console errors in the verified routes
- No horizontal overflow in the verified routes

Each future progress report must include real screenshots. Each real persona slice must be checked at desktop, 390 mobile, and 360 mobile before release.

## Active release train - 2026-07-15

Owner authorized parallel agents and instructed the team to execute without further approval loops.

Active engineering tracks at the time of this handoff:

1. Shared case spine: create a typed sandbox case/event model and make the Sofia Rivera record consistent across family, director, and employee routes.
2. Multi-location funeral-home operations: organization/location switching, employee/team assignment, case ownership, and routing.
3. Vendor fulfillment: scoped opportunity -> accept/negotiate -> confirmed order -> schedule -> completion proof.

Agent runtimes do not transfer to a new chat. The new root agent must inspect the branch and local workspace for any landed work, then re-instantiate incomplete tracks rather than assuming these processes are still alive.

## Next execution sequence

### Batch 1 - shared operational truth

- Define canonical organization, location, team member, case, person, participant, task, message, handoff, order, proof, and audit-event types.
- Use one canonical Sofia Rivera case across family, director, and employee routes.
- Add a client-safe sandbox repository/state layer now; design it so Supabase can replace the storage adapter without rewriting screens.
- Make state changes visible across persona surfaces and preserve actor, audience, timestamp, status, proof, and next action.

### Batch 2 - funeral-home operating system

- Organization onboarding requiring minimal setup.
- Multiple locations and workspace switching.
- Employee invite, role, working hours, skills, assignment, and escalation.
- Case creation, assignment, reassignment, routing rules, templates, family access, communication health, and proof gaps.
- Director "Today" view: cases needing action, unowned waiting, service-date risk, staff load, family communication risk, and recommended next action.
- Employee "My work" view: assigned cases/tasks only, one action at a time, prepared communication, proof capture, escalation.

### Batch 3 - vendor network

- Funeral home requests a scoped service/product from the case.
- Vendor receives an opportunity with minimum required context.
- Accept, decline, or negotiate price/date/scope.
- Confirm an order and expose the same state to the case team.
- Schedule fulfillment, communicate in the order thread, and save completion proof.
- Keep payment state and future billing readiness explicit without inventing pricing or charging real money.

### Batch 4 - durable backend

Before applying schema changes, write a what/why/breakage list as required by `AGENTS.md`.

Expected data domains:

- Organizations, locations, memberships, roles, and routing rules
- Continuity records/cases and persona-scoped case access
- Tasks, dependencies, assignments, waiting states, and proofs
- Case-scoped communication threads and receipts
- Vendor opportunities, negotiations, orders, schedule events, and completion proof
- Transfer Pass tokens, consents, disclosures, scans, acceptances, expiration, and revocation
- Integration connections, outbound jobs, attempts, errors, idempotency keys, and external identifiers
- Append-only audit events

Use real Supabase migrations for structural changes. Do not apply ad hoc production SQL.

### Batch 5 - integration adapter framework

- Stable internal case-creation contract
- Provider-specific adapters behind the contract
- Mapping/version strategy
- Idempotent outbound jobs
- Retry and operator-visible failure states
- Human-readable synchronization proof
- Sandbox/mock adapter for demos before any real vendor integration

## PM Sprint Brief

Status: COMPLETE for the current parallel build batch.

Sprint goal: turn Passage Zero from separate persona demonstrations into one coherent funeral-home-led operating product where a walk-in becomes a shared, assignable case and downstream vendor work stays attached to that case.

Requirements:

- One canonical case and event contract across routes.
- Director-first, zero-hand-holding operating UX.
- Multi-location organization and employee ownership model.
- Vendor negotiation-to-proof state machine.
- Responsive desktop/mobile behavior.
- No unverified legal/compliance claims and no fake external execution.

Acceptance criteria:

- A director can scan a pass or create a minimal walk-in case.
- The resulting case is visible consistently to the allowed family/director/employee personas.
- A director can select location and owner and reassign work.
- A vendor can accept or counter a scoped request, confirm, schedule, and complete it with proof.
- Each transition records actor, time, state, audience, proof destination, and next action.
- Desktop, 390, and 360 have no horizontal overflow or blocking console/hydration errors.
- Real screenshots are committed for every completed persona path.

Dependencies:

- Current Passage Zero App Router application and shared operations shell
- Canonical Sofia Rivera demo fixtures
- GitHub connector for branch writes
- Vercel canonical preview project
- Chrome/browser automation for real visual QA
- Supabase project access before durable migrations

QA/deploy plan:

1. Static TypeScript/component review.
2. Build/lint when a runtime is available; never claim build proof if unavailable.
3. Browser exercise of the complete cross-persona story.
4. Desktop 1440, mobile 390, and mobile 360 checks.
5. Console/hydration/overflow/accessibility checks.
6. Commit screenshot evidence.
7. One coherent preview deployment after the batch is integrated; avoid deploy chains.

Risks:

- Local environment may lack Node/npm/git; use GitHub/Vercel connectors and record verification limits.
- Parallel agents share the filesystem; inspect overlaps before integration.
- Share tokens expire.
- Client-side demo state is not durable or secure; do not confuse it with production readiness.
- Exact legal, compliance, privacy, medical, authority-to-act, HIPAA, FTC Funeral Rule, retention, and disclosure claims require authoritative verification and owner review before product publication.

Non-goals for this batch:

- Charging real money or changing pricing
- Sending real customer/vendor email or SMS
- Claiming real funeral-home-system integration before an adapter exists
- Publishing unverified compliance language
- Production database writes without documented migrations

## Owner gates that remain

Steve has already approved the greenfield rebuild, frontend/backend restructuring, parallel agents, demo deployment, and normal documentation/QA work. Do not ask again for those.

Stop only for the explicit `AGENTS.md` gates:

- Changing pricing amounts
- Sending real customer/vendor/funeral-home email or SMS
- Raw/ad hoc production database SQL
- Deleting functionality rather than deprecating/redirecting
- Material legal, compliance, privacy, security, medical, or funeral-director claims
- Irreversible production data loss
- Spending money or starting paid campaigns

## Required release-train behavior

- Continue PM -> UX -> Development -> QA -> Deploy without pausing when the next action is known.
- Keep roles distinct and record their handoffs.
- Use meaningful batches and preserve the Vercel deploy budget.
- Never report a mockup as shipped product.
- Never report "working," "integrated," "secure," or "enterprise ready" without the matching functional and verification evidence.
- Update this file before final handoff and after each integrated batch.

## Immediate new-chat action

1. Read the three canonical files.
2. Confirm PR #24 head is at or after `ba71de6`; inspect any newer branch/local changes before editing.
3. Re-instantiate PM and UX around the multi-location funeral-home operating slice: organization, locations, memberships, workspace context, assignment, and case routing.
4. Extend the existing typed event spine rather than creating a parallel state model; keep family access unchanged and vendor fulfillment queued.
5. Define the durable-backend what/why/breakage plan required by `AGENTS.md` before any migration. Prefer real auth/RLS-backed persistence over cosmetic progress once the multi-location contract is coherent.
6. Run React/Next review, full cross-persona browser QA at desktop/390/360, contrast/overflow/console checks, and commit new screenshots.
7. Publish one coherent `[deploy] [qa-approved]` batch, update PR #24 and this file, then auto-advance.

## Release-train cycle 2 - shared operational truth

Status: COMPLETE and preview verified for this shared-truth batch.

Branch audit:

- PR #24 was inspected at head `5b9ce061ac320aac6b15cc87e95779369c14c201` before this batch.
- The two commits after the last verified code commit contained operating-context and screenshot changes only. None of the previously delegated shared-case, multi-location, or vendor implementation tracks had landed.
- The unfinished tracks were re-instantiated. Product and UX narrowed this batch to the smallest coherent dependency: one shared operational record. Multi-location operations and vendor fulfillment remain queued in that order.

Role handoff record:

- PM: defined Sofia Rivera / Maya Rivera / `PASS-RIVERA-7K4M` / `NS-2051` at Northstar Portland as the canonical scenario, with Elena Torres accountable and Marcus Lee assigned. Required an idempotent browser-persistent sandbox event spine; excluded multi-location, vendor, and Supabase work from this batch.
- UX: passed the concept with conditions that one event be translated by persona, family and staff boundaries remain explicit, every mutation preserve actor/time/audience/waiting/proof/next owner, sandbox-only execution be disclosed, and desktop plus 390/360 layouts be verified.
- Development: implemented typed commands, events, fixture state, a replaceable local-storage adapter, a React provider, and cross-persona issue/inspect/accept/start/proof/revoke/reset flows. Director intake, director case, staff work, family pass, and receiver surfaces now read and mutate the same canonical record.
- QA: first review failed on selectable destination divergence, premature director actions, ambiguous manual-draft state, staff navigation leakage, ownership wording, and receipt-link behavior. Those issues were fixed. Focused static QA then passed.

Verification evidence:

- TypeScript verification passed after integration.
- Final TypeScript verification and the optimized production Next.js build passed after integration and the warning-only layout adjustment.
- Browser QA exercised family issue -> receiver inspection -> acceptance into `NS-2051` -> director start -> staff proof -> director/family proof return.
- Runtime state persisted after reload. Revoked, expired, already-accepted, and invalid pass outcomes preserved a no-disclosure boundary.
- Mobile checks at nominal 390 and 360 widths had equal document client and scroll widths with no horizontal overflow.
- Browser evidence is stored under `docs/evidence/passage-zero/shared-*.png`.
- The sandbox is explicitly browser-local and is not durable, secure, multi-user, or production backend evidence.

Preview handoff:

- QA-approved commit: `f4ba31321474fbdf4620aeadc888460c914c236b`.
- Vercel deployment: `dpl_6o3NivMoyE93XY8woguxpLMQu9Yn` (`READY`, Next.js/Turbopack, preview target).
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Temporary share token generated for the July 15 demo expires July 16, 2026.
- The family/D2C journey is viable for next-week guided testing, including urgent and planning-ahead positioning, but self-serve SaaS readiness still requires authentication, durable cross-device records, account recovery, subscriptions, notifications, and production authorization.

Integrated files and contracts:

- `lib/sandbox/types.ts`, `repository.ts`, and `provider.tsx` define the shared contract and storage seam.
- `lib/passage-zero.ts` and `components/PassageZeroProvider.tsx` expose the shared slice to the App Router.
- Family, receive, director intake, director case, and staff routes now project persona-appropriate views of the same events.
- Multi-location organization switching, employee administration, vendor negotiation/fulfillment, durable Supabase persistence, and real integrations remain intentionally unimplemented.

Next execution sequence after preview verification:

1. Re-instantiate PM and UX for the multi-location funeral-home operating slice.
2. Preserve the shared event spine and add organization/location/membership/assignment concepts without widening family access.
3. Run the same static -> browser -> evidence -> single-preview loop.
4. Advance vendor fulfillment only after location and ownership semantics are coherent.

## Release-train cycle 3 - warm editorial system and onboarding

Status: COMPLETE, committed, and preview verified.

Founder feedback addressed:

- Removed the sterile martech direction across all current family and funeral-home surfaces.
- Display typography is Cormorant Garamond, chosen for its narrow editorial serif character; all navigation, controls, labels, and body copy use Montserrat as requested.
- The shared palette now begins with warm ivory paper surfaces and uses dusty, low-saturation purple, blue, and green for action and state.
- Near-black glowing pass panels, vivid iris blocks, cool gradients, and console-like intake chrome were replaced with raised paper surfaces, warm borders, quieter shadows, and accessible state bands.
- The Transfer Pass QR remains high-contrast black on white with its quiet zone preserved.
- Direct-user onboarding now acknowledges both planning-ahead and immediate-help intent before entering one honest shared handoff flow.
- Demo-only gateway labeling was replaced with product language while the browser-sandbox boundary remains explicit.

Visual QA:

- Family onboarding, family pass, receiver, funeral-home intake, director, staff, and gateway routes were inspected after the shared token change.
- All tested routes had equal document client and scroll widths at 360 pixels; family onboarding also passed at 390 pixels.
- The key warm palette pairs pass WCAG AA contrast for normal text: muted/canvas 4.75:1, signal/canvas 4.63:1, and surface text on signal 5.00:1.
- The complete issue -> inspect -> accept -> start -> proof loop still works after the visual change and produced no browser warnings or errors in the tested path.
- New evidence uses the `warm-*.png` prefix under `docs/evidence/passage-zero`.

Preview handoff:

- QA-approved commit: `ba71de6a5ea61d516e483d1a365a176a39fa3c7f`.
- Vercel deployment: `dpl_5RcB1ekoBJoPr1Jfxm6TJqL8TAnW` (`READY`, Next.js/Turbopack, preview target).
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Temporary July 15 share token expires July 16, 2026; generate a new token if the fresh chat runs later.

Readiness boundary:

- Direct-user guided testing/onboarding experience is approximately 85% complete for the current planning-ahead and immediate-help entry story.
- Funeral-home UX/workflow demonstration is approximately 85% complete for intake, ownership, staff execution, and proof return.
- Neither product is 85% operationally production-ready. Funeral-home pilot readiness still requires real auth/roles, durable multi-user storage, organization/location administration, RLS/audit enforcement, notifications/recovery, and integration reliability. D2C SaaS additionally requires account lifecycle, cross-device persistence, and subscription/billing work.

## Release-train cycle 4 - multi-location operating foundation

Status: COMPLETE, committed, and preview verified.

Branch and role audit:

- Work began from the requested PR #24 head `e8dbdd01a42c55a15ce9716d21f3fb2e3979ee3b`. The open draft PR had no review threads or requested changes. The head was a context-only commit after the cycle-3 QA-approved code commit; no parallel implementation had landed.
- PM (`/root/pm_cycle4`) constrained the batch to Northstar Funeral Home, Portland and Beaverton locations, org-wide director Elena Torres, Portland operator Marcus Lee, Beaverton operator Avery Brooks, one location-routed intake, and same-location assignment changes.
- UX (`/root/ux_cycle4`) passed the proposed All locations / Portland / Beaverton workspace, location-specific empty states, intake routing receipt, and non-leaking staff view with explicit copy and 44-pixel target conditions.
- Engineering (`/root/eng_cycle4`) extended the existing typed command/event reducer and browser repository. It did not create a second case model and did not widen family access.
- QA (`/root/qa_cycle4`) first failed six authority and state-integrity issues: destructive pass issue reset, missing actor authority, premature reassignment, invalid assignment-to-proof transition, optimistic receipt display, and undersized targets. PM kept all six in scope. Engineering corrected them, and focused static QA passed.
- Deploy (`/root/deploy_cycle4`) is instantiated only after the integrated browser and production-build gates; it may publish the one `[deploy] [qa-approved]` preview for this batch and no more.

Implemented operating contract:

- Added typed organization, location, membership, membership scope, workspace context, case accountability, assignment history, and routing events to the shared case/event spine.
- Added director workspaces for all locations, Portland, and Beaverton. Workspace choice filters presentation only and never grants authority.
- Added an atomic intake path that creates `NS-2051`, records organization/location/accountable director/first assignee, and explains the default routing reason.
- Added accepted-case reassignment with explicit actor and actor-membership identity. Reducer guards enforce role, membership, location, case state, and current-assignee boundaries.
- Added staff execution guards so only the current assignee can start work and only an in-progress commitment can submit proof.
- Preserved the family view and privacy boundary. Family proof status updates from the shared event history but never exposes organization location, staff scope, or internal routing detail.
- Kept vendor fulfillment queued. No vendor model was introduced before location and ownership semantics became coherent.
- The implementation remains an honestly labeled browser-persistent sandbox. It does not claim external synchronization, durable multi-user storage, or production authorization.

Required database migration analysis - documented before any migration:

No database migration is included in cycle 4. The following is the documentation-first gate for the next persistence batch.

| Required change | Why the frontend/pilot needs it | What breaks if skipped |
| --- | --- | --- |
| `organizations` and `locations` tables, with stable IDs and active state | Director and intake surfaces need durable funeral-home and operating-location identity. | Workspace filtering, routing, ownership, and audit records collapse into display strings and cannot be enforced. |
| Auth-backed `profiles` plus `organization_memberships` with role and active state | Every command needs a durable human actor and organization authority. | The app can impersonate seeded people; multi-user attribution and access revocation are not trustworthy. |
| `membership_locations` (or an equivalently explicit scope relation) | Location-scoped operators need least-privilege access while organization-wide directors can span locations. | A user is either overexposed to the whole organization or cannot work their assigned location. |
| Case `organization_id`, `location_id`, and `accountable_membership_id` foreign keys | The shared case must carry durable tenancy, work location, and accountability. | Cases cannot be routed, filtered, or protected consistently; family and operational projections may diverge. |
| Append-only `case_assignments` history with assignee, actor, reason, and effective timestamps | Reassignment needs an enforceable history rather than a mutable owner label. | Current ownership can be overwritten without proof of who changed it or why; recovery and audit fail. |
| Versioned `routing_rules` keyed by organization/location and intake attributes | Intake defaults must be deterministic and explainable while allowing controlled evolution. | Routing lives in UI conditionals, cannot be audited, and becomes unreliable across clients. |
| Per-user `workspace_preferences` | The selected location can persist without being mistaken for authorization. | Users repeatedly lose context, or developers are tempted to encode workspace in a security-sensitive session field. |
| Append-only `audit_events` with server-derived actor, audience, case, organization/location, command/event IDs, and timestamps | Pilot operations require tamper-resistant proof of every transition and access-relevant mutation. | Client-authored audit rows can be forged or omitted; incident review, recovery, and compliance evidence are inadequate. |

RLS and breakage expectations for that migration:

- Active organization membership is required for operational access; location-scoped members are restricted through their membership-location rows. Assignment may further narrow staff case visibility.
- Family access remains independent and grant-based. It must never be inferred from funeral-home membership or broadened by organization/location changes.
- Workspace preference is presentation state only and must never appear in an RLS predicate as authority.
- Audit insertion is server-derived and append-only; clients may not choose actor IDs, organization IDs, or timestamps.
- The migration will intentionally break browser-only seeded identity and local-storage-as-source-of-truth assumptions. It must ship with an adapter cutover, fixture/test updates, rollback notes, and verification that existing family grants still resolve to the same case projection.
- It will also surface missing membership/location records as denied access rather than silently falling back to broad organization access. Seed/backfill validation is required before enabling policies.

Verification evidence:

- TypeScript and optimized Next.js production builds pass after integration.
- Browser QA completed the receive -> accepted intake -> routed case -> reassignment -> staff start -> proof -> family proof-return path.
- Desktop, 390-pixel, and 360-pixel layouts were inspected. Tested pages had no horizontal overflow; visible interactive targets in the new slice are at least 44 pixels.
- Exact empty states were verified for Beaverton and unassigned Portland staff. The intake receipt records location, accountable director, first assignee, routing reason, proof destination, next action, and an explicit browser-only/no-external-sync boundary.
- Browser logs contained no warnings or errors from the application.
- Evidence is stored under `docs/evidence/passage-zero/cycle4-*.png`.

Preview handoff:

- QA-approved commit: `5a6f06e23bac3fd13702ec4a8f6a31d639674a62` with the required `[preview] [deploy] [qa-approved]` markers.
- Exactly one canonical preview was created: `dpl_6dJnC8jHuqDEzENrV9FwEWm7BK3v` (`READY`, Next.js project, Git branch `greenfield/passage-zero`, PR #24).
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Temporary share URL expires July 16, 2026 at 22:31 Pacific: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app/?_vercel_share=IlVB6d874l2GTiIjlTezoSTFGpbJBaaF`.
- Deployment-scoped Vercel error, warning, and fatal log query returned no entries after preview creation.

Readiness estimates after cycle 4:

- Family / direct-user path: **85% guided-experience readiness; 25% operational production readiness**. The shared handoff and proof-return story is coherent, but authentication, durable cross-device records, recovery, notifications, subscriptions/billing, and production authorization remain.
- Funeral-home path: **90% guided pilot-workflow readiness; 40% operational pilot readiness**. Organization/location/membership/assignment/routing semantics now exist and are demonstrable, but they are not yet backed by real authentication, RLS, durable multi-user persistence, enforced server audit, notifications/recovery, or reliable integrations.
- These percentages are goal-progress estimates, not production-readiness claims. The next loop is durable authentication and RLS-backed persistence using the documented migration gate above.

## Release-train cycle 5 - multi-employee workload and task-bound communication

Status: QA APPROVED; one guarded non-production preview is authorized for this integrated batch.

Owner direction carried forward:

- A funeral-home organization owns the operational case at a named location; the accountable director can assign specific commitments to eligible employees.
- Multi-location workload, current ownership, waiting parties, and communication must stay clear across director, employee, and family projections.
- Passage-prepared work must make the human step faster without implying that an external message was sent.
- Guided-experience progress remains separate from operational production readiness.

Release-train role record:

- PM (`/root/pm_cycle5`) first scoped durable auth/RLS plus workload communication. The environment check found no Supabase toolchain, credentials, or configured project variables, so PM re-scoped the executable batch to the typed browser sandbox and kept durable auth/RLS as the immediate backend blocker.
- UX (`/root/ux_cycle5`) passed implementation with conditions: workload -> filtered queue -> selected commitment -> prepared output; explicit audience, automation, review-required, and not-sent boundaries; seeded identity labeled preview-only; 44-pixel targets; and zero family leakage.
- Engineering (`/root/eng_cycle5`, completed by `/root/eng_cycle5_finish`) generalized the existing event spine to collections and implemented the director/staff slice. No parallel task/message model was created and family access was not widened.
- QA (`/root/qa_cycle5`) first failed stale hardcoded member totals, then failed two undersized family-header targets. PM classified both as fix-now. Engineering moved every workload label to shared derived selectors and applied a CSS-only hit-area correction. Final integrated QA passed.
- Deploy role may publish exactly one non-production `[deploy] [qa-approved]` preview from this coherent release commit. The exact deployment ID and accessible evidence are recorded on PR #24 after verification; no production release is authorized.

Implemented operating contract:

- The typed sandbox now contains five active cases and five active commitments across Northstar Portland and Beaverton: Marcus 2, Avery 1, Elena 1, and one unassigned at the canonical reset state.
- Director workload, location/owner filters, unassigned assignment, same-location reassignment, staff ownership totals, and staff queues derive from the same current commitment collection.
- Assigning the Williams commitment to Marcus changes director load, filtered queue, identity option, and staff-owned count from 2 to 3 immediately and after reload; reassignment reverses the same selectors.
- Staff can switch among explicitly labeled seeded sandbox identities and sees only commitments assigned to that identity. The switch is presentation-only and explicitly does not sign in or grant access.
- Each selected commitment exposes owner, waiting party, audience, automation level, Passage-prepared content, human action, proof destination, next state, and next owner.
- Communication stays attached to its commitment. The fixture contains two Passage-prepared review-required outputs, one automatic internal routing receipt, and zero automatically sent external messages.
- Family-facing confirmation copy and an internal escalation summary can be marked review-ready in the sandbox, but no send action exists and the event records that nothing was sent.
- The Rivera accept -> route -> staff start -> proof -> family proof-return path still passes. Family files, grants, and projection remain unchanged apart from a CSS-only expansion of existing header hit areas; internal workload, locations, assignment reasons, drafts, automation metrics, and routing receipts do not appear in the family DOM.
- Vendor fulfillment remains queued. No database migration, real authentication, RLS claim, external delivery, or integration execution is included.

Automation inventory at canonical reset:

- Human-owned or unowned commitments: **5**.
- Passage-prepared drafts requiring human review: **2**.
- Automatically recorded internal routing receipts: **1**.
- Automatically sent external messages: **0**.

Verification evidence:

- Independent TypeScript and optimized Next.js 16 production builds pass; all eight App Router routes prerender.
- Browser QA passed director, staff, and family flows at 1440x1000, 390x844, and 360x800.
- The assignment/reassignment count mutation, location eligibility, seeded identity isolation, prepared-output review/no-send boundary, Rivera proof return, and family non-leakage checks pass.
- Tested routes have no page-level horizontal overflow, console warning/error, or hydration error.
- New director/staff controls meet the 44-pixel target requirement. The existing family wordmark and profile targets now render at 99x44 and 44x44 at desktop, 390, and 360; keyboard focus and Enter activation pass.
- Real screenshots are stored under `docs/evidence/passage-zero/cycle5-*.png`.

Database and operational-readiness boundary:

- No migration was applied. The cycle-4 what/why/breakage gate remains controlling and now also requires durable `commitments` plus append-only assignment history, and contextual `communication_threads` / `prepared_outputs` with audience and review state.
- Supabase tooling, preview-safe credentials, and project environment variables were not available after local environment and canonical Vercel project checks. Browser localStorage remains the explicit source of truth for this preview.
- The next operational batch is still real authentication, RLS-backed multi-user persistence, server-derived append-only audit, then notifications/recovery and integration reliability. Do not substitute another local adapter or cosmetic surface for that cutover.

Readiness estimates after cycle 5:

- Family / direct-user path: **85% guided-experience readiness; 25% operational production readiness**. Family behavior did not expand and no durable account or delivery capability landed.
- Funeral-home path: **94% guided pilot-workflow readiness; 40% operational pilot readiness**. Workload, assignment, employee scope, contextual communication, prepared outputs, and automation boundaries are demonstrably coherent, but remain unauthenticated and browser-local.
- These are goal-progress estimates, not production-readiness claims. Operational percentages do not increase from visible sophistication alone.

Auto-advance:

- After the single preview and PR handoff are verified, Product Management returns immediately to the durable auth/RLS batch. The current external blocker is missing Supabase project/tool access; no owner question is needed until safe self-service paths are exhausted and a credential/access gate remains.

## Release-train cycle 6 - persona pressure test and persistence truth

Status: COMPLETE; QA approved and the single guarded preview is verified.

Role and branch audit:

- PM (`/root/pm_cycle6_pressure`) produced a 36-scenario persona-flow matrix and classified real authentication/invitation binding as the P0 operational dependency. Target first-use times are family Google login within 60 seconds, represented participant within 90 seconds, vendor owner within 2 minutes, vendor employee within 90 seconds, funeral-home owner within 3 minutes, and invited funeral-home director/employee within 90 seconds.
- UX (`/root/ux_cycle6_onboarding`) returned FAIL/P0 for operational onboarding until real auth, invitation binding, protected routing, role onboarding, and live address autocomplete exist. UX approved an honest browser-sandbox repair batch and prohibited fake sign-in, invitation, vendor, or address routes.
- Engineering (`/root/eng_cycle6a`, completed in the root engineering role after the delegated editor stalled) implemented only the approved sandbox repairs. The existing typed event spine remains the single state model.
- QA (`/root/qa_cycle6a`) initially returned PARTIAL because the director queue claimed due-time order without sorting and the 360-pixel brand overlapped the director navigation. Engineering sorted the visible queue and replaced the mobile header with a compact nonoverlapping grid. QA re-tested and returned PASS.
- Deploy will be instantiated only after QA PASS and may publish exactly one non-production `[deploy] [qa-approved]` preview for the integrated batch.

Implemented batch:

- Director navigation is role-pure: Today, Intake, and Receive. Staff navigation contains only My work.
- The staff identity preview excludes the accountable director in both UI derivation and reducer authority checks; legacy browser state is normalized to an active non-director employee.
- Director assignment choices derive from the selected case's operating location, exclude the current owner, and use the same effective assignee for displayed and submitted state across filtering, row selection, and repeated reassignment.
- Family planning-ahead and urgent intent now produce materially different guidance and persist only in browser local storage. The copy states that the choice creates no account, does not change sharing, and can be changed at any time.
- The inert family profile control is now a noninteractive signed-in-preview identity label.
- Human-prepared outputs begin unreviewed. Review creates one stable idempotent event, persists `reviewReady`, changes the boundary to Reviewed / Not sent, removes the repeated review action, and never exposes a send control. Existing browser records are normalized from event evidence rather than trusting stale seeded flags.
- TypeScript and the optimized Next.js 16 production build pass after final integration; all eight App Router routes prerender.

Final Cycle 6A verification:

- Browser QA passed at 1440, 390, and 360 for family intent selection/reload, director filtering/selection/reassignment/reload, staff identity isolation/empty state, and prepared-output review/reload.
- The director queue is actually ordered 10:30, 11:15, 12:20, 13:45, 15:30. The 360/390 mobile header has no wordmark/navigation collision and 55-pixel navigation targets.
- Staff options are Marcus and Avery only; Elena is absent. Reviewed state persists, changes to `Reviewed · Not sent`, removes the review button, exposes no send action, and remains one idempotent event.
- Every tested page has equal document client/scroll width, with no page-level horizontal overflow, console warning/error, or hydration issue.
- Ten real screenshots are committed under `docs/evidence/passage-zero/cycle6a-*.png` for family planning/urgent, director, and reviewed staff states at required viewports.

Cycle 6A preview handoff:

- QA-approved commit: `80e5e52b61675851d014709467db4d87d5e06891`.
- Exactly one non-production preview was created: `dpl_5FKCPc9UmQLkMRYtazQxzUu7hM2e`, `READY`, `target: null`, on `greenfield/passage-zero` in the canonical Vercel project.
- Deployment URL: `https://thepassageappio-rf007pfdz-thepassageappio-7018s-projects.vercel.app`.
- Stable branch alias: `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- Fresh share URL: `https://thepassageappio-rf007pfdz-thepassageappio-7018s-projects.vercel.app/?_vercel_share=hBd8j6oA76QvUHv2erKzYv5HxmeZ6NA5`; Vercel reports expiry July 17, 2026 at 2:21:28 AM without labeling the displayed timezone.
- Build completed in 21 seconds. Errors-only build logs were clean; deployment-scoped preview runtime error/warning/fatal logs were empty. Protected root fetch returned HTTP 200 and rendered Passage with Cormorant Garamond and Montserrat.
- No additional preview or production deploy was created or authorized.

Operational-readiness boundary:

- Family/direct-user remains **85% guided-experience readiness and 25% operational production readiness**.
- Funeral-home remains **94% guided pilot-workflow readiness and 40% operational pilot readiness**.
- Visible UX refinement does not raise operational readiness. Real auth, durable multi-user persistence, RLS, server-enforced audit, recovery/notifications, and integration reliability remain required.

### Cycle 7 database migration contract - documentation-first gate

No migration has been applied. Supabase project `qsveqfchwylsbncsfgxe` is connected and healthy. Production contains real auth users and an established public schema, so structural work must first run on an isolated Supabase development branch. Supabase quoted that branch at **$0.01344/hour**; explicit owner cost approval is still pending.

The migration must extend `organizations`, `organization_locations`, `organization_members`, `workflows`, `tasks`, `workflow_events`, `estate_access`, `estate_participants`, `messages`, `notification_log`, `vendors`, `vendor_team_members`, and `vendor_requests` where applicable. It must not create a second case, task, communication, or event spine.

| Required structural/policy change | Why the pilot needs it | What breaks if skipped |
| --- | --- | --- |
| Normalize organization membership to an authenticated `auth.users` identity; enforce one active membership state and explicit funeral-home roles for owner/director/employee. | Google and email-invited users must resolve to a durable actor before any organization access or command. | Seeded identity remains impersonable; revocation, attribution, and multi-user persistence are not trustworthy. |
| Add an explicit membership-to-location relation and migrate away from `organization_members.location_scope` text as authority. | Directors may span approved locations while employees may be limited to one or several named locations. | RLS either overexposes the whole company or blocks legitimate multi-location work; workload and routing cannot be enforced. |
| Add hashed, expiring, single-use organization invitations with invited email, role, organization, optional location scope, inviter, accepted user/time, and revoked/expired states. Never persist a raw bearer token. | Google login and email acceptance must bind the authenticated person to the invitation and intended role in one transaction. | Forwarded/replayed links can grant the wrong role; acceptance cannot be audited or recovered safely. |
| Replace plaintext `estate_participants.invite_token` lookup with a token hash/digest transition and revoke/expiry/accepted state while preserving existing family grants. | Participant invitations currently expose a reusable bearer token pattern; represented-person access must remain independent from funeral-home membership. | Token disclosure can become record access, old invitations cannot be safely revoked, or a cutover can lock out legitimate family participants. |
| Extend `organization_locations` address fields with address line 2/unit, provider, provider place ID, original input, normalized components, validation timestamp/status, source (`provider` or `manual`), and review-required state. | Required typeahead must parse city/state/postal/country as the user types while keeping every field editable and supporting manual/international fallback. | Routing and service-location data become display strings; silent provider errors can misroute cases or overwrite user corrections. |
| Enforce durable workflow/case organization, operating location, accountable membership, current assignment, and append-only assignment history with actor, reason, effective time, and prior/next owner. | Funeral homes receive family cases and directors delegate specific commitments across employees and locations. | Ownership can be overwritten without proof; staff workload, recovery, and location routing diverge across clients. |
| Keep task communication and prepared outputs attached to the existing task/workflow identifiers, with audience/visibility, automation level, review state, recipient, delivery state, proof destination, and next owner. | Family, director, staff, participant, and later vendor communication must explain what was prepared, who acts, who waits, and whether anything was actually sent. | A parallel chat model loses task context; the UI can imply delivery without a reliable recipient/status/proof record. |
| Make `workflow_events` append-only to ordinary clients: remove owner UPDATE/DELETE, prohibit client-selected actor/organization/timestamps, and insert validated events through a server-side transaction/RPC or trigger. | Audit evidence must be derived from authenticated commands and survive retries without duplication. | Users can rewrite/delete history or forge actors; disputes, recovery, and operational QA have no trustworthy record. |
| Replace broad or overlapping public-role policies with authenticated least-privilege RLS for organization, location, assignment, family grant, participant invite, and vendor request scopes; audit exposed SECURITY DEFINER helpers with fixed `search_path`. | The current advisor reports broad inserts, exposed helpers, and overlapping policies. | Cross-tenant data may be exposed, unauthorized rows may be created, or performance degrades under pilot load. |
| Add durable notification intents/outbox rows keyed to the event spine, idempotency keys, retry/backoff, delivery provider IDs, terminal failure, and user-visible recovery state. | Invites, assignment changes, family updates, proof returns, and escalations need reliable delivery without claiming success early. | Users wait without knowing why, duplicate messages can be sent, and failed integrations have no recovery path. |
| Add required indexes and uniqueness constraints for membership/location lookups, invitation digest, workflow organization/location/assignee, event idempotency, and notification retry queries. | RLS and event/outbox lookups sit on every authenticated workflow. | Pilot latency and database load rise quickly; retries can create duplicate effects. |

Migration sequencing and breakage plan:

1. Create and validate the isolated development branch only after the exact cost approval.
2. Snapshot policy/table advisor output; add nullable structures, indexes, invitation hashing support, and backfill verification first.
3. Backfill membership/location/case references and reject ambiguous records into an explicit manual-review report; never silently broaden access.
4. Add invitation acceptance and command/event transactions, then integration tests for owner/director/employee, represented participant, family grant, and vendor boundaries.
5. Enable restrictive RLS and append-only audit on the development branch; prove denied cross-org, wrong-location, unassigned-staff, expired/replayed-invite, and family-leakage cases.
6. Cut the frontend adapter from local storage to Supabase only after the same typed event contract passes end to end. Keep an explicit rollback path until validation completes.
7. Production application remains a separate migration action. No raw production SQL, destructive data rewrite, Google provider activation, email send, or paid address provider is authorized by this plan.

Auth and integration decisions queued behind the branch gate:

- Use Supabase Auth for Google OAuth and email invitation acceptance. Resolve a pending invitation after authentication by normalized verified email; never trust a client-supplied organization, role, or location claim.
- Prefer server token-hash/OTP verification for email links because mail security scanners can prefetch and consume one-click links. Recovery must not reveal whether an email belongs to an account.
- Implement the address UI through a provider-neutral adapter, with Google Places Autocomplete (New) as the current leading provider. Billing/API activation needs separate owner approval; the UI must remain functional with manual structured entry when the provider is unavailable.
- Vendor owner/employee persistence and fulfillment remain after funeral-home location and ownership enforcement passes. Existing vendor tables are audited now but not widened into family-record access.

#### Cycle 7A exact first-migration scope

Final SQL must preflight the development branch's actual column types and names and add only missing structures; it must fail closed rather than guess.

- New `organization_invitations`: UUID primary key; organization FK; normalized invited email; constrained funeral-home role; nonempty purpose; inviting auth-user FK; unique SHA-256 token hash plus nonsecret support hint; expiry; mutually exclusive accepted/revoked timestamps and user FKs; accepted member FK; created timestamp. The raw token is returned once to the trusted server caller and is never stored or logged.
- New `organization_invitation_locations`: invitation/location composite key with FKs. The invite discloses and enforces its exact location scope before acceptance.
- New `organization_member_locations`: member/location composite key, granting auth-user FK/time, optional revoked time, and indexes for active member and location lookups. Legacy `organization_members.location_scope` remains temporarily as deprecated read-only compatibility and receives no new writes.
- Auth binding: use an existing auth-linked profile if branch preflight finds one; otherwise add `profiles(id -> auth.users, display_name, onboarding_state, created_at, updated_at)` and the standard creation trigger. Add only missing `organization_members.user_id`, lifecycle status, accepted time, and unique active `(organization_id,user_id)` enforcement.
- Existing authority columns: ensure `workflows.organization_id`, `workflows.organization_location_id`, and `tasks.assigned_organization_member_id` exist with FKs and tenant/location/assignee indexes.
- Existing `workflow_events`: add only missing organization, location, actor-user, actor-member, event type, idempotency key, audience, prior/next state, occurred time, metadata, and optional invitation FK; enforce unique `(organization_id,idempotency_key)`. Revoke client INSERT/UPDATE/DELETE, install an unconditional mutation-prevention trigger, and allow insertion only from validated server RPCs that derive actor, organization, location, and time.

Required RPC boundary:

1. `inspect_organization_invitation(raw_token)` hashes the token and returns only inviter display name, organization, role, location names, purpose, expiry, and state. It returns no invited email, roster, case/family data, or token digest.
2. `accept_organization_invitation(raw_token)` requires authentication, row-locks the invitation, compares normalized verified Auth email, atomically creates/activates the member and member-location rows, stamps acceptance, emits one event, and returns the member and `/staff` landing. Replay by the same accepted user returns the existing receipt; it never creates a second member.
3. `create_employee_invitation(org_id, invited_email, location_ids, purpose, expires_at)` requires an active authorized owner/director for every requested location, generates the raw token server-side, stores only its digest, emits an event, and does not claim an email was sent.
4. `revoke_organization_invitation(invitation_id, reason)` requires authorized owner/director scope and records revocation plus an event. Accepted invitations require the separate membership-revocation path.
5. The internal event append function is not executable by anon/authenticated clients. RLS helpers use SECURITY DEFINER only where needed, set a fixed `search_path`, and answer active membership, location access, task assignment, and invite-management predicates.

Cycle 7A RLS must prove: no public table lookup for invitations; employee reads only own membership/location rows and assigned workflows/tasks at allowed locations; managers operate only within organization/location authority; clients cannot elevate roles, locations, or assignees; workflow events are read only for accessible workflow and audience; family grant policies remain independent. Workspace preference, client-selected location, email text alone, and a role label alone are never authority.

Cycle 7B is separate and required before organization-owner onboarding: structured address line 1/2, locality, administrative area, postal code, country code, existing provider place ID, provider, validation status, suggested formatted value, validation/review timestamps and reviewer, and address version. Preserve the legacy display address until deterministic backfill. Address data never grants access. Keeping 7B separate limits the employee-invite migration while preserving the owner's mandatory live typeahead requirement for the immediately following organization/location slice.

Next highest-leverage action: after explicit Supabase branch-cost approval, create the isolated development branch and implement the invited funeral-home employee path first (invite -> Google/email authentication -> account binding -> role/location onboarding -> protected My work -> audit proof), followed by funeral-home organization onboarding with live address parsing. Until approval, continue migration tests/specification and the Case Room contract without touching production schema.

## Queued Cycle 7B/8 - Case Room, realtime coordination, and proof integrity

Owner requirement: each case needs real-time group coordination across funeral home, family, invited participant, employee, and later vendor relationships. PM (`/root/pm_cycle6_pressure`) and UX (`/root/ux_cycle6_onboarding`) converted this into a task-attached Case Room contract. It is not a detached chat product and must extend `workflows`, `tasks`, `messages`, `workflow_events`, and the existing typed event spine.

Experience and evidence contract:

- The stable Case Room information architecture is `Now · Tasks · Updates · Proof`. `Now` shows one viewer-relative action, who is waiting, the latest permitted update, and the latest proof. Default ordering is Needs action then time, not an undifferentiated social feed.
- A composer appears only inside a selected task/request/decision thread and says `Reply about [task]`. Effective recipients are server-derived from current grants and authority. The send boundary repeats the named audience beside the action.
- Every message, status, proof, prepared output, receipt, correction, and handoff shows immutable actor/role plus authoritative date and time, audience/visibility, related task, delivery/read evidence, resulting state, who is waiting, proof destination, next owner, and next action.
- Prepared external output is visibly `Passage prepared · Review required · Not sent`. After a human send, the human is the sender and preparation remains metadata. Initial external automatic sends remain zero. Internal automatic receipts are `Recorded automatically · Internal only` and never appear as human speech.
- Delivery truth progresses only from durable evidence: Not sent -> Sending -> Sent/Delivered with time -> Read by permitted named recipient/time. Failure is Not delivered with retry and escalation. Unknown is Delivery not confirmed, never inferred read/unread.
- Persona projection remains strict: director/employee internal coordination is case-team only; family sees one decision-ready question/outcome without workload/routing/vendor negotiation; participant sees only the granted task and contributes without implied approval/authority; vendor sees only the scoped request/order and never browses the family record.

Proof is a structured task outcome, not a hollow green label. Required fields are what happened, submitter, authoritative timestamp, source/artifact/reference, audience, related task/event, verification state, verifier/time where applicable, proof destination, next owner, and next action. Lifecycle is Required -> Submitted -> Under review -> Verified or Rejected/Needs replacement. Corrections supersede rather than overwrite. Family may see a translated pending/verified outcome without internal artifacts unless explicitly granted.

Data and realtime direction:

- `messages` stays bound to workflow and normally task, with parent/correction relationship, server-derived sender/time, audience/visibility, client idempotency key, prepared-output relationship, delivery state, resulting task state, and next action. Message bodies are immutable; corrections/retractions append.
- A `message_receipts` child relation is allowed for recipient-specific queued/sent/delivered/read/failed evidence without exposing hidden rosters. A `task_proofs` child relation is allowed for evidence on the existing task, including structured outcome, private artifact reference, submitter/time, audience, review state/reviewer/reason, and superseded proof. Neither is a parallel task or event model.
- `workflow_events` remains the canonical append-only spine for message, delivery, blocker, escalation, proof, status, owner, waiting, and next-action transitions.
- Realtime starts only after Cycle 7A auth/membership/location/assignment RLS passes. Subscribe to authorized Postgres changes, then reconnect by fetching after the last durable event cursor. Realtime accelerates the UI but is never the source of truth. Send/proof/status RPCs are idempotent.
- Offline/retry preserves a visibly device-local draft, never claims sent, and cannot double-send. Provider-pending, failed/bounced recipient, revoked grant, conflicting response, and failed/resumable proof upload all retain a named recovery owner and truthful state.

Phased delivery:

1. Cycle 7A: real invited-employee auth, organization membership, relational location scope, assigned-only RLS, append-only audit.
2. Cycle 7B: authenticated director/employee Case Room, structured proof review, and realtime catch-up across two sessions.
3. Cycle 8A: funeral home/family reviewed communication and family-safe verified proof after durable independent family grants.
4. Cycle 8B: family/invited-participant bounded thread after participant invitation/grant hardening.
5. Cycle 8C: funeral home/vendor room only after vendor organization/member/request authority is enforced.

Acceptance includes two-session updates within two seconds under normal preview conditions, reload/reconnect catch-up without gaps/duplicates, direct-URL denial, double-submit idempotency, revoked access, delivery failure, proof rejection/replacement, exact timestamps and audiences, and desktop/390/360 keyboard/overflow/console verification. Operational readiness does not increase from a visual chat shell; it increases only after authenticated multi-session RLS, immutable audit, real delivery/recovery, and integration evidence pass.

### Cycle 7A live Supabase preflight and isolation gate

Status: PM scope and documentation-first migration gate are complete; Engineering is drafting the additive migration; no database migration has been applied.

The owner explicitly approved the quoted Supabase development-branch cost of **$0.01344/hour**. The branch create request then failed with `PaymentRequiredException: Branching is supported only on the Pro plan or above`. No branch was created, no cost was incurred, and no production schema or data changed. Upgrading the Supabase organization is not authorized. Supabase quoted a separate isolated test project at **$0/month**; creating that project is a new explicit cost-confirmation action and remains owner-gated.

Read-only production preflight established the actual compatibility and backfill risks before SQL was written:

- `organization_members` has 3 rows. It already contains `user_id`, `email`, `role`, `status`, `display_name`, `title`, and legacy `location_scope`; one demo director row uses `location_scope = 'all'`.
- The demo director organization `b36f8032-2181-5ef0-9cdf-08bcd48de6c3` has no `organization_locations` row, so its director cannot yet receive a relational location grant without an explicit seed/backfill decision.
- `workflows` has 8 rows; 2 have no `organization_id`.
- `tasks` has 47 rows; all reference a workflow, but 37 have no `organization_id`.
- `workflow_events` has 0 rows and only the legacy event fields. Current owner policies allow client `INSERT`, `UPDATE`, and `DELETE`, so it is not yet a trustworthy append-only audit source.
- Existing workflow/task policies grant broad organization-level reads through `is_org_member_of`; switching immediately to assigned-only employee policies would hide legitimate current work before the missing organization/location/assignment references are backfilled.
- `estate_participants.invite_token` is plaintext and has a public token-lookup policy. It remains a separate participant-token hardening migration so funeral-home membership work cannot accidentally change family access.
- Existing public SECURITY DEFINER helpers and broad/overlapping RLS policies require later least-privilege replacement, fixed `search_path`, and explicit grants. Current Supabase behavior no longer implies Data API grants for new tables, so every new-table grant is specified separately from RLS.

PM breakage decision: Cycle 7A is split into an additive foundation and a later enforcement cutover. The additive migration may create hashed employee invitations, invitation-location grants, member-location grants, nullable workflow/task authority columns, richer event-spine fields, indexes, and narrowly granted invitation RPCs. It must not replace legacy workflow/task read policies, enforce assigned-only RLS, or install an unconditional append-only event trigger until deterministic backfill and adapter tests prove that current records remain reachable. Skipping this split would trade an honest operational gap for silent lockout of 37 tasks and two workflows.

Engineering source artifact: `supabase/migrations/20260716035414_cycle_7a_invited_employee_foundation.sql`, created with Supabase CLI. It is a draft until independent SQL/RLS QA passes. It will not be applied to production. The next safe validation path is an isolated test project only after the owner approves the separate **$0/month** confirmation; a blank project can validate migration mechanics and security tests but is not equivalent to a branch copy of production data, so production-shaped fixtures and the read-only preflight remain required evidence.

Owner approved the **$0/month** isolated-project path. Supabase project `uyacxqtsiwlvtmhxvoxr` (`passage-cycle-7a-test`, `us-east-2`) was created in the existing Passage Supabase organization and reports `ACTIVE_HEALTHY`. It is a migration/RLS safety lab, not the customer production project and not yet the product demo instance. Production remains read-only for this batch.

### Governing priority for the next operational sprints

The owner set the utmost priority: make the funeral-home experience operational end to end, establish a genuinely separate demo instance, and then drive the D2C path toward **85-90% operational readiness**. Guided-experience percentages must remain separate and cannot substitute for operational evidence.

The release train therefore stops awarding readiness for visual completeness alone. An operational gate passes only when two independently authenticated users can complete the relevant cross-persona flow on separate sessions/devices; RLS denies the wrong organization, location, role, or family grant; commands are idempotent; reload/reconnect preserves truth; delivery or integration failure has a visible recovery owner; audit/proof contains server-derived actor and timestamp; and desktop, 390-pixel, and 360-pixel QA pass.

Current product assessment: Passage is not missing a broader feature catalog as much as it is missing proven operational trust. Current funeral-tech products already market case management, team tasks, family collaboration, mobile access, forms, reports, and integrations. Passage's differentiated product bar is the clarity and evidence of every handoff: owner, waiting party, audience, prepared work, human review/send boundary, resulting state, proof, next owner, and recovery. The product should integrate with incumbent funeral-home systems before attempting to replace their accounting, body tracking, forms, or full ERP surface.

Provisional sprint order, pending the PM role's measured brief:

1. **Funeral-home authority foundation:** Google/email authentication, hashed single-use employee invitations, organization/location membership, protected workspace context, assignment, RLS, append-only command audit, and recovery. Exit with owner/director/employee invite-to-assigned-work simulation across two sessions.
2. **Funeral-home case operations:** first call/intake to accepted case, accountable director, employee delegation/workload, task-bound Case Room, reviewed family update, structured proof, reconnect/replay, notification outbox, and one provider-failure recovery path. Exit with a complete case handoff and no cross-persona leakage.
3. **Separate demo instance:** isolated auth/database/environment/domain, deterministic seed and reset, synthetic identities, blocked production data/communications, integrations in recorded simulation mode, and an automated smoke run. It may demonstrate only flows that the real product supports and must never share production routes or customer data.
4. **D2C operational path:** Google/email onboarding, planning-versus-urgent intent, independent family record/grants, participant invitation hardening, recovery, funeral-home handoff/acceptance, family-safe updates/proof, notification failure recovery, and account/data controls. Advance toward 85-90% only after the same two-session, RLS, audit, retry, and responsive exit gates pass.
5. **Pilot hardening and evidence:** real funeral-director usability sessions, measured time-to-first-case/time-to-assign/time-to-family-update, accessibility/performance, observability/support runbooks, backup/recovery proof, integration contract tests, and explicit legal/privacy/security review for unresolved high-risk decisions. These are prerequisites to an 85-90% claim, not optional cleanup.

Non-goals until these gates pass: broad vendor fulfillment, a generic group chat, full funeral-home accounting/ERP replacement, automatic external messaging without review, additional cosmetic redesign, or production-readiness increases based on demo polish.

PM role instance `/root/pm_cycle7_operational` reviewed the operating guide, full living context, and persona architecture and converted this doctrine into the governing four-sprint brief. The canonical legacy roadmap file named in AGENTS.md (`pages/system/admin/saas-roadmap.js`) is absent from this greenfield workspace, so no competing roadmap was created. The targets are evidence-gated projections, not promises: Sprint 7A funeral home 55% / D2C 30%; Sprint 7B funeral home 72% / D2C 35%; Sprint 8A funeral home 85-88% / D2C 45%; Sprint 8B D2C 85-90% / funeral home 88-90%.

Readiness caps are now explicit: no real auth/RLS caps operational readiness at 49%; no durable notifications/recovery caps it at 79%; no complete family-to-funeral-home handoff and proof return caps it at 84%. Reaching 85-90% means pilot-operational for allowlisted accounts with monitoring, support/recovery runbooks, known non-goals, and verified persona simulations. It does not mean general availability, legal/compliance completion, live billing, or universal integration readiness.

Every sprint follows distinct PM -> UX -> Engineering -> QA -> Deploy handoffs and must include SQL/RLS persona tests, advisor review, TypeScript and optimized production build, desktop/390/360 browser QA, two-user/two-session evidence, direct-URL denial, replay/idempotency/reconnect/failure recovery, timestamped screenshots, and audit-row evidence. One `[deploy] [qa-approved]` preview per coherent batch goes only to the separately configured demo environment. Production promotion remains a distinct later decision.

Owner differentiation direction: Passage wins by being stakeholder-agnostic and following the person through planning, nursing/hospice/care, family coordination, funeral-home operations, service partners, disposition, aftercare, and later estate work. The vision is now documented in `docs/product/persona-action-architecture.md` as stakeholder-agnostic continuity rails. Indispensability comes from permissioned portability, destination acknowledgment, lower repeated intake, task-bound communication, structured proof, and visible exception recovery—not data lock-in or an attempt to replace every vertical system.

Current market grounding reviewed for this decision: Passare emphasizes cloud case management, team/family collaboration, mobile access, reports, and dozens of integrations (`https://www.passare.com/` and `/manage`); Gather emphasizes case/task visibility, mobile team coordination, family invitations, autofill/e-sign, and real-time family collaboration (`https://gather.app/case-management/`); Tribute Management Software emphasizes an operational command center spanning cases, staff, locations, schedules, facilities, families, and reporting (`https://www.tributetech.com/tribute-management-software`). This reinforced the decision not to compete on a generic feature checklist. Passage's differentiated bar is one viewer-relative continuity record with explicit purpose/scope, human-reviewed prepared outcomes, handoff receipts, proof integrity, and a named next/recovery owner across organizational boundaries.

### Cycle 7A isolated-lab application and index follow-up

The test-only production-shape fixture and additive invited-employee foundation passed independent static SQL/RLS QA and were applied, in that order, to isolated project `uyacxqtsiwlvtmhxvoxr`. Migration history records `test_fixture_cycle_7a_production_shape` and `cycle_7a_invited_employee_foundation`. Production project `qsveqfchwylsbncsfgxe` remains untouched. The first large-file transport attempt was rejected on invalid encoding before migration recording; migration history proved no partial application, and the exact QA-approved source was then reconstructed in bounded chunks and applied successfully.

Post-apply catalog proof: invitation and invitation-location tables have RLS enabled and no anon/authenticated read or write grants; member-location has authenticated SELECT only and no client writes; public invite wrappers are SECURITY INVOKER with fixed empty `search_path`; privileged Passage functions are in `passage_private` with fixed empty `search_path`; direct raw invitation-table access remains unavailable. No family, participant, or vendor table was created or changed in the isolated lab.

Security advisor output contains only expected INFO notices for the six deliberately fail-closed fixture tables that have RLS and no policies. Performance advisor output identified uncovered foreign keys in the invitation, member-location, workflow, task, and event authority paths. What: add covering indexes for those foreign keys in `20260716093113_cycle_7a_index_hardening.sql`. Why: every invite/RLS/assignment/event lookup will sit on the operational request path and FK deletes/updates otherwise require avoidable scans. Breakage if skipped: pilot latency and database load grow with memberships/events, while referential actions can lock or scan more rows. This follow-up is additive, changes no data or authority, and must pass independent review and isolated-lab advisors before it is considered ready for any production plan.

Post-apply ACL simulation also found default `service_role` EXECUTE on the public SECURITY INVOKER wrappers even though those functions require an authenticated end-user context and the role cannot access the private cores. What: `20260716093406_cycle_7a_service_role_acl.sql` explicitly revokes those four misleading default grants, and the foundation source now includes the same revocation. Why: server code must pass a real user session for invitation authority rather than imply a service-role bypass. Breakage if skipped: catalog permissions suggest a trusted server path that always fails at runtime and could encourage later bypass design. This is privilege removal only; anon inspection and authenticated create/accept/revoke grants remain unchanged.

### Cycle 7A invitation-acceptance ambiguity recovery gate

PM recovery role `/root/pm_cycle7a_auth_recovery` received a behavioral QA FAIL after the first controlled acceptance attempt against isolated project `uyacxqtsiwlvtmhxvoxr`. PostgreSQL returned `42702` because the `RETURNS TABLE` output name `organization_member_id` in `passage_private.accept_organization_invitation(text)` collides with the unqualified conflict-target column in `ON CONFLICT (organization_member_id, organization_location_id)`. PostgreSQL rolled the command back transactionally: no membership, invitation acceptance, member-location grant, or audit-event row committed. Production project `qsveqfchwylsbncsfgxe` remains untouched, and operational-readiness percentages remain unchanged.

Documentation-first what/why/breakage analysis for the corrective migration:

- **What:** add a new follow-up Supabase migration that uses `CREATE OR REPLACE FUNCTION passage_private.accept_organization_invitation(text)` with the existing signature, return contract, security mode, fixed empty `search_path`, validation, locking, idempotency, event emission, and grants unchanged. Replace only the ambiguous inference clause with `ON CONFLICT ON CONSTRAINT organization_member_locations_pkey`. Do not rewrite the already-applied lab migration or use raw/ad hoc SQL. Apply the follow-up to the isolated lab first.
- **Why:** naming the existing composite primary-key constraint removes PL/pgSQL variable/output-column ambiguity while preserving the intended member-location upsert and the transaction's existing authority boundaries. A follow-up migration keeps migration history deterministic and makes the correction independently reviewable before any production plan.
- **Breakage if skipped:** every first-time invitation acceptance that reaches the location-grant upsert can fail with `42702`, leaving the invited employee unable to enter the workspace. Retrying cannot repair the deterministic failure, so onboarding remains non-operational even though inspection and authentication may succeed.
- **Breakage risk of the correction:** an incorrect constraint name, altered function attribute, or copied-body drift could break fresh migration runs, widen execution authority, weaken verified-email/token checks, create duplicate grants, or change replay behavior. Engineering must therefore diff the replacement body against the current function and change only the conflict target; QA must recheck `SECURITY DEFINER`, empty `search_path`, execute ACLs, and transactional/idempotent behavior.

Recovery acceptance: the follow-up migration applies cleanly to the isolated lab; the controlled invite accepts exactly once; one active organization membership and the exact invited location grants exist; the invitation records the accepted user/member/server timestamp; exactly one acceptance audit event exists; same-user replay returns the existing receipt without duplicate membership, grant, or event rows; wrong-email, expired, revoked, and second-user attempts remain denied; and a forced failure still leaves no partial rows. Until this retest passes, Cycle 7A QA remains FAIL/PARTIAL, no `[deploy] [qa-approved]` preview is authorized for live invitation behavior, and funeral-home/D2C operational readiness remains 40%/25%.

### Cycle 7A Auth foundation recovery verification and deploy handoff

Distinct role instances and handoffs:

- PM recovery `/root/pm_cycle7a_auth_recovery` received the behavioral `42702` failure, classified it FIX NOW, and recorded the documentation-first what/why/breakage gate above before SQL changed.
- UX `/root/ux_cycle7a_auth_handoff` set the acceptance bar for invitation disclosure, calm recovery language, protected role landing, 44-pixel targets, responsive layout, and the demo/preview boundary.
- Engineering `/root/eng_cycle7a_auth_ui` implemented the Auth/runtime shell, server authorization, invitation UI, corrective migration, and rollback-only SQL test. The corrective function body matches the foundation except for the named primary-key conflict target.
- QA `/root/qa_cycle7a_auth_foundation` independently returned PASS for the bounded Auth/route-guard foundation and authorized one non-production `[deploy] [qa-approved]` preview with Google and email providers disabled.
- Deploy role target: publish one guarded Vercel preview from `greenfield/passage-zero`, verify the canonical project, build/runtime health, route rendering, and fail-closed environment state. No production promotion is authorized.

Behavioral and data proof:

- Local Supabase PKCE/email-capture flow passed on one exact origin: OTP callback -> authenticated invitation -> deliberate POST acceptance -> replay-verified receipt -> `/staff`. Crossing between `127.0.0.1` and `localhost` correctly did not share cookies.
- The first acceptance exposed PostgreSQL `42702`; the command rolled back with no member, grant, accepted invitation, or event. Migration `20260716130000_cycle_7a_accept_invitation_conflict_constraint.sql` replaced only the ambiguous inference target with `ON CONFLICT ON CONSTRAINT organization_member_locations_pkey`.
- Corrected first acceptance created exactly one active staff membership, one Portland location grant, one server-timestamped invitation receipt, and one acceptance event. Same-user replay returned the stable receipt without duplication. A different authenticated user received `22023` and gained zero membership.
- Rollback-only test `supabase/tests/cycle_7a_accept_invitation_conflict_constraint.sql` passed and left no QA fixture residue. Catalog proof preserved `SECURITY DEFINER`, empty `search_path`, authenticated-only private execution, and no anon/service-role execution.
- The exact corrective migration is recorded in hosted isolated project `uyacxqtsiwlvtmhxvoxr` as version `20260717004417`. Production project `qsveqfchwylsbncsfgxe` remains untouched. Hosted security advisors report only the six expected fail-closed fixture INFO notices; performance advisors report unused-index INFO only in the empty lab.
- TypeScript and optimized Next.js 16 production build pass. Browser evidence at 1440, 390, and 360 shows no horizontal overflow for login, invitation review/receipt, verified staff authority, and staff-to-director denial. Evidence is under `docs/evidence/cycle-7a-auth/`.

QA/deploy boundary:

- PASS is limited to the Auth/route-guard foundation. Google and external email delivery remain disabled. No real external message was sent; local Mailpit captured only synthetic test mail.
- Hosted two-browser Auth behavior and the deployed Vercel isolated-project environment binding are not yet proven. Post-deploy QA must verify the preview's binding and confirm a mismatched or absent binding fails closed.
- Operational readiness remains funeral home **40%** and D2C **25%**. Guided readiness remains funeral home **94%** and D2C **85%**. This preview proves a guarded foundation, not durable assigned-work, notification/recovery, complete Case Room, or production readiness.
- Next highest-leverage action after preview verification: configure and prove the isolated preview data binding, run two independent hosted sessions through director invite -> staff acceptance -> role landing/replay/denial, then cut assigned workflow/task RLS onto the same authority spine.

Deploy result:

- QA-approved source commit `e13bb411ec6fed64cbcc203549ffd36c971908df` was published to `greenfield/passage-zero` with `release: authenticated funeral-home invitation foundation [deploy] [qa-approved]`.
- Exactly one new non-production preview was created in canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`: deployment `dpl_DWcXnAHAYvaJqfdw19awsdQQxfmg`, READY, target `null`, 37-second build window, 27-second build command. Errors-only build output is clean.
- Preview URL: `https://thepassageappio-lcoy7m45j-thepassageappio-7018s-projects.vercel.app`. Stable branch alias remains `https://thepassageappio-git-green-4c1c26-thepassageappio-7018s-projects.vercel.app`.
- The first generated share token incorrectly redirected to Vercel login. A freshly regenerated working login-route URL is `https://thepassageappio-lcoy7m45j-thepassageappio-7018s-projects.vercel.app/login?_vercel_share=RLV41GAiZXUDOUn0w0GgpEAsYwtoReiv`; Vercel reports expiry July 18, 2026 at 12:47:45 AM without labeling the displayed timezone.
- Post-deploy browser proof: `/login` renders the warm Auth surface and truthfully reports `Environment unavailable`; `/director`, exact `/director/intake?mode=manual`, and `/staff` render `Workspace access remains closed`; invalid invitation inspection fails closed. No organization, location, roster, case, family, or seeded operator data is exposed.
- Deployed `/login` has zero horizontal overflow at 1440, 390, and 360. Project runtime error clusters are empty for the verification window; deployment-scoped error/warning/fatal runtime logs are empty. `docs/evidence/cycle-7a-auth/deployed-login-mobile-390.png` records the deployed mobile state.
- Deploy status is therefore PASS for the guarded fail-closed preview and PARTIAL for operational Auth: Vercel preview environment variables are not yet bound to isolated project `uyacxqtsiwlvtmhxvoxr`, so provider actions remain unavailable. Production is unchanged.
- Deployment-control finding after the handoff commit: Vercel also built docs-only commit `432db9a52829b55aea107c0ee62e851e5a2ac516` as READY deployment `dpl_9WN27dmHmfYvPdNrkg9QavxHTpTZ` even though its message contains `[skip deploy]`. The product tree is identical to the QA-approved preview except for context/evidence files, but this means the greenfield Vercel project is not honoring the documented ignore-build gate. No cancellation capability was exposed through the connected Vercel tools, and the pinned CLI could not complete authentication before timeout. Stop creating follow-up commits until the ignore-build configuration is restored; treat this as a deploy-process defect, not a product or build failure.
- Latest verified working share URL: `https://thepassageappio-f5r9mc6vi-thepassageappio-7018s-projects.vercel.app/login?_vercel_share=iO5wxs2enoUBBsMMfOnvSxw5yxHe1vgp`; Vercel reports expiry July 18, 2026 at 12:52:22 AM without labeling the displayed timezone. The URL was opened in the browser and rendered the expected fail-closed login surface.
- PR #24 was updated with the Cycle 7A scope, proof, readiness boundary, latest share URL, isolated-project migration state, and the unexpected docs-only rebuild. No further commit or deployment was created after this finding.

### Cycle 7A hosted-auth cutover - PM Sprint Brief

Status: PM COMPLETE; no engineering or hosted configuration change is authorized until UX receives this handoff. This is the smallest next batch that can raise funeral-home operational readiness: turn the current guarded preview from a fail-closed Auth shell into a two-person, durable invitation proof against the isolated Supabase lab. It does not widen the batch into assigned-work RLS, Case Room, D2C, vendor fulfillment, or production promotion.

Role instance and prior handoff:

- Product Manager: `/root/pm_cycle7a_hosted_cutover`, Cycle 7A hosted cutover.
- Prior handoff received: Cycle 7A Auth foundation QA PASS and guarded-preview Deploy PASS/PARTIAL. The current preview renders safely but is not bound to `uyacxqtsiwlvtmhxvoxr`; a docs-only `[skip deploy]` commit also built unexpectedly.
- Next role targets: distinct UI/UX Review -> Development/Platform Engineering -> independent QA -> Deploy. UX is focused on the hosted sign-in/invitation/recovery experience; Deploy remains distinct and may publish only the one integrated non-production preview.

Sprint goal:

- Prove that a Northstar director and an invited Northstar employee can enter the hosted `greenfield/passage-zero` preview as two independent authenticated people, accept one location-scoped invitation exactly once, land in the correct workspace, and receive durable server-timestamped authority/audit evidence without exposing production, family, or broader organization data.
- Restore source-controlled Vercel deploy gating before spending that preview so docs-only or unapproved commits cannot silently create additional builds.

Requirements and sprint components:

1. **Source-controlled deploy gate repair.** The greenfield tree currently has `scripts/vercel-ignore-build.js` but no `vercel.json`, so the documented script is not guaranteed to run. Add the canonical-project `ignoreCommand` wiring and align the script with the operating guide: preview builds require the approved release markers; `[skip deploy]`, docs-only, unmarked, deploy-without-QA, and wrong-project cases cancel. Add a deterministic environment/message/project matrix test. Do not create a sacrificial docs-only commit just to test the gate; prove the matrix locally and confirm the integrated preview build log ran the gate. Official Vercel behavior is exit `0` = canceled and exit `1` = build continues; repository `vercel.json` overrides the dashboard Ignored Build Step.
2. **Branch-scoped preview binding only.** Bind Vercel Preview variables only for Git branch `greenfield/passage-zero` to isolated Supabase project `uyacxqtsiwlvtmhxvoxr`. Required public runtime values are the isolated project URL, its publishable key, `PASSAGE_RUNTIME=preview`, the exact isolated project ref, and the existing production-ref comparison used by the fail-closed guard. Do not place a secret/service-role key in the browser or Vercel runtime. Do not modify Production variables or bind any other preview branch.
3. **Redirect and environment proof before sign-in initiation.** With Google and app email controls still disabled, verify the deployed page reports the intended preview runtime/project binding, no seeded operator data appears before authentication, protected routes still fail closed, and the isolated Supabase Auth allow-list covers the exact stable branch callback plus the current deployment callback as needed. Use one exact origin throughout each PKCE flow. Supabase recommends exact production redirects and permits Vercel preview patterns; this batch should prefer the stable branch alias for repeatable testing and explicitly record every allowed preview pattern.
4. **Synthetic hosted identities without external delivery.** Create or reuse synthetic director and staff Auth users only in `uyacxqtsiwlvtmhxvoxr`. Generate controlled test Auth links through the isolated project's trusted admin/test path; do not enable Google, do not enable a public email sign-in button, do not send real email/SMS, and do not store an admin/service credential in the application. Provider controls remain disabled throughout this batch unless a later PM brief explicitly expands scope.
5. **Two independent hosted sessions.** In separately isolated browser storage contexts, authenticate the authorized director, create one staff invitation through the authenticated invitation RPC, inspect and accept it as the invited staff user, then prove `/staff` access, `/director` denial for staff, same-user invitation replay returning the original receipt, and a different authenticated user receiving no membership. The director and staff session evidence must not come from one shared cookie jar or a seeded identity switcher.
6. **Durable evidence.** Confirm exactly one active staff membership, the exact invited location grant, one accepted invitation with server timestamp/user/member, and one immutable acceptance event in the isolated database. Reload both hosted sessions and verify truth persists. Record actor, organization, role, location, invitation state, authoritative time, audience, and next action without disclosing raw tokens, invited email on public inspection, cookies, access tokens, keys, or family data.

Development objectives:

- Make deployment control deterministic in the repository and observable in Vercel logs.
- Make the existing runtime guard accept only the intended isolated project for this branch while preserving its production-project rejection.
- Use the existing Supabase SSR/PKCE, organization invitation, membership, location, and workflow-event foundations; do not introduce another identity, invitation, audit, or event model.
- Keep Supabase clients request-scoped, Auth responses uncached, redirects origin-consistent, and authorization derived from verified Auth identity plus durable membership/location rows—not user-editable metadata, workspace selection, email text alone, or a role label alone.

Acceptance criteria:

- `vercel.json` invokes the gate; automated matrix proves that only a canonical non-production `greenfield/passage-zero` release carrying the required deploy and QA markers builds, while `[skip deploy]`, unmarked, partial-marker, wrong-branch/project, and production cases fail according to the documented policy.
- One and only one new `[deploy] [qa-approved]` preview is created after all pre-deploy checks pass; no production deployment or docs-only follow-up build is created.
- Hosted `/login` renders the bound isolated environment while Google and public email actions remain disabled. Unauthenticated `/director`, exact `/director/intake?mode=manual`, and `/staff` retain their exact safe-next/fail-closed behavior.
- Director session A and staff session B are independently authenticated on the hosted preview. The director can create one location-scoped employee invitation; staff can inspect only approved invite metadata and deliberately accept it.
- Staff lands at `/staff`; direct `/director` access is denied with a calm role-correct recovery action. The staff user cannot create/revoke invitations or gain a second location/role.
- Same-user replay returns the stable receipt without a duplicate membership, location grant, or event. Wrong-email/second-user, expired, revoked, and malformed token tests fail closed without partial rows or metadata leakage.
- After reload in both sessions, the membership/denial result persists. Database evidence shows exactly one accepted membership, exact location grant, accepted invitation receipt, and one acceptance event, all with server-derived identity and time.
- TypeScript and optimized production build pass. Browser QA passes at 1440 desktop, 390, and 360 with zero horizontal overflow, no blocking console/hydration errors, visible keyboard focus, and minimum 44-pixel enabled targets. Real timestamped screenshots and redacted database/audit evidence are committed.
- Vercel build/runtime error scans are clean, the canonical project/team and branch are recorded, and PR #24 plus this operating context are updated without a post-release docs commit.

Dependencies:

- Healthy isolated Supabase project `uyacxqtsiwlvtmhxvoxr`, its publishable key, Auth admin/test access, and already-applied Cycle 7A corrective migration.
- Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, team `team_X0ta3bEEbRVGNM9xOwdBtCga`, branch-specific Preview environment management, Auth URL configuration, and deployment/build logs.
- Two truly isolated browser sessions or equivalent independent browser contexts; a single identity switcher does not qualify.
- Existing invitation RPCs, protected route shells, and warm Auth surfaces.
- Missing repository references noted but not recreated: `docs/release-train.md`, role briefs under `docs/agents/`, `docs/deployment-discipline.md`, `docs/UX-REDESIGN-BRIEF.md`, the rollout tracker, and `pages/system/admin/saas-roadmap.js` are absent from this greenfield workspace. `AGENTS.md`, this living context, and the persona architecture govern this batch.

QA plan:

1. Static security review of branch-scoped variables, redirect allow-list, runtime binding, server/client key placement, request-scoped SSR clients, no-store Auth responses, invitation RPC ACLs, and deploy-gate matrix.
2. Local TypeScript, optimized build, gate matrix, and focused invitation regression before any release marker.
3. Hosted environment-bound smoke with providers disabled and unauthenticated direct-route/invalid-invite denial.
4. Two independent hosted sessions: director Auth -> invitation creation -> staff Auth -> inspection -> deliberate acceptance -> `/staff` -> staff `/director` denial -> reload -> same-user replay.
5. Negative data tests: wrong user/email, expired, revoked, malformed token, repeated submit, unauthorized invite management, wrong location, and forced failure/no partial rows.
6. Redacted catalog/data proof for membership, location grant, invitation acceptance, event cardinality, server timestamps, and function/ACL invariants; run Supabase security/performance advisors and classify only expected isolated-fixture findings.
7. Visual/interaction checks at 1440, 390, and 360 plus keyboard, focus, target size, overflow, console/hydration, and exact safe-next checks.

Deploy plan:

- Engineering and QA prepare one integrated release candidate containing the gate repair and any necessary bounded runtime/redirect corrections. Preview environment and isolated Auth URL settings are configured before the release commit; public provider controls remain disabled.
- Deploy creates exactly one non-production commit on `greenfield/passage-zero` with the required `[deploy] [qa-approved]` markers only after independent QA PASS. Verify the source-controlled ignore command executes, the canonical project is used, and the resulting preview is READY.
- Complete hosted two-session verification against that deployment, capture screenshots/data/log proof, and update PR #24 and this context through the GitHub PR body/comment or by including prepared context in the integrated release commit. Do not push a separate docs/evidence follow-up while the gate repair is still being proven.
- Production promotion, Production environment changes, and production Supabase migration/application remain unauthorized and out of scope.

Risks and recovery:

- **Preview aliases and PKCE origins:** switching between the unique deployment URL, stable branch alias, share URL, or `localhost` can lose verifier/session cookies. Use one origin per flow and record it. If the protected preview requires a share token, establish protection access in each browser context before opening the Auth link.
- **Environment changes require a new deployment:** finish branch-scoped values and Auth redirect configuration before the single release. A misbound deployment is PARTIAL/FAIL, not permission for a blind deploy chain; repair source/config and re-enter PM/QA if another deploy would be required.
- **No UI team-invite surface yet:** invoking the existing authenticated RPC through a controlled test client is acceptable proof of the authority transaction, but it does not count as organization-team UX completion.
- **Additive foundation does not yet enforce assigned-work RLS:** successful membership Auth must not be described as durable case/task authorization. `/staff` is an authority shell, not proof that an employee can safely read assigned cases.
- **Deployment protection may obstruct Auth redirects:** test both sessions before declaring PASS; do not bypass protection or enter owner credentials into automation.
- **Synthetic identities and tokens:** never include credentials, links containing bearer tokens, cookie values, or private keys in screenshots, logs, commits, PR text, or user reports. Remove/expire synthetic invitations after QA if doing so does not destroy required audit evidence.

Non-goals:

- Assigned workflow/task RLS cutover, staff workload data, Case Room/realtime, notifications/outbox, address autocomplete, organization-owner onboarding, family/D2C account lifecycle, participant or vendor access, Google activation, public/external email delivery, production migration, production deployment, pricing/billing, legal/compliance claims, or broader redesign.

Owner gates:

- No new owner approval is required for branch-scoped preview variables, isolated-project Auth URL configuration, synthetic lab users, local/controlled Auth-link generation, repository deploy-gate repair, QA, or one non-production preview; these are within the approved isolated free test path and normal engineering/deploy work.
- Stop for the existing `AGENTS.md` gates only: any real external email/SMS, paid provider/plan change, production raw SQL or irreversible data change, production promotion, pricing change, or material legal/privacy/security claim. If the necessary isolated Auth admin or Vercel environment access is genuinely unavailable after connector/CLI/browser self-service, record the access blocker rather than substituting production credentials.

Readiness change rules:

- Current baseline remains funeral home **40% operational / 94% guided** and D2C **25% operational / 85% guided** until hosted evidence passes.
- Binding alone, a rendered login page, one authenticated user, a shared-cookie simulation, or fail-closed behavior earns **no increase**.
- If all hosted two-session invitation, replay, wrong-user/role denial, reload persistence, server audit, responsive QA, and deploy-control gates pass, funeral-home operational readiness may move to **45%**. This five-point increase recognizes durable hosted identity, membership, location grant, and invitation/audit proof only. D2C remains **25%** because family accounts/grants were not advanced.
- Funeral-home readiness remains capped below **50%** until assigned workflow/task RLS is enforced and two users prove authorized work plus cross-location/cross-organization denials. It remains capped below **80%** until durable notifications/recovery exist and below **85%** until the complete family-to-funeral-home handoff/proof-return path, support/observability, and pilot simulations pass.
- A PARTIAL result retains **40%/25%**, documents the failed criterion, and returns to PM. No percentage is awarded for visual polish or simulated authority.

Research grounding and scope effect:

- Supabase's current SSR guidance requires PKCE/cookie-based sessions and warns that authenticated responses must not be cached and request-specific clients must not be shared under Vercel Fluid compute: `https://supabase.com/docs/guides/auth/server-side` and `https://supabase.com/docs/guides/auth/server-side/advanced-guide`.
- Supabase's redirect guide recommends exact production callback URLs and documents Vercel preview patterns plus `NEXT_PUBLIC_VERCEL_URL`: `https://supabase.com/docs/guides/auth/redirect-urls`. This narrowed QA to one exact origin per session and made redirect configuration a pre-deploy gate.
- Vercel documents that `vercel.json` `ignoreCommand` overrides project settings and that exit `0` cancels while exit `1` continues: `https://vercel.com/docs/project-configuration/vercel-json` and `https://vercel.com/docs/project-configuration/project-settings`. The missing `vercel.json` is therefore classified FIX NOW, not a quota mystery.
- Vercel branch-specific Preview variables override general Preview values and only affect new deployments: `https://vercel.com/docs/environment-variables`. This requires completing the isolated branch binding before the single integrated preview.

Auto-advance handoff: PM scope is complete and moves to distinct UI/UX Review. No code, Vercel, Supabase, or production configuration was changed by this PM role.

### Cycle 7A hosted-auth cutover - UI/UX Review handoff

Status: **PASS TO ENGINEERING WITH CONDITIONS**. This is an experience-contract approval, not hosted QA. No product code, Vercel setting, Supabase setting, identity, or external configuration was changed by this role.

Role instance and prior handoff:

- UI/UX Review: `/root/ux_cycle7a_hosted_cutover`, Cycle 7A hosted cutover.
- Prior handoff received: PM `/root/pm_cycle7a_hosted_cutover` completed the bounded hosted director-invite -> employee-acceptance brief, retained disabled public providers, required two isolated authenticated sessions, and excluded assigned-work RLS, Case Room, D2C, vendors, and production.
- Required repository references `docs/release-train.md` and the UX role brief under `docs/agents/` are absent in this greenfield workspace, as already recorded by PM. The reviewer read the complete available `AGENTS.md`, living context, and persona action architecture; those sources govern this handoff.
- Next role target: distinct Development/Platform Engineering. Independent QA must evaluate every condition below on the integrated hosted preview before Deploy can report the cutover PASS.

Experience intent:

- A grieving or time-pressed employee should encounter one calm decision at a time: review the invitation scope, verify identity through the controlled link, deliberately accept, then enter the role-correct workspace. The UI must never make the person infer whether a disabled provider, invitation acceptance, or workspace request succeeded.
- A director and employee must understand that organization membership is not family access. The employee sees only the invited organization, role, and location scope; no case, family, roster, production-project, or broader organization data appears before durable authority is verified.
- Hosted proof must feel like an operational receipt, not a green success label: who accepted, what organization/role/location was granted, authoritative date and time with timezone, who can see the receipt, where it was saved, and what happens next.

Required screen and state sequence:

1. **Hosted preview entry:** login, invitation, and access-boundary surfaces show a plain non-production label such as `Isolated preview · no external messages`. Do not expose a Supabase project ref or other infrastructure identifier in persona-facing copy. The exact project binding belongs in redacted QA evidence. Unauthenticated protected routes continue to redirect or fail closed without flashing seeded operator content.
2. **Provider-disabled login:** Google and public email delivery remain visibly unavailable, with an adjacent explanation that no invitation or account was changed. If both are disabled, neither the email input nor its submit control may look like an available path. Remove misleading active `or` sequencing and make `Review invitation` the one obvious active action, supported by `Use the secure invitation link or paste the complete invitation code from your funeral-home administrator.` The controlled Auth link used by QA remains a test path, not a public-provider claim.
3. **Pre-auth invitation review:** show inviter, organization, role, exact active locations, purpose, and expiration date/time with timezone. Do not show invited email, roster, cases, family data, raw-token metadata, or a digest. State plainly that review does not join the workspace and never widens family access. The one primary action is `Continue to secure sign-in`.
4. **Authenticated confirmation:** repeat the organization, role, locations, and signed-in account immediately beside the consequential action. State that these values are read-only and that acceptance records the account and server time. The one primary action is `Accept invitation`; it changes to an announced `Accepting…` state and cannot be submitted again while pending. A failed response restores a usable retry without optimistic success.
5. **Accepted receipt:** show `Membership verified` only after the durable transaction is re-read. The receipt includes accepted account/actor, organization, role, locations, status, authoritative `Accepted` date/time with timezone in a semantic `time` element, audience/visibility, proof destination such as the organization membership/activity history, and next action. The primary action is role-relative (`Open My work` for staff). Same-user replay renders the same acceptance time and authority receipt; it must not imply a second acceptance.
6. **Role-correct landing and denial:** `/staff` identifies the verified account, organization, staff role, and authorized location and truthfully states that durable assigned work is not yet loaded. Direct `/director` access returns `This workspace is outside your role`, explains that employee membership opens My work, and makes `Open My work` the first recovery action. Sign-out remains available. It does not expose the director screen, seeded operator data, or a technical authorization error.

Failure and recovery acceptance:

- Malformed, expired, revoked, already-claimed-by-another-account, wrong-email/second-user, environment-mismatch, and temporary verification failures each have distinct text outcomes. Each says whether access changed (`No access was granted` or `Nothing was joined or changed`) and gives one safe next action: retry, use the accepting/invited account, or request a new invitation from the funeral-home administrator.
- Wrong-user and already-claimed states must not reveal the invited address, accepting account, valid-token hint, membership existence beyond the minimum state already permitted by the inspection contract, or any family/case detail.
- Error and success messages are persistent text, not color/icon alone; dynamic pending/result states are programmatically announced without unexpected focus movement. On a failed acceptance, focus moves to or is programmatically associated with the error summary, while the invitation details and retry action remain available.
- Provider-disabled controls use a normal unavailable cursor/state rather than a busy cursor. Only an in-flight action communicates busy state.

Responsive and accessibility bar:

- Verify the complete login -> review -> confirmation -> receipt -> staff -> director-denial sequence at 1440 desktop, 390x844, and 360x800. At 390 and 360 the details/receipt become a single readable column, the primary action stays visible in normal document flow, long names/locations/timestamps wrap, and document `scrollWidth` equals `clientWidth`.
- Every enabled control and recovery link has at least a 44-by-44 CSS-pixel hit area, clear Montserrat functional copy, visible non-obscured keyboard focus, logical focus order, and Enter/Space behavior appropriate to its semantic element. Disabled controls remain perceivable but are not focus traps or presented as working actions.
- Cormorant Garamond remains display-only; labels, timestamps, errors, helper text, controls, and receipt facts remain Montserrat. Preserve warm ivory paper and dusty low-saturation purple, blue, and green states. Error/success meaning must not rely on those colors alone.
- No blocking console error, hydration warning, duplicate-submit flash, stale receipt, or protected-content flash is acceptable. Screen-reader/status semantics are checked for unavailable provider state, acceptance pending/result, invitation errors, accepted receipt, and role denial.

Timestamp and evidence acceptance:

- Invitation expiration and membership acceptance are rendered from server values, never `Date.now()` or browser-authored proof. Each visible proof time includes calendar date, clock time, and timezone; relative time may be supplemental only.
- The replay receipt preserves the original server acceptance time. Reloading both independent sessions preserves the same organization/role/location authority and denial result without copying a cookie jar or using a seeded identity switcher.
- Screenshot evidence must include the visible system date/time or a paired redacted evidence manifest tying capture time, URL origin, session label A/B, viewport, and database event time together. Never capture bearer links, cookies, access tokens, private keys, raw invitation tokens, or real/synthetic login credentials.
- The redacted audit proof must match the receipt: actor/account, organization, role, location, invitation state, audience, acceptance time, proof destination/event, and next action. Database cardinality and ACL proof remain QA evidence rather than persona-facing copy.

UX QA stop conditions:

- FAIL if the two identities share browser storage, if a seeded identity switcher substitutes for Auth, if a provider appears available when disabled, if any pre-auth screen reveals email/family/case/roster data, if acceptance lacks a pending state, if receipt or replay lacks the original timezone-bearing server timestamp, if the proof omits audience or destination, if staff sees director content, or if mobile/keyboard/status-message checks fail.
- PARTIAL if the hosted authority flow passes but the source-controlled deploy gate or isolated branch binding cannot be proven. No readiness increase is earned by a visually correct local or shared-cookie simulation.
- PASS permits the PM-defined funeral-home operational estimate to move from 40% to 45% only when the complete two-session, replay, wrong-user/role denial, durable audit, responsive QA, and deploy-control gates also pass. D2C remains 25% operational.

Research grounding and effect on this handoff:

- W3C WCAG 2.2 Accessible Authentication requires an authentication path that does not depend on unaided recall/transcription and permits mechanisms such as email-link authentication and copy/paste: `https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html`. This preserved complete-code paste and prohibited puzzle-like or manually transcribed QA flows from becoming the product pattern.
- W3C WCAG 2.2 Error Identification and Error Suggestion require textual identification plus a known correction path: `https://www.w3.org/WAI/WCAG22/Understanding/error-identification` and `https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion`. This made each invitation failure state name both the unchanged-access truth and one recovery action.
- W3C WCAG 2.2 Status Messages requires programmatically determinable success, waiting, progress, and error updates: `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`. This added the announced acceptance-pending/result contract rather than relying on color or a page that appears unchanged during the server transaction.
- W3C WCAG 2.2 Focus Visible, Focus Not Obscured, Target Size, and Reflow guidance informed persistent keyboard focus, the product's stricter 44-pixel target bar, and the 360/390 no-overflow checks: `https://www.w3.org/WAI/WCAG22/Understanding/focus-visible`, `https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum`, `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum`, and `https://www.w3.org/TR/WCAG22/#reflow`.

Auto-advance handoff: UX scope is complete and moves to distinct Development/Platform Engineering. Engineering should treat the provider-disabled hierarchy, acceptance pending state, and audience/proof-destination receipt fields as FIX NOW experience conditions inside the bounded hosted cutover; no broader onboarding or assigned-work UI is authorized.

### Canonical operational roadmap - PM decision and handoff

Status: PM COMPLETE. The owner requested one visible, focused roadmap with current scores, both product paths, demo separation, production readiness, milestones to 85-90%, and time ranges. PM `/root/pm_cycle7a_hosted_cutover` created `docs/product/operational-readiness-roadmap.md` as the single internal source of truth for this greenfield repository and updated the stale Roadmap And Planning Rules in `AGENTS.md`.

Canonical-source decision:

- The legacy Pages Router file `pages/system/admin/saas-roadmap.js` named in older guidance is absent, and Passage Zero has no secure System Admin route yet. Requiring a nonexistent path made the roadmap invisible and encouraged percentages to live only in handoff history.
- The new canonical file is internal/System-Admin source material, not a public or persona roadmap. When a secure App Router System Admin route is implemented, it must render this roadmap or one structured source extracted from it; it must not maintain a second milestone set.
- `docs/agent-operating-context.md` remains the role/evidence ledger. It may quote the current roadmap decision but is not a competing roadmap. No product page, persona navigation, deployment, database, or external system changed in this PM action.

Current verified baselines remain:

- Funeral home: **94% guided / 40% operational**.
- Family/D2C: **85% guided / 25% operational**.
- Separate demo instance: isolated Supabase lab exists, but the hosted binding, deterministic reset, communication blocking, and smoke proof are incomplete; roadmap baseline **10% operational**.
- Production readiness: build/migration discipline exists, but production-safe identity/data/delivery/integration/support controls are not proven; roadmap baseline **10% operational**.
- Greenfield pages remain preview-only. The current hosted Auth preview is fail-closed and production pages are unchanged.

Critical-path decision:

1. Hosted director/staff identity and membership proof plus deploy-control repair.
2. Organization/location/assignment RLS, durable assigned work, revocation, and append-only command audit.
3. Durable funeral-home intake, Case Room, structured proof, notification recovery, realtime/reconnect, and a deterministic isolated demo instance.
4. D2C account lifecycle, independent family/participant grants, funeral-home handoff, family-safe communication/proof, recovery, and account/data controls.
5. Observability, one reliable integration adapter, backup/restore, support/break-glass runbooks, failure drills, persona simulations, and explicit high-risk owner review before an 85-90% allowlisted pilot claim.

Roadmap time ranges, assuming focused execution and no external owner-gated delay:

- Hosted Auth preview: **2-4 focused working days**.
- Assigned-work funeral-home authority: **1-2 focused weeks cumulative**.
- End-to-end funeral-home case loop plus isolated demo: **3-5 focused weeks cumulative**.
- Funeral-home 85-90% allowlisted pilot readiness: **approximately 5-8 focused weeks**.
- D2C 85-90% allowlisted pilot readiness: **approximately 7-11 focused weeks** after reusing the stable authority/case spine.

The next three integrated sprints are now fixed in the roadmap:

1. Cycle 7A hosted authority cutover, 2-4 days; full PASS may move funeral home only from 40% to 45%.
2. Cycle 7B assigned-work RLS, 4-7 days; full PASS may move funeral home to 55-60%, D2C remains 25%.
3. Cycle 8A funeral-home case operations plus isolated demo, 7-10 days; full PASS may move funeral home to 72-78%, D2C to 30-35%, and demo to 75%.

Readiness remains evidence-gated: no partial implementation, visual preview, local-only result, or seeded/shared-cookie identity advances a score. The next active handoff remains distinct Development/Platform Engineering for Cycle 7A, followed by independent QA and Deploy. The roadmap itself requires no deployment and does not interrupt the active hosted-cutover release train.

Documentation-first hosted-QA fixture decision before engineering changes:

- **What:** Engineering may create a new idempotent `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql` for isolated project `uyacxqtsiwlvtmhxvoxr`. It may seed only the synthetic Northstar organization, Portland location, and synthetic director membership/relational location grant required for hosted QA, plus the minimum narrow self-authority SELECT policies needed by the server resolver. Director and staff Auth users are created through the isolated Auth Admin API. The staff membership, location grant, accepted invitation, and acceptance event must be created only by the real director-invite/staff-acceptance RPC path, never preseeded.
- **Why:** the isolated production-shape fixture intentionally has fail-closed tables/policies. Hosted invitation and role-landing proof needs a reproducible synthetic director authority without borrowing production data or manually inserting result rows.
- **Breakage if skipped:** the preview can prove environment binding but cannot prove authenticated invitation authority or role landing; readiness remains 40%/25%. Manual lab edits would be irreproducible and could invalidate the event/audit cardinality evidence.
- **Breakage risk and controls:** a fixture executed against the wrong project could modify real memberships or policies. Its execution must preflight the exact isolated project ref, explicitly reject production ref `qsveqfchwylsbncsfgxe`, use reserved synthetic IDs and `@passage.test` accounts, assert collision/row-count expectations, retain evidence, and provide ordered cleanup. It contains no family, participant, vendor, customer, or production data; sends no external communication; and stores no credentials, service key, bearer token, or raw invitation token.
- **Classification:** test-only reversible fixture script, not a product migration, not recorded as a production migration, and not permission for ad hoc production SQL. Production-grade self-authority and assigned-work RLS remain Cycle 7B migration work behind its own what/why/breakage and backfill gate.

### Cycle 7A hosted-QA fixture - Development/Data Engineering handoff

Status: SOURCE COMPLETE; NOT APPLIED. Development/Data Engineering role `/root/eng_cycle7a_fixture` received the completed PM hosted-cutover brief, UX conditions, and the documentation-first hosted-fixture gate. It created only `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql`; no migration, hosted project, Auth user, Vercel setting, commit, or deployment was changed by this role.

Implementation boundary:

- The fixture requires a transaction-local project-ref attestation, rejects production ref `qsveqfchwylsbncsfgxe`, and accepts only isolated lab `uyacxqtsiwlvtmhxvoxr`. Its checklist also requires the executor to verify the connector/dashboard target independently before setting that attestation; a missing or mismatched value aborts before grants, policies, or rows change.
- Reserved synthetic IDs and `cycle7a-director@passage.test` are collision-checked. Exactly one director Auth user must already exist through the supported isolated Auth Admin path. The fixture seeds one synthetic Northstar organization, one Portland location, the one director membership, and its one relational location grant.
- Three SELECT-only authenticated policies expose only the signed-in user's active membership, organization, and granted active locations required by `lib/auth/authorization.ts`. The existing Cycle 7A member-location policy remains the authority for that relation. No INSERT/UPDATE/DELETE client policy is added.
- `cycle7a-staff@passage.test` appears only in the execution checklist. The fixture contains no executable staff membership, staff location grant, invitation, acceptance, or event write. Those outcomes must come from the real authenticated create/accept RPC path.
- The ordered post-evidence cleanup deletes synthetic events/invitations/members/location/organization, removes only the fixture policies/grants, and refuses cleanup if later workflow/task fixture data is attached. Auth-user removal remains an Auth Admin action.

Static verification PASS: executable DDL/DML target review found only the three narrow grants/policies and four allowed synthetic authority inserts; a comment-stripped scan found no staff identity or insert into `auth.users`, `organization_invitations`, or `workflow_events`; dollar-quote pairing and trailing-whitespace checks passed. No SQL was executed locally or against a hosted database, so independent QA must still parse/apply it transactionally in the isolated lab, exercise idempotent re-run and cleanup rollback, inspect ACL/RLS behavior as director/staff/wrong user, and run advisors before any hosted cutover PASS.

Research grounding: current Supabase RLS guidance requires explicit Data API grants separately from RLS, `TO authenticated`, and user-relative predicates such as `(select auth.uid())`; the April 2026 Data API breaking change makes explicit table grants intentional rather than assumed (`https://supabase.com/docs/guides/database/postgres/row-level-security` and `https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically`). This kept the fixture's grants explicit and its policies narrowly self-scoped.

Next role target: independent Data/QA review and isolated-lab execution only after connector target verification. Operational readiness remains funeral home **40%** and D2C **25%** until the complete hosted two-session milestone passes.

### Cycle 7A hosted-auth cutover - Development handoff (interrupted)

- Development role instance: `/root/eng_cycle7a_fast`; received the completed PM and UI/UX handoffs.
- Work stopped on parent request before an engineering patch was applied. This role changed no product, gate, package, runtime, Vercel, Supabase, or evidence file.
- Read-only verification found `vercel.json`, `scripts/test-vercel-ignore-build.js`, and an expanded `scripts/vercel-ignore-build.js` already present in the shared working tree from parallel work. The gate still needed a strict preview rule requiring literal `[deploy]` plus `[qa-approved]`; its `release:` shortcut was too permissive for preview, and `package.json` still lacked the matrix-test script.
- The existing login/invitation surfaces still needed the UX conditions for a single obvious invitation action when both providers are disabled, an announced disabled `Accepting…` state, and receipt audience/proof-destination fields. The staff-to-director denial already placed `Open My work` first.
- No test was run by this role. No commit or deployment was created. A read-only Supabase connector lookup confirmed an enabled publishable key exists for isolated project `uyacxqtsiwlvtmhxvoxr`; no secret or service-role credential was requested, stored, or changed.
- Next handoff: Development must finish the bounded gate/runtime/UX patch, then run the deterministic gate matrix, TypeScript, and production build before independent QA. Production and family/vendor surfaces remain untouched.

### Compressed operational-pilot roadmap - PM correction

Status: PM COMPLETE. Owner rejected the prior 5-11-week operational estimate and asked what actually consumes time. PM `/root/pm_cycle7a_hosted_cutover` revised the canonical roadmap without changing current readiness scores or weakening evidence gates.

Decision:

- The core allowlisted-pilot critical path is now **10-15 focused working days**, targeting funeral home **85-88% operational** and D2C **83-87% operational** if hosted authority, RLS, recovery, cross-persona proof, demo, and QA gates all pass.
- Full production hardening is explicitly separate and continues after the pilot. The compressed target holds out live external email/SMS, paid address-provider activation, broad live integrations, production migration, billing, general-availability support, and unresolved legal/privacy/security decisions. No unapproved claim or production promotion is included.
- Current verified scores remain funeral home **40% operational / 94% guided** and D2C **25% operational / 85% guided**. No schedule-driven score increase is authorized.

Why the earlier range was too long:

- It treated authority, funeral-home operations, D2C grants, demo isolation, and QA as mostly sequential and bundled full production hardening into the pilot estimate.
- The existing warm responsive screens, typed event spine, invitation migration, isolated Supabase lab, and guided cross-persona flows remove most net-new UI work.
- Four parallel lanes now run from Day 1: hosted Auth/data/RLS; funeral-home case operations; D2C identity/grants; and demo/QA/release evidence. The final handoff integrates only after the shared authority predicates pass.

What actually consumes focused time:

- Auth redirects/cookies, organization/location/assignment RLS, deterministic fixtures/backfill, and negative authority tests: about 30-35%.
- Idempotent event/outbox/retry/reconnect behavior and truthful failure recovery: about 20-25%.
- Family/funeral-home/participant grants, handoff receipts, task-bound communication, and family-safe proof: about 20-25%.
- Independent multi-session, SQL/RLS, device, failure-injection, logging, screenshot, and deploy verification: about 20-25%.
- Net-new screens are a small remainder; visual polish is not the critical path.

Compressed three-sprint plan:

1. **Days 1-3:** deploy-gate repair, isolated hosted binding, director/staff Auth invitation proof; begin D2C grant contract and demo reset in parallel.
2. **Days 4-8:** assigned-work RLS, durable intake/commitment/revocation/audit, and durable D2C identity/family-grant foundations on the same spine.
3. **Days 9-15:** Case Room, Transfer Pass acceptance, reviewed family update, structured proof, realtime/reconnect, simulated delivery/integration failure recovery, deterministic demo smoke, and full persona/device/evidence pass.

Production-hardening follow-on: production migration/backfill/rollback, live providers, broader integrations, load/restore drills, durable monitoring and support coverage, audited break-glass, security/privacy/legal decisions, billing, and general rollout. Its estimate is deferred until those owner/external inputs exist rather than padding the pilot timeline.

Next handoff remains Development/Platform Engineering for the active Cycle 7A bounded patch, followed immediately by independent QA and Deploy. The parallel D2C/demo lanes may prepare contracts and fixtures now but may not bypass the shared authority or evidence gates.

### Cycle 7A integrated source - independent QA handoff

Status: **PARTIAL / RETURN TO PM AND ENGINEERING** at 2026-07-16 21:43:30 -07:00. QA role `/root/qa_cycle7a_integrated_source` reviewed the current uncommitted integrated source against the Cycle 7A PM brief, UI/UX conditions, roadmap M1, and `AGENTS.md`. No SQL, hosted configuration, commit, or deployment was created. The release candidate must not receive `[qa-approved]` yet.

Verified PASS in source:

- `pnpm test:deploy-gate` passed all 11 cases: canonical approved preview, skip-marker precedence, unmarked preview, each partial-marker case, `release:` without literal preview deploy marker, wrong branch, wrong project, approved production release, feature-branch production denial, and local build. `vercel.json` parses as JSON and its `ignoreCommand` points to the tested script.
- `pnpm typecheck` passed. Development/root reported the optimized production build already passed; this QA role did not repeat that completed build before returning the source blockers.
- Static review found no service-role/private/secret credential in the reviewed runtime, login, invitation, gate, or fixture files. The committed Supabase credential is explicitly a publishable browser key.
- The production runtime guard fails closed when `VERCEL_ENV=production` is paired with the preview runtime, and the gate denies a production deployment from `greenfield/passage-zero`.
- With Google and email disabled, `LoginClient` renders only the explicit non-delivery status and one controlled invitation-code action. `AcceptInvitationButton` uses the server-action pending state, changes to `Accepting...`, and disables repeated submission. The accepted receipt renders the server value with date, clock time, timezone, explicit server-time label, audience, proof destination, and next action. Staff role denial keeps `Open My work` as the first recovery.
- The hosted fixture statically rejects missing, production, and non-lab project-ref attestations, requires the one exact supported director Auth user, collision-checks reserved synthetic identities, and contains no executable staff membership, staff location grant, accepted invitation, invitation row, acceptance event, or `auth.users` insert.

Blocking findings:

1. **Branch binding is not source-correct.** `vercel.json` places the isolated Supabase URL, publishable key, project refs, and `PASSAGE_RUNTIME=preview` in the top-level `env` object. Vercel documents this as static environment passed to all invoked functions and recommends project Environment Variables; branch-specific Preview variables must be configured for the exact Git branch. The source guard makes an accidental production deployment unavailable rather than leaking operator data, but merging this file to `main` would also inject preview runtime values and intentionally make production unavailable. Remove the top-level `env` object, retain `ignoreCommand`, and prove these values as Preview-only variables scoped to `greenfield/passage-zero` before the one integrated preview. Sources: `https://vercel.com/docs/project-configuration/vercel-json` and `https://vercel.com/docs/environment-variables`.
2. **The hosted fixture violates the migration discipline it claims to avoid.** `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql` executes three `GRANT SELECT` statements and three `DROP POLICY` / `CREATE POLICY` replacements, with corresponding policy/grant cleanup. Those are structural ACL/RLS changes. `AGENTS.md` requires every schema change to be documented first and applied through real Supabase migration tooling, not classified as a non-migration fixture. The what/why/breakage analysis exists, but the artifact classification and application path do not comply. Separate the ACL/policies into a documented isolated-lab migration applied via `apply_migration`, or defer them to Cycle 7B and keep the fixture DML-only. Do not apply this fixture as written.
3. **Hosted milestone evidence remains unproven.** Because the branch binding and fixture application are blocked, independent two-session hosted Auth, same-user replay, wrong-user denial, row/event cardinality, redirect allow-list, Vercel gate-log execution, runtime logs, and 1440/390/360 hosted visual evidence were not performed. Root supplied a local smoke at an actual 704-pixel viewport for the provider-disabled login, malformed invitation, and protected-route redirect; that is useful engineering evidence but does not satisfy independent M1 hosted QA or the required three-viewport matrix.

QA decision and next role:

- Return to Product Manager for the fixture-classification correction, then Development/Platform Engineering for the two bounded fixes above. Re-enter independent QA after the source is corrected and branch-scoped Vercel/Supabase configuration is available.
- Operational readiness remains funeral home **40%** and D2C **25%**. No preview or Deploy handoff is authorized from this PARTIAL result.

### Cycle 7A QA-PARTIAL recovery - PM decision

Status: FIX NOW / ENGINEERING AUTHORIZED. PM `/root/pm_cycle7a_hosted_cutover` received independent QA PARTIAL and kept both blocking findings inside the bounded hosted-authority sprint. No readiness credit or Deploy handoff is authorized yet.

Recovery decision 1 - Vercel environment scope:

- **What:** remove the repository-wide top-level `env` object from `vercel.json`; retain only `$schema` and the tested `ignoreCommand`. Keep the isolated Supabase URL, publishable key, project refs, runtime, and disabled-provider flags out of repository-wide Vercel configuration.
- **Why:** Vercel's top-level `env` applies static values across invoked functions/deployments rather than expressing the required exact-branch Preview binding. If merged, the current values would make a production deployment intentionally unavailable and would erase the environment-separation proof this sprint is meant to establish.
- **Breakage if skipped:** every branch or production deployment can inherit the isolated-preview runtime values; production remains fail-closed but unusable, branch isolation is unproven, and M1 cannot pass.
- **Breakage risk/recovery:** removing the source values means previews without externally configured branch variables render the already-verified fail-closed environment state. That is the correct safe fallback. Engineering must rerun the gate matrix, TypeScript, and optimized build after removal.
- **External blocker:** the required Vercel variables must be configured as Preview variables scoped specifically to Git branch `greenfield/passage-zero`. Current connected access does not expose credentialed branch-environment mutation, so hosted binding remains an external credential/access blocker after the source correction. Do not reintroduce values into `vercel.json`, use Production variables, or request/store a secret/service-role key as a workaround.

Recovery decision 2 - hosted QA ACL/RLS migration discipline:

- **What:** create a new isolated-lab-only Supabase migration containing only the three authenticated SELECT grants and three narrowly self-scoped organization/membership/location policies currently embedded in `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql`. Create the migration through the Supabase migration workflow and apply it only to project `uyacxqtsiwlvtmhxvoxr` using Supabase migration tooling. Give every policy a lab-specific name. Remove all `GRANT`, `REVOKE`, `DROP POLICY`, and `CREATE POLICY` statements from the fixture, including cleanup; keep the fixture DML-only for guarded synthetic organization/location/director membership/location-grant rows.
- **Why:** Data API grants and RLS policies are structural authority changes. Recording them in migration history makes the lab state reproducible, reviewable, advisor-visible, and separable from repeatable persona data. Fixture reruns must never silently replace authorization policy.
- **Breakage if skipped:** applying the fixture as written violates the documented migration discipline, structural state can drift across reruns/cleanup, and independent QA cannot trust or reproduce hosted authority evidence.
- **Breakage risk:** an incorrect or wrong-target migration could expose organization, membership, or location rows more broadly than intended, revoke access needed by another policy, or collide with later Cycle 7B enforcement. The migration must assert the expected isolated production-shape relations, use only `TO authenticated` plus user-relative active-membership/location predicates, add no client write policy, use lab-specific names, and be applied only after connector target verification rejects production ref `qsveqfchwylsbncsfgxe`.
- **Reversibility:** structural rollback is a separate isolated-lab follow-up migration that drops only the lab-named policies and revokes only the grants introduced by this lab migration after checking no later lab policy depends on them. Persona cleanup deletes only reserved synthetic DML rows in dependency order. Production is untouched; the disposable lab may be removed after retained evidence, but that is not a substitute for migration-record clarity.
- **Data boundary:** no family, participant, vendor, customer, case, task, production row, external communication, password, bearer token, raw invitation token, service key, or production credential is added by the migration or fixture.

Engineering correction acceptance:

1. `vercel.json` contains no `env` object and the 11-case deploy-gate matrix still passes.
2. The new lab migration is independently reviewed, applies through Supabase migration tooling to `uyacxqtsiwlvtmhxvoxr`, appears once in migration history, passes catalog/ACL/RLS inspection and advisors, and is never applied to production.
3. The hosted persona fixture contains no executable DDL/ACL/policy statement and remains idempotent, project-guarded, collision-checked, and DML-cleanup reversible.
4. TypeScript and optimized production build pass; independent QA then rechecks source and hosted evidence when branch-scoped Vercel access is available.

Role handoff: PM returns immediately to Development/Platform/Data Engineering for these two corrections, then to independent QA. The Vercel branch-binding access blocker may keep hosted QA PARTIAL, but it does not block safe source/migration correction or local/isolation testing. Operational readiness remains funeral home **40%** and D2C **25%**.

### Owner-requested handoff note - 2026-07-16 21:50 -07:00

Repository and release state:

- Repository: `thepassageappio/thepassageappio`; branch: `greenfield/passage-zero`; draft PR: `#24`.
- Canonical internal roadmap: `docs/product/operational-readiness-roadmap.md`. It supersedes the older sequential estimate and targets a tightly allowlisted operational pilot in **10-15 focused working days**, with full production hardening tracked separately.
- Verified readiness remains funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**. The full compressed-pilot evidence gate may move those to funeral home **85-88% operational** and D2C **83-87% operational**; dates alone never move a score.
- Production, family access, participant access, vendor fulfillment, pricing, and live external messaging were not changed. No new preview or production deployment was authorized in this batch.

Completed and verified in the current source batch:

- Added source-controlled Vercel ignore-build wiring in `vercel.json`; removed the unsafe repository-wide preview environment values after QA review.
- Tightened the preview release gate so only the canonical project, exact `greenfield/passage-zero` branch, literal `[deploy]` plus `[qa-approved]`, and no skip marker can build. The deterministic 11-case matrix passes.
- Added the provider-disabled isolated-preview hierarchy: Google/email actions stay unavailable and the controlled invitation-code review is the only active login action.
- Added a duplicate-safe, announced `Accepting...` invitation state and strengthened the acceptance receipt with the original timezone-bearing server timestamp, visibility/audience, proof destination, and next action.
- Preserved staff-to-director denial with `Open My work` as the primary recovery. Family and vendor surfaces remain unchanged.
- TypeScript and the optimized Next.js production build pass. Local smoke verified the isolated-preview label, one active invitation action, malformed-invitation denial, and unauthenticated `/director` redirect. The local browser was 704 pixels wide, so it is supporting evidence only, not the required 1440/390/360 release proof.
- Created the canonical roadmap and compressed four-lane plan: hosted Auth/data/RLS, funeral-home operations, D2C identity/grants, and demo/QA/release evidence advance in parallel.

Current QA decision and blockers:

- Independent QA is **PARTIAL**; no `[qa-approved]` marker and no deploy are permitted yet.
- Source blocker 1 is corrected: `vercel.json` now contains only `$schema` and `ignoreCommand`. The remaining hosted blocker is credentialed Vercel access to set the required Preview variables only for `greenfield/passage-zero`; the connected read/deploy tools do not expose branch-environment mutation. Do not work around this with repository-wide or Production variables.
- Source blocker 2 is documented and queued: the hosted persona fixture currently mixes synthetic DML with `GRANT` and RLS policy DDL. Engineering must move those six structural authority statements into a lab-named migration, keep the fixture DML-only, and apply the migration only to isolated project `uyacxqtsiwlvtmhxvoxr` through Supabase migration tooling. Production project `qsveqfchwylsbncsfgxe` is explicitly prohibited.
- Hosted director/staff two-session proof, redirect allow-list, replay/wrong-user/cardinality checks, Vercel gate log, runtime logs, and 1440/390/360 screenshots remain unproven and therefore earn no readiness increase.

Exact next handoff:

1. Development/Data Engineering splits the hosted fixture DDL into the documented isolated-lab migration and reruns static checks.
2. Independent QA reviews the migration/fixture separation; Deploy remains closed until PASS.
3. Configure exact-branch Vercel Preview variables and isolated Supabase Auth redirects without touching Production variables.
4. Create synthetic director/staff Auth users through the isolated Auth Admin path, apply the lab migration through migration tooling, and seed only the guarded director fixture.
5. Run two independent hosted sessions: director creates the location-scoped invitation; staff inspects and accepts; prove `/staff`, staff `/director` denial, reload persistence, same-user replay, wrong-user denial, and exact membership/location/invitation/event cardinality.
6. Run TypeScript/build plus hosted desktop 1440, mobile 390, and mobile 360 QA; commit timestamped screenshots and redacted audit evidence; publish exactly one `[deploy] [qa-approved]` preview; update PR `#24` and this context in the integrated release commit.
7. Auto-advance immediately to Cycle 7B assigned-work RLS, workload, reassignment, revocation, and append-only command audit. Vendor fulfillment stays queued until location and ownership semantics pass.

Role state: PM recovery is complete; UX acceptance is complete; Development source work is partially complete; independent QA returned PARTIAL; Deploy is not authorized. The release train remains active and the next role target is Development/Data Engineering for the bounded fixture/migration correction.

### Cycle 7A QA-PARTIAL recovery - isolated migration applied, hosted credentials gated - 2026-07-16 22:31 -07:00

Owner parity directive:

- Frontend/backend contract parity is now a standing release gate in `AGENTS.md` and the operational-readiness roadmap. For every slice, PM must identify the visible persona action/state, server command or query, durable rows, RLS/authority predicate, append-only event/proof for state change, failure/recovery behavior, and persona projection. Engineering advances those elements together; QA rejects either a UI claim the backend cannot prove or a backend capability presented as available before the UI truthfully exposes it.
- Cycle 7A remains bounded to current invitation authorization and hosted invitation UI. The isolated self-authority policies expose only the current user-relative organization, membership, and location reads required by that UI. Assigned-work authority is not implied by these policies and remains explicitly queued for Cycle 7B with its workload, reassignment, revocation, and append-only command-audit UI states.

Role and source disposition:

- PM classified the two QA findings as FIX NOW without changing scope or readiness. UX independently confirmed that the SQL artifact split changes no persona copy, layout, family boundary, vendor state, or established 1440/390/360 acceptance conditions.
- Development/Data Engineering created `supabase/migrations/20260717051552_cycle_7a_isolated_lab_self_authority.sql` through the migration workflow. It contains exactly three authenticated `SELECT` grants and three lab-named, user-relative self-authority policies; it adds no client write policy and fails closed on missing lab markers, schema/RLS drift, existing target grants/policies, or existing authority rows.
- Development removed every executable ACL, policy, and DDL statement from `supabase/test-fixtures/cycle_7a_hosted_auth_personas.sql`. The fixture remains project-attested, production-rejecting, collision-checked, idempotent, guarded-cleanup reversible, DML-only, and limited to the synthetic organization, location, director membership, and director location grant. It does not seed staff authority, invitations, acceptance, audit events, or `auth.users`.
- Independent QA passed the migration/fixture separation and authorized migration application only after exact isolated-project verification. The deterministic deploy-gate matrix passes all 11 cases. Root verification also passed `pnpm typecheck` and the optimized `pnpm build` after restoring frozen dependencies.

Hosted database evidence:

- Supabase target verification identified isolated project `uyacxqtsiwlvtmhxvoxr` (`passage-cycle-7a-test`) and separately identified prohibited production project `qsveqfchwylsbncsfgxe`. The new migration was applied exactly once to the isolated project through Supabase migration tooling and appears once in its migration history as `cycle_7a_isolated_lab_self_authority`.
- Post-apply catalog inspection proves exactly the three lab policies and authenticated `SELECT` on organizations, locations, and memberships, with no authenticated insert/update/delete privilege. Authority-row counts remain zero before fixture seeding. A read-only production migration-history check proves the migration name is absent from production.
- Supabase security advisors report only the expected fail-closed Cycle 7B tables with RLS enabled and no policy. Performance advisors report unused-index informational findings expected in the empty isolated lab. Neither result authorizes readiness credit.

External credential gate and exact continuation:

- No synthetic director or staff Auth user currently exists in the isolated project. The guarded fixture has not been seeded. Vercel Preview variables, Supabase Auth redirects, Auth Admin users, hosted sessions, screenshots, and hosted cardinality evidence remain untouched because neither the Vercel CLI nor the Vercel/Supabase browser sessions are authenticated in this workspace. No secret was requested or exposed, and no repository-wide or Production environment value was restored.
- Deploy remains closed: no preview was published, no `[qa-approved]` marker was added, PR `#24` was not updated, and operational readiness remains funeral home **40%** and D2C **25%**. The guided figures remain funeral home **94%** and D2C **85%**.
- Owner action required by the explicit credentials/access gate: authenticate the existing Vercel and Supabase browser/CLI sessions without sharing credentials. Then Deploy can configure only branch `greenfield/passage-zero`, configure only isolated Auth redirects, create the synthetic Auth users through Auth Admin, seed the guarded director fixture, and return to independent hosted QA for the full two-session, replay/denial/cardinality, runtime-log, and 1440/390/360 evidence gate. Exactly one non-production preview is permitted only after full PASS.

### Cycle 7A Deploy re-entry - explicit sequencing gate - 2026-07-16 22:31 -07:00

Deploy decision: **PARTIAL / CLOSED**. Deploy independently confirmed the canonical Vercel project/team, exact allowed branch, draft PR/head alignment, isolated-only migration history, production absence, and bounded migration/fixture QA PASS. It also confirmed that the deployed ignore gate predates the uncommitted repair and built the current `[skip deploy]` head; pushing before the integrated gate is ready could therefore create an unintended preview. No push is authorized.

PM re-entry identified a real release-sequencing contradiction rather than an engineering defect:

- Exact-branch Vercel Preview environment changes apply only to a new deployment, so the required hosted application sessions cannot be proven on an existing preview after those variables are staged.
- The current owner instruction permits exactly one new non-production preview only after the complete hosted evidence gate and requires that preview to carry `[deploy] [qa-approved]`.
- `AGENTS.md` and the roadmap prohibit a truthful `[qa-approved]` marker until independent hosted QA has actually passed. A throwaway preview, a second preview, a gate bypass, repository-wide or Production variables, or relabeling local/shared-context proof as hosted proof would violate the release contract.

Safe PM decision: Deploy and hosted mutation remain closed, scores remain unchanged, and no approval semantics will be weakened implicitly. All source, migration, advisor, typecheck/build, gate, runbook, and evidence-manifest preparation may continue. Before the integrated release commit, the owner must resolve this explicit sequence gate. PM recommends one narrow exception: authorize the sole new non-production deployment as a **verification preview** with a truthful pre-QA status distinct from `[qa-approved]`; run complete independent hosted QA against that same preview; if it passes, update PR/context/evidence without creating a second preview. Any implementation of that exception must also explicitly reconcile the ignore gate. The alternative is an explicit one-time redefinition of `[qa-approved]` as pre-deploy approval with hosted QA pending, which PM does not recommend because it makes the marker misleading.

The frontend/backend parity matrix for this bounded slice remains fixed: director create, staff inspect/accept, receipt, `/staff`, director denial, replay, and recovery UI map to the verified Auth session, invitation commands/RPCs, exact durable invitation/membership/location-grant rows, self-authority and invitation predicates, exactly one append-only acceptance event with server actor/time, denial without partial effects, and the correct director/staff projection. Family/vendor stay unchanged and assigned-work authority stays queued. Independent QA must reject drift in either direction.

### Cycle 7A owner-authorized verification preview and parity correction - 2026-07-17 20:04 -07:00

Owner decision: Steve explicitly authorized the PM-recommended one-preview sequencing exception. This authorizes exactly one non-production **verification preview** before hosted QA; it does not authorize `[qa-approved]`, Production, a second preview, repository-wide environment values, or any readiness increase.

PM Sprint Brief status: **COMPLETE**. Goal: close the Cycle 7A backend-ahead contract gap by adding a reachable director-only, location-scoped invitation creation surface that uses the existing `create_employee_invitation` RPC and feeds the existing staff inspect/accept flow. Requirements and acceptance are: server-derived eligible locations only; no direct table writes; explicit pending/success/denial/conflict/retry states; receipt with actor, recipient, location, server proof, visibility, delivery state, expiry, and next action; exact invitation/location/event cardinality before acceptance; exact membership/location/accepted-event cardinality afterward; replay and wrong-user denial; `/staff` persistence and `/director` denial; 1440/390/360 responsive and accessibility proof. Family/vendor, Cycle 7B assigned work, Production, and real delivery remain non-goals.

UX decision: **PARTIAL / FIX NOW**. Independent UX review found that the backend creation RPC existed but no reachable director route/component called it. Creating the hosted invitation through SQL, dashboard, or a hidden RPC would violate the new frontend/backend parity gate and cannot satisfy the owner-requested proof. The sole preview slot remains unspent until Development closes this UI/backend gap and local QA passes.

Engineering deploy-gate correction: the source gate now recognizes the literal, cycle-specific `[deploy] [cycle-7a-verification-preview]` combination only for Vercel Preview, canonical project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, and exact branch `greenfield/passage-zero`. Skip markers still win. The exception is explicitly denied for Production even when combined with `[qa-approved]`; ordinary `[deploy] [qa-approved]` behavior remains unchanged. The expanded deterministic matrix passes all 16 cases. The exception must be removed/closed in the post-QA integrated `[skip deploy]` commit so it cannot become a standing bypass.

Credential state: current Vercel CLI has no authenticated credentials. Chrome reaches Vercel and Supabase sign-in pages but has no active dashboard session. Source implementation and local verification continue; branch environment configuration, Auth redirects, Auth Admin users, fixture seed, and the one preview remain gated on the owner signing in without sharing credentials.

Cycle 7A creation-idempotency backend correction (documentation-first gate):

- **What:** add a nullable client request UUID to `organization_invitations`, a unique organization/request index, and a new authenticated `create_employee_invitation_idempotent` RPC. The function must serialize live invitation creation by organization plus normalized email, replay an existing request or identical live pending invitation without returning the raw token again, and delegate first creation to the already-reviewed invitation command so the existing single append-only creation event remains authoritative.
- **Why the frontend needs it:** disabling a pending button prevents only a same-tab double click. Lost responses, reloads, parallel tabs, and concurrent requests could currently create multiple invitation rows and multiple `organization_invitation.created` events while the UI claims one pending invitation. The director receipt and exact-cardinality evidence cannot be truthful without database-enforced deduplication.
- **Breakage if skipped:** frontend and backend drift under retry; duplicate live credentials and audit events can exist; the one-invitation proof and hosted QA must fail.
- **Risk and recovery:** the correction is additive and leaves the existing RPC intact for compatibility. A replay returns the existing id/hint/expiry with `raw_token = null` and a truthful recovery state; it never reconstructs a stored credential digest. A request-id collision with different input fails closed. Structural application is isolated-project-only through Supabase migration tooling after independent review; Production `qsveqfchwylsbncsfgxe` remains prohibited.

Post-apply ACL hardening (documentation-first gate): the isolated migration applied successfully and postconditions proved the new authenticated RPC, revoked old entrypoints, request column/index, zero starting cardinality, and Production absence. The Supabase security advisor then correctly flagged the public wrapper because it was `SECURITY DEFINER`. **What:** a follow-up migration changes only the public wrapper to `SECURITY INVOKER` and grants authenticated execution on the new private idempotent implementation; the old private/public creation functions remain revoked. **Why:** `passage_private` is not a Data API exposed schema, already grants schema usage for the established wrapper pattern, and the private implementation performs explicit Auth, organization, location, and replay-scope checks. This preserves the required privilege chain without exposing a public security-definer RPC. **Breakage if skipped:** the advisor warning remains and the public API has a broader execution posture than needed. **Breakage if misapplied:** omitting the private grant makes the wrapper fail closed with permission denied; restoring either old creation grant reopens duplicate bypass. Apply only through migration tooling to isolated `uyacxqtsiwlvtmhxvoxr`, never Production.

### Cycle 7A parity implementation and isolated idempotency proof - 2026-07-17 20:38 -07:00

Role handoff and decisions:

- PM completed the director-invitation Sprint Brief and classified the missing preview password session path FIX NOW. UX independently found and blocked both backend-ahead creation drift and frontend-behind-Auth drift before the verification preview. Development implemented the bounded corrections. Independent QA initially failed non-idempotent creation, token prefetch, replay truth, old-RPC bypass, privilege-chain, cross-location replay, and persisted-inviter defects; each was corrected and QA then passed both migrations for isolated application.
- The director workspace now links to `/director/invitations/new`. That route derives organization and active locations from the verified server-side viewer, calls only the new idempotent RPC, and shows truthful created, replayed-pending, validation, denial, conflict, and unavailable states. The receipt uses persisted purpose, scope, inviter, expiry, state, event destination, delivery `not_sent`, and next action. Raw-token links disable Next prefetch and are absent on replay.
- The provider-disabled isolated Preview login now has a real `signInWithPassword` path for Auth Admin synthetic accounts. It is enabled only by `PASSAGE_PREVIEW_PASSWORD_AUTH_ENABLED=true` together with Vercel Preview, Passage preview runtime, and exact isolated project ref `uyacxqtsiwlvtmhxvoxr`; Production and every other project fail closed. No credential is stored in source or rendered copy.
- The one-use Vercel exception remains `[deploy] [cycle-7a-verification-preview]`, exact canonical project/branch/Preview only. It remains explicitly forbidden in Production and will be removed in the post-QA `[skip deploy]` integrated commit.

Verification:

- `pnpm typecheck`, optimized `pnpm build`, and the expanded 16-case deploy-gate matrix pass. The build includes dynamic `/director/invitations/new`.
- Migration `cycle_7a_invitation_creation_idempotency` applied once through Supabase migration tooling to isolated `uyacxqtsiwlvtmhxvoxr` as version `20260718033341`. It adds request identity, serializes organization/email creation, replays existing live invitations without reconstructing the raw token, returns persisted scope/purpose/inviter/state, rejects cross-scope replay, and revokes authenticated execution of the old duplicate-capable public/private commands.
- Follow-up `cycle_7a_invitation_idempotency_acl_hardening` applied once to the same isolated project as version `20260718033709`. Post-apply catalog proof: public wrapper `prosecdef=false`; authenticated can execute the new public and new checked private functions; anon cannot; authenticated cannot execute either old creation function. Both migration names are absent from Production `qsveqfchwylsbncsfgxe`.
- Security advisors are clear of the temporary public-security-definer warning. Remaining INFO findings are the expected fail-closed Cycle 7B tables (`tasks`, `workflows`, `workflow_events`) with RLS and no policies: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy. Empty-lab unused-index INFO remains expected: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.
- Starting isolated cardinality remains zero invitations, zero invitation-location rows, zero memberships, and zero invitation events. Real authenticated first-create/replay/cardinality proof still requires the two Auth Admin users and director fixture.

Current external gate and next exact action:

- No verification preview has been created and no `[qa-approved]`, commit, push, PR update, screenshot claim, or readiness increase has occurred. Vercel CLI still has no credentials; Chrome Vercel and Supabase dashboard tabs are left at their sign-in screens as explicit handoffs.
- Steve must sign in to both Vercel and Supabase in those open Chrome tabs and report ready, without sharing credentials. Then Deploy configures the ten exact-branch Preview variables (the existing nine plus `PASSAGE_PREVIEW_PASSWORD_AUTH_ENABLED=true`), configures only isolated Auth redirects, creates the director/staff synthetic users through Auth Admin, runs the guarded DML fixture, and spends the sole authorized verification-preview slot. Independent hosted QA then proves create/replay/wrong-user/acceptance/denial/reload/cardinality and 1440/390/360 evidence on that same preview.
- Operational readiness remains funeral home **40%** and D2C **25%**; guided readiness remains funeral home **94%** and D2C **85%**. Production remains untouched.

### Cycle 7A hosted re-entry parity audit - FIX NOW - 2026-07-18 03:55 -07:00

Authenticated target verification:

- Vercel browser access is authenticated to the canonical `thepassageappio` project. Supabase browser access is authenticated directly to isolated project `passage-cycle-7a-test` (`uyacxqtsiwlvtmhxvoxr`). Production project `qsveqfchwylsbncsfgxe` was not opened or changed.
- The Vercel CLI still requires its separate device authorization. No Preview variable, Auth setting, Auth user, fixture row, deployment, PR marker, readiness score, or Production value has changed in this re-entry.

Independent Engineering parity audit decision: **FAIL / FIX NOW before hosted mutation**.

- **Unreachable frontend contract:** `/director/invitations/new` is nested under `app/director/layout.tsx`, but `OperationalBoundary` currently renders director children only for the demo runtime. The password-auth path is deliberately available only in the exact isolated Vercel Preview runtime. Without a narrow verified-preview route allowance, a real director session can authenticate but can never reach the invitation command UI. Engineering must permit only the real, server-authorized invitation route in the isolated Preview and must not expose the sandbox director dashboard, weaken Production, or change family/vendor access.
- **Visibility-copy drift:** the invitation receipt currently says only authorized directors and the verified invitee can see the invitation. The backend intentionally permits pre-auth inspection to anyone possessing the secure raw link until expiry or revocation; acceptance remains restricted to the exact verified invited email. The UI copy must state that boundary truthfully.
- **Timestamp-proof drift:** the Server Action currently invents `new Date().toISOString()` after the RPC and labels it a Passage server receipt. That timestamp is not the durable invitation `created_at` or append-only creation-event time. The frontend must display a persisted database timestamp and invitation ID, or stop claiming authoritative timestamp proof.

Documentation-first backend correction for timestamp proof:

- **What:** add a versioned authenticated invitation-creation receipt RPC that preserves the current idempotency, replay, organization/location authority, old-command revocations, and raw-token non-recovery behavior, while returning the persisted invitation `created_at`. The old idempotent client entrypoints will be revoked after the versioned RPC is available; the underlying checked implementation remains internal.
- **Why the frontend needs it:** the task/proof contract requires actor, recipient, state, durable timestamp, and lookup identity. A response-generation clock cannot truthfully be labeled database or append-only proof, and a replay must show the original creation time rather than the replay time.
- **Breakage if skipped:** the director UI is frontend-ahead of durable proof and can misstate when the invitation was created; same-request replay displays a different invented time while claiming the original event was preserved.
- **Failure/recovery:** first creation and replay return the same invitation ID and persisted creation time; replay still returns no raw token. Missing authority, payload conflicts, and unavailable receipts fail closed. Apply the structural RPC change only through Supabase migration tooling to isolated `uyacxqtsiwlvtmhxvoxr`; never Production `qsveqfchwylsbncsfgxe`.

External parity lane:

- A delegated agent pushed contract-ledger/checker commits through `5bb292a` to `origin/greenfield/passage-zero`. Root fetched and inspected those commits. Its ledger correctly detected the backend-only state on the remote head, but it predates the current uncommitted invitation UI and therefore must be reconciled to the real reachable route and versioned RPC before it can be accepted. Root will run the checker and its deliberately failing fixtures locally; no GitHub Workflows permission expansion is required for this Cycle 7A gate.

FIX NOW implementation and verification:

- Engineering added a server-derived pathname gate which admits only exact path `/director/invitations/new` when runtime is Preview, the configured project is isolated ref `uyacxqtsiwlvtmhxvoxr`, the preview password gate is enabled, and the existing server-side viewer resolves to owner/director with an active location. The page repeats the runtime/role guard before mounting the form. `/director`, `/director/intake`, `/staff`, subpaths, demo, Production, wrong refs, disabled-password state, and unavailable configuration remain denied. The Preview director authority placeholder exposes only the controlled invitation link; seeded dashboard/case data remains withheld.
- Engineering corrected invitation visibility to state that link possession permits inspection until expiry/revocation while acceptance requires the exact verified invited account. Root removed Cycle/QA/preview/cutover narration from persona-facing copy. Family, participant, vendor, and case access are unchanged.
- Independent QA passed migration `20260718105025_cycle_7a_invitation_receipt_timestamp.sql`. It was applied once through Supabase migration tooling only to isolated `uyacxqtsiwlvtmhxvoxr` as version `20260718105618`. Production migration history contains zero matching entries. Catalog proof shows the public v2 wrapper is `SECURITY INVOKER`, the private v2 function is checked `SECURITY DEFINER`, authenticated alone can execute v2, authenticated cannot execute v1 or either original command, and the v2 result includes persisted `created_at`.
- Post-apply security advisors introduced no new warning; only expected Cycle 7B fail-closed RLS-without-policy INFO remains for tasks/workflows/workflow_events. Empty-lab unused-index INFO remains expected. The app now calls only `create_employee_invitation_idempotent_v2`, requires `created_at`, and displays the persisted creation time plus invitation ID; replay retains the original ID/time and no raw token.
- Root verification passes: exact-route matrix, TypeScript, optimized Next.js production build including dynamic `/director/invitations/new`, and all 16 deploy-gate cases. The delegated parity checker was executed in a detached review worktree: nine deliberately passing/failing unit cases plus the remote ledger integration check all passed (10/10). Its ledger still requires reconciliation from `backend_only` to the now-implemented route/v2 receipt before merge acceptance.

Role state and next target:

- PM: FIX NOW scope remains active. Engineering: PASS on source reachability correction. Data Engineering: PASS after independent QA and isolated application. Deploy: plan PASS with hard preconditions; the sole verification-preview slot is still unspent. UX is re-reviewing the corrected current surface. Hosted QA remains unrun, so `[qa-approved]`, readiness changes, Production, and preview publication remain prohibited.
- Next: commit the verified source batch with `[skip deploy]`, merge and correct the delegated parity ledger, configure only exact-branch Vercel Preview variables, create isolated Auth users/redirects and seed the guarded DML fixture, then spend the one authorized verification preview and run the complete two-session hosted evidence gate.

### Cycle 7A parity integration and UX recovery - 2026-07-18 04:34 -07:00

- Development source batch `95e913f` (`fix: close Cycle 7A hosted parity gaps [skip deploy]`) records the reviewed route boundary, versioned persisted-timestamp receipt, isolated migrations/fixtures, Preview gate, and operating-context handoff without triggering a deployment. TypeScript, optimized production build, exact operational-route matrix, and all 16 deploy-gate cases passed immediately before commit.
- Root merged the external parity lane from remote head `5bb292a` without treating its hand-verification as execution proof. The provided unit/integration suite was run locally and passed all ten cases. The contract ledger was reconciled from `backend_only` to `implemented` only after the exact `/director/invitations/new` route, form, Server Action, v2 RPC, durable receipt timestamp, authority guards, and recovery behavior existed together. No GitHub Workflows permission expansion is needed for this release gate.
- Distinct UX re-review returned **PARTIAL / FIX NOW**. Its timestamp concern was stale because the current Server Action already requires persisted `created_at`; three valid issues remained. Engineering added an explicitly timezone-bearing date/time formatter for expiry and creation proof, an announced live pending state plus `aria-busy`, and separate unavailable-versus-active-request cursor semantics. Source inspection indicates the 48px controls and one-column mobile rules remain structurally sound. UX remains PARTIAL until the hosted 1440/390/360 render, focus, announcement, wrapping, and zero-overflow evidence is actually captured.
- The parity suite and TypeScript pass after those corrections. Hosted QA is still unrun. No Preview variable, Supabase Auth redirect/user, guarded persona fixture, Preview deployment, PR marker, `[qa-approved]`, readiness score, Production value, family access, or vendor fulfillment state changed in this integration step.
- Role state: PM scope COMPLETE; UX PARTIAL pending hosted visual proof; Engineering PASS on source; Data QA PASS on isolated migration split/application; Deploy plan PASS with hard exact-branch/isolated-project preconditions; hosted QA NOT RUN. Next role target is Deploy configuration of only exact branch `greenfield/passage-zero`, followed by isolated Auth Admin setup and the sole authorized verification Preview.

### Cycle 7A authenticated publish recovery - 2026-07-18 05:12 -07:00

- The shell push could not use the browser-only GitHub session, so root used the already-authorized GitHub connector without requesting Workflows permission. Remote commit `0303fb3` published the tested source as `[skip deploy]`. Root immediately detected that the connector's shell-output transport had truncated two large blobs at exactly 30,012 bytes; because the commit was non-deploying, no runtime or hosted data was affected.
- Root repaired all four connector-transformed blobs with chunked byte-exact uploads. Remote repair commit `e820257` (`fix: restore complete Cycle 7A source blobs [skip deploy]`) now has tree `5a1c2979e129fac64d104715f63ef70913fc557d`, exactly matching the locally tested HEAD tree. The local branch pointer was aligned only after tree identity was proven. The parity suite, TypeScript, production build, route matrix, and deploy-gate evidence remain the verification basis for this tree.
- Auth confirmation remains valid in Chrome for canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD` and isolated Supabase project `uyacxqtsiwlvtmhxvoxr`. No environment value, redirect, Auth user, fixture row, deployment, PR marker, or Production resource changed. The authenticated Chrome browser had already been finalized for this logical turn; the alternate in-app browser reached Vercel/GitHub sign-in but has no authenticated session. Deploy configuration therefore remains the next auto-advance target on the fresh browser turn, without requiring another owner decision or permission expansion.

### Owner-approved canonicalization and 72-hour transformed beta brief - 2026-07-18 05:12 -07:00

Owner decision and scope:

- Steve approved the review recommendation and directed the train to proceed toward a transformed functional beta within three focused days. Passage Zero on `greenfield/passage-zero`, draft PR #24, is now the sole target architecture. Threshold/main is frozen to separately governed production P0/P1 hotfixes; no new legacy dashboard, estate, IA, schema, or redesign work may begin.
- This is a non-production, synthetic, manually supported funeral-home beta. A complete PASS may move funeral-home operational readiness from 40% to **55-60%**. D2C remains **25% operational / 85% guided** because durable family identity/grants are not in this slice. The wider evidence-gated pilot remains 10-15 focused working days at funeral home 85-88% and D2C 83-87%; no schedule alone moves a score.
- Production project `qsveqfchwylsbncsfgxe`, public relaunch, real customer data, live Google/email/SMS, durable D2C grants, full Case Room/realtime/outbox/proof lifecycle, vendor fulfillment, estate, billing, paid providers, broad integrations, and legal/privacy/security claim changes are explicit non-goals.

Role instances and handoffs:

- Product Manager `/root/pm_three_day_beta`: **COMPLETE**. It received the owner decision and latest hosted-authority handoff and produced the Sprint Brief, contract matrix, migration gate, acceptance, dependencies, risks, non-goals, owner gates, and role sequence.
- UX Review `/root/ux_three_day_beta`: **IN PROGRESS**. It received the PM scope for invitation, durable workload, assignment/reassignment, staff transition, revoked/denied states, audit, and 1440/390/360 acceptance.
- Engineering/Data root: **IN PROGRESS**. It restored Passage Zero-specific release-train/role guidance, recorded canonicalization/freeze and cutover governance, expanded the parity plan, and is preparing hosted configuration. No hosted mutation, deployment, readiness change, family/vendor change, or Production action has occurred in this documentation batch.
- Independent QA/Deploy-preflight `/root/review_threshold_main`: **ASSIGNED** for the two-session evidence script and Cycle 7B RLS/RPC negative-test matrix. Deploy remains closed until independent PASS.

PM Sprint Brief:

- **Goal:** within 72 hours, prove a transformed funeral-home beta where two hosted identities complete director invitation -> staff acceptance, then operate one real durable assigned-work loop with assignment/reassignment, staff transition, revocation, append-only audit, reload/replay truth, denial, and responsive evidence.
- **Day 1 components/objectives:** configure only exact-branch Preview variables; configure only isolated Auth redirects; create synthetic director/staff through Auth Admin; run the guarded DML-only director fixture; spend the authorized Cycle 7A verification Preview; prove create/inspect/accept, `/staff`, staff `/director` denial, reload, replay, wrong-user denial, exact membership/location/invitation/event cardinality, and 1440/390/360 evidence; then remove the temporary verification-preview exception.
- **Day 2 components/objectives:** preflight existing workflows/tasks/authority columns; document and independently review the 7B what/why/breakage migration; apply only additive isolated migrations through Supabase migration tooling; seed deterministic Sofia Rivera/Northstar workflow/task data; enforce manager organization/location workload reads, staff assigned-only reads, workspace-as-presentation, idempotent assignment/reassignment, validated staff transition, invitation/membership revocation, server-only append-only events, and family-grant preservation; replace beta director/staff sandbox projections with durable server queries and add reachable revocation/audit states.
- **Day 3 components/objectives:** prove director assignment -> staff work transition -> director activity trail -> reassignment -> revocation plus replay, stale-session, wrong-location, wrong-organization, unassigned-user, and revoked-user denial; run parity, TypeScript, optimized build, deploy gate, SQL/RLS tests, advisors, failure injection, console/hydration, keyboard/focus/target/overflow QA; commit timestamped redacted evidence; publish the one coherent non-production beta Preview only after independent QA authorization; update PR #24, roadmap, ledger, and context.

Frontend/backend beta contract:

| Persona action | UI | Server/data | Authority/event/recovery |
| --- | --- | --- | --- |
| Director creates invitation | `/director/invitations/new` | Existing v2 idempotent creation RPC; invitation + locations | Active manager and managed locations; one created event; replay preserves ID/time and no raw-token recovery |
| Staff inspects/accepts | `/invite/[token]` | Existing inspect/accept RPCs; one membership + location grant | Exact verified invited email; accepted event; invalid/expired/revoked/wrong-user/replay fail safely |
| Director views workload | Durable `/director` beta projection | Planned workflows/tasks query | Manager organization/location grant; empty/denied states reveal no other location |
| Director assigns/reassigns | Reachable workload action | Planned idempotent commands | Managed task and location-authorized assignee; one event per command; conflict/replay returns durable owner |
| Staff views/advances work | Durable `/staff` and bounded work detail | Planned assigned-only query and validated transition | Current active assignee and location; one transition event; unassigned/revoked/reassigned/invalid state denied |
| Director revokes | Pending invitation and team actions | Existing invitation revoke RPC; planned membership revoke RPC | Manager predicate; one revoke event; accepted invite routes to membership revocation; revoked access closes on next request/reload |
| Director reads audit | Bounded activity trail | Planned scoped event query | Read-only organization/location/case authority; no global or family-visible operator audit |

Cycle 7B documentation-first migration gate:

- **What:** durable organization/location/assignment references; manager workload and staff assigned-only SELECT policies; idempotent assignment/reassignment; validated staff transition; membership revocation; server-only append-only events and scoped audit reads; supporting uniqueness/indexes.
- **Why:** the transformed UI must project the same durable ownership, task state, proof, and event identifiers that the backend authorizes; browser-only state cannot support the beta claim.
- **Breakage if skipped:** director/staff surfaces drift, staff can see too much or no real work, retries duplicate effects, revocation fails to remove authority, and audit states can be forged, omitted, or invisible.
- **Risk/recovery:** workspace choice never grants access; no direct client audit writes; family grants remain independent; fixtures stay guarded DML-only and reversible; migrations apply only through tooling to `uyacxqtsiwlvtmhxvoxr`; Production `qsveqfchwylsbncsfgxe` is prohibited.

Documentation and parity decisions:

- `AGENTS.md` now carries the superseding Passage Zero canonicalization directive.
- `docs/product/passage-zero-cutover-plan.md` records route responsibility, beta/pilot/production definitions, PR #24 merge gates, hotfix ownership, and rollback principles without becoming a second roadmap.
- The canonical roadmap now includes the isolated 72-hour beta milestone and preserves the 10-15-day pilot target.
- Passage Zero-specific `docs/release-train.md` and PM/UX/Engineering/QA/Deploy role briefs now exist, closing the missing-file governance gap.
- `cycle7b.director.revoke_invitation` is classified `backend_only`; workload, assignment, staff transition, membership revocation, reassignment, assigned work, and audit remain queued until their complete reachable contracts exist. No status may move to `implemented` before the parity suite and evidence pass.

Dependencies and current evidence:

- Browser access is authenticated to the canonical Vercel project and isolated Supabase URL Configuration. The isolated project is `ACTIVE_HEALTHY`; its nine Cycle 7A migrations are present once. Current security advisors show only expected INFO for `tasks`, `workflows`, and `workflow_events` with RLS enabled and no policy; performance advisors show expected unused-index INFO in the empty lab.
- The first baseline command attempt could not execute because the fresh shell PATH omitted the bundled Node runtime. This is an environment/tooling issue, not a product test failure; Engineering must rerun the complete suite with the resolved bundled Node path before handoff.

Exact next role target: UX returns the acceptance bar; Engineering then configures branch-only Vercel variables and isolated Auth, runs the guarded director fixture, publishes only the authorized verification Preview, and hands the two independent sessions to QA. Cycle 7B migration/application cannot begin until its independent review completes. The train remains active.

### Cycle 7A/7B integrated beta candidate - hosted configuration and durable parity - 2026-07-18 06:56 -07:00

Release sequencing and role handoffs:

- The governing one-Preview sequence is now explicit: finish the combined Cycle 7A + 7B source, migration, fixture, and local/SQL gate first; publish the sole non-production verification Preview with literal `[deploy] [cycle-7a-verification-preview]`; run independent hosted QA against that same deployment; then close evidence/context/PR state with a non-deploying commit. A truthful `[qa-approved]` marker is not permitted before hosted PASS, and no second Preview is authorized.
- PM `/root/pm_three_day_beta`: **COMPLETE** with the 72-hour beta brief. UX `/root/ux_three_day_beta`: **PARTIAL / FIX NOW** until hosted viewport/accessibility evidence, but its source blockers are implemented. Engineering/Data root: **PASS on the current source + isolated SQL candidate**. Independent QA `/root/review_threshold_main`: **PASS** on Cycle 7B assigned-work migration and its separately guarded advisor migration after rejecting and correcting multiple authority/concurrency defects. Deploy remains **CLOSED pending the sole verification commit**.
- This is an isolated functional beta candidate, not a public relaunch, pilot-operational claim, or full production release. Funeral-home readiness remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational** until the entire hosted gate passes.

Hosted configuration completed without repository-wide or Production mutation:

- Canonical Vercel project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD` now has only exact-branch `greenfield/passage-zero`, Preview-only runtime, isolated-project, public URL/key, provider-disable, and controlled password-auth values needed by the beta. Repository-wide Stripe values were left untouched; no Production value was added or changed; no redeploy occurred.
- Isolated Supabase Auth now uses the stable Passage Zero branch Preview origin/callback. Exact synthetic Auth Admin accounts exist for `cycle7a-director@passage.test` and `cycle7a-staff@passage.test`; credentials are not stored in source, docs, or evidence.
- The guarded Cycle 7A persona fixture was applied as DML-only to isolated project `uyacxqtsiwlvtmhxvoxr`. Current pre-evidence cardinality is exactly one organization, one location, one active director membership, one active director location grant, zero invitations, zero events, zero workflows, and zero tasks.
- Supabase's leaked-password check remains one acknowledged security WARN because the authenticated dashboard confirms it is available only on a paid Pro plan. No purchase or plan change was authorized. All database/RLS structural advisor warnings are closed; unused-index INFO is expected in the empty lab.

Cycle 7B backend/frontend parity:

- Migration `supabase/migrations/20260718180000_cycle_7b_assigned_work.sql` (independent-review SHA-256 `4931559B0332B8B2725A5C6FE7AD258BA61900363AB61614CBA8998AB8FAC241`) adds durable workflow/task operating fields, versioned assignment/start/revocation commands, organization/location/staff-assignment RLS, server-only append-only events, historical revoked-team visibility, and accepted-token `access_ended` truth. Family grants remain unchanged.
- Independent review initially rejected cross-task idempotency, assignment/revocation races, stale/former-assignee replay, revocation ordering/replay, historical access, accepted-token truth, multi-location audit leakage, and null-assignee edges. Engineering corrected each defect before QA passed. The migration was then applied exactly once through Supabase migration tooling only to `uyacxqtsiwlvtmhxvoxr` as `cycle_7b_assigned_work`; Production `qsveqfchwylsbncsfgxe` was not touched.
- The disposable `supabase/tests/cycle_7b_assigned_work.sql` matrix passes after application and again after advisor hardening, then rolls back. It proves direct-DML closure, assignment/replay/cross-task collision/stale conflict, start/replay/former-assignee denial, revocation/replay/historical projection, accepted-token denial + `access_ended`, partial-location event denial, and cross-organization read denial.
- Advisor migration `supabase/migrations/20260718190000_cycle_7b_advisor_hardening.sql` was first rejected because a comment was not an executable isolated-project boundary. Engineering added required Cycle 7A/7B migration markers, RLS/function/column prerequisites, and exact pre/post policy-set guards. Independent QA then passed SHA-256 `82B904AA86C5C80E49EFF800AD2D7F785932A2F9A7CF218A099B58820FCCA399`; it was applied once only to the isolated lab. The resulting member policy set is exactly `cycle_7b_members_authorized_select`, and the revoker FK index is present.
- The verified app now uses durable server/RLS projections: Director Today `/director`, Team `/director/team`, Activity `/director/activity`, and Staff My work `/staff`. Assignment/reassignment, invitation revocation, membership revocation, and staff `assigned -> in_progress` use Server Actions and idempotent RPCs with stable UUIDs/expected versions, no optimistic claim, durable re-read, and server receipt. Verified navigation does not expose sandbox Intake/Receive. Family and vendor surfaces are unchanged.
- `docs/product/frontend-backend-contracts.json` is version 2 and promotes all completed Cycle 7A/7B beta contracts only after the reachable route, Server Action/query, migration/RLS, durable row/event, recovery state, and SQL/source evidence were present together. `pnpm test:parity` passes all 10 checker cases after reconciliation.

Current verification and remaining gate:

- PASS: TypeScript, runtime Preview/Production isolation matrix, operational-route fail-closed matrix, frontend/backend parity suite, 16-case Vercel deploy gate, optimized Next.js build, Cycle 7B SQL/RLS matrix, isolated migration history, post-test exact baseline cardinality, and Supabase database advisors (apart from paid-plan Auth WARN and empty-lab unused-index INFO).
- The controlled Cycle 7B workload fixture `supabase/test-fixtures/cycle_7b_hosted_workload.sql` remains unapplied. It is guarded, idempotent, reversible, DML-only, requires successful Cycle 7A staff acceptance, and will not overwrite the invitation cardinality proof.
- No Preview has been published, no screenshot/evidence artifact has been committed, PR #24 has not yet received this candidate update, no `[qa-approved]` marker exists, and no readiness score moved.
- Exact next role target: Engineering completes final worktree/source review and publishes the sole verification Preview; independent hosted QA then proves two separate director/staff sessions, create/inspect/accept, replay/wrong-user/role denial/reload/cardinality, 1440/390/360 reflow/accessibility, followed by the 7B assignment/start/reassignment/revocation/activity/negative-authority story and timestamped redacted evidence. Deploy may approve only if every gate passes.

### Cycle 7A verification-Preview runtime recovery - 2026-07-18 08:18 -07:00

Hosted QA result and role return:

- Deploy published verification commit `ecddbbf8c2b99ff99caf79efaeb6e2b5c35a5981` with the cycle-specific Preview marker and no `[qa-approved]`. Vercel deployment `dpl_B5J7iveJnaFpxyLjYdXvaTjQfisi` reached `READY` as `target: Preview`, exact branch `greenfield/passage-zero`, canonical project, and draft PR #24. This was the sole initial verification attempt; it is retained as failed evidence rather than counted as a beta PASS.
- Hosted QA signed in the synthetic director and verified the durable `/director` and `/director/invitations/new` surfaces. The first invitation submission returned a server-side exception, digest `266042502@E352`. Vercel Preview runtime logs identified the exact cause: a top-level `use server` module exported a runtime object (`A "use server" file can only export async functions`). QA marked FAIL and returned the train to PM before any Cycle 7B hosted mutation.
- PM `/root/pm_three_day_beta` classified the defect P0/FIX NOW inside Cycle 7A. Readiness remains funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**. No `[qa-approved]`, PR readiness claim, screenshot claim, or Production action is permitted. PM authorized one bounded replacement verification Preview on the same exact branch/project/isolated environment only after the corrective local gate; this is recovery of the failed slot, not permission for a preview chain.

Frontend/backend runtime correction and proofing:

- Engineering removed runtime initial-state exports from every affected Server Action module: director workload commands, invitation creation, and staff work transition. Typed initial state now lives in the consuming client components; each top-level `use server` module runtime-exports async functions only.
- New AST-backed gate `scripts/test-use-server-exports.js` scans all App Router TypeScript/TSX modules whose directive prologue contains `use server`. It permits erased type/interface exports and immutable async function exports; it rejects runtime objects, arrays, primitives, classes, enums, mutable async bindings, synchronous functions, non-async defaults, and unprovable runtime re-exports. Ten deliberately failing fixtures and multiple passing fixtures prove both acceptance and rejection behavior. `pnpm test:parity` now includes this gate, with `pnpm test:server-actions` available for focused diagnosis.
- The first gate implementation itself missed an export declaration; its negative re-export fixture caught that defect. The checker was corrected before any PASS was recorded. The final real-repository scan passes with all ten prohibited fixtures rejected.
- Isolated data was checked immediately after the hosted 500 and again after local smokes: zero staff-recipient invitations, zero invitation-location rows, zero staff memberships, zero active staff location grants, and zero invitation events. No partial mutation, deletion, or reseed occurred.
- A production-mode Next server was built with temporary ignored Preview-only values copied from the authenticated isolated Supabase dashboard. It contained no service-role or Production credential and was removed after the smoke. The real director invitation Server Action was submitted with whitespace-only purpose and returned the intended server validation without mutation. The real staff start Server Action was submitted from a temporary local-only harness using inert valid UUIDs and returned the intended authority denial without RPC mutation. Both requests completed without a runtime digest or server-log error; the harness, local server, tabs, and temporary environment file were removed before the release candidate.

Replacement Preview acceptance:

- Required local release gates are the focused Server Action export test, parity, TypeScript, runtime isolation, operational-route matrix, 16-case deploy gate, optimized build with no temporary route, cached-diff/secret checks, and independent staged-candidate QA.
- The replacement commit may use `[deploy] [cycle-7a-verification-preview]` only. It must remain Preview-only, exact branch/project, isolated Supabase only, and must not contain `[qa-approved]`.
- Hosted QA restarts from the unmutated Cycle 7A baseline: director first-create and same-request replay, staff pre-auth inspection and exact-user acceptance, wrong-user denial, `/staff`, staff `/director` denial, reload persistence, replay, exact cardinality, runtime logs, and 1440/390/360 evidence. Cycle 7B hosted fixture/mutation remains frozen until Cycle 7A passes.

Exact next role target: Engineering runs the final clean gate and stages only the corrective source/test/context files; independent QA re-reviews the staged replacement; Deploy publishes the single PM-authorized replacement verification Preview only after that PASS. Production remains untouched.

### Owner-requested Cycle 7A hosted handoff - 2026-07-18 12:30 -07:00

Owner disposition: Steve asked this chat to finish the current task, update the living Markdown, and hand the remaining release train to a fresh chat. This is an explicit stop before any Cycle 7B hosted fixture or workflow mutation. It does not authorize Production, another readiness claim, or a misleading `[qa-approved]` marker.

Role instances and handoffs:

- PM `/root/pm_three_day_beta`: **COMPLETE**. It received the failed first Preview, classified the Server Action export failure P0/FIX NOW, and authorized the bounded replacement verification Preview.
- UX `/root/ux_three_day_beta`: **PARTIAL**. The functional authority story passed, but the exact hosted visual pass found one accepted-invitation projection defect described below.
- Engineering/Data root: **PASS for the source handoff**. It corrected the hosted runtime failure, added the Server Action export gate, completed the replacement hosted transaction, corrected the final Team projection, and passed the local release suite.
- Independent QA `/root/final_publish_qa`: **PASS** on the staged Server Action recovery candidate before its replacement Preview and **PASS** on this final handoff delta. The final review verified the pending-only source projection, targeted regression assertion, screenshot dimensions/content, redaction, and absence of passwords/tokens/share URLs; it explicitly retained **PARTIAL / no `[qa-approved]`** because the last UI correction is source-only. Independent SQL QA `/root/review_threshold_main` previously passed the isolated Cycle 7B migration candidates.
- Deploy: replacement Preview is retained as evidence; Production remains closed. The fresh chat begins with PM/Deploy re-entry, not an assumed deploy approval.

Replacement Preview and hosted Cycle 7A result:

- Corrective commit `f56f1fbf9ad8cd71f612db045d3eb0d1b2f019e5` deployed as Vercel Preview `dpl_F5J8DoQJhd2oKtm99PQ44gr4fTPs`, `READY`, canonical project, exact `greenfield/passage-zero` branch, and isolated Supabase only. Runtime error/fatal logs were empty after the full flow. No `[qa-approved]` marker was used.
- Separate hosted director and staff sessions proved director first-create, same-request replay with the original ID/time and no second raw token, staff pre-auth inspection, wrong-user denial without mutation, exact-user acceptance, `/staff`, staff `/director` denial, reload persistence, and stable same-user accepted-receipt replay without another acceptance action.
- Exact isolated post-acceptance cardinality is: organization 1; location 1; active memberships 2 (`director: 1`, `staff: 1`); active location grants 2; invitation 1; accepted invitation 1; invitation-location 1; invitation command events 2 (`metadata.event_kind` = `organization_invitation.created` and `organization_invitation.accepted`); workflows 0; tasks 0. Family/vendor data and grants were unchanged.
- Redacted evidence is recorded at `docs/evidence/cycle-7a-auth/2026-07-18-hosted-cycle-7a-redacted-evidence.md`. Sensitive invitation material, synthetic passwords, temporary share URLs, and service credentials are not committed.

Exact viewport evidence and final parity correction:

- Hosted `/director/team` was checked at 1440 x 900, 390 x 844, and 360 x 800. Each viewport reported document width equal to viewport width, no horizontal overflow, and no browser console/page errors. Timestamped screenshots are committed beside the redacted evidence.
- The 360 snapshot exposed a truthful-state defect: the already accepted invitation still rendered in the `PENDING INVITATIONS` section while the active staff membership rendered below it. The backend was correct; the director projection mapped the full invitation collection after displaying a filtered pending count.
- Engineering now derives `pendingInvitations` once and renders only that collection, with a truthful zero-pending empty state. Accepted/revoked/expired rows no longer appear as pending controls; membership and append-only Activity remain their durable destinations.
- The parity harness now reads the real Team source and rejects either removal of terminal-state filters or a return to mapping `invitations` directly. Final local results: frontend/backend parity **11 passed / 0 failed**; Server Action export gate PASS with ten prohibited fixtures rejected; runtime isolation PASS; operational route gate PASS; 16-case deploy gate PASS; optimized Next production build PASS; TypeScript PASS.
- The screenshots preserve the hosted defect as QA evidence. Because the projection fix has not been deployed and visually rechecked, hosted QA remains **PARTIAL** and the branch must not be labeled `[qa-approved]` yet.

Release/readiness state:

- Funeral home remains **94% guided / 40% operational**. D2C remains **85% guided / 25% operational**. No score was raised; this is not a pilot-operational or full-production claim.
- Production Supabase project `qsveqfchwylsbncsfgxe` was not mutated. Exact-branch Preview variables and isolated Auth configuration remain branch/lab scoped. Signed-in Vercel and Supabase admin tabs were deliberately left signed in; the synthetic hosted QA tabs were not used to sign the owner out.
- The Cycle 7B migrations are present only in isolated project `uyacxqtsiwlvtmhxvoxr` as previously recorded, but `supabase/test-fixtures/cycle_7b_hosted_workload.sql` remains unapplied. No Cycle 7B assignment, start, reassignment, revocation, or activity mutation was performed in this close.
- PR #24 must describe Cycle 7A as functionally proven with one source-only projection correction awaiting hosted re-verification. It must not claim QA approval or beta/pilot completion.

Fresh-chat next highest-leverage sequence:

1. Start from this handoff and inspect the pushed handoff commit, draft PR #24, deployments, and isolated cardinality before acting. Preserve the owner's signed-in admin sessions; do not sign out or replace branch-only/Preview-only values.
2. PM/Deploy re-enter on the source-only Team projection correction and determine the truthful non-production re-verification path under the existing preview-budget/marker rules. Do not invent `[qa-approved]` before hosted PASS and do not touch Production.
3. Reverify `/director/team` on the corrected source at 1440, 390, and 360: zero pending invitations, one active staff membership, no horizontal overflow, no console/hydration/runtime errors. Commit replacement screenshots; retain the prior screenshots as defect evidence.
4. Preserve Cycle 7A exact cardinality, then apply the guarded DML-only `supabase/test-fixtures/cycle_7b_hosted_workload.sql` only to isolated `uyacxqtsiwlvtmhxvoxr`. Exercise director workload, assignment/start/reassignment, invitation/member revocation, append-only Activity, replay/conflict, wrong-location/organization/unassigned/former/revoked-user denial, reload persistence, and exact task/event cardinality.
5. Rerun parity, Server Action export, TypeScript, optimized build, runtime/route/deploy gates, Cycle 7B SQL/RLS tests, Supabase security/performance advisors, Vercel runtime logs, and desktop/mobile accessibility/overflow QA. Commit only timestamped screenshots and redacted database/audit evidence.
6. Update this context and PR #24 in the integrated handoff/release commit. Publish no Production deployment. Add `[qa-approved]` only if the complete hosted evidence gate actually passes and the governing deploy marker/preview authorization is satisfied.

Auto-advance disposition: intentionally handed to a fresh PM role at the owner's request. The train is not blocked by credentials; it is paused at a deliberate owner-requested chat boundary with all remaining work and release truth recorded.

### Owner-requested Cycle 7A re-verification and Cycle 7B hosted loop - 2026-07-18 13:35 -07:00

Release disposition and role handoffs:

- PM `/root/pm_cycle7a_reverify` authorized exactly one truthful non-production re-verification Preview for the source-only Team projection correction and kept Cycle 7B closed until that hosted correction passed. UX `/root/ux_cycle7a_reverify` retained the Passage Zero typography, warm ivory surfaces, low-saturation state palette, privacy boundaries, persona projections, responsive reflow, and 48px target acceptance. Engineering/Data root executed only the authorized isolated flow. Independent QA `/root/qa_cycle7a_audit` returned **PASS** after the screenshot format/dimension record was made truthful and the contract ledger's membership-revocation event was aligned to the migration's actual `organization_member.revoked` semantic. QA confirmed `[qa-approved]` is truthful for this exact non-production candidate and evidence set. Deploy `/root/deploy_cycle7a_reverify` independently returned **PASS** and authorized one final `[skip deploy]` evidence/context commit plus the draft PR update, with no further Preview.
- This evidence establishes a non-production functional-beta slice only. It does not make Passage Zero pilot-operational or full-production ready. Funeral home remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational**.

Cycle 7A corrected hosted PASS:

- Verification commit `072b37df3a97714872bfdf5e89c75cda8d00d937` (`test: reverify accepted invitation projection [deploy] [cycle-7a-verification-preview]`) published Vercel Preview `dpl_5jaw5SMPekKLEPbzzRgjRJePiKMW`. It is `READY`, exact branch `greenfield/passage-zero`, canonical project `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`, and isolated Supabase only. The build log explicitly recorded the owner-authorized verification exception; optimized build and TypeScript passed. Deployment-scoped warnings/errors/fatals were empty, grouped runtime errors were empty, and observed requests were 200/204 only.
- The corrected `/director/team` projection showed exactly zero pending invitations, the truthful `No pending invitations.` empty state, and one active staff membership before Cycle 7B. At configured 1440 x 900, 390 x 844, and 360 x 800 viewports, live document width equaled client width, controls met the 48px target bar, Passage typography remained intact, reload persisted the same projection, and no console, hydration, page, or runtime error occurred. The browser's JPEG page-content captures are truthfully named `.jpg` and separately documented at encoded 1425 x 891, 375 x 812, and 345 x 767; they exclude browser chrome/scrollbar and are not mislabeled as exact-size PNGs. The earlier exact-size PNG defect screenshots remain retained as evidence of the caught regression.
- Immediately before the Cycle 7B fixture, exact isolated cardinality was re-read and preserved: one organization; one location; two active memberships; two active location grants; one accepted invitation; one invitation-location row; two invitation events; zero workflows; zero tasks.

Cycle 7B hosted authority loop:

- Guarded fixture `supabase/test-fixtures/cycle_7b_hosted_workload.sql` was applied once as reversible, idempotent, DML-only SQL to isolated project `uyacxqtsiwlvtmhxvoxr`. It created two workflows and three tasks without changing the accepted-invitation proof. Production project `qsveqfchwylsbncsfgxe`, Production Vercel configuration, family access, vendor fulfillment, pricing, and readiness scores were untouched.
- Separate director and staff sessions proved director workload, assignment, staff `assigned -> in_progress`, reload persistence, reassignment to an alternate active staff member, former-assignee removal, separate pending-invitation revocation, accepted-member revocation only after zero active assignments, revoked-workspace denial, and the append-only Activity projection. Server receipts and durable re-reads agreed after every command.
- Idempotency and recovery passed: assignment, start, reassignment, and member-revocation replays returned their original event with exactly one event per command; conflicting assignment/reassignment replays returned SQLSTATE `22023`; stale start returned `40001`. Wrong-location, wrong-organization, unassigned, former-assignee, and revoked-user commands returned `42501`; the unauthorized personas projected zero tasks/workflows. Direct event insert, update, and delete each returned `42501`, and total event cardinality remained eight.
- Final isolated manifest is two invitations (the original accepted invitation and a separate revoked pending invitation), two active memberships (director and alternate staff), one revoked staff membership and grant, two workflows, three tasks, and eight append-only events. The command spine contains one assignment, one staff start, one reassignment, one member revocation, and four invitation lifecycle events.

Release, SQL, advisor, and responsive gates:

- PASS: frontend/backend parity **11/11**; Server Action export gate with all ten prohibited fixtures rejected; runtime configuration; operational route gate; Vercel deploy gate **16/16**; TypeScript; optimized production build; hosted Cycle 7B RLS matrix; authenticated replay/conflict/denial supplements; append-only proof; responsive and accessibility QA for Director Today, Team, and Activity at 1440/390/360; revoked staff at 1280 desktop and 390/360; and deployment/runtime log review.
- QA found and Engineering corrected one final documentation-only parity mismatch before approval: `docs/product/frontend-backend-contracts.json` had said `organization_membership.revoked`, while the real migration and durable E8 event are `organization_member.revoked`. Both ledger fields now match the real event semantic, and the parity/Server Action suite passed again at **11/11** with all ten prohibited fixtures rejected.
- `supabase/tests/cycle_7b_assigned_work.sql` passed rollback-only against the isolated project. The standalone Cycle 7A conflict-constraint test correctly refused to run because its documented local-only fixture identities are absent in the hosted project; its transaction rolled back. The equivalent hosted Cycle 7A acceptance, replay, wrong-user denial, and exact cardinality were already proven against the real isolated identities.
- Supabase security advisors contain one acknowledged isolated-lab WARN because leaked-password protection is disabled while public providers and external delivery remain disabled. Performance advisors contain only unused-index information for new lab paths; no RLS or exposed-write warning is present.
- Redacted evidence is recorded in `docs/evidence/cycle-7a-auth/2026-07-18-hosted-cycle-7a-redacted-evidence.md` and `docs/evidence/cycle-7a-auth/2026-07-18T13-35-00-0700-cycle-7b-redacted-evidence.md`. No synthetic password, invitation token, share URL, service credential, or raw database dump is committed.

Exact closeout sequence: commit only the timestamped screenshots, redacted evidence, corrected parity ledger, and this context with `[skip deploy]`; push; verify Vercel cancels the skipped commit rather than creating another Preview; update draft PR #24 with exact deployment, QA/Deploy PASS, gates, scope, warnings, and unchanged readiness; then finalize only agent-created browser tabs while preserving the owner's Vercel and Supabase admin sessions. Deploy PASS must auto-advance to PM for the next highest-leverage funeral-home operating slice rather than imply pilot or production readiness.

### Cycle 8 PM Sprint Brief - task-bound Case Room proof loop - 2026-07-18 13:57 -07:00

Prior closeout and role transition:

- Cycle 7A/7B closed at commit `6847076fd194aeaf4fde416ab34ccb0cf2f16e8d`; Vercel deployment `dpl_2Cm33okhvZumAJWzTGC1uUGKXvY8` is correctly `CANCELED` by `[skip deploy]`. Draft PR #24 now records independent QA **PASS**, Deploy **PASS**, exact hosted evidence, unchanged readiness, and Production separation.
- Product Manager `/root/pm_cycle7a_reverify` auto-advanced after Deploy PASS and received the owner's direction to make the next chunk impactful. PM selected **Cycle 8: Task-bound Case Room Proof Loop** as the highest-leverage two-day slice. UX Review `/root/ux_cycle8_proof_loop` is **IN PROGRESS**. Engineering/Data is **PREFLIGHT ONLY** until UX returns its acceptance bar; no Cycle 8 source, migration, fixture, isolated-hosted state, or deployment has changed.

Sprint goal and user problem:

- Within two focused days, an independently authenticated, currently assigned staff member can open one bounded commitment, submit immutable structured proof, and recover the same truth after reload; an authorized director can verify that proof or request a replacement; both personas see one durable correction/event history without cross-location or cross-organization leakage.
- Cycle 7B currently stops after `Start work`. The employee cannot record what happened or hand responsibility back, and the director cannot accept/reject an outcome. Passage therefore cannot yet answer what happened, who proved it, who can see it, whether it was accepted, and what happens next.

Requirements and components:

1. Reachable `/staff/work/[taskId]`: viewer-relative Now summary, task facts, one proof action, prior proof/review history, and no director controls; link from `/staff`.
2. Smallest consistent linked director case/task proof surface, preferably `/director/cases/[workflowId]`: owner/waiting/due state, proof queue, verify/request-replacement action, chronological proof/event history; link from `/director`.
3. Stable Case Room vocabulary may expose `Now`, `Tasks`, and `Proof`. No fake Updates/chat surface; durable task-bound Updates remain queued.
4. Add immutable `task_proofs` and append-only `task_proof_reviews`. Proof includes server-derived organization/workflow/task/submitter/time/audience, structured outcome, optional non-secret reference, request identity, and optional `supersedes_proof_id`. Replacement creates a new row; no client updates/deletes prior proof or review.
5. Add checked, versioned, idempotent submit/review commands in the existing private-command/public-wrapper pattern. Staff submit requires exact active assignment, location grant, and `in_progress`; director review requires managed organization/location. Same-key replay returns the original receipt; conflicting payload or stale version fails without partial state.
6. State/event spine: submit `in_progress -> proof_submitted` with `task.proof_submitted`; verify `proof_submitted -> completed` with `task.proof_verified`; replacement request `proof_submitted -> in_progress` with `task.proof_replacement_requested`. Server derives actor, scope, time, audience, next owner/action, and event identity.
7. Failure/recovery: pending controls disable safely; stale/conflict directs reload; changed assignment/revoked authority closes the action; replacement reason and prior proof remain visible; failure states say nothing changed; no optimistic success.
8. Staff sees only current assigned task/proof scope; director sees only managed locations; family and vendors see none. Workspace selection remains presentation-only.

Documentation-first migration gate:

- **What:** additive isolated migration for proof/review tables, proof lifecycle task status, FKs/indexes/unique command identity, narrow SELECT RLS, no client writes, checked RPC wrappers, append-only protection, and the three event types.
- **Why:** the frontend must save and review the same durable proof it claims; Cycle 7B ends at `in_progress`.
- **Breakage if skipped:** completion becomes a visual claim, retries can duplicate proof, directors cannot accept/reject, and correction history cannot be trusted.
- **Risk/recovery:** preserve the current three-task/eight-event baseline; use migration tooling only on isolated `uyacxqtsiwlvtmhxvoxr`; prohibit Production. Stop on unsafe task-status constraints, RLS recursion/BOLA, public/default function execution, schema drift, duplicate replay, cross-tenant visibility, or inability to establish a real active staff session. Reversal may remove only Cycle 8 objects after dependency checks; fixture cleanup remains DML-only.

Frontend/backend contract matrix:

| Persona action | Reachable UI | Durable/authorized contract | Proof/recovery |
| --- | --- | --- | --- |
| Staff reads task/proof history | `/staff/work/[taskId]` | Task/workflow/proof/review/event SELECT under exact assignment + active location | read-only reload truth; denied state reveals no case |
| Staff submits/replaces proof | staff proof form + Server Action | idempotent submit RPC; immutable proof + task status/version | one submit event; replay stable; stale/former/revoked/cross-task denied |
| Director reviews proof | linked director case/task proof panel + Server Action | idempotent review RPC; append-only review + task status/version | verified or replacement event; replay stable; wrong scope/conflict denied |
| Director/staff read history | proof panels + Activity | exact proof/review/event cardinality under existing scope | prior bodies/reviews immutable; family/vendor projection absent |

Acceptance and QA/deploy plan:

- From a recorded Cycle 7B baseline, establish one controlled active synthetic staff identity without erasing retained evidence. Prove assignment/start, one submit + replay, director reload + verify to completed, and a separate replacement/re-submit/verify chain whose prior proof remains immutable.
- Prove one proof/review/event per unique successful command and zero rows/events/partial task change for wrong organization, wrong location, unassigned, former, revoked, staff-direct-review, cross-task proof/supersedes, stale, conflicting replay, and direct insert/update/delete attempts.
- Two isolated browser sessions must show owner, waiting party, audience, proof destination, next action, server time, and reload truth with no family/vendor leakage. At 1440/390/360: no overflow, controls at least 48px, visible focus, semantic pending/status/error, and no console/hydration/runtime error.
- Required gates: parity ledger/checker; Server Action exports; TypeScript; optimized build; runtime/route/deploy; rollback-only SQL/RLS matrix; Supabase advisors; Vercel logs; timestamped screenshots and redacted database/event evidence. One coherent non-production Preview only after independent predeploy QA PASS under the normal gate; no verification exception or deploy chain.

Dependencies, non-goals, risks, and readiness effect:

- Dependencies: current PASS head/PR, canonical exact-branch Preview configuration, isolated lab, existing workflow/task/member/RLS/event spine, migration tooling, two browser contexts, and a controlled active staff user. The original hosted staff is revoked and the alternate lacks an Auth identity, so Engineering must solve this synthetic dependency truthfully rather than hand-wave it.
- Explicit non-goals: generic chat/Updates composer, realtime, notifications/outbox/external send, Storage/file upload, family-safe proof, D2C/participants, durable intake/Transfer Pass, vendors, integrations, demo reset, Production, pricing/billing, and legal/privacy/security claims.
- Full PASS deepens the synthetic non-production functional beta and creates the first complete assigned-work-to-verified-outcome loop. It is not an allowlisted pilot and not Production. Funeral home remains reported at **94% guided / 40% operational** until PM separately reconciles completed M2 evidence with the canonical roadmap; D2C remains **85% guided / 25% operational**.
- No owner gate applies to additive isolated migration, synthetic identity, QA, docs, or one normal QA-approved non-production Preview. Stop for Production, real communications, paid services, irreversible data loss, pricing, or material legal/privacy/security claims.

Exact next role target: UX Review returns the Case Room interaction/accessibility acceptance bar. Engineering then completes source/schema preflight and the what/why/breakage migration candidate; independent SQL QA reviews it before any isolated migration is applied.

Cycle 8 UX and Engineering live handoff:

- UX Review `/root/ux_cycle8_proof_loop`: **PASS for Engineering start**. The fixed experience order is Back -> case/location boundary -> Now -> task facts -> proof action/receipt -> immutable history. Staff copy distinguishes proof submission from completion; director copy distinguishes verify from request replacement; earlier proof never disappears. The approved director route is `/director/cases/[workflowId]`, with task query/anchor presentation-only. Pending, identical replay, stale reload, recoverable failure, denied/revoked/former, cross-task, empty, completed, and durable reload states are mandatory. At 1440 use a restrained dominant-action/supporting-facts composition; at 390/360 use one column with full-width actions and vertical history. Native semantics, announced status/error, visible focus, 48px controls, and no fake Updates/chat are FIX NOW.
- Engineering created the documentation-first additive migration candidate `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql`, added proof/review types and optional hosted queries, reachable staff/director Case Room routes, structured staff submission and director review Server Actions/forms, immutable history projections, responsive proof-loop styling, and links from current work surfaces. TypeScript passes on the uncommitted candidate.
- Independent SQL QA `/root/qa_cycle8_sql` returned **FAIL / DO NOT APPLY** on the first migration draft. It approved the core transaction model but required a stronger isolated-baseline guard, rollback-only Cycle 8 regression, privileged-insert semantic integrity, database anti-branching, a lab-bound append-only reset escape, null normalization, advisor indexes, and explicit proof-pending reassignment behavior.
- Engineering has corrected the candidate guard to require the exact synthetic organization/location plus 2 workflows, 3 tasks, 8 events, and `NS-2051`; added catalog-collision refusal, active staff/director/location checks in integrity triggers, one-replacement-per-prior uniqueness, missing FK indexes, a postgres + exact-project + exact-sentinel reset boundary, explicit null validation, proof-destination validation, and a proof-pending reassignment guard. These corrections are source-only and have not yet been independently re-reviewed.
- Current QA state remains **FAIL/PARTIAL**, not release-ready: the complete rollback-only Cycle 8 SQL/RLS/race/reversibility matrix still must be authored and passed before any migration application. No Cycle 8 DDL or DML has touched isolated Supabase, no Preview was created, and Production remains untouched.

Exact next action: Engineering authors the rollback-only Cycle 8 matrix covering preflight/catalog/ACL, submit/review/replacement/replay/conflict/stale/atomicity, supersession, BOLA projections, races, append-only checksums, proof-pending reassignment, cleanup, and advisor expectations. Independent SQL QA then re-reviews both files. Only PASS may authorize applying the additive migration to `uyacxqtsiwlvtmhxvoxr`.

### Owner-requested governance, roadmap, reliability, and plain-language correction - 2026-07-18 14:45 -07:00

Owner request and confirmed audit:

- The owner required the repository learn from and prevent recurrence of four draft PRs with zero founder approvals, self-graded release evidence, a stale red required check, direct-main agent collisions, live hydration failures, contradictory Demo/hosted language, internal persona copy, and roadmap drift.
- GitHub evidence confirmed PRs #17, #19, #23, and #24 were draft with zero submitted reviews. PR #17's release-train job failed because `## Product Manager scope` did not exactly match `## Product Manager Scope`. Main history confirmed two release commits 2 minutes 49 seconds apart.
- Live browser QA confirmed React hydration errors `#425`, `#418`, and `#423` on `/pricing`, `/resources`, `/guides`, `/care-providers`, `/trust`, and `/mission`. This is one P1 Threshold/main maintenance incident; it is not Passage Zero progress and has not been fixed in this dirty greenfield worktree.
- Greenfield browser/source QA confirmed mixed `BROWSER SANDBOX` and database-authority claims, internal terms, raw event names/states, UUID activity targets, fixture/cycle language, and ambiguous consequential buttons. The intermittent reported 30-second `/director` freeze did not reproduce: one direct load was 3.1 seconds and one in-preview navigation was 0.35 seconds with no fresh console errors. It remains a P1 watch item requiring timing/query instrumentation.

Role instances and decisions:

- Product Manager `/root/pm_governance_consolidation`: **COMPLETE**. Passage Zero/PR #24 is the sole feature lane; Threshold/main is reviewed P0/P1 maintenance only. Direct-main agent/schedule pushes, silent red CI, self-review, overlapping greenfield merges, and architecture narration are FIX NOW. Readiness remains funeral home **94% guided / 40% operational** and D2C **85% guided / 25% operational**.
- UX Review `/root/ux_plain_language_audit`: current preview **FAIL for release / PASS for Engineering start**. Every page must answer where the user is, what needs attention, what to do, what happens next, what is saved, who can see it, and recovery. Browser-only Demo and Secure Preview require distinct truthful labels. Raw enums, UUIDs, internal architecture, fixture/cycle/QA/deploy language, and raw backend errors are prohibited.
- Documentation/Engineering `/root/engineering_governance_docs`: **COMPLETE**. It updated `AGENTS.md`, `docs/release-train.md`, the canonical roadmap, cutover plan, persona architecture, and new `docs/product/release-governance-and-plain-language-policy.md` without changing Cycle 8 implementation.
- Historical Engineering record `/root`: implemented greenfield release-train controls and the first reachable-copy correction. New PR structure distinguished drafts from merge-ready evidence, serialized same-target release-train runs, required context, and blocked confirmed persona vocabulary regressions. It replaced mixed environment language, internal director/staff/team/activity copy, UUID activity fallback, and ambiguous browser-only Demo actions on the sampled routes. The original non-author `User` inference and subsequent Bot-author/founder-review model are both superseded by the 2026-07-22 Development Head / Production Reviewer correction. Direct-main prevention belongs to required GitHub branch rules; a post-push workflow cannot prevent a push.
- Independent QA `/root/qa_governance_language`: first returned **PARTIAL/FAIL** because the scanner missed raw enum rendering, historical Threshold language remained executable-sounding, the roadmap reintroduced two-initiative framing, the reviewer check lacked account-type/current-head proof, and candidate-head checkers were tamperable. PM re-scoped FIX NOW; Engineering added explicit human maps and regression fixtures, archived the historical directives, corrected the one-lane roadmap, required current-head `User` approval, and added a trusted base-branch immutable governance workflow. QA re-review is **PASS** for the bounded governance/roadmap/plain-language source slice and authorizes one `[skip deploy]` commit only. It does not authorize Preview, Production, `[qa-approved]`, Cycle 8 migration, or PR #24 merge.

Files and contract changes:

- Governance/docs: `AGENTS.md`, `docs/release-train.md`, `docs/product/operational-readiness-roadmap.md`, `docs/product/passage-zero-cutover-plan.md`, `docs/product/persona-action-architecture.md`, `docs/product/release-governance-and-plain-language-policy.md`, and this context.
- Enforceable repo controls: `.github/workflows/agent-release-train.yml`, `.github/workflows/governance-integrity.yml`, `.github/pull_request_template.md`, `scripts/check-agent-context.js`, `scripts/check-release-train.js`, `scripts/check-persona-language.js`, `scripts/test-release-governance.js`, and `package.json` scripts. The rejected custom review-identity inference script is removed by the solo-founder correction below.
- Plain-language source: gateway/environment shell, family intent/pass action, receive Preview flow, director intake, hosted director/team/activity, staff landing, invitation entry/creation, and operational access boundary. Existing Cycle 8 proof-loop files remain dirty and uncommitted; no migration was applied.
- Historical branch-protection target, superseded: the then-current plan required founder approval and authorization. The active model instead requires Bot-authored pull requests, current-head checks, Independent Agent Review, Development Head / Release Authority approval, distinct Production Reviewer authorization, stale-approval dismissal, resolved conversations, restricted bypass, and blocked force-push/deletion.

Verification completed before independent QA:

- Historical test result: `test:release-governance` passed the then-current draft and review-inference fixtures. The dedicated reviewer later rejected the identity inference; the solo-founder correction below replaces those fixtures with separate agent-review, founder-review, and Production-authorization states.
- `test:persona-language`: PASS against current reachable TSX/JSX sources.
- Frontend/backend parity and Server Action exports: PASS, 11/11 parity and 10 prohibited export fixtures rejected.
- TypeScript: PASS.
- Deploy gate, runtime configuration, and operational route gate: PASS.
- Optimized Next.js build: PASS; all current routes compiled and page data generated.
- No browser or hosted PASS is claimed for these uncommitted copy changes. No Preview or Production deployment was created. Production Supabase and Vercel configuration remain untouched.

Historical PR, deployment, and next-role disposition — superseded by the owner correction at 2026-07-22 04:59 -07:00:

- Historical directive, superseded: PR #24 remains the draft integration umbrella and needs bounded review packets, but its final cutover now requires exact-head Independent Agent Review and Development Head / Release Authority approval—not founder review.
- PR #17 must have its exact heading corrected or be closed with the failure root cause recorded; #17/#19/#23 require diff-based incorporated/unique/superseded disposition against #24. No competing architecture merges independently.
- Historical directive, superseded: governance and roadmap changes are `[skip deploy]`. The six-route Production hydration repair uses exact-head Independent Agent Review, Development Head approval, distinct Production Reviewer authorization, and post-deploy verification; routine founder review is prohibited.
- Cycle 8 remains source-only QA FAIL/PARTIAL. Its migration is not applied and no Cycle 8 deployment is authorized.
- Historical next-role note, now superseded: Deploy verified the `[skip deploy]` governance commit canceled. The remaining governance work is the PR #25 bootstrap, dedicated Bot identity, live rules, founder review, protected Production environment, PR dispositions, the clean-main hydration hotfix, and hosted 1440/390/360 copy QA.

### Historical governance bootstrap adversarial correction - 2026-07-18 15:38 -07:00

This section preserves the then-current bootstrap record. Its founder-review and PR #25 instructions are non-executable and superseded by the owner correction at 2026-07-22 04:59 -07:00.

- Governance source commit `14b30029593c92e99aeeab2c6490b8af3f6b0912` was pushed to draft PR #24 with `[skip deploy]`. Distinct Deploy verification confirmed Vercel deployment `dpl_FtSrgEL2Ma6LTfxLWfh76E8p9ZRN` canceled before build and Production remained unchanged.
- A narrow main-based draft PR #25 was opened to bootstrap the controls without merging Passage Zero product code. Independent QA failed its first head `61f7a32bacddef48a86c0a72c7bdd5db546952aa`: API-created files had dirty endings; a push workflow falsely classified legitimate PR merges as direct pushes; and candidate-controlled code received a persisted/read token.
- Product Manager re-scoped all three issues FIX NOW. The corrected head `657f21e9c175adac983261eadd3a4a72ecd1c350` removed the push event and candidate credentials. Its custom review-identity inference was subsequently rejected by the dedicated reviewer and is superseded below.
- Independent QA `/root/qa_governance_language` passed the bounded source/trust checks on exact PR #25 head `657f21e9c175adac983261eadd3a4a72ecd1c350`. A later dedicated adversarial reviewer found the `User`-type identity assumption and 100-review pagination unsafe, so that head is **FAIL / not merge-ready** under the current owner-approved model.
- Distinct Deploy `/root/deploy_cycle7a_reverify`: **PASS for suppression / NO DEPLOYMENT**. Vercel canceled all three PR #25 commits; exact-head event `dpl_HJ1BKfCbLpDr3EmVYt4xndHXnz7i` stopped at the Ignored Build Step with no Preview artifact. Production still resolves to `dpl_3rAyuahrHAqcoH5KJLykL6mR2JSR` at main commit `3d881fde684fcc8cfdf5a828d2df87366364175a`.
- The hardened workflow correction is now mirrored into PR #24 source so the umbrella cannot reintroduce the rejected trust-boundary design.
- PR #25 remains open, draft, and unmerged. Direct-main protection is incomplete until the corrected governance-only bootstrap passes exact-head Independent Agent Review, receives the founder's explicit one-time bootstrap attestation, merges without deployment, and Phase B installs the Bot identity and live rules.
- Cycle 8 remains FAIL/PARTIAL and uncommitted. No migration was applied. PR #25 and Production remain blocked while the solo-founder governance correction below is reviewed and externally activated.

### Historical solo-founder Bot-author governance correction - 2026-07-18 16:42 -07:00

This section preserves the model that existed on 2026-07-18. It is non-executable and superseded by the distinct Development Head / Release Authority and Production Reviewer model recorded at 2026-07-22 04:59 -07:00.

Owner decision:

- The owner confirmed there is no second human reviewer and explicitly approved correcting the Markdown to an honest solo-founder model. Agents and schedules must author through a dedicated Passage GitHub App/Bot identity after bootstrap. The founder is the sole human reviewer of Bot-authored pull requests. Independent Agent Review is a separately named technical check, never founder or human approval. Production additionally requires the founder's authorization through the protected Production environment or release gate for the exact commit.

PM Sprint Brief and UX handoff:

- Product Manager `/root/pm_governance_consolidation`: **COMPLETE / ENGINEERING AUTHORIZED**. Remove all custom review enumeration and human/material-implementer inference, preserve read-only candidate CI and trusted-base structural checking, update every governing document and PR field, and keep PR #25 blocked during correction. The bootstrap is two-phase because the immutable workflow and Bot identity are not yet live on `main`.
- UX/Policy Language Review `/root/ux_solo_founder_governance`: rendered-product UX **N/A**; policy-language acceptance **PASS for Engineering start**. Required terms are Agent author, Independent Agent Review, Founder Review, and Founder Production Authorization. Merge approval and Production authorization must remain visibly distinct.

Dedicated reviewer failure that triggered the correction:

- Independent reviewer `/root/independent_pr25_reviewer` reviewed PR #25 exact head `657f21e9c175adac983261eadd3a4a72ecd1c350` and returned **FAIL / not merge-ready**. The custom logic could not distinguish a human from a machine-operated `User`, did not exclude material implementers, read only the first 100 reviews, and could not prove a workflow/ruleset that was not yet on base `main`. PR #25 was also draft with no founder approval and no Deploy approval.

Engineering scope in progress:

- Update `AGENTS.md`, release train, governance policy, roadmap, cutover plan, PR template, release checker, governance tests, trusted workflow, and this context to the approved model.
- Delete `scripts/check-independent-review.js`; native branch protection, not custom GitHub-account inference, enforces founder review.
- The trusted `pull_request_target` workflow becomes base-defined structure validation only: no push trigger, Reviews API, PR-head checkout, candidate execution, dependency installation, persisted credentials, secrets, or write permission.
- Preserve all dirty Cycle 8 application, route, hosted-query, CSS, and migration work as unstaged and unmodified by this governance commit. No Supabase or Vercel Production change is authorized.

Bootstrap and external enforcement contract:

1. Phase A uses only checks currently available on `main` to review the governance-only bootstrap. PR #25 remains `[skip deploy]` and draft until exact-head agent QA passes and the founder records a one-time bootstrap attestation. Direct/force-push prevention is not yet proven and cannot be claimed until the external Phase B rules are enabled and tested.
2. The exception expires when PR #25 is merged or closed and may never be reused. It is not independent review and grants no deployment approval.
3. Phase B installs the dedicated Bot identity, requires Bot-authored pull requests, current-head checks, Independent Agent Review, founder approval with stale dismissal, resolved conversations, restricted bypass, no force-push/deletion, and a protected Production environment requiring founder authorization.
4. A harmless Bot-authored validation PR must prove the complete model before product or Production work relies on it.

Readiness remains unchanged: funeral home **94% guided / 40% operational**; D2C **85% guided / 25% operational**. Governance correction is a release prerequisite, not product-readiness progress. Cycle 8 remains FAIL/PARTIAL; no migration or deployment is authorized.

Exact next role: Engineering completes the bounded source/doc correction and deterministic conflict/tests. A distinct Independent Agent Reviewer then reviews the exact diff. Independent QA must still verify the live Phase A/Phase B rules, Bot/founder separation, stale approval behavior, bypass denial, and protected Production authorization before Deploy can PASS governance.

### Cycle 8 SQL/RLS hardening - Development Engineer handoff - 2026-07-19

- Development Engineer `/root/engineering_cycle8_sql_hardening`: **SOURCE HARDENING COMPLETE / QA REQUIRED**. Prior handoff received: Cycle 8 PM Sprint Brief COMPLETE, UX PASS for Engineering start, and independent SQL QA FAIL/DO NOT APPLY on the first proof-loop migration candidate. This role inspected every current uncommitted Cycle 8 application, route, hosted-query, CSS, and migration file before changing only the migration and this context. The parallel rollback-only test matrix is assigned to a separate Engineering test specialist; there is no overlap with that file.
- `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql` now fails before DDL unless the isolated-lab-only self-authority migration and both reviewed Cycle 7B migrations exist and the complete retained synthetic manifest matches exactly: one organization/location, two workflows, three tasks, eight events, two invitations/location rows, two active plus one revoked membership, two active grants, the reserved workflow/task IDs, and `NS-2051`. This is a machine-checked lab/baseline sentinel; a caller-supplied project label alone is not treated as authority.
- Database integrity now enforces command semantics even for privileged ordinary inserts: the authenticated actor must match the proof/review actor, membership and location authority must be active, proof submit requires the current assignee plus `in_progress` and exact task version/destination/audience, review requires the latest unreviewed proof plus `proof_submitted` and exact version, and replacement proof requires the latest proof's recorded `needs_replacement` review.
- Proof-chain branching is prevented in the database by one root proof per task plus one direct replacement per prior proof. The existing append-only chain and checked commands remain the only normal write path.
- The proof/review and inherited workflow-event reset escape is now DELETE-only and requires a postgres session, exact isolated project/reset settings, exact retained organization/workflow/task IDs, and (for events) one of the three Cycle 8 proof event names. UPDATE remains prohibited even during cleanup, and the escape cannot delete retained invitation/member or prior Cycle 7B events.
- Research grounding: current Supabase RLS guidance still requires RLS on exposed tables, explicit role/grant separation, indexed policy columns, user-relative authorization rather than `TO authenticated` alone, and fixed/private security-definer helpers; the April 28, 2026 Data API change makes explicit grants intentional. PostgreSQL 18 guidance confirms cross-row invariants belong in UNIQUE/FK/trigger enforcement, referencing FK columns need explicit indexes, and transactions should acquire short, consistently ordered locks. These findings drove database uniqueness, trigger integrity, least privilege, and the retained task-row-first lock sequence.
- Source-only verification completed: targeted catalog/text inspection confirms the new sentinel, root/replacement uniqueness, semantic trigger predicates, exact-project DELETE-only reset boundary, fixed empty function `search_path`, RLS SELECT-only policy shape, and explicit authenticated wrapper grants. No SQL was executed and no Supabase project, Vercel setting/deployment, readiness score, family/vendor boundary, or Production resource changed.
- QA status remains **FAIL/PARTIAL** until the separate rollback-only Cycle 8 matrix is complete and independent SQL QA passes both artifacts. Required pending proof: preflight/catalog/ACL; submit/review/replacement/replay/conflict/stale/atomicity; root/replacement race uniqueness; wrong-organization/location/unassigned/former/revoked and staff-review denials; append-only checksums and reset-boundary denial; proof-pending reassignment; rollback cleanup/reversibility; missing-index/advisor expectations. Only independent PASS may authorize migration application to isolated project `uyacxqtsiwlvtmhxvoxr`. Production `qsveqfchwylsbncsfgxe` remains prohibited.

### Cycle 8 isolated migration application - Deploy/Evidence handoff - 2026-07-19 13:42 -07:00

- Deploy/Evidence Agent `/root/deploy_cycle7a_reverify`: **ISOLATED SQL GATE PASS / RELEASE PARTIAL**. Prior handoff received: the Cycle 8 PM Sprint Brief was complete, UX had passed Engineering start, Engineering had completed source hardening, and independent SQL QA passed the exact reviewed migration and rollback-test hashes and authorized isolated application. A later PM recovery message saying no migration application was authorized was issued without the completed SQL-gate result; it is superseded for this isolated SQL step by the earlier exact-hash SQL QA authorization, while remaining controlling for the still-pending application/UI Deploy gate.
- Target preflight identified only isolated project `uyacxqtsiwlvtmhxvoxr`, `ACTIVE_HEALTHY`, PostgreSQL 17. The exact retained baseline was one organization, one location, two workflows, three tasks, eight workflow events, two invitations, two invitation-location rows, two active plus one revoked organization member, and two active member-location grants.
- Exact reviewed migration `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql`, SHA-256 `CA860B7D3590B88FDB5D4E02CB502A9A3642B38FAE602CA25CCFC7AFBCBFA408`, was applied through migration tooling as version `20260719203647`. Exact rollback matrix `supabase/tests/cycle_8_task_proof_loop.sql`, SHA-256 `06880BE16B29006AA182D2D9EFE789D84110D8744E494F31E448CF2793E7FE62`, executed without error inside its transaction and rolled back.
- Postchecks found zero task proofs and zero proof reviews, both submit/review RPCs present, and every retained baseline count unchanged. The security advisor returned only the existing leaked-password-protection warning. The performance advisor returned INFO-level unused-index notices, including the new empty-table indexes, with no missing-index or RLS error.
- Durable/recovery evidence: the rollback matrix covered catalog/ACL/RLS, submit/review/replacement, replay/conflict/stale atomicity, wrong-organization/location/unassigned/former/revoked/staff-review denial, anti-branching, append-only checksums, proof-pending reassignment, and exact isolated cleanup. It left no proof/review rows. Redacted evidence is recorded in `docs/evidence/cycle-8-proof-loop/2026-07-19T13-42-25-0700-isolated-application-redacted-evidence.md`.
- Files changed by this role: the timestamped redacted evidence file and this context only. No application code, SQL, migration, fixture, environment, branch, PR, or deployment state was changed by this role. No Claude-in-Chrome or other external-agent assistance was used.
- QA/deploy status remains **PARTIAL**, not `[qa-approved]`: this proves only the isolated database application and rollback gate. No Vercel deployment was created, Production project `qsveqfchwylsbncsfgxe` and Production Vercel configuration were untouched, and application/browser QA at 1440, 390, and 360 remains pending. Funeral home remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational**.
- Queued but not deployed: reachable staff submission and director review integration, durable hosted reload proof, responsive/accessibility checks, console/hydration/runtime checks, full parity/export/TypeScript/build/route/deploy gates, Vercel logs, and exact-head independent QA. Auto-advance returns this Deploy PARTIAL handoff to PM/Engineering for the application/browser slice, then independent QA, then Deploy re-entry. Do not create a Preview or add `[qa-approved]` until that evidence passes.

### Cycle 8 application source QA - Deploy-prep handoff - 2026-07-19 14:19 -07:00

- Deploy-prep Agent `/root/deploy_cycle7a_reverify`: **SOURCE QA PASS / HOSTED RELEASE PARTIAL**. Earlier independent application QA rounds failed actionable defects; Engineering corrected each reported issue, and the final focused re-review passed the bounded Cycle 8 application source. The persona-language gate, frontend/backend parity **15/15**, Server Action export checks, TypeScript, optimized build, runtime configuration, operational route, and deploy-gate checks all pass. The separately recorded isolated SQL/RLS/application gate already passes.
- This exact combination authorizes preparation of a bounded Bot-authored source packet and one truthful non-production Preview/browser QA run only. It does not establish hosted behavior, permit `[qa-approved]`, authorize Production, or change the overall **PARTIAL** release status. Production Supabase project `qsveqfchwylsbncsfgxe` and Production Vercel configuration remain untouched.
- Exact next Deploy target: publish the bounded Bot-authored source packet to a non-production Preview, then verify the reachable director/staff proof loop at 1440, 390, and 360 for seven-question comprehension, responsive/accessibility behavior, clean console/hydration/runtime logs, and durable submit/review/replacement/replay state after reload. Only that hosted evidence can return to independent QA and Deploy for a later status decision.

### Cycle 8 stacked PR publication and CI classification - Deploy handoff - 2026-07-19 14:28 -07:00

- Bot-authored draft stacked PR #30 was published against base `fcf2150...` at original source head `5303892...`, containing exactly 25 files. Vercel event `dpl_JCN...` was **CANCELED** by the expected `[skip deploy]` gate; no Preview was created and Production remained untouched.
- Candidate governance failed before any product gate solely because the base-branch checker still required the legacy `## QA Handoff` heading while the PR body used the new `## Independent QA` heading. The PR body was corrected without changing source or head to retain the truthful new section and add the required legacy headings plus release-loop Cycle 1. A context-only Bot-authored `[skip deploy]` follow-up is the next publication action to retrigger checks.
- Status remains **PARTIAL**: no `[qa-approved]`, no hosted Preview PASS, and no Production authorization. After governance and product checks pass on the follow-up head, the next Deploy target remains one truthful non-production Preview followed by 1440/390/360 comprehension, runtime, accessibility, and durable-reload QA.

### PR #30 candidate-check dependency correction - CI handoff - 2026-07-19 14:42 -07:00

- PR #30 head `9009...` failed the candidate check before product gates because that job did not install dependencies while the checker required `typescript`. Product Manager classified the mismatch **FIX NOW**.
- Engineering extracted the shared, dependency-free member-identity implementation into `member-identity.js` with a matching `.d.ts`; the TypeScript wrapper now delegates to it, and the checker exercises the real helper using Node built-ins only. Independent focused QA passed the correction and authorized a Bot-authored follow-up. Persona language, parity **15/15**, Server Actions, TypeScript, optimized build, runtime, route, deploy, and focused checker gates all pass.
- Overall status remains **PARTIAL**. The Bot follow-up is authorized only to retrigger PR checks; no Preview exists, `[qa-approved]` is not authorized, and Production Supabase/Vercel remain untouched.

### Cycle 8 bound Preview and active-staff identity recovery - 2026-07-19 19:50 -07:00

Release decision: **SOURCE/SQL/SETUP PASS; HOSTED BROWSER PARTIAL**. No `[qa-approved]`, merge, Production authorization, readiness increase, or responsive hosted PASS is claimed.

Role instances and handoffs:

- Product Manager `/root/pm_cycle8_hosted_recovery`: **COMPLETE**. It received the Cycle 8 source/SQL PASS and replacement-Preview handoff, classified the QA-branch binding and controlled active-staff identity as FIX NOW, stopped an unsafe first identity assumption when the accepted invitation was proven to belong to the retained revoked member, then authorized a separate generated Auth identity bound to the existing active alternate through reviewed DML. After supported browser paths failed, PM classified the remaining gap as an external tool/access blocker and authorized this bounded PARTIAL closeout. The Cycle 8 Sprint Brief, requirements, frontend/backend parity contract, non-goals, risks, QA plan, and Deploy plan remain controlling.
- UI/UX Review `/root/ux_cycle8_proof_loop`: the existing **PASS for Engineering start** acceptance bar remains controlling; UX Review was N/A for the isolated identity/configuration mechanics because no rendered source or copy changed. Hosted comprehension, accessibility, overflow, focus, and recovery evidence at 1440/390/360 remains unproven.
- Platform/Deploy `/root/deploy_cycle8_preview` and `/root/platform_cycle8_branch_binding`: **ARTIFACT/BINDING PASS; HOSTED RELEASE PARTIAL**. The first throwaway deployment `dpl_5mTD8H7HMQuYMAmymumJ7p2UujVX` proved exact source plus one gate-only commit but could not prove inherited isolated variables. Platform therefore added ten new Sensitive, Preview-only records scoped exactly to `bot/cycle-8-preview-qa`; it did not edit or remove the existing `greenfield/passage-zero` records or any repository-wide/Production record. One corrective replacement deployment `dpl_BpB5P1zqK4FtNBBo7E2yMhbYjZ4P` is READY, `target: null`, on `bot/cycle-8-preview-qa@e62002e5601f7e06a1645e29a4d9da2476f714df`. The exact QA head is one gate-removal commit above source `e1032e557a57737fbdb0606d648a533251e07d83`. Build completed in 26 seconds with no build error; deployment-scoped warning/error/fatal runtime logs were empty. Production remains unchanged.
- Data/Auth Engineering `/root/engineering_cycle8_staff_identity` and `/root/data_auth_cycle8_staff`: **SOURCE AND ISOLATED APPLICATION PASS / SESSION HANDOFF PARTIAL**. Engineering added the guarded active-staff identity fixture, hardened Cycle 7B replay so it cannot clear an established binding, and added a rollback-only regression matrix. After independent SQL QA PASS, Auth Admin created exactly one confirmed synthetic user in isolated project `uyacxqtsiwlvtmhxvoxr` without invitation, email, or SMS delivery. The reviewed DML fixture bound that generated Auth UUID to the existing active alternate membership; same-ID replay was a no-op. No direct Auth-schema SQL, new public membership/grant, invitation rewrite, revoked-user reactivation, or product Activity event occurred. A Passage staff browser session was not established because protected Preview navigation never completed.
- Independent SQL QA `/root/qa_cycle8_staff_identity_sql`: **PASS** on the reviewed source semantics and isolated rollback execution. Canonical committed UTF-8/LF artifact hashes are `supabase/test-fixtures/cycle_8_hosted_active_staff_identity.sql` SHA-256 `99D12A634F286E2379D66C250F2DDC6E8FC50EFB7E084FBAF56A8FDB701802E3`; `supabase/test-fixtures/cycle_7b_hosted_workload.sql` SHA-256 `4E4D193DA0BA143F5A6D32F13FE828E8F365CB490B3FED10BEDC5F8188EBE349`; `supabase/tests/cycle_8_hosted_active_staff_identity.sql` SHA-256 `17D22A8306560FD91EC7948BA8872F1A98DB2E98134D79041B7BEFC9ECD32268`. The earlier `DAB472A0...` value was the mixed-CRLF local-worktree hash and is not the canonical GitHub artifact hash. The rollback-only matrix covered wrong project/Production, missing/wrong/colliding Auth identity, first bind, replay, different-ID conflict, one-row atomicity, digests, cleanup, and terminal ROLLBACK. Its pre/post retained digest matched exactly.
- Hosted QA `/root/qa_cycle8_hosted`: **PARTIAL / NO HOSTED VERDICT**. Clean agent-browser/profile/share attempts were redirected to Vercel login. The already signed-in browser connector repeatedly stalled during its own authorization handshake. No staff Passage login was submitted; no proof/review mutation, replay, reload, denial matrix, viewport inspection, console/hydration check, accessibility pass, or screenshot occurred. This is not a product FAIL and cannot be promoted to PASS.
- Deploy/Evidence `/root/evidence_cycle8_identity_preview`: **COMPLETE**. Redacted setup/deployment evidence is `docs/evidence/cycle-8-proof-loop/2026-07-19T19-48-50-0700-preview-partial-redacted-evidence.md`. It excludes passwords, email addresses, Auth UUIDs, publishable keys, cookies, share tokens, and raw database output. No Claude-in-Chrome assistance was used.

Durable isolated truth after binding:

- One organization, one location, two active plus one revoked membership, two active location grants, two invitations, two invitation-location rows, two workflows, three tasks, eight retained workflow events, zero task proofs, and zero proof reviews.
- Both active members are Auth-linked; the revoked member remains revoked and Auth-linked. The accepted invitation and its acceptance/revocation chain remain attached to the revoked historical identity. The active alternate owns all three reserved tasks and is linked exactly once. The retained public digest and every public row count were unchanged by first bind and replay.
- Production Supabase `qsveqfchwylsbncsfgxe`, Production Vercel configuration/deployment, family access, vendor fulfillment, pricing, and readiness scores were untouched. Funeral home remains **94% guided / 40% operational** and D2C remains **85% guided / 25% operational**.

Source, PR, and Deploy disposition:

- PR #30 remains a Bot-authored draft. Its reviewed application head `e1032e557a57737fbdb0606d648a533251e07d83` already has exact-head source QA and dedicated merge-review checks, but those checks become stale when this closeout packet is published. The next authorized publication is one Bot-authored `[skip deploy]` commit containing only the three reviewed SQL artifacts, the redacted evidence file, this context, and the canonical-roadmap evidence wording. Generated build state, browser profiles, temporary helpers, credentials, environment values, and screenshots are excluded.
- The first closeout head `fcaa894788882ab6fd3f20a871c10c1d3ae5b11f` passed candidate validation but independent QA correctly failed its evidence claim: Bot publication normalized the Cycle 7B fixture from mixed CRLF to canonical LF, so the recorded local hash did not equal the committed GitHub artifact. Dedicated Merge Review had returned PASS without catching that mismatch and therefore does not override the QA failure. The replacement closeout must record the canonical LF hash `4E4D193DA0BA143F5A6D32F13FE828E8F365CB490B3FED10BEDC5F8188EBE349` in evidence, context, and PR body, then rerun both exact-head roles.
- Before publication, normalize and inspect the exact diff; rerun the focused identity SQL/static checks and all applicable deterministic release gates. After publication, wait for and classify every current-head check, then emit new exact-head Independent QA and dedicated Merge Review checks. Those roles may pass the bounded source/setup/evidence packet while explicitly withholding hosted QA and Production authorization.
- Freeze `bot/cycle-8-preview-qa` at `e62002e5601f7e06a1645e29a4d9da2476f714df`. Do not merge it or create another Preview. The throwaway branch gate remains temporarily open because hosted QA is unfinished; restore `ignoreCommand` immediately after hosted QA completes or PM formally abandons the Preview.

Exact next action and auto-advance:

- When a supported protected-browser handshake works, resume against the same READY replacement Preview with no redeploy or configuration change. Use distinct director/staff storage contexts; prove staff submit -> director requests replacement -> staff submits replacement -> director verifies, identical replay, stale/conflict recovery, reload durability, append-only history, and wrong-organization/location/unassigned/former/revoked/staff-review denials. Capture truthful 1440/390/360 screenshots plus comprehension, focus, target, overflow, console, hydration, runtime, advisor, and exact database/event evidence.
- Only distinct hosted QA PASS may authorize the later `[qa-approved]` integration step. Until then the release train auto-advances through safe source/evidence/PR work and remains **PARTIAL**. No owner question is required unless the only remaining path requires owner-supplied credentials, a protection bypass or other material security decision, paid service, Production, real communication, or another explicit `AGENTS.md` gate.

### Cycle 8 owner-test source correction - 2026-07-21 21:00 -07:00

- Product Manager `/root/pm_next_impactful_block` returned the hosted PARTIAL handoff to Engineering with a bounded FIX NOW list: invalid supplied task queries must fail closed; results and errors need focus plus exact reload/return recovery; proof history must name submitter, reviewer, time, decision, reason, and replacement sequence; audience copy must be exact; Case Room position must look passive; replacement needs cancel/focus return and explicit reason validation; proof/reference terminology must be human.
- Engineering role context was explicitly assumed by the release-train lead after two delegated Engineering instances produced no file change. The bounded source correction implements every item above without schema, fixture, isolated database, Vercel configuration, Preview, or Production mutation. The parity ledger now asserts invalid-query, focus/recovery, replacement validation, and indexed history bindings.
- Independent QA `/root/qa_cycle8_owner_test_corrections`: **SOURCE PASS**. Parity passes 15/15; Server Action export checks pass with all ten prohibited fixtures rejected and both Cycle 8 actions bound; persona language, runtime isolation, operational-route fail-closed behavior, Vercel gate 16/16, TypeScript, and optimized Next.js build pass. QA independently verified responsive source semantics, 48px actions/recovery links, focus behavior, and unchanged server-side replacement validation.
- Hosted status remains **PARTIAL**. The existing Preview `dpl_BpB5P1zqK4FtNBBo7E2yMhbYjZ4P` does not contain this correction and remains prior setup/defect evidence. No `[qa-approved]`, merge, readiness change, or Production authorization is implied. Funeral home remains 94% guided / 40% operational; D2C remains 85% guided / 25% operational.
- Next target: after Bot publication and current-head checks, create one replacement throwaway-branch Preview while retaining the branch-only isolated configuration. Preserve one pristine owner-test task and use a separate QA task for submit -> replacement -> resubmit -> verify, replay/conflict, reload, denial, focus, comprehension, overflow, console, hydration, runtime, and 1440/390/360 proof. Restore the throwaway build gate afterward.

### V2/V4/V5 revenue portfolio and direct-acquisition strategy - 2026-07-21 21:00 -07:00

- Owner request: stack-rank the active and horizon initiatives by where Passage is most likely to earn revenue, while preserving the serious V4/V5 consumer and digital-continuity vision. This is a planning packet under the one canonical roadmap, not a parallel implementation lane.
- Product Manager `/root/pm_next_impactful_block`: **COMPLETE**. The qualitative revenue order is Passage Zero/Cycle 8 funeral-home operating SaaS; M3 Director Right Hand/Transition Brief; M4 family continuity/Transfer Pass; online-first/direct-cremation provider handoff; V3 partner/integration rails; Digital Continuity Locker; Help a Friend; creator/community distribution; V4 consumer-directed provider network. Every row identifies payer, willingness-to-pay evidence versus hypothesis, burden, acquisition friction, retention, dependency/risk, compounding, and an advance/kill gate. No price, ARR, CAC/LTV, margin, conversion, or readiness claim was invented.
- UX/Product Design `/root/ux_cycle8_proof_loop`: **DISCOVERY PASS / IMPLEMENTATION HOLD**. Digital Continuity Locker, Help a Friend, and online-first provider handoff remain separate prototypes joined only by `intent -> smallest useful detail -> explicit permission -> named owner -> bounded handoff -> receipt -> recovery`. Passage does not store secrets, infer authority from relationship, rank providers by payment, or turn grief communities into lead funnels.
- Independent Product/Strategy QA `/root/qa_v5_revenue_strategy`: **PASS** after three precision corrections: After.com is labeled competitor/first-party positioning; the provider advance gate repeats the online-first operator threshold; and the roadmap distinguishes earlier gated research from downstream implementation.
- Allocation is Now: close Cycle 8 and implement the first bounded M3 slice. Next: M4 plus research-only provider/V3 simulation and isolated Locker/Help a Friend prototypes. Later: one evidence-backed integration, a bounded non-custodial Locker pilot, and disclosed community education. Do not fund yet: V4 network infrastructure, paid ranking, live custodian actions, secret custody, paid creator acquisition, or a standalone viral helper loop.
- This packet changes no Cycle 8 status, milestone target, July 23 owner-test target, score, pricing, provider relationship, campaign, database, deployment, or Production state. Cycle 8 remains PARTIAL; funeral home remains 94% guided / 40% operational; D2C remains 85% guided / 25% operational. Implementation remains held behind M3-M6, exact-head Independent Agent Review, Development Head / Release Authority approval, and the applicable evidence gates.

## Cross-persona messaging thin slice - 2026-07-28

- Owner instruction: no cross-persona messaging/communication layer existed anywhere in Passage Zero -- "Messages" was a disabled placeholder tab on every persona surface that has one (family case-detail nav since PR #51, director Case Room). Scope and build a minimal real version: schema + RLS for a simple per-workflow message thread, sender identity resolved via the existing continuity_spaces/organization_members patterns, plain-language sender labels (no raw ids), a server action to post, and a basic UI panel usable from at least family case-detail and director Case Room.
- Delivered (PR #74, branch `bot/workflow-messaging-v2`, targets `greenfield/passage-zero` only; PR #24 untouched):
  - `supabase/migrations/20260727020000_workflow_messages_thin_slice.sql` -- `workflow_messages` table (append-only via trigger), RLS reusing the existing `passage_private.can_view_workflow()` predicate for both read and write (no new authority surface), and `passage_private.post_workflow_message_idempotent(workflow_id, body, request_id)` following the same advisory-lock + `(workflow_id, request_id)` idempotency pattern as every other command RPC.
  - Sender identity resolved server-side inside the `SECURITY DEFINER` RPC via `organization_members` (staff/director) and `continuity_spaces`/`continuity_participants` (family/participant), producing a plain-language `sender_label` ("Director", "Staff member", "Family", "Family -- Sibling", etc.) stored on the row -- the only sender identity ever returned to a client, deliberately not resolved via a client-side cross-authority join (matches the existing documented boundary in `lib/family/case-view.ts`).
  - Shared loader/action/component (`lib/messaging/hosted.ts`, `lib/messaging/actions.ts`, `components/messaging/MessageThread.tsx`) used from both `/case/[id]/messages` (new family route, linked from the previously-disabled "Messages" nav item) and a new Messages section on `/director/cases/[workflowId]` (Case Room), alongside the existing Vendors section.
- Verification:
  - Rollback-only RLS/RPC simulation against the isolated project (`uyacxqtsiwlvtmhxvoxr`) before any app code was written: family owner post, family participant post (relationship-aware label), director post, cross-tenant denial, revoked-participant denial, idempotent-replay dedup, and cross-direction read-back all passed. Two real bugs found and fixed in the same pass: a missing `EXECUTE` grant on the private RPC (same bug class as PR #57's fix) and an ambiguous `occurred_at` column reference in the `INSERT ... RETURNING ... INTO`.
  - Real hosted build/runtime verification: a from-scratch branch (`create_branch` from the current `greenfield/passage-zero` tip, tree verified complete before and after push) built successfully on Vercel (genuine `next build`, not a gated skip) with the deploy-ignore gate temporarily removed.
  - Live Chrome UI QA (sign-in as director + family, post/read both directions, cross-tenant denial, mobile check) was attempted but blocked by an environment-configuration gap, not a code defect: `lib/runtime-config.ts` returns `available: false` (rendered as "Preview runtime configuration is unavailable" on "/login") whenever VERCEL_ENV is "preview" but the custom PASSAGE_RUNTIME environment variable is not set for that deployment. This env var appears to be scoped in the Vercel dashboard to a specific allow-list of branch names (at minimum `bot/cycle-8-preview-qa`, used successfully for this session's earlier urgent-persona and vendor-fix QA); brand-new branch names created during this session (`bot/workflow-messaging-v2` and two disposable QA-only branches) are not in that scope, and no MCP tool in this environment can read or edit Vercel project environment-variable scoping to confirm or fix it. `bot/cycle-8-preview-qa` itself is now significantly stale (missing the entire family-persona route tree merged earlier this session) and would need a large resync to reuse safely. QA evidence for this PR is therefore the schema/RPC-level verification above plus genuine build success, not live Chrome UI QA -- flagged here so the next agent knows this is an infrastructure gap to close (either get PASSAGE_RUNTIME scoped to real feature-branch names in the Vercel dashboard, or maintain one always-in-scope, always-synced QA branch) rather than something to keep rediscovering per PR.
- Also fixed in passing: a separate, pre-existing corrupted-branch-tree bug in the GitHub MCP tool surface -- calling push_files with createBranch true plus baseBranch pointing at an existing branch silently produces a tree containing only the explicitly-listed files rather than inheriting the base branch's full tree (confirmed by directory-listing diffs; the original attempt at this PR, #73, was built this way and had to be closed and redone). create_branch (the dedicated branch-creation tool) copies the full source tree correctly and is the safe way to create a new branch; push_files without createBranch correctly layers changes onto an already-existing, correctly-based branch.

### PR #74 messaging least-privilege correction - Engineering handoff - 2026-07-28 21:39 -07:00

- Messaging Security/Engineering role `/root/messaging_p1_engineering`: **MESSAGING SOURCE PASS / REPOSITORY SOURCE PARTIAL / HOSTED NOT RUN**. The role received the exact-head security and UX findings for PR #74 at `dff62760e6e7139ab5a2ef8b8c6f9f887a524411` and worked only in an isolated source archive. No GitHub, Vercel, Supabase, branch, deployment, or Production state was changed.
- The follow-up migration `supabase/migrations/20260729034001_workflow_messages_client_projection.sql` removes authenticated table-wide `SELECT`, drops the client read policy, and makes an authority-checked RPC the only authenticated client projection. It returns only message id, sender kind/label, body, occurred time, and server-computed ownership. The same migration bounds server-derived labels to 48 characters and makes idempotent replay reject a different actor or normalized body for the same request id.
- The application loader now reads only the safe RPC and creates an explicit server-side UTC label. The client renders that stable label without `Date`, `Intl`, locale, or time-zone computation. A history-load failure returns before the composer and presents a 48px reload action; the Case Room no longer marks Today as the current route; and persona copy distinguishes “saved in Passage” from email or text delivery.
- Frontend/backend parity is recorded as `m3.shared.workflow_messages` in `docs/product/frontend-backend-contracts.json`. `scripts/test-workflow-messaging-security.js` adds twelve focused assertions. `supabase/tests/workflow_messages_client_projection.sql` adds a rollback-only owner/participant/director visibility, replay/conflict, cross-tenant/revoked denial, direct-table denial, label bound, cardinality, and append-only matrix. The SQL matrix was authored but **NOT RUN**; isolated database execution belongs to a distinct Data/QA role.
- Deterministic evidence: messaging security **12/12 PASS**; parity fixture/integration **15/15 PASS**; parity ledger **18 contracts PASS**; Server Action exports **PASS** with ten prohibited fixtures rejected and both Cycle 8 actions bound; persona-language **PASS**; runtime isolation **PASS**; Vercel ignore-build **16/16 PASS**; release-governance **PASS**; direct TypeScript `tsc --noEmit` **PASS**; optimized Next.js 16.1.6 webpack build **PASS** with a local test-only Google-font response because restricted network access returned `EACCES`. The font response file is outside the candidate source and is not a product change.
- One required repository test is independently **FAIL on the untouched exact head**: `scripts/test-operational-route-gate.js` expects `/director/intake` to be denied while `lib/auth/operational-route-gate.ts` explicitly allows it. Both sides of that mismatch were verified directly in the original `dff627...` archive. This messaging packet did not alter either file. It prevents an overall repository Source QA PASS and must be classified by PM/Engineering rather than hidden.
- Roadmap classification: no material direction, milestone order, persona coverage, or architecture change. This is least-privilege and recovery hardening of the already-scoped messaging slice, so the canonical roadmap is unchanged. No readiness score changed.
- Evidence verdict: **Source QA: PARTIAL** (messaging-focused gates pass; inherited route-gate test fails; SQL not executed). **Hosted Preview QA: NOT RUN. Production Deployment: NOT DEPLOYED. Production QA: NOT RUN. Overall release state: SOURCE PARTIAL.** No `[qa-approved]`, merge, Preview, Production, or account-setting change is authorized by this handoff.
- Exact next roles: distinct Data/QA reviews and runs the rollback-only SQL matrix against the isolated project only, including advisors and post-rollback cardinality; distinct Independent QA reviews this exact diff, resolves/classifies the inherited route-gate mismatch, and performs 1440/390/360 family/director hosted message QA once a truthful non-production environment is available. Development Head may evaluate the exact reviewed packet only after those gates. No routine owner prompt is required.

### PR #74 message-purpose authority FIX NOW - Engineering handoff - 2026-07-28 22:21 -07:00

- Product Manager returned the 21:39 source packet **FIX NOW** because broad `can_view_workflow` authority was not a sufficient messaging-purpose boundary and because the parity ledger incorrectly claimed a user-visible staff messaging surface. This section supersedes those two claims in the earlier messaging entries; prior evidence remains preserved rather than rewritten.
- Messaging Security/Engineering `/root/messaging_p1_engineering`: **FOCUSED SOURCE PASS / SQL AND HOSTED NOT RUN**. `passage_private.can_message_workflow(uuid)` is now the only authority predicate used by both list and post. It permits the linked active family-space owner, an active participant whose `category_scope` includes `updates`, an active owner/director managing the exact workflow location, or an active staff member with an active exact-location grant and a task on that workflow assigned to the same membership.
- Fail-closed coverage now explicitly denies non-updates participants, revoked participants, cross-organization directors, wrong-location directors, active but unassigned staff, and revoked staff for both list and post. Changed-actor and changed-body request reuse conflicts; direct authenticated SELECT/INSERT/UPDATE/DELETE remains denied; all denial/conflict paths preserve exact no-write cardinality.
- The user-visible `m3.shared.workflow_messages` parity contract now covers family owners, updates-scoped participants, and managed directors only. Staff was removed from that implemented contract. `m3.staff.workflow_messages_backend` is separately marked `backend_only`, with `user_visible: false`, no route, no component, and explicit zero user-visible staff messaging credit.
- Focused deterministic evidence: messaging security **15/15 PASS**; parity ledger **19 contracts PASS**; parity fixture/integration **15/15 PASS**; Server Action export **PASS**; persona-language **PASS**; agent-context structure **PASS**. The previously recorded TypeScript and optimized-build results remain applicable because this FIX NOW changed only SQL, JSON, source-test, and context files. The inherited operational-route test mismatch remains separately unresolved and unchanged.
- The expanded rollback-only SQL/RLS matrix is authored but **NOT RUN**. It requires distinct Data/QA review and isolated-lab execution before any migration application. No roadmap direction, milestone, readiness score, GitHub, Vercel, Supabase, branch, Preview, or Production state changed.
- Evidence verdict: **Source QA: PARTIAL** (focused messaging source passes; SQL unexecuted; inherited route-gate mismatch remains). **Hosted Preview QA: NOT RUN. Production Deployment: NOT DEPLOYED. Production QA: NOT RUN. Overall release state: SOURCE PARTIAL.** Exact next role is the same distinct Independent QA/Data QA lane; no routine owner prompt is required.

### PR #74 append-only trigger search-path FIX NOW - Engineering handoff - 2026-07-28 22:45 -07:00

- PM Security returned one final bounded hardening item: preserve the existing append-only trigger function, owner, ACL, body, and trigger while setting an empty function `search_path`. Messaging Security/Engineering `/root/messaging_p1_engineering` added the forward-only migration `20260729053000_workflow_messages_trigger_search_path.sql`; its only statement is `alter function passage_private.reject_workflow_message_mutation() set search_path = '';`.
- The rollback-only SQL matrix now uses `pg_proc`, `pg_namespace`, and `pg_options_to_table` to require exactly one zero-argument function with an empty `search_path`. It also requires the enabled `workflow_messages_append_only` trigger to remain attached to `public.workflow_messages` with exact row-level `BEFORE UPDATE OR DELETE` type. No function replacement, app, authority, grant, RLS, parity, roadmap, or readiness change occurred.
- Exact source hashes: migration `4DB886BE8512F3A822A7876A85C1692979CB07CB63A6C6070368B11D4745449D`; rollback matrix `3122CF00A4BB7DA2857F013361E58BB7057E629CE3A16A4EBD61EC37EB9A1C04`; focused source test `2DE373B7D23E80CA7F3487A6D36463B1A7B4148E253CD067A5D20103DBAF1311`.
- Focused static gates: messaging security **17/17 PASS**; parity ledger **19 contracts PASS**; parity regression **15/15 PASS**; persona-language **PASS**. No live SQL was run. The earlier inherited operational-route mismatch is unchanged and keeps the whole repository verdict PARTIAL.
- Named deferred performance debt `MESSAGING-FK-INDEX-01` is owned by **Engineering / DB Performance** and is due before pilot-load testing and the 75% full-platform performance exercise. `workflow_id` is already covered; `organization_id`, `sender_user_id`, `sender_organization_member_id`, and `sender_continuity_participant_id` require isolated advisors and representative `EXPLAIN (ANALYZE, BUFFERS)` at pilot-like cardinality before a separate reviewed index migration. This debt may not be hidden as `QA: N/A`.
- Redacted source evidence: `docs/evidence/workflow-messages/2026-07-28T22-45-47-0700-trigger-search-path-source-evidence.md`.
- Evidence verdict: **Source QA: PARTIAL** (focused static PASS; SQL NOT RUN; inherited route-gate mismatch unresolved). **Hosted Preview QA: NOT RUN. Production Deployment: NOT DEPLOYED. Production QA: NOT RUN. Overall release state: SOURCE PARTIAL.** No GitHub, Vercel, Supabase, Preview, or Production state changed. Next role remains distinct Data/QA and Independent QA; no routine owner prompt is required.

### PR #74 trigger catalog assertion correction - 2026-07-28 22:52 -07:00

- PM returned an assertion-only FIX NOW: `pg_options_to_table` exposes the empty `search_path` setting as the quoted empty identifier, so the exact preflight comparison is now `function_option.option_value = pg_catalog.quote_ident('')`. The predicate uses no `IN`, pattern, trim, or permissive alternative; the exact function namespace/name/zero-argument and option-name lookups remain unchanged.
- The correct one-statement migration remains byte-for-byte unchanged at SHA-256 `4DB886BE8512F3A822A7876A85C1692979CB07CB63A6C6070368B11D4745449D`. The corrected rollback matrix hash is `CFE980EDF43BB10B4BCBF9552EC49CD56E5AA37D9541624EB87A9644C4749AF1`; the earlier `3122CF00...` assertion hash is preserved as superseded evidence.
- Focused source rerun: messaging security **17/17 PASS**; parity ledger **19 contracts PASS**; parity regression **15/15 PASS**. No product, application, authority, grant, RLS, parity, roadmap, readiness, live SQL, GitHub, Vercel, Preview, or Production state changed.
- `MESSAGING-FK-INDEX-01` remains named Engineering / DB Performance debt due before pilot-load and the 75% performance exercise. Evidence verdict remains **Source QA: PARTIAL** pending full isolated Data QA; **Hosted Preview QA: NOT RUN; Production Deployment: NOT DEPLOYED; Production QA: NOT RUN; Overall release state: SOURCE PARTIAL**.

### PR #74 message-purpose SQL fixture cast correction - Development Engineer handoff - 2026-07-28 22:36 -07:00

- Product Manager returned one test-only SQL execution defect **FIX NOW**: PostgreSQL could infer the first literal column of each `INSERT ... SELECT ... UNION ALL` fixture as `text`, even though the destination columns are UUIDs.
- Development Engineer `/root/urgent_matrix_hardening` changed only `supabase/tests/workflow_messages_client_projection.sql` plus this mandatory context evidence. The two organization-member fixture rows now cast both `id` and `user_id` literals to `uuid`. The two member-location fixture rows now cast both member IDs, both `granted_by_user_id` values, and the wrong-location location ID to `uuid`.
- No migration, application code, authority predicate, parity contract, roadmap, readiness score, branch, PR, Preview, database, Vercel configuration, or Production state changed. UX Review: **N/A** because this is an invisible test-fixture typing correction. The SQL matrix remains **NOT RUN** by Engineering and is reserved for distinct Data QA.
- Focused source checks: messaging security **15/15 PASS**; parity fixture/integration **15/15 PASS**; parity ledger **19 contracts PASS**; agent-context structure **PASS**; exact fixture-cast coverage and whitespace/diff checks **PASS**. Corrected SQL SHA-256: `FFCBF8CD970C869C9EC278EABD74864737D51160EA9EF82758F2A548006A92B7`. **Source QA: ENGINEERING PASS / independent retest required. Hosted Preview QA: NOT RUN. Production Deployment: NOT DEPLOYED. Production QA: NOT RUN. Overall release state: SOURCE PARTIAL.**

### PR #74 external messaging Data QA and executable-assertion guard - 2026-07-28

- External Independent Data QA `/root/urgent_data_qa`: **PASS** for the exact hash-bound messaging database packet on isolated Supabase project `uyacxqtsiwlvtmhxvoxr`. This later result supersedes only the earlier “SQL NOT RUN” limitation; it does not change the inherited route-gate defect, hosted status, roadmap, or readiness.
- Locally recomputed source bindings: foundational migration `4BD25BA04144BAE47683880782696068C877801C83D20187D870B8CCE22F3B93`; least-privilege/client projection migration `97805F1BF66001FC13EDC23FB5AD3853B46D6CF76ABBDF5C3608B118CABADE80`; trigger search-path migration `4DB886BE8512F3A822A7876A85C1692979CB07CB63A6C6070368B11D4745449D`; rollback matrix `CFE980EDF43BB10B4BCBF9552EC49CD56E5AA37D9541624EB87A9644C4749AF1`; post-QA focused source guard `1E6BB890627F1E01C8F7B5B6016F5556CD86EAA2B4419DF3234F07F5FEEA5768`.
- Full external coverage: exact catalog/function/trigger/ACL/RLS preflight; owner, updates-scoped participant, managed director, and exact-location assigned-staff list/post success; non-updates/revoked/cross-organization/wrong-location/unassigned/revoked-staff denial; direct authenticated SELECT/INSERT/UPDATE/DELETE denial; sender-label bound; exact replay; changed-actor/body conflict; denial/conflict no-write cardinality; and append-only UPDATE/DELETE rejection.
- Data QA reported exact pre/post counts and deterministic ordered-fingerprint equality across ten relations—`auth.users`, `continuity_spaces`, `continuity_participants`, `organizations`, `organization_locations`, `organization_members`, `organization_member_locations`, `workflows`, `tasks`, and `workflow_messages`—with zero fixture change persisted. Its handoff did not supply a run timestamp or the full fingerprint strings; this record invents neither, and a later exact evidence rerun may be required if promotion needs those values. Advisor-equivalent proof found no blocking security/integrity issue. Four uncovered message foreign-key paths remain INFO-only `MESSAGING-FK-INDEX-01` performance debt (`organization_id`, `sender_user_id`, `sender_organization_member_id`, `sender_continuity_participant_id`); `workflow_id` is already indexed. Pilot-like `EXPLAIN (ANALYZE, BUFFERS)` and any justified indexes remain a separate pre-pilot-load/75% performance task.
- Development Engineering hardened `scripts/test-workflow-messaging-security.js` without changing migration or SQL behavior. The guard strips executable SQL line and nested block comments while respecting quoted literals, requires exact executable `function_option.option_value = pg_catalog.quote_ident('')`, rejects executable `function_option.option_value = ''`, and proves three temporary in-memory mutations: canonical-only-in-comment FAIL, obsolete executable FAIL, restored source PASS. Focused messaging security is **20/20 PASS**.
- No replacement commit exists. The artifacts remain an uncommitted, hash-bound correction based on PR #74 head `dff62760e6e7139ab5a2ef8b8c6f9f887a524411`; they are not a claim about a new remote head. This Development role ran no live SQL and made no product, migration, SQL matrix, parity, roadmap, readiness, GitHub, Vercel, Preview, or Production change.
- **External Independent Data QA: PASS. Source QA: messaging database packet PASS / repository integration PARTIAL because the inherited operational-route mismatch remains. Hosted Preview QA: NOT RUN. Production Deployment: NOT DEPLOYED. Production QA: NOT RUN. Overall release state: SOURCE PARTIAL.**

### PR #74 executable SQL assertion lexical-guard correction - 2026-07-28 23:43 -07:00

- Independent source QA invalidated only the preceding lexical-guard PASS: the comment remover retained double-quoted identifiers and did not consume dollar-quoted strings, so a canonical predicate placed only in either non-executable form could satisfy the source assertion. The database matrix and external Data QA PASS remain bound to their unchanged hashes; this finding does not rewrite or manufacture database evidence.
- Product Manager `/root` classified the source-test defect **FIX NOW**. Development Engineer `/root/urgent_matrix_hardening` changed only `scripts/test-workflow-messaging-security.js`, this living context, and the existing redacted source-evidence record. UX Review: **N/A** because no product route, component, copy, state, authority, or responsive projection changed.
- The replacement lexer now skips line comments and arbitrarily nested block comments; consumes standard strings, backslash-aware `E` strings, escaped double-quoted identifiers, and tagged or untagged dollar strings; and recursively tokenizes only the executable body of a `DO $tag$...$tag$` statement. The assertion is matched as an ordered executable token sequence, including the exact empty-string argument to `pg_catalog.quote_ident`, rather than as raw text.
- Adversarial in-memory mutations prove canonical text cannot pass from line/nested comments, standard/E strings, double-quoted identifiers, or tagged/untagged dollar strings. The obsolete executable empty-string comparison still fails, and the real executable canonical predicate still passes. Focused messaging security is **23/23 PASS**.
- Historical intermediate guard SHA-256: `5FBF688AC1C74D6D7AECD6DBFDE3FBAA011EBC2FCCA70562F156F97C949E0B53`. This binding is **STALE** for the final committed guard and is superseded by the canonical `21C4A938...` rebinding below. Unchanged bindings: foundational migration `4BD25BA...`, client projection migration `97805F1B...`, trigger hardening migration `4DB886BE...`, and rollback matrix `CFE980ED...`.
- Roadmap classification: source-test false-positive correction only; no material direction, scope, architecture, persona coverage, milestone, readiness, or Production change.
- **Source QA:** REPLACEMENT ENGINEERING FOCUSED PASS / distinct rereview required; repository integration remains PARTIAL because the inherited operational-route mismatch is unchanged.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL.
- No live SQL, commit, push, deployment, product, migration, matrix, parity, roadmap, or Supabase state changed.
### Urgent/red receiver submit P1 — product-only publication split — 2026-07-28

Status: **AD41 INDEPENDENT QA FAIL / 55312 AND E00099 REVIEW RETURNS / THIRD REPLACEMENT DEVELOPMENT SOURCE COMPLETE / INDEPENDENT QA REQUIRED**. This packet is not hosted, deployed, merged, or release-approved.

Role instance and handoff:

- Product Manager: `/root`, urgent/red submit P1. PM invalidated the earlier “urgent/red done” claim after the receiver-bound database command and `/start/next` Server Action were proven out of parity.
- UI/UX Review: `/root/qa_demo_expiry_finalizer`, **PASS TO ENGINEERING WITH CONDITIONS**. The acceptance bar requires a named Northstar callback action, an explicitly private alternative, durable receipt time, exact reload recovery, accessible pending/error states, 48-pixel targets, visible focus, and zero overflow at 1440/390/360.
- Development Engineer: `/root/urgent_product_only_split`.
- Prior Engineering/QA/Review handoff received: combined candidate `c337760767bcf00f22f418a94f40ef78b509f463` contained a source-complete urgent repair, but the Passage Release Bot could not publish it because that commit also modified a trusted workflow and the Bot installation lacks the narrowly required workflow-file permission.
- This product-only branch starts from exact `greenfield/passage-zero` base `520a3bf2d12c51a427f7ad08a8f1dea1fe44d311`. It preserves the complete urgent product/data/parity repair and excludes `.github/workflows`, repository-governance doctrine, and governance-infrastructure tests. The separate governance correction remains independently tracked; this packet does not delete, revert, weaken, or supersede it.
- Independent QA rejected first product-only head `ad41b55d245913e07a1ab81a57f48a785ef70413`: its broad `urgent_family_organization_boundary.sql` test hard-required the separately developed `urgent_case_first_commitment` migration even though that migration is absent from exact base `520a3bf...`. The test therefore was not reproducible from the candidate’s committed migration stack. Every approval path tied to `ad41b55...` is stale.
- Reviewer returned replacement head `55312cba131dc08ff61064bbcf967d02833244e6`: the narrowed matrix proved requester, exact receiver leader, wrong-organization, and unrelated-user projection, but did not execute the PM-required signed-out submit denial or same-organization active-staff and revoked-leader helper/RLS/command denials. Every approval path tied to `55312cb...` is stale.
- Reviewer returned second replacement head `e00099f18e78248ff260d915bffec89dea69e76e`: it added the anon, staff, and revoked-leader denials but omitted direct wrong-organization director rejection on the callback claim command and exact-receiver director rejection on the private `self_handling` request. Every approval path tied to `e00099f...` is stale.

PM Sprint Brief:

- **Goal:** restore the signed-in family’s core urgent action so one deliberate choice either requests a callback from Northstar Funeral Home or saves the guidance privately, with durable request/event proof and truthful recovery.
- **Requirements/components:** exact allowlisted receiver ID in wizard/form/Server Action/RPC; stable persisted request UUID; exact-key recovery; authoritative append-only event time; callback-versus-private audience copy; requester/receiver RLS boundary; replay/conflict/reload behavior; frontend/backend parity and operational-route regressions.
- **Development objectives:** repair the smallest coherent product contract; keep the existing urgent tables, typed action, RPC, event spine, warm visual system, and persona boundaries; add no client-side authority or parallel urgent model.
- **Acceptance:** source regression detects a missing receiver field or RPC argument; first submit creates one request and one event; exact replay is stable; changed replay conflicts without partial mutation; callback is visible only to requester plus an active leader of the exact receiver; private save remains requester-only; reload shows the same request and durable event time; signed-out, forged receiver, wrong organization, staff, revoked, and unrelated identities are denied; 1440/390/360 comprehension/accessibility/runtime checks pass.
- **Dependencies:** exact base above; isolated project `uyacxqtsiwlvtmhxvoxr`; the already-applied and reviewed receiver-bound migration; canonical non-production Vercel Preview path.
- **QA plan:** independent diff inspection; deterministic source gates; exact receiver migration inspection; rollback-only receiver-submit SQL/RLS matrix that depends only on the committed thin-slice and receiver-boundary migrations; then exact-head hosted first-submit/replay/reload, director visibility, private non-visibility, cardinality, logs, and 1440/390/360 evidence.
- **Deploy plan:** Passage Release Bot publishes a bounded draft PR against `greenfield/passage-zero`; exact-head Independent QA, Independent Agent Review, and Development Head decide before one branch-only non-production Preview. No `[qa-approved]` precedes hosted proof.
- **Risks/recovery:** a source-only form change can drift from the already-applied function; regenerated request identity breaks idempotency; “latest request” recovery can show unrelated data; a successful mutation followed by failed proof re-read is uncertain and must direct reload, not duplicate submission.
- **Non-goals/owner gates:** no new schema design, SQL application, Production, live email/SMS, public provider activation, pricing, billing, access-scope expansion, legal/medical claim, or broad urgent redesign. No owner gate is reached by this bounded non-production repair.
- **Roadmap classification:** no material product-direction, scope, milestone-order, readiness-doctrine, persona-coverage, or architecture change. The roadmap is touched only to invalidate the false completion claim and record the P1’s truthful release state.

Documentation-first database artifact gate:

- **What:** retain the truthfully applied `20260727042651_urgent_receiving_organization_boundary.sql` and replace the unreproducible broad test with narrow rollback-only `urgent_receiver_submit_boundary.sql`.
- **Why the frontend needs it:** `/start/next` must name and bind the exact receiving funeral home, while private saves remain requester-only.
- **What breaks if skipped:** the UI calls a database signature that source control cannot reproduce or audit, and hosted behavior can drift from migrations.
- **Risk:** reapplying already-present DDL or widening a `SECURITY DEFINER` boundary would be unsafe.
- **Recovery:** no SQL is applied in this packet; independent QA inspects the exact source artifacts and runs the narrow test in a rollback-only transaction before any later release step.
- **Data boundary and target:** synthetic isolated project `uyacxqtsiwlvtmhxvoxr` only. Production project `qsveqfchwylsbncsfgxe` is prohibited and untouched.
- **Separate unresolved lane:** the broader first-commitment migration and claim/case/workflow/task regression remain outside this hotfix and are not present on exact base `520a3bf...`. This packet does not claim that broader migration drift is closed.

Development handoff:

- Product/UI files: `app/start/Start.module.css`, `app/start/StartWizardContext.tsx`, `app/start/actions.ts`, `app/start/next/UrgentNextClient.tsx`, and `lib/urgent/situations.ts`.
- Contract/gates: `docs/product/frontend-backend-contracts.json`, `scripts/test-frontend-backend-parity.js`, and `scripts/test-operational-route-gate.js`.
- Database artifacts: `supabase/migrations/20260727042651_urgent_receiving_organization_boundary.sql` and `supabase/tests/urgent_receiver_submit_boundary.sql`.
- Context/roadmap: this handoff and the matching readiness correction. No `.github` file is included.
- The form now carries and the Server Action validates the allowlisted Northstar receiver before passing `p_receiving_organization_id`. The stable wizard request UUID drives exact recovery. Receipts read the matching append-only event time. Callback and private actions state who can see the saved request, and uncertain post-mutation recovery directs reload.

Historical Engineering verification for invalidated head `ad41b55...`:

- `git diff HEAD --check`: PASS; 12 tracked files, no `.github`, `AGENTS.md`, release-governance doctrine, or governance-infrastructure test change.
- Frontend/backend parity: PASS, 16/16, including the receiver field-to-Server-Action-to-RPC regression.
- Server Action export guard: PASS; ten prohibited fixtures rejected and both Cycle 8 actions bound.
- Operational route gate, persona-language guard, runtime isolation, Vercel deploy gate 16/16, agent-context guard, release-train non-PR classification, and the existing release-governance regression: PASS.
- TypeScript `tsc --noEmit`: PASS.
- The product/UI and receiver migration blobs matched the combined candidate, but that did not make its broad SQL test reproducible from this branch. The receiver migration remains exact Git blob `fdd3c978f7a703882dec30c45ac289519f6fab4f`; broad SQL-test blob `382c8dc...` is intentionally removed from this packet.
- A fresh optimized Next.js 16.1.6 build reached compilation but could not fetch Cormorant Garamond and Montserrat from Google Fonts because this isolated shell has no outbound connection. The failure named only those two remote font fetches; it did not report a source, type, route, or application compile error. The combined candidate’s prior optimized build applies to the executable product files only after exact blob equality is rechecked; independent QA and hosted Vercel build remain required for this new head.
- No migration or test SQL was executed or applied by this Development Engineer.

Replacement Development Engineer verification for returned head `55312cb...`:

- Removed `supabase/tests/urgent_family_organization_boundary.sql` from this product-only packet. Added `supabase/tests/urgent_receiver_submit_boundary.sql`, Git blob `db43338622e7b0d790483fcdcd73c50fb849c8c0`.
- The narrow rollback-only test preflights only `urgent_family_thin_slice`, `urgent_receiving_organization_boundary`, and the receiver-bound submit signature. It contains no first-commitment, claim, case-creation, workflow, or task dependency.
- Its catalog and transaction matrix covers exact Northstar receiver enforcement; signed-out anon submit denial; callback and private creation; wrong-receiver no-write; exact replay; changed-payload conflict; one request/one append-only event per key; requester visibility; callback visibility for an active leader of the exact receiver; private non-visibility; wrong-organization and unrelated-user denial; runtime false helper results plus projection and claim-command denials for same-organization active staff and a revoked director; unchanged cardinality after those denials; and final two-request/two-event cardinality.
- Frontend/backend parity: PASS, 17/17. The new executable regression fails if the broad test returns, if a separate case-lane dependency enters the narrow test, or if the narrow callback/private/replay/conflict/RLS/cardinality evidence disappears.
- Server Action exports, operational-route fail-closed matrix, persona-language, runtime isolation, Vercel deploy gate 16/16, agent-context, release-train non-PR classification, existing release-governance regression, `git diff --check`, and TypeScript `tsc --noEmit`: PASS.
- The receiver migration remains unchanged at Git blob `fdd3c978f7a703882dec30c45ac289519f6fab4f`. No SQL was run or applied; the exact rollback-only matrix remains for Independent QA execution against the guarded isolated project.

Second replacement denial verification for returned head `e00099f...`:

- Updated narrow SQL test Git blob: `a79d4c2b28ccb13cace56bfa99f2cb05a327fe46`.
- Runtime anon role invokes the public submit signature and must receive `insufficient_privilege`; a postgres cardinality check proves the denied key created no request.
- Runtime same-organization active staff and revoked-director identities each prove the exact receiver-leader helper returns false, both callback/private request and event projections return zero, and the receiver claim command returns `42501`.
- The family projection is then restored and proves the callback remains `submitted` version 1, the private save remains `self_handling` version 1, neither is claimed, and each retains exactly one submission event. Final postgres cardinality remains two requests and two events.
- Parity 17/17, Server Action exports, operational route, persona language, runtime isolation, Vercel deploy gate 16/16, agent context, release-train classification, existing governance regression, `git diff --check`, and TypeScript: PASS. No SQL was executed.

Third replacement paired-command verification:

- Updated narrow SQL test Git blob: `7a9d9cca9fbcfd1c89f7d203f926087753ab31a7`.
- The active Northstar director receives `42501` when attempting to claim the private `self_handling` request. The active wrong-organization director receives `42501` when attempting to claim the callback request.
- After those paired direct-command denials plus the existing staff/revoked denials, the family re-read proves callback `submitted` version 1, private `self_handling` version 1, neither claimed, one event each, and final two-request/two-event cardinality.
- Parity 17/17, Server Action exports, operational route, persona language, runtime isolation, Vercel deploy gate 16/16, agent context, release-train classification, existing governance regression, `git diff --check`, and TypeScript: PASS. No SQL was executed.

Release truth:

- **Source QA:** FAIL for stale head `ad41b55...`; REVIEW RETURN for stale heads `55312cb...` and `e00099f...`; third replacement Engineering gates PASS and independent QA NOT RUN.
- **Hosted Preview QA:** NOT RUN for this product-only candidate.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL.
- Auto-advance target: distinct Independent QA, then Independent Agent Review, Development Head, Deploy, and exact-head hosted QA. No Claude-in-Chrome or other external-agent assistance was used by this Development Engineer.

### Post-merge urgent first-task parity repair — 2026-07-28

Status: **DEVELOPMENT SOURCE COMPLETE / INDEPENDENT QA REQUIRED**. This entry invalidates the merged-head `e25c6d2dc64e64687ec55d31d711ffeba9569266` source-PASS claim. Exact merged source passed only 16/17 parity checks because it referenced a nonexistent receiver migration filename, and it omitted the `urgent_case_first_commitment` migration already applied to isolated project `uyacxqtsiwlvtmhxvoxr`.

Role record:

- Product Manager: root release-train PM. The bounded goal is to make urgent case creation save one workflow and exactly one unassigned first task in one transaction, then open that task for exact-location assignment. No Production, provider, pricing, messaging, or access expansion is in scope.
- UI/UX Review: `/root/postmerge_parity_ux`, PASS to Engineering with conditions. Required human copy, Tasks-first orientation, no raw IDs, exact-location team choices, 48-pixel recovery actions, explicit missing-task recovery, and server time only or no displayed time.
- Development Engineer: `/root/postmerge_parity_engineering`. Work was performed only in the exact extracted `e25c6d2` source; no GitHub, Vercel, Supabase, or Production state was mutated.
- Next role: distinct Independent QA, then Independent Agent Review, Development Head, Deploy, and exact-head hosted QA.

Documentation-first database artifact gate:

- **What:** restore the exact reviewed `urgent_case_first_commitment` statements under the truthful applied filename `supabase/migrations/20260727200936_urgent_case_first_commitment.sql`; keep the receiver boundary under `20260727042651`; restore the broad rollback-only organization/location/replay/cardinality test.
- **Why:** the director UI now requires the authoritative command receipt to return both the case and first-task identifiers, and staff assignment must begin from a durable unassigned task rather than an empty workflow.
- **Breakage if skipped:** source cannot reproduce the isolated database, case creation can leave no assignable work, exact replay cannot recover the first task, and frontend/backend parity is false.
- **Risk/recovery:** the migration is forward-only, guarded, additive to the receiver boundary, and transaction-atomic. It is not applied in this Development handoff. QA must compare it with isolated migration history and execute only the rollback-only test against `uyacxqtsiwlvtmhxvoxr`. Production `qsveqfchwylsbncsfgxe` remains prohibited.

Development handoff:

- Restored `20260727200936_urgent_case_first_commitment.sql` and `urgent_family_organization_boundary.sql`; corrected every executable receiver-migration reference to `20260727042651`.
- Case creation now requires and consumes `workflow_id` plus `first_task_id`, omits client-generated receipt time, deep-links to the returned task, and uses the approved success/replay language.
- Case Room opens the returned task in Tasks, filters candidates to active staff with a non-revoked grant to the exact case location, revalidates the exact Case Room after assignment, and provides calm no-candidate and missing-task recovery.
- Staff pages translate the legacy director assignment instruction into the assigned person's next action. No raw identifier is rendered.
- Frontend/backend ledger now records the complete urgent director claim -> case -> first task -> assignment contract, durable cardinality, authority, append-only events, recovery, and persona projection.

Release truth:

- **Source QA:** DEVELOPMENT PASS/PARTIAL; independent QA NOT RUN. Frontend/backend parity passed 17/17 and the checker passed 19 contracts. Server Action export, operational-route, persona-language, runtime-isolation, deploy-gate 16/16, agent-context, release-train non-PR classification, release-governance, and TypeScript gates passed. The optimized build reached Next/Turbopack compilation but failed only because this deeply nested extracted-source path made a generated Windows chunk path exceed the filesystem maximum; no TypeScript, route, or application compile error was reported. Independent QA must rerun the optimized build from a normal checkout path.
- **Hosted Preview QA:** NOT RUN for this repair.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL. No readiness score changes.

### Post-merge urgent first-task parity - QA return and replacement Engineering handoff - 2026-07-28 21:44 -07:00

Release truth: **REPLACEMENT ENGINEERING SOURCE COMPLETE / INDEPENDENT QA REQUIRED**. Source QA for the prior candidate is **FAIL**; Hosted Preview QA is **NOT RUN**; Production Deployment is **NOT DEPLOYED**; Production QA is **NOT RUN**; Overall release state is **SOURCE ONLY / NON-PRODUCTION PARTIAL**.

- Product Manager `/root` returned all four independent-QA findings as **FIX NOW**. Development Engineer `/root/postmerge_parity_engineering` changed only the extracted `e25c6d2dc64e64687ec55d31d711ffeba9569266` candidate. No branch, PR, Preview, database, Vercel configuration, or Production resource changed.
- An authorized zero-task Case Room now reaches the named missing-first-task recovery panel before generic invalid-task denial. An explicit task outside a nonempty workflow still fails closed.
- `AssignTaskForm` now uses an explicit `first-task` variant. Urgent recovery says `Assign first task`; ordinary workload assignment says `Assign task`. The no-candidate boundary names the humanized case location and renders: `No eligible team members can work at [location]. Review team access, then return here.`
- The broad rollback-only urgent matrix now executes `assign_task_idempotent` after case/first-task creation. It proves one exact-location staff assignment and one append-only `task.assigned` event, exact replay without duplication, and atomic denials for wrong-organization target, wrong-location target, revoked target, wrong-organization actor, wrong-location actor, unaffiliated actor, and former/revoked actor. Final task/event cardinality remains exact.
- The parity ledger now asserts the distinct assignment labels, exact-location recovery, zero-task ordering, assignment command, replay, append-only proof, and actor/target denials.
- PM explicitly separated governance from this urgent product packet. Candidate `AGENTS.md` was restored byte-for-byte to the exact `e25c6d2...` source blob (`45751268fe83831ee91edbbbe2d5f0eff2f8d78e`). No governance doctrine change is included or claimed.

Focused Engineering gates: parity checker **PASS** (19 contracts); parity regression **PASS** (17/17); TypeScript `--noEmit` **PASS**; Server Action export regression **PASS** (ten prohibited fixtures rejected and both Cycle 8 actions bound). The optimized-build path retains the already-recorded nested Windows archive path-length limitation; this handoff does not convert it into an application verdict.

Roadmap classification: defect/parity correction only; no product direction, scope, milestone order, readiness doctrine, persona coverage, architecture, or score change. Next role is distinct Independent QA for the replacement diff and applicable source/SQL/RLS gates. One truthful non-production Preview and complete 1440/390/360 hosted evidence remain mandatory before `[qa-approved]`.

### Post-merge urgent first-task parity - second QA return - 2026-07-28 21:51 -07:00

Independent QA returned the replacement on one remaining evidence gap only: assignment command and denial proof did not prove that the newly assigned person could actually see the exact urgent workflow/task through the same RLS read path used by My Work, while other identities could not.

Development Engineer `/root/postmerge_parity_engineering` extended only the rollback matrix and its parity/context assertions. After authorized assignment and exact replay, the assigned active staff identity must see exactly one matching version-2 task and its exact-location workflow. An unaffiliated identity, a distinct active but unassigned staff member with an exact-location grant, wrong-location staff, wrong-organization staff, revoked staff, and revoked director identities must see zero rows for both identifiers. Returning to the authorized director must prove the workflow, assignment, version, and single append-only assignment-event cardinality are unchanged.

No product code, migration, fixture, project guard, rollback boundary, branch, PR, Preview, database, Vercel configuration, or Production resource changed. Source QA remains **REPLACEMENT ENGINEERING SOURCE COMPLETE / INDEPENDENT QA REQUIRED**; Hosted Preview QA remains **NOT RUN**; Production Deployment remains **NOT DEPLOYED**; Production QA remains **NOT RUN**; Overall release state remains **SOURCE ONLY / NON-PRODUCTION PARTIAL**.

### Post-merge urgent first-task parity - independent source QA PASS - 2026-07-28 22:02 -07:00

- Independent QA Agent `/root/urgent_repair_qa` completed two return loops and then issued **SOURCE QA PASS** for the frozen replacement candidate. The first return corrected unreachable authorized zero-task recovery, a shared assignment-label regression, missing exact-location recovery copy, and missing assignment/event/denial execution. The second return added authenticated My Work projection proof for the assigned staff identity plus zero-row proof for unassigned, wrong-location, wrong-organization, unaffiliated, former/revoked staff, and former/revoked director identities.
- Final source evidence proves one urgent workflow, exactly one first task, exactly one `task.created` event, one authorized assignment at version 2, exactly one `task.assigned` event, exact replay without duplication, conflict/authority/candidate denials without mutation, assigned-staff workflow/task visibility, denied-persona non-visibility, and unchanged final cardinality.
- Deterministic gates: frontend/backend parity **17/17 PASS**; contract checker **19 PASS**; Server Action export, operational-route, persona-language, runtime-isolation, Vercel deploy-gate **16/16**, agent-context, release-governance, and TypeScript gates **PASS**.
- Optimized build remains **PARTIAL for local infrastructure only**. The deeply nested archive first exceeded a generated Windows path limit; the short-path rerun reached Next/Turbopack and then stopped because the restricted runner could not fetch the two configured Google Fonts. No source, TypeScript, route, or application compile error was reported. The exact Vercel Preview build must close this evidence cell.
- **Source QA:** PASS for this bounded urgent repair candidate.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PASS / EXTERNAL SQL AND HOSTED PREVIEW QA PENDING.
- Remaining gates: distinct Independent Agent Review and Development Head exact-head decisions; rollback-only SQL execution against isolated project `uyacxqtsiwlvtmhxvoxr`; Bot-authored branch-only verification Preview; submit -> claim -> case + first task -> assignment -> staff My Work plus replay/conflict/reload/denial/recovery QA at 1440, 390, and 360; clean console, hydration, network, and Vercel runtime logs. Production project `qsveqfchwylsbncsfgxe` remains prohibited.

### Urgent retained-lab rollback-matrix hardening - Development Engineer handoff - 2026-07-28 22:32 -07:00

- Product Manager `/root/launch_readiness_pm` classified the first external data-QA result **FIX NOW**. The earlier Data QA **PARTIAL / MATRIX NOT RUN** verdict is preserved: isolated project `uyacxqtsiwlvtmhxvoxr` already retained 7 urgent requests, 13 urgent events, 5 workflows, 6 tasks, and 21 workflow events, so a global-empty assertion was not truthful. No SQL was executed and Production `qsveqfchwylsbncsfgxe` remained untouched.
- Development Engineer `/root/urgent_matrix_hardening` changed only `supabase/tests/urgent_family_organization_boundary.sql` and this handoff. UX Review: **N/A** because no route, component, copy, or persona projection changed. No migration, fixture, product behavior, branch, PR, deployment, environment, or database state changed.
- The matrix now fails closed on the isolated project, postgres role, required schema/migrations/functions, function ACL/search-path posture, table ACL/RLS posture, and every reserved synthetic identity, request key, assignment key, and case reference. It records pre-run counts plus deterministic ID-ordered row digests for `urgent_intake_requests`, `urgent_intake_events`, `workflows`, `tasks`, and `workflow_events`.
- During the repeatable-read transaction, the matrix proves only fixture-scoped deltas: two requests, four urgent events, one workflow, one first task, and two workflow events. It records exact candidate snapshots around submit replay/conflict and claim denials, claim replay/conflict and case denials, case replay/conflicts, assignment replay/projections/actor-and-target denials, direct append-only DML denials, and private-request denial. Unrelated retained counts and digests must remain byte-for-byte unchanged.
- The script contains no commit path. A terminal `rollback` is followed by an outside-transaction equality check proving all five counts and ordered digests exactly match the pre-run baseline, then the session-local baseline table is dropped. This makes two consecutive executions safe: the second run must start from exactly the same retained state and collision-free reserved namespace.
- Source checks: frontend/backend parity **17/17 PASS**; Server Action export regression **PASS**; operational-route, persona-language, runtime-isolation, Vercel deploy-gate **16/16**, and release-governance checks **PASS**; `git diff --check` **PASS**. TypeScript was **NOT RERUN** because this standalone checkout has no installed TypeScript package and dependency installation is blocked by restricted registry access; no TypeScript source changed and the prior exact-candidate TypeScript PASS remains preserved. The SQL matrix itself was **NOT RUN** by Engineering, per role separation.
- Supabase research: the current breaking-change index was checked. No current platform breaking change alters direct PostgreSQL rollback transactions; the 2026 explicit Data API grant change reinforces the matrix's separate ACL and RLS checks rather than relying on RLS alone.
- **Source QA:** ENGINEERING PASS / independent retest required because the SQL artifact changed after the prior exact-head QA and review.
- **Hosted Preview QA:** NOT RUN for this changed candidate.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL.
- Auto-advance target: distinct Independent QA reviews and parses the changed matrix; distinct Data QA executes it twice against isolated project `uyacxqtsiwlvtmhxvoxr` and records pre/run-1/post/run-2/post counts and digests. Any head change invalidates prior exact-head QA/review. No `[qa-approved]`, Bot publication, or Preview is allowed before both source and two-run rollback evidence pass.

### Urgent retained-lab rollback-matrix hardening - second Data QA return - 2026-07-28 22:54 -07:00

- The 22:32 Engineering statement that exact rollback equality covered the complete retained authority surface is **INVALIDATED for evidence sufficiency**. It covered five candidate relations but omitted `organization_member_locations`, and the revoked-location denial proved only request/event cardinality rather than a complete pre/post mutation boundary. The earlier Data QA verdict remains **PARTIAL / MATRIX NOT RUN**. The earlier record is preserved above; it is not silently rewritten.
- Product Manager `/root/launch_readiness_pm` classified the second Data QA return **FIX NOW**. Development Engineer `/root/urgent_matrix_hardening` changed only the rollback-only SQL matrix and this living-context correction. UX Review remains **N/A**: no route, component, copy, or persona projection changed. No live SQL, migration, fixture, product behavior, branch, PR, Preview, deployment, environment, or database state changed.
- The deterministic pre-run and post-rollback baseline now covers six relations. `organization_member_locations` uses full-row digests ordered by its composite member/location key; its ACL and RLS posture is included in the preflight. Fixture cardinality proves seven transaction-local grant rows, while terminal rollback must restore the exact pre-run count and full digest.
- Immediately before the intentional location-grant revocation, the matrix snapshots the exact grant, every grant, both candidate requests and their events, the candidate workflow, first task, all candidate workflow events, explicit assignment fields, the single `task.assigned` event, and every unrelated retained row in all six relations. It then revokes exactly one grant and proves `can_manage_location` changed to false before the replay denial.
- After the denial, full deterministic fingerprints must remain unchanged for all candidate request/event/workflow/task/assignment/assignment-event state and all unrelated retained rows. The exact grant must differ only in `revoked_at`; total grant cardinality must remain unchanged. The unconditional terminal `rollback` and outside-transaction six-relation equality check remain the only exit path.
- **Source QA:** ENGINEERING PASS / independent retest required. Static SQL structure, release-train checks, and deterministic source gates are recorded in the Engineering handoff; the SQL matrix itself remains **NOT RUN** by Engineering.
- **Hosted Preview QA:** NOT RUN for this changed candidate.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL.
- Auto-advance target remains distinct Independent QA, then distinct Data QA executing the matrix twice against isolated project `uyacxqtsiwlvtmhxvoxr` with pre/run-1/post/run-2/post six-relation counts and full digests. Production `qsveqfchwylsbncsfgxe` remains prohibited.

### Urgent retained-lab rollback matrix - invalid private-call evidence replacement - 2026-07-28 23:14 -07:00

- The next distinct Data QA attempt is preserved as **RUN 1 FAIL / RUN 2 NOT RUN**. The matrix called `passage_private.can_manage_location` directly after switching to the authenticated role. The isolated project correctly denied that private-schema call, so the run stopped before the intended public-command denial and before terminal rollback evidence could be certified. This is a test-evidence defect, not evidence of an application authority defect. No PASS is inferred from the aborted run.
- Product Manager `/root` classified the evidence defect **FIX NOW**. Development Engineer `/root/urgent_matrix_hardening` removed the private call without changing any migration or ACL. Catalog preflight now explicitly proves the authenticated role can execute `public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)` while the private helper is not an authenticated callable entrypoint.
- Privileged fixture setup now proves the real director membership remains active before and after revoking exactly one location grant. The authenticated director JWT then invokes the real public create-case command as a true replay with the same request, expected version, location, case reference, family name, and idempotency key. The only accepted result is SQLSTATE `42501` with no command receipt.
- The existing post-denial replacement proof remains unchanged in scope: full candidate request/event/workflow/task/assignment/assignment-event fingerprints, exact/all grant fingerprints, and all unrelated retained fingerprints must match their immediate pre-revocation snapshots except that the exact grant may differ only in `revoked_at`. The unconditional terminal rollback must restore all six baseline relation counts and full ordered digests.
- **Source QA:** REPLACEMENT ENGINEERING PASS / independent retest required. The matrix was **NOT RUN** by Engineering.
- **Hosted Preview QA:** NOT RUN for this changed candidate.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL.
- Auto-advance target: distinct source QA validates the public/private entrypoint boundary, then distinct Data QA executes two consecutive complete matrix runs against isolated project `uyacxqtsiwlvtmhxvoxr`. Production `qsveqfchwylsbncsfgxe` remains prohibited.

### Urgent public-command/private-helper authority repair - 2026-07-28 23:34 -07:00

- The subsequent independent ACL review is preserved as **FAIL**. A security-invoker public wrapper cannot delegate to the private helper after authenticated private-function execution is removed; retaining that private grant contradicts the intended public-only command boundary. The prior matrix/source verdict is stale and no two-run Data QA PASS exists.
- Product Manager `/root` classified the security contradiction **FIX NOW**. Development Engineer `/root/urgent_matrix_hardening` added only the forward migration `20260729063305_urgent_case_public_wrapper_authority_boundary.sql`, updated its parity/matrix contract, and updated this handoff. No prior migration was rewritten. UX Review: **N/A** because no route, component, rendered copy, or responsive projection changed.
- **Documentation-first database batch:** change the existing public six-argument create-case wrapper to `SECURITY DEFINER` with an empty fixed `search_path`; preserve its existing typed SQL delegation/body; revoke the matching private helper from `PUBLIC`, `anon`, `authenticated`, and `service_role`; and reassert the public wrapper as authenticated-only. The frontend needs one callable public command without private-schema exposure. If skipped, either case creation remains unusable or authenticated callers retain direct private-helper execution. The private command already enforces exact receiving-organization, active leader, exact-location, replay, and conflict predicates before mutation.
- **Risk/recovery/data boundary:** `SECURITY DEFINER` is intentionally narrow here: the unchanged wrapper delegates only typed arguments to the existing authorization-checking private command, uses an empty search path, and exposes no generic SQL. No `passage_private` schema privilege changes are included. Recovery, if independent QA finds a defect before any release, is to reject the migration; after application, recovery requires a new forward migration restoring invoker mode and the prior function ACL. Target is isolated project `uyacxqtsiwlvtmhxvoxr` only after distinct approval. Production `qsveqfchwylsbncsfgxe` is prohibited.
- The rollback matrix now requires this migration, authenticated-only public execution, no direct private-helper execution for authenticated/anon/service roles, `prosecdef`, fixed empty `search_path`, real public-command `42501` denial after exact grant revocation, full candidate/history/grant no-mutation fingerprints, and unconditional six-relation rollback.
- Roadmap classification: authority/security defect repair within the already approved urgent slice; no product direction, persona coverage, milestone order, readiness score, pricing, or Production scope change.
- **Source QA:** REPLACEMENT ENGINEERING SOURCE COMPLETE / independent source and Data QA required. No SQL was executed by Engineering.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL.
- Auto-advance target: distinct source QA reviews the exact migration and parity contract, then distinct Data QA applies the forward migration only to isolated project `uyacxqtsiwlvtmhxvoxr` and runs the complete rollback matrix twice. No commit, push, Preview, or Production action occurred.

### Urgent forbidden-entrypoint behavioral ACL evidence - 2026-07-29 06:02 -07:00

- Independent QA returned the preceding source packet **FAIL** because the matrix asserted function privileges only from catalogs. The prior replacement source claim is **INVALIDATED for behavioral ACL sufficiency**. The forward migration remains unchanged and no complete two-run Data QA PASS exists.
- Product Manager `/root` classified the gap **FIX NOW**. Development Engineer `/root/urgent_matrix_hardening` changed only the rollback matrix, its parity source assertions, and this living handoff. UX Review: **N/A** because no product route, component, copy, state, or responsive projection changed.
- After the authorized authenticated public create-case success/replay path has already established the candidate workflow, first task, assignment, and history, the matrix snapshots exact full-row counts and deterministic ordered digests for all six retained relations. It then uses exact role/JWT/reset discipline to prove: an authenticated director cannot call the private create-case helper; `anon` cannot call the public wrapper even with the director subject claim; and `service_role` cannot call the public wrapper even with that claim. Each call must return SQLSTATE `42501` with no receipt.
- Returning to postgres after every role, the matrix requires all six full relation counts and row digests to equal the immediate pre-denial snapshot. This covers candidate requests, urgent history, workflow, task/assignment, workflow history, every grant, and unrelated retained rows. The later active-membership grant-revocation denial and unconditional terminal six-relation rollback remain intact.
- Root release-train Engineering separately reported a network-enabled optimized build rerun **PASS** for the unchanged application candidate. This matrix-only correction does not reuse that as SQL execution evidence. Engineering here ran no live SQL.
- Roadmap classification: test-evidence correction only; no product direction, architecture, persona coverage, milestone, readiness score, pricing, or Production scope change.
- **Source QA:** REPLACEMENT ENGINEERING SOURCE COMPLETE / distinct source and Data QA required.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE ONLY / NON-PRODUCTION PARTIAL.
- No live SQL, migration rewrite, commit, push, Preview, deployment, or Production action occurred.

### Urgent public-command authority repair - independent Data QA PASS - 2026-07-29 06:19 -07:00

- Distinct Data QA Agent `/root/messaging_p1_qa` received the exact forward migration and rollback-only authority matrix after the preserved FAIL, PARTIAL, and invalidated evidence records above. Those earlier verdicts remain historical truth for their exact candidates; this PASS applies to migration SHA-256 `515F32566FD6823B249CB22C56D38A0DF33A3C354AA2CCCAF135785BF0E80377` and the executed mixed-EOL matrix artifact SHA-256 `43EB6E5EC281290748B114A8E987F7A4D3243F2F89EBF3976CFD50C6A3035FB4`, whose canonical committed LF binding is established below.
- Target verification: isolated Supabase project `uyacxqtsiwlvtmhxvoxr` (`passage-cycle-7a-test`), `ACTIVE_HEALTHY`, PostgreSQL `17.6.1.141`. Production project `qsveqfchwylsbncsfgxe` appeared only in the initial read-only project inventory and was never passed to migration, SQL-execution, or advisor tools. No Production query, migration, configuration, or data action occurred.
- Exact execution artifacts were unchanged after execution: `supabase/migrations/20260729063305_urgent_case_public_wrapper_authority_boundary.sql`, 1,248 bytes, SHA-256 `515F32566FD6823B249CB22C56D38A0DF33A3C354AA2CCCAF135785BF0E80377`; and the retained mixed-EOL `supabase/tests/urgent_family_organization_boundary.sql`, 94,896 bytes / 94,309 LF characters, SHA-256 `43EB6E5EC281290748B114A8E987F7A4D3243F2F89EBF3976CFD50C6A3035FB4`. The committed LF-blob equivalence is proved below.
- Preflight proved the migration absent. Supabase migration tooling applied `urgent_case_public_wrapper_authority_boundary` from `2026-07-29 13:10:41.844786+00` through `13:10:44.793242+00`; migration history records version `20260729131043` and the same name.
- The complete rollback matrix passed twice consecutively. Run 1 executed from `2026-07-29 13:15:18.908752+00` through `13:15:21.639741+00`; run 2 executed from `2026-07-29 13:15:43.800125+00` through `13:15:46.202997+00`. The execution adapter began with explicit repeatable-read `BEGIN`, set the isolated-project guard, replaced the source inner transaction boundary in memory with a savepoint, ran the source post-rollback equality block unchanged, and committed only the outer zero-fixture transaction. The migration, matrix, parity ledger, and product source were not edited for execution.
- All six retained relations had identical baseline, post-run-1, and post-run-2 counts and deterministic digests. Baseline snapshots were taken at `2026-07-29 13:10:21.257840+00` through `.257851+00`; post-run-1 at `13:15:21.639731+00` through `.639741+00`; post-run-2 at `13:15:46.202987+00` through `.202997+00`:
  - `organization_member_locations`: count `8`; digest `a70f963e7a63a1950845440df57f10d3`.
  - `tasks`: count `6`; digest `50383bd60a194786c2cc5e45b133202f`.
  - `urgent_intake_events`: count `13`; digest `9d43b44b53a35e3d5ad8d86367d053a4`.
  - `urgent_intake_requests`: count `7`; digest `da9e345e6a40872faa60e16c0334ad94`.
  - `workflow_events`: count `21`; digest `9e874eed8d2c7bb6d8ccab7f4beb37d7`.
  - `workflows`: count `5`; digest `fa133714cb2d24cc3104dc3358310f42`.
- Both runs passed the complete semantic matrix: catalog/RLS/ACL preflight; authorized family submission, exact Northstar claim, atomic case plus first-task creation, exact-location assignment, and My Work projections; exact replay; changed-payload/version/location/reference/family/actor conflicts; wrong-organization, wrong-location, staff, revoked/former, unaffiliated, self-handling, unassigned, and private-helper denials; direct table/event mutation denial; append-only invariants; exact location-grant revocation; public replay denial after revocation; candidate and unrelated digests; final cardinality; and terminal rollback equality. Expected authority/BOLA denials returned `42501`; expected conflicts returned `22023` or `40001` as authored.
- Catalog and ACL were verified after apply at `2026-07-29 13:10:54.330822+00` and finally at `13:16:09.731122+00`. `public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)` is owned by `postgres`, is `SECURITY DEFINER`, has `proconfig=[search_path=""]`, and grants execution only to `authenticated`; `anon`, `service_role`, and `PUBLIC` cannot execute it. The private helper is also an empty-search-path `SECURITY DEFINER` owned by `postgres`, but `authenticated`, `anon`, `service_role`, and `PUBLIC` all lack execution. The public SQL body delegates only the six typed arguments; the private PL/pgSQL helper re-derives `auth.uid()` and enforces receiving organization, exact location, replay actor/payload, and conflict semantics.
- Advisor comparison completed at `2026-07-29 13:16:55.423631+00`. Performance remained `43 -> 43` with an identical cache-key set and no added or removed lint. Security changed `2 -> 3`: the existing mutable-search-path warning for `passage_private.reject_workflow_message_mutation` and leaked-password-protection warning were unchanged; the sole new warning is `authenticated_security_definer_function_executable` for this intentional authenticated public command. Data QA classified it **EXPECTED / NON-BLOCKING** because every other role grant is revoked, the search path is empty, delegation is typed, the private authority checks passed, and the complete two-run denial matrix passed. Reference: `https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable`.
- Three harness attempts failed safely before the two PASS runs and are retained as evidence rather than hidden: a shell-truncated 40,024-character SQL payload returned `42601` at `2026-07-29 13:11:41.767664+00`; the full 94,309-character source with an early `SET` returned `25001` at `13:13:25.785760+00`; and the first savepoint adapter without explicit `BEGIN` returned `25P01` at `13:14:42.870326+00`. Each failed transaction was followed by exact six-relation baseline equality, including post-failure snapshots at `13:11:43.997665+00` and `13:14:45.997741+00` where applicable, and persisted zero fixture mutation.
- **Source QA:** PASS for the bounded urgent repair candidate; the exact migration and matrix hashes remained unchanged.
- **Isolated Data QA:** PASS for migration application plus two consecutive complete rollback-matrix runs.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE AND ISOLATED DATA PASS / NON-PRODUCTION PARTIAL. This Data QA PASS does not authorize `[qa-approved]`, Preview publication, merge, or Production promotion.
- Auto-advance target: distinct Independent Agent Review and Development Head bind the exact candidate, then non-production Deploy and hosted QA execute submit -> claim -> case plus first task -> assignment -> staff My Work, replay/conflict/reload/denial/recovery, 1440/390/360, and browser/runtime-log evidence. No commit, push, deploy, or Production action occurred in this documentation closeout.

### Combined Preview candidate - rejected-head correction and exact-artifact rebinding - 2026-07-29 17:24 -07:00

- Independent Agent Reviewer `/root/independent_review_exact_head` **REJECTED** exact superseded head `4a560bc5e0cf03b1702432190e0702376eab6951`. The rejection is preserved: that head carried the expired founder-review doctrine, its recorded urgent-matrix and messaging-guard hashes did not bind the committed blobs, and its Vercel gate rejected the configured `release/10h-delivery` Preview branch. Its deterministic application tests and optimized build passed, but no hosted claim was made.
- Product Manager `/root` classified all three findings **FIX NOW**. Engineering restored the owner-approved Development Head / Release Authority and Production Reviewer model in `AGENTS.md`, `docs/release-train.md`, the release-governance policy, the trusted workflow, and deterministic governance checkers/tests. Routine founder review is prohibited. This is a binding anti-regression correction, not a product-readiness increase.
- Exact-artifact rebinding preserves the prior evidence instead of silently replacing it. The urgent Data QA execution used the retained mixed-EOL file at 94,896 bytes and SHA-256 `43EB6E5EC281290748B114A8E987F7A4D3243F2F89EBF3976CFD50C6A3035FB4`. Normalizing only `CRLF -> LF` produces 94,309 bytes and SHA-256 `93706B9CDA1CB516C6527CA0DF1BFC5F003364849C660ADA11296A78704501A0`, byte-for-byte equal to `git show HEAD:supabase/tests/urgent_family_organization_boundary.sql`. The SQL text, statements, project guard, rollback boundary, and assertions are unchanged; the mixed-EOL execution evidence is now explicitly bound to the canonical committed LF blob.
- The earlier messaging-guard SHA-256 `5FBF688AC1C74D6D7AECD6DBFDE3FBAA011EBC2FCCA70562F156F97C949E0B53` is **STALE** and must not be cited as the final guard artifact. The canonical committed blob `git show HEAD:scripts/test-workflow-messaging-security.js` is 15,625 bytes with SHA-256 `21C4A9389A154E459FB2D76382BDA77DD4FFB75B2679CC12C13FF585CD2ABFFF`; the focused security suite passes 23/23 against that exact logical source.
- The Vercel ignore-build gate now allowlists exactly two non-production Preview refs: `greenfield/passage-zero` and the already configured `release/10h-delivery`. Exact marker requirements remain unchanged; near-matches such as `release/10h-delivery-candidate`, unrelated branches, non-canonical projects, skip markers, and every Production verification-preview attempt remain denied. No Vercel environment variable or project configuration changed.
- Roadmap classification: governance/evidence/deploy-infrastructure defect correction only; no product direction, persona coverage, pricing, readiness score, or Production scope change. UX Review: **N/A** because no rendered route, interaction, or persona copy changed in this correction.
- **Source QA:** ENGINEERING CORRECTION COMPLETE / distinct evidence QA and fresh exact-head Independent Agent Review required.
- **Hosted Preview QA:** NOT RUN for the replacement head.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE CORRECTION / NON-PRODUCTION PARTIAL.
- Next-role target: distinct evidence-integrity QA verifies the canonical hashes and focused checks; Engineering then freezes a replacement deploy-marker head; a fresh Independent Agent Reviewer and distinct Development Head bind that exact head before a distinct Deploy role publishes the non-production branch.

### Combined Preview candidate - Development Head return and final governance-text repair - 2026-07-29 18:05 -07:00

- Exact head `d202dafd40afe5198c95a131ff6836d50d528bcf` passed fresh Independent Agent Review by `/root/independent_review_replacement_head`: governance, context, deploy gate 19/19, merge-identity fixtures, messaging 23/23, parity 17/17 plus 19 contracts, Server Actions, operational routes, persona language, runtime isolation, TypeScript, optimized build, and diff check all passed. Hosted Preview QA remained NOT RUN and Production remained untouched.
- Development Head `/root/development_head_d202` returned **REQUIRED**, not approved, on that exact head. All technical/data/build/hash/ancestry/marker gates passed and the Development Head explicitly accepted the roadmap branch-reconciliation proposal. It correctly found active stale founder-review directions in the fresh-chat kickoff and strategy handoff plus current-tense historical governance lines that could restart the prohibited owner-dependency model.
- Product Manager classified the governance-text defect **FIX NOW**. Engineering corrected the fresh-chat kickoff to the active Independent Agent Reviewer -> Development Head / Release Authority -> Production Reviewer chain, corrected the V2/V4/V5 implementation gate, and labeled the older bootstrap/founder-review directions historical, non-executable, and superseded. No route, copy, data, migration, environment, deployment, or Production resource changed.
- UX Review: **N/A** for this documentation-only correction. Roadmap classification: anti-regression governance repair within the already classified release-infrastructure packet; no product direction, score, pricing, or Production scope change.
- The Independent Agent Review PASS and Development Head result on `d202daf...` become **STALE** when this correction is committed. A new exact deploy-marker head must rerun context/governance/source checks, receive fresh Independent Agent Review, and receive a fresh distinct Development Head decision before publication.
- **Source QA:** ENGINEERING CORRECTION / fresh exact-head review required.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE CORRECTION / NON-PRODUCTION PARTIAL.
### Combined Preview publication - least-privilege App recovery - 2026-07-29 18:32 -07:00

- Fresh Independent Agent Reviewer `/root/independent_review_replacement_head` returned **PASS** on exact head `25f99dc68682d98751db01a9fc894ed77375f208`. Distinct Development Head / Release Authority `/root/development_head_d202` then returned **APPROVED** for that exact head for non-production Preview publication and merge-readiness evaluation only. Hosted Preview QA remained **NOT RUN**; Production remained untouched; neither decision authorized `[qa-approved]` or Production promotion.
- Distinct Deploy role `/root/deploy_executor_25f` attempted the required Passage GitHub App push once. GitHub rejected it because that exact commit changed `.github/workflows/governance-integrity.yml` and added `.github/workflows/post-merge-identity-integrity.yml`, while the least-privilege App intentionally lacks workflow-modification permission. The attempt failed closed. Remote `release/10h-delivery` remained exactly `9a95d825dec5c21df2127a10e0f94d647179b828`; draft PR #70 remained open at that head; no deployment for `25f99dc...` was created; existing Preview deployment `dpl_32Vn3CpzP58YdzcY4QSLZW5Ht43A` remained the latest branch deployment. Production and Vercel/Supabase configuration were not changed.
- Product Manager `/root` classified permission expansion, owner-credential use, and bypassing the App as prohibited. The recovery is to publish the already reviewed application, data, test, roadmap, policy, and context tree without changing repository workflow files in this packet. Workflow governance corrections remain separately reviewable work for an identity with the correct bounded capability; they are not required to verify the urgent and messaging product candidate in Preview.
- Engineering created publishable commit `1c3e565adf3130b2b651d8e39a4c48fd1726afc3` directly on configured branch head `9a95d825...`. Its tree is byte-identical to reviewed head `25f99dc...` except that `.github/workflows/governance-integrity.yml` is restored to the exact `9a95d825...` blob `15420d5dd6790b77b4ccf72eacf2b16367aadda7` and `.github/workflows/post-merge-identity-integrity.yml` is absent. The complete diff from `9a95d825...` to `1c3e565...` contains no `.github/workflows` change.
- Exact-head source verification on `1c3e565...` passed agent context, release governance, the 19-case Vercel gate, messaging security 23/23, parity regression 17/17 plus 19 contracts, Server Action exports, operational routes, persona language, runtime isolation, merge-identity positive and same-identity-rejection fixtures, TypeScript, optimized Next.js build, and diff check. The build emitted only the known nested-worktree root-inference warning and completed successfully.
- Roadmap classification: release-infrastructure recovery only. No product direction, scope, persona coverage, milestone order, readiness score, pricing, schema, runtime configuration, or Production scope changed. UX Review: **N/A** because no rendered route, interaction, or persona copy changed in the recovery.
- **Source QA:** ENGINEERING PASS / fresh exact-head Independent Agent Review required after this context commit.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PASS / NON-PRODUCTION PARTIAL.
- Auto-advance target: freeze the context-bearing publishable head, obtain fresh exact-head Independent Agent Review and distinct Development Head approval, then a distinct Deploy role pushes only `release/10h-delivery`; after Vercel reports the exact deployment terminal state, distinct hosted QA executes the required 1440/390/360 functional, responsive, accessibility, console, hydration, runtime, recovery, replay/conflict, and denial evidence. No owner or founder review is required.

### Participant invitation lifecycle - PM Sprint Brief - 2026-07-29 18:52 -07:00

Status: **PM COMPLETE / HANDOFF TO DISTINCT UX REVIEW**. This brief schedules the next canonical Passage Zero product slice after the current urgent/messaging Preview packet. It changes no product code, migration, fixture, database, branch, PR, deployment, environment, readiness score, or Production resource.

Role instance and prior handoff:

- Product Manager: `/root/pm_participant_lifecycle`.
- Exact planning base inspected: `a8996ae6944f10b3695e09ff6968615e251212bc` in isolated worktree `.release-train-clean/.participant-candidate`; the worktree was clean before this context-only edit.
- Prior handoff received: close the truthful non-production urgent/messaging Preview packet, then implement the complete participant invitation journey before participant acknowledgment or deterministic-demo work.
- Required sources read completely: `AGENTS.md`, this living context, `docs/release-train.md`, the canonical operational-readiness roadmap, persona/action architecture, complete frontend/backend contract ledger, Passage Zero cutover plan, and Product Manager role brief. The existing participant foundation migrations and current staff-only `/invite/[token]` route were also inspected for reconciliation.
- Next role target: a **distinct UI/UX Review Agent**. Engineering may not start rendered participant work until UX defines and records the responsive, comprehension, failure, and privacy acceptance bar for this exact brief.

Sprint goal:

- Deliver the complete synthetic, non-production participant-invitation lifecycle: a signed-in family coordinator names a person and bounded purpose, creates one secure invitation with truthful manual delivery, the invited person safely inspects it before authentication, signs in as the exact verified identity, deliberately accepts, completes a minimal participant onboarding receipt, receives only the permitted continuity/case projection, and retains that access across reload and a separate session until expiry or coordinator revocation.
- Complete the coordinator recovery loop in the same lifecycle: list pending and historical invitations, create a replacement link through rotation, distinguish expired/declined/revoked/accepted states, revoke a pending invitation, end an accepted participant's access, and show append-only human-readable proof without exposing tokens, raw identifiers, internal events, or broader family/operator data.
- Keep participant **acceptance** separate from the later participant **acknowledgment/contribution** slice. This sprint proves identity and bounded access; it does not claim that a participant can yet acknowledge a decision, complete a task, upload proof, or act for the family.

Product requirements:

1. **Coordinator authority and reachable management.**
   - Add an authenticated family-coordinator surface at `/family/people` with one obvious `Invite someone` action, current participants, pending invitations, and historical accepted/declined/revoked/expired states.
   - Resolve the coordinator's durable active `continuity_space`; if none exists, the same bounded flow may create exactly one through `create_family_space_idempotent`. It must never substitute the current browser-only Rivera fixture or a client identity switcher for Auth.
   - A family coordinator may manage only the continuity space they own. A participant, funeral-home member, vendor, unrelated user, or owner of another space must receive no roster or invitation rows.

2. **Scoped creation and truthful delivery.**
   - Invitation input is normalized email, human display name, relationship, plain-language purpose, one or more allowed category scopes, and an expiry between the existing 15-minute and 30-day bounds.
   - The Server Action calls only `public.create_participant_invitation_idempotent`; it never inserts the table directly and never trusts a client-supplied owner identity.
   - First creation may show the one-time raw link long enough for deliberate copy/share. The raw token must not be stored in application state, a durable table, analytics, logs, screenshots, evidence, PR text, or committed fixtures.
   - Delivery is always `Not sent by Passage` in this slice. Copy must say the email is **named for this invitation**, never that the person “received” an email. The receipt explains that the coordinator must share the secure link manually.
   - Exact request replay returns the original invitation/time with no second row/event and no reconstructed raw token. If the first response or link is lost, recovery is `Create a replacement link`, not a false “show again” or “resend succeeded” claim.

3. **Safe pre-auth inspection.**
   - Reconcile the existing staff-only `/invite/[token]` route to call the already-reviewed unified `public.inspect_passage_invitation` entrypoint and branch on `invitation_type`.
   - Participant inspection exposes only inviter display name, family-space name, relationship, category labels, purpose, expiry with timezone, lifecycle state, and truthful `not_sent` delivery boundary. It exposes no invited email, owner email, roster, participant IDs, cases, documents, messages, token hint/digest, or Auth existence.
   - Inspection is read-only. It does not join the participant, widen access, consume the token, create an event, or imply that accepting grants authority to decide for the family.
   - Malformed, unknown, expired, revoked, accepted-by-another-user, and access-ended paths reveal only the minimum safe state and one recovery action.

4. **Verified identity binding and deliberate acceptance.**
   - Available participant invitations route to secure sign-in while preserving the exact invitation return path. The copy says `Sign in with the email named for this invitation`.
   - First acceptance is POST-only through a participant-specific Server Action that calls `public.accept_participant_invitation`. No GET, link prefetch, route render, or security-scanner request may perform first acceptance.
   - The server binds only the verified Auth email that exactly matches `participant_invitations.invited_email`; client metadata, typed email, role labels, link possession alone, and family-space selection are never authority.
   - Pending state prevents duplicate submission and is announced. Success is shown only after durable re-read or same-user replay proves the same participant, space, scope, acceptance time, and event receipt.
   - Same-user replay preserves the original server acceptance time and adds no participant or event. A different signed-in user gets a non-enumerating denial and no partial row.

5. **Participant onboarding and least-privilege projection.**
   - The acceptance receipt names the family space, relationship, permitted categories in human language, accepting account, authoritative date/time/timezone, who can see the receipt, where proof is saved, and the next action.
   - The role-correct next action opens the participant's permitted family/case destination, never the funeral-home staff/director workspace and never a broad family-owner management surface.
   - The participant may list only active spaces returned by `list_participant_continuity_spaces` and their own active row returned by `list_continuity_participant_projection`.
   - Where an existing workflow is linked to that continuity space, the current family-safe `/case/[id]/today` and message projection may be used only when the participant's category grant permits that exact capability. A scope without the needed category must fail closed. No operator workload, team roster, internal proof artifact, vendor negotiation, organization data, or another participant is exposed.
   - Reload and a separate authenticated session reconstruct the same bounded projection from durable rows and RLS. UI state or a copied token is not the source of truth.

6. **Rotation, resend recovery, expiry, decline, and revocation.**
   - “Resend” in this no-delivery slice is implemented truthfully as an idempotent **replacement-link rotation** through `public.rotate_participant_invitation_idempotent`. Passage does not claim an email or SMS was sent.
   - Rotation revokes the old link with the existing replacement reason, emits the old-link rotation event, creates one new invitation/event, returns the new raw token once, and prevents the old token from accepting. Exact rotation replay adds no rows/events and returns no raw token.
   - An invited person may deliberately decline through `public.decline_participant_invitation` after verified sign-in. Decline requires a short reason, creates one append-only event, grants no access, and remains distinct from coordinator revocation.
   - Expiry is derived from the authoritative database timestamp. An expired token cannot accept; the coordinator sees `Expired` and can create a replacement link. Do not invent a sent, opened, or expiry event that the backend does not record.
   - A coordinator revokes a still-pending invitation through `public.revoke_participant_invitation`; an accepted invitation directs to `End participant access`.
   - Ending accepted access calls only `public.revoke_continuity_participant_idempotent`. It marks the participant revoked, records the coordinator/reason/time and one append-only event, and removes continuity-space, case, task, proof, and message visibility on the participant's next request/reload. History remains visible to the coordinator; revocation never deletes proof.

7. **Human language and privacy.**
   - Every screen must answer the seven governing questions without training: where am I, what needs attention, what do I do, what happens next, what is saved, who can see it, and how do I recover.
   - Use `Family invitation`, `Person invited`, `Can see`, `Not sent by Passage`, `Invitation accepted`, `Access ended`, and similarly direct outcomes. Do not render raw lifecycle enums, event names, UUIDs, token hints, category arrays, fixture/cycle labels, `RLS`, `projection`, `event spine`, `durable`, `server verified`, QA/deploy narration, or readiness language.
   - Preserve Passage Zero typography, warm ivory surfaces, restrained low-saturation purple/blue/green states, visible non-color status text, and the established family privacy boundary.

Sprint components and stack order:

1. **Packet P1 - invite-to-access core (first implementation packet; highest leverage).**
   - Authenticated `/family/people` owner projection and one scoped creation form/receipt.
   - Unified participant-aware `/invite/[token]` inspection without regressing the implemented staff-invitation path.
   - Exact-user POST acceptance, durable acceptance receipt, participant landing/space projection, same-user replay, wrong-user denial, reload/cross-session persistence, and least-privilege case denial/allow proof.
   - Complete parity-ledger rows and rollback-only authority/cardinality coverage for creation, inspection, acceptance, and projection.
   - This is the first bounded stacked PR/review packet. A PASS means the core invite-to-access packet is proven; it does **not** mean the full lifecycle, platform checkpoint, or participant persona is complete.

2. **Packet P2 - lifecycle and access recovery.**
   - Coordinator invitation/history list; replacement-link rotation; expired-state recovery; participant decline; pending-invitation revocation; accepted-participant access revocation; human Activity receipts.
   - Old-link denial, one-time replacement token, exact replay/conflict, no-partial-write proof, and immediate loss of participant continuity/case/message access after revocation.
   - Packet P2 is required before the participant-invitation journey may be called complete.

3. **Packet P3 - hosted lifecycle closure and release evidence.**
   - Deterministic, guarded, reversible, DML-only isolated fixture for the minimum synthetic family coordinator/continuity/case linkage if real command setup cannot create it reproducibly. The fixture must not preseed invitation, acceptance, rotation, decline, revocation, or lifecycle event outcomes.
   - Full independent multi-session hosted matrix, redacted evidence, contract/roadmap/context updates, and exact-head role/release decisions.
   - Participant acknowledgment/contribution starts only in a later PM brief after P1-P3 PASS. It must get its own task/decision command, proof/event, authority, recovery, persona projection, and QA matrix.

Development objectives:

- Reuse the existing continuity and invitation model; do not introduce another participant table, token system, family-role enum, case grant, activity stream, or messaging store.
- Build the participant branch into the existing invite route without copying the staff invitation implementation wholesale or weakening staff invitation behavior.
- Keep server clients request-scoped and dynamic Auth surfaces uncached. Keep all consequential actions in Server Actions/RPCs with stable request UUIDs and re-read receipts.
- Translate category scopes centrally into human labels and enforce the same categories in route queries/commands. Hiding a link is not authority.
- Make recovery deterministic: same-key replay, changed-payload conflict, lost first token, expired link, accepted-by-other, denied category, revoked participant, unavailable environment, and uncertain response each have one safe next action.
- Add frontend/backend contract rows before promoting any participant capability to `implemented`; partial rows remain `backend_only` or `queued`.

Existing-foundation reconciliation:

- The candidate already contains the equivalent reviewed participant/advisor/provider foundation. Engineering must **not** cherry-pick the dirty root packet wholesale and must not duplicate these objects:
  - `supabase/migrations/20260723072450_participant_invitation_thin_slice.sql`;
  - `supabase/migrations/20260723080309_participant_advisor_hardening.sql`;
  - `supabase/migrations/20260723092402_family_provider_discovery.sql`;
  - `supabase/migrations/20260726040000_family_case_workflow_grant.sql`.
- The existing foundation already provides `continuity_spaces`, `continuity_participants`, `participant_invitations`, hashed one-time tokens, `not_sent` delivery truth, create/inspect/accept/decline/rotate/revoke commands, coordinator/participant projections, workflow linkage, and append-only continuity events. This sprint is primarily the missing reachable UI, recovery, parity, test, and hosted-evidence layer.
- Manual collision points are `app/invite/[token]/*`, `package.json`, `docs/product/frontend-backend-contracts.json`, parity/Server Action/persona-language scripts, the canonical roadmap, and this context. Engineering must merge those areas deliberately against the exact current candidate rather than overwrite current urgent/messaging/governance work.
- No new migration is presumed. If Engineering proves a real schema/authority gap, it must stop that subpart, record a new what/why/breakage/recovery list, and name a migration timestamp **later than `20260729063305`**. Structural changes go through migration tooling only; fixtures remain DML-only.
- The missing historical path named in the original migration comment, `docs/product/participant-invitation-thin-slice.md`, must not be silently invented as prior evidence. This PM brief is the controlling documentation-first product gate for new implementation; any later migration requires its own explicit gate.

Frontend/backend parity matrix:

| Persona action/state | Reachable UI target | Authorized command/query | Durable state/cardinality | Authority/RLS predicate | Append-only proof | Failure/recovery and persona projection |
| --- | --- | --- | --- | --- | --- | --- |
| Coordinator opens People | `/family/people` | `list_owned_continuity_spaces`, `list_owned_continuity_participant_projection`, `list_participant_invitation_projection` | One active owned space; only its invitations/participants | `auth.uid() = continuity_spaces.owner_user_id` through reviewed manager predicates | Read only | Signed-out/unavailable/other-space returns no roster; coordinator sees only their space |
| Coordinator creates invitation | `/family/people` invite form | `create_family_space_idempotent` when needed; `create_participant_invitation_idempotent` | One invitation per space/request; one live invite per space/email; raw token never stored | Active authenticated continuity-space owner | `continuity_space.created` when needed; one `participant_invitation.created` | Exact replay stable/no token; conflict/live-member/live-invite denial; receipt says manual share/not sent |
| Any visitor safely inspects | Participant branch of `/invite/[token]` | `inspect_passage_invitation` | Read-only digest lookup; zero membership change | Possession of valid token permits only bounded inspection fields | None; inspection is not claimed as recorded | Invalid/expired/revoked/access-ended states reveal no email, roster, case, or token metadata |
| Exact invited user accepts | Participant branch of `/invite/[token]` | `accept_participant_invitation` | Exactly one active participant linked to one accepted invitation; acceptance fields set once | Authenticated verified email exact-match; active space; token available | One `participant_invitation.accepted` | Same-user replay stable; wrong user, expired, revoked, duplicate active access fail without partial writes |
| Participant opens permitted space/case | Participant landing and existing `/case/[id]/today` where linked | `list_participant_continuity_spaces`, `list_continuity_participant_projection`, family-safe workflow/task/message queries | One own active participant row; only linked workflow rows and permitted categories | Active participant + exact continuity space + category purpose; existing family workflow predicate | Read only | Wrong space/category, revoked/former, unrelated and operator-only data fail closed; reload/cross-session persists |
| Invited person declines | Participant invite screen | `decline_participant_invitation` | Invitation revoked once with accepting user/reason/time, no participant row | Verified email named by invitation; not accepted | One `participant_invitation.declined` | Exact replay stable; different reason/actor conflict; no access granted |
| Coordinator replaces link | `/family/people` invitation row | `rotate_participant_invitation_idempotent` | Old invitation revoked; one new invitation linked by `rotates_invitation_id`; one-time token | Active owner of exact continuity space | One old `participant_invitation.rotated` plus one new `participant_invitation.created` | Old link denied; replay no duplicate and no token; UI says replacement link, not sent/resend |
| Coordinator revokes pending invite | `/family/people` invitation row | `revoke_participant_invitation` | One terminal pending-invite revocation | Active owner of exact continuity space | One `participant_invitation.revoked` | Accepted invite routes to end access; wrong owner/reason conflict fails unchanged |
| Coordinator ends accepted access | `/family/people` participant row | `revoke_continuity_participant_idempotent` | Participant status becomes revoked once; invitation history retained | Active owner of exact continuity space | One `continuity_participant.revoked` | Next participant request/reload loses space/case/message access; same-key replay stable; no deletion |

Acceptance criteria:

- A separately authenticated family coordinator creates one participant invitation for one active continuity space with bounded purpose/category scope and a visible `Not sent by Passage` receipt. Database evidence shows exactly one invitation and one creation event; the raw link appears only once and is absent from logs/evidence.
- An unauthenticated browser safely inspects the participant invitation and sees only the allowed fields. The page says that inspection changes nothing and that sign-in must use the email named for the invitation.
- A wrong authenticated user cannot accept and produces zero participant or acceptance-event rows. The exact invited authenticated user accepts once, receives the original server timestamp and bounded scope receipt, and same-user replay creates no duplicate.
- After acceptance, the participant sees only their own active space/participant projection and only a linked case/capability allowed by category scope. Wrong category, wrong continuity space, another participant, another family owner, funeral-home-only, vendor-only, and unrelated-user data remain absent.
- Reload and a second browser storage context for the same participant reconstruct the same receipt and allowed projection from durable state.
- Rotation makes the old link unusable, creates exactly one new link/invitation, adds exactly one rotation plus one creation event, and never claims delivery. Lost-response replay is stable and cannot reconstruct the raw token.
- Decline grants no access. Pending revocation prevents acceptance. Accepted-participant revocation removes all participant continuity/case/message access on the next request while preserving coordinator history and one immutable revocation event.
- Expired invitations cannot accept and present one recovery: request or create a replacement link. No fictitious expiry event or delivery state appears.
- Staff invitation creation/inspection/acceptance, director/staff authority, urgent, messaging, family case view, and vendor routes retain their existing behavior and gates.
- All user-visible states pass the seven-question language check and display no raw identifier, enum/event key, token metadata, or internal architecture/release wording.
- Enabled controls are at least 48 CSS pixels; keyboard order, visible non-obscured focus, announced pending/error/success states, semantic time elements, and error recovery pass.
- 1440 x 900, 390 x 844, and 360 x 800 show the complete creation, inspection, acceptance, participant landing, rotation, expiry, and revocation states without overflow, truncating required instructions, console errors, hydration errors, unhandled rejection, or failed application request.
- Source, hosted Preview, Production Deployment, Production QA, and Overall release state are reported separately. No score or `[qa-approved]` claim is earned before the complete exact-head hosted matrix passes.

Dependencies:

- Exact current participant candidate and the already merged/applied continuity migrations above.
- Existing Supabase SSR/Auth session helpers, unified invitation inspection RPC, family workflow grant, family-safe case loader, message-scope predicate, and Passage Zero responsive tokens.
- Isolated Supabase project `uyacxqtsiwlvtmhxvoxr` only; Production `qsveqfchwylsbncsfgxe` is prohibited.
- Controlled synthetic family coordinator, participant, wrong-user, unrelated-owner, and revoked-user Auth identities in independent browser contexts. No credentials or Auth UUIDs enter source/evidence.
- A deterministic linked continuity-space/workflow setup created through real commands or a separately reviewed guarded DML-only fixture.
- Completion of the current urgent/messaging Preview publication or exact-head reconciliation before the participant packet is pushed, so this stack does not overwrite or duplicate the active release packet.

QA plan:

1. Inspect the exact diff and verify manual reconciliation at every collision point; reject wholesale cherry-picks, duplicate migrations, duplicate Auth/invitation models, or staff-invitation regressions.
2. Add and run a rollback-only participant invitation matrix against isolated `uyacxqtsiwlvtmhxvoxr`: project/role/migration/ACL/RLS preflight; creation/replay/conflict; safe inspection projection; exact-user accept/replay; wrong-user/expired/revoked/declined denial; rotation/old-link denial; pending revoke; active-participant revoke; category/space/case/message projections; append-only mutation denial; exact terminal rollback and retained-state fingerprints. Run it twice if shared-lab state is retained.
3. Run frontend/backend parity, Server Action export, persona-language, agent-context, release-governance, operational-route, runtime-isolation, deploy-gate, TypeScript, optimized build, and diff/secret checks. Add participant-specific adversarial fixtures so removing scope checks, using `inspect_organization_invitation`, saying “received,” rendering raw states, or mapping all invitations fails deterministically.
4. Run independent hosted sessions: coordinator A -> pre-auth browser B -> wrong user C denial -> exact participant D acceptance -> participant second session E persistence -> coordinator rotation/revocation -> participant denial. A single cookie jar or UI identity switcher does not qualify.
5. Verify exact row/event cardinality after each command and that denials/conflicts change no unrelated retained state. Prove direct table mutation and private helper execution remain denied to ordinary clients.
6. Run Supabase security/performance advisors and classify every finding. Any missing index/runner/browser/fixture capability creates a named QA-infrastructure fix item; it is never `N/A`.
7. At 1440/390/360, record direct and client navigation, final URL, page purpose/action/outcome/visibility/proof/recovery comprehension, overflow, target size, keyboard/focus/status semantics, raw console/page/unhandled-request errors, and exact Preview deployment/commit.
8. Commit only timestamped screenshots and redacted database/audit evidence. Preserve earlier defect evidence; never include raw invitation links, credentials, cookies, keys, email addresses, Auth UUIDs, share tokens, or unredacted database output.

Deploy plan:

- P1 and P2 are bounded Bot-authored stacked packets against the current Passage Zero integration line. Each exact head receives Independent QA, Independent Agent Review, and distinct Development Head / Release Authority disposition. The author identity cannot merge it.
- Use `[skip deploy]` while integrating source. Publish one configured non-production Preview only after the exact packet earns the applicable source/data authorization and the governing truthful Preview marker path. Never add `[qa-approved]` before the complete hosted lifecycle passes.
- Verify the canonical Vercel project/team, exact non-production branch, isolated Supabase binding, READY deployment, build/runtime logs, direct route behavior, and rollback route. Do not change Production configuration, aliases, or Supabase.
- Update the canonical roadmap and this context in the implementation packet, update the umbrella PR #24 with packet dependencies and truthful verdict stages, and retain PR #24 as draft until its larger cutover gates pass.
- Production Deployment remains `NOT DEPLOYED`; Production QA remains `NOT RUN`. Promotion is outside this sprint.

Risks and recovery:

- **Shared `/invite/[token]` collision:** replacing staff-specific inspection/acceptance can break proven staff onboarding. Use a unified inspection discriminator and separate typed action paths; run both complete staff and participant regressions.
- **Token leakage/prefetch:** a copied raw link is a bearer secret before identity binding. Render it once, disable prefetch where applicable, never log/store it, and require POST for first acceptance.
- **False delivery language:** no real outbound provider exists in scope. Every create/rotate receipt remains `Not sent by Passage`; the recovery is manual share or replacement link.
- **Scope leakage:** an active participant is not a family owner. Category scope must govern reachable actions/queries, not merely labels. Missing scope closes the capability.
- **Lost one-time token:** replay cannot recover it by design. The only recovery is audited rotation; the UI must not imply otherwise.
- **Shared-lab drift:** deterministic tests must use reserved IDs, scoped deltas, ordered fingerprints, terminal rollback, and explicit project guards rather than global-empty assumptions.
- **Base movement:** urgent/messaging publication may advance while this slice is built. Before commit, reconstruct/rebase the participant diff onto the exact current integration head and rerun every exact-head gate.
- **Migration temptation:** existing backend coverage is broad. A new migration without a proven gap risks duplicate objects or timestamp collision. Fail closed and use the documentation-first gate above.

Non-goals:

- Participant acknowledgment, decision approval, task completion, document upload, proof submission/review, invitation-based legal authority, or representation of the family.
- Detached chat, realtime presence, notifications/outbox, real email/SMS, provider activation, delivery/read receipts, paid services, or address autocomplete.
- A second case/family/participant/event/invitation model; broad participant record browsing; staff/director/vendor access changes.
- Deterministic Steve demo reset/smoke implementation, public/conversion rebuild, pricing/billing, integrations, Production migration/deployment, or readiness-score promotion.
- Any material legal, privacy, security, medical, funeral-director, representative-authority, retention, or deletion claim.

Issue classification:

- **FIX NOW in P1:** missing reachable participant creation/acceptance/onboarding UI; staff-only invite-route branching; truthful `named for this invitation` language; least-privilege participant landing; complete contract/test coverage.
- **FIX NOW in P2:** rotation/manual-resend recovery, expiry, decline, pending revoke, accepted access revocation, and human history.
- **FIX NOW before release:** full hosted multi-session/responsive/accessibility/cardinality/denial evidence and staff-invite regression.
- **BACKLOG / next PM slice:** participant acknowledgment/contribution after lifecycle PASS.
- **WATCH:** shared-lab retained-state drift, one-time-token leakage, shared invite-route regression, category-scope leakage, and base movement from the urgent/messaging release packet.
- **OWNER GATE:** none for the scoped synthetic non-production implementation. Real external email/SMS, Production, spending, destructive Production data, or material legal/privacy/security claims remain out of scope and would require their applicable explicit gate rather than blocking routine progress.

Roadmap classification:

- This PM brief selects the already-canonical immediate priority and M4 participant requirement; the brief itself does **not** change product direction, milestone order, readiness doctrine, architecture, pricing, or score.
- The implementation packets materially advance participant persona coverage and status. Therefore each implementation PR must classify roadmap impact `YES` and update `docs/product/operational-readiness-roadmap.md` plus this living context in the same PR. Missing classification or stale roadmap status fails closed.
- No whole-platform checkpoint advances from P1 alone. The official platform checkpoint remains at the last fully certified value until the complete six-domain E2E matrix passes; participant lifecycle evidence cannot average away vendor, public, director/staff, or demo gaps.

Owner gates:

- **None for routine execution.** PM, UX, source changes, tests, isolated DML fixture, isolated SQL/RLS QA, branch/PR work, non-production Preview, evidence, Independent Agent Review, Development Head review, and Deploy verification proceed through the agent chain without asking Steve.
- No real customer/family/vendor/funeral-home communication is sent. No Production project/configuration/data is touched. No pricing, paid service, destructive data, or material legal/privacy/security judgment is made.

Release truth at PM handoff:

- **Source QA:** NOT RUN for participant implementation; this brief only.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** PLANNED / NON-PRODUCTION / NO READINESS CREDIT.

Auto-advance: the next distinct role is UI/UX Review for Packet P1 and the complete P1-P3 lifecycle acceptance bar. After UX PASS or a PM-resolved UX return, a distinct Development Engineer manually ports only the bounded participant diff onto this candidate, preserves the current urgent/messaging/governance tree, and hands the exact source/data packet to independent QA. The train does not pause for owner review.

### Participant invitation lifecycle - UI/UX Review handoff - 2026-07-29 19:02 -07:00

Status: **PASS TO ENGINEERING WITH CONDITIONS** for Packet P1 and the controlling P1-P3 lifecycle experience bar. This is a UX implementation authorization, not Source QA, Hosted Preview QA, release approval, or readiness credit.

Role instance and prior handoff:

- UI/UX Review Agent: `/root/ux_participant_lifecycle`.
- Prior handoff received: the complete PM Sprint Brief above from `/root/pm_participant_lifecycle`, with Packet P1 invite-to-access first, Packet P2 lifecycle/recovery second, and Packet P3 hosted closure third.
- Review base: exact clean product base `a8996ae6944f10b3695e09ff6968615e251212bc` plus the PM context append in isolated worktree `.release-train-clean/.participant-candidate`.
- Reviewed source: current staff-only `/invite/[token]` page, Server Action, acceptance button, invitation helpers, sign-in surfaces, family/browser-demo entry, real family case route and loader, current director invitation/team patterns, shared Passage Zero styles, participant/continuity migrations and public RPC contracts, release train, canonical roadmap, persona/action architecture, and the UX role brief.
- Next role target: a distinct Development Engineer. Engineering may implement Packet P1 under this bar; Packet P2 actions must not be presented as complete until their own reachable controls, commands, recovery, and evidence land.

UX verdict and core decisions:

- The current code is not the participant experience. `/invite/[token]` calls the staff-only inspection RPC, labels every token a funeral-home invitation, routes accepted users to staff/director workspaces, and still says an email "received" the invitation. `/family` is a browser-demo fixture, not a safe authenticated participant landing. Engineering must reconcile these surfaces; it must not layer participant copy onto the staff route without changing the discriminator, authority path, landing, and privacy footer.
- Use one shared `/invite/[token]` route and one unified read-only inspection call, `inspect_passage_invitation`. Branch immediately on `invitation_type` into separately typed staff and participant presentations/actions. Staff keeps its existing role/location contract and complete regression suite. Participant uses only participant acceptance/decline actions and can never fall through to staff acceptance or an operations landing.
- Packet P1 creates a dedicated authenticated participant landing at `/participant`. Do not send a participant to the browser-demo `/family`, coordinator-only `/family/people`, `/staff`, or `/director`. `/participant` reads only `list_participant_continuity_spaces` and the signed-in user's own active `list_continuity_participant_projection`.
- For Packet P1, `Family updates` (`updates`) is the minimum selectable and reachable category because it can map to the existing family-safe `/case/[id]/today` destination when a linked workflow exists. Do not offer another category as an actionable promise until its route, authorized query, durable state, denial/recovery behavior, and participant projection pass parity. Existing/future category values may be translated in a receipt, but an unavailable capability gets no enabled link and no "you can now use" claim.
- The family coordinator manages people at authenticated `/family/people`, not inside the Rivera browser-demo identity switcher. Reuse the warm family visual language, but render the verified account/family-space name from server authority. A participant never receives the coordinator's roster or invitation-management view.

Required screen and state inventory:

1. **Coordinator People landing - `/family/people`.**
   - First useful screenful: eyebrow `FAMILY / PEOPLE`, heading `Choose who can help.`, one sentence explaining that access is limited by purpose, and one primary `Invite someone` action.
   - Below the primary action, use three bounded sections rather than a card dashboard: `People with access`, `Waiting for a response`, and `Invitation history`. Each section has a count, a plain empty state, and only its state-valid actions.
   - Each active person row shows human name, relationship, `Can see` labels, accepted date/time with timezone, and `End access`. It does not show participant IDs, token hints, raw category arrays, Auth identity, event names, or case/operator data.
   - Each waiting row shows person, relationship, purpose, human `Can see` labels, `Not sent by Passage`, created/expiry times, and `Create replacement link` plus `Cancel invitation`. Do not show `Resend`.
   - History translates accepted, declined, revoked, expired, and access-ended outcomes. Accepted people belong primarily in `People with access`; history may retain the receipt but must not present an accepted invitation as pending.

2. **Invitation form and review - inside `/family/people`.**
   - Opening `Invite someone` moves focus to a real heading and shows one form in normal document flow; it does not open a cramped mobile modal.
   - Fields have visible labels and short adjacent instructions: email named for the invitation, name, relationship, purpose, allowed `Can see` categories, and expiry. Category choices use a `fieldset` and `legend`; the P1 minimum enabled choice is `Family updates`.
   - The expiry control explains the allowed window in human time. Validation names the exact field and a correction. User input remains in place after a recoverable error.
   - Before the submit button, a compact review block repeats person, relationship, purpose, `Can see`, expiry, `Not sent by Passage`, proof destination, and what happens next.
   - Primary action: `Create secure invitation`. Pending copy: `Creating invitation and saving the receipt...`. Pending disables duplicate submit but does not erase the review.

3. **First-creation receipt and one-time link.**
   - Heading: `Invitation created.` State band: `NOT SENT BY PASSAGE`.
   - Required facts: person, relationship, purpose, `Can see`, email named for this invitation, expiry with timezone, created time with timezone, visible audience, `Proof saved to: Family invitation history`, and `Next: Share the secure link yourself`.
   - Present the raw link once through an explicit `Copy secure link` button/read-only selectable field. Do not render it as a Next `Link`, do not prefetch it, do not auto-open it, do not auto-copy it, and do not place it in an image, QR, analytics event, toast body, screenshot, log, evidence, or persistent client store. Announce `Secure link copied` only after clipboard success; on clipboard failure keep the selectable value and say `Copy did not work. Select the link and copy it manually.`
   - Explain once: `Passage did not send this invitation. Share the link through a private channel you trust.` Do not say emailed, delivered, received, opened, or read.
   - Exact command replay shows `This invitation is already waiting.` It preserves the original time, creates no duplicate, and never shows/reconstructs the link. Recovery is `Create replacement link`.

4. **Participant pre-auth inspection - participant branch of `/invite/[token]`.**
   - Eyebrow `FAMILY INVITATION`; heading `You are invited to help with [family-space name].`
   - Show only invited-by display name, family-space name, relationship, purpose, human `Can see` labels, expiry with timezone, and `Not sent by Passage`.
   - State plainly: `Reviewing this invitation changes nothing.` and `Accepting lets this account see only the items listed above. It does not let you make decisions for the family.`
   - Primary action when available and signed out: `Continue to secure sign-in`. Adjacent instruction: `Sign in with the email named for this invitation.` Never display the invited email or say the email received the link.
   - The shared sign-in page becomes invitation-aware. For an invitation return path it says `Continue your invitation`, not `Funeral-home workspace`, and retains the exact invitation return path. Password-manager/autofill and paste must remain enabled; the invitation code field says `Paste the complete code from your secure invitation link`, not `from your email`.
   - GET, route render, Next prefetch, link scanner, and inspection never accept, decline, rotate, revoke, create an event, or widen access.

5. **Authenticated participant decision.**
   - Repeat family-space name, relationship, `Can see`, purpose, signed-in account, expiry, and the boundary that acceptance saves account/time and grants no family decision authority.
   - Primary `Accept invitation`; secondary `Decline invitation`. On mobile the primary is first in DOM and visual order, full width, with the secondary separated below. Do not place competing equal-weight actions side by side at 390/360.
   - `Decline invitation` first reveals a labeled short-reason field and final `Decline invitation` confirmation; it must not submit from the first disclosure click.
   - Accept pending copy is `Accepting invitation...`; decline pending copy is `Declining invitation...`. Both are announced, disable only the in-flight action set, and never show optimistic success.
   - Wrong-account outcome is non-enumerating: `This signed-in account cannot accept this invitation. No access was added.` Primary recovery: `Use another account`; helper: `Sign in with the email named for this invitation.` It does not reveal the email, accepting account, family roster, or token validity beyond the safe inspected state.

6. **Acceptance receipt and participant landing.**
   - Success heading: `Invitation accepted.` Show family-space name, relationship, human `Can see` labels, signed-in account, original server acceptance date/time/timezone, `Visible to`, `Proof saved to: Family access history`, and `Next`.
   - Same-user replay shows the same receipt and original time. It says `This invitation was already accepted by this account`; it does not imply a second acceptance or render another accept control.
   - Primary action `Open shared family updates` goes to `/participant` first. The participant landing says where they are, whose space it is, their relationship, what they can see, and who controls access.
   - If an authorized linked workflow exists and `updates` is granted, show one `Open family updates` link to the family-safe case destination. If no linked item is available, say `Nothing has been shared here yet. The family coordinator controls what appears.` There is no broad case search.
   - Reload and a separate authenticated session reconstruct the same `/participant` space and scope from the two participant projection RPCs, not from token, receipt query string, local storage, or browser-demo state.

7. **Terminal and recovery states.**
   - Malformed/unknown: `We cannot open this invitation.` / `Check that you copied the complete secure link, or ask the family coordinator for a new one.` No family-space or account detail.
   - Expired: `This invitation has expired.` / `Ask the family coordinator to create a replacement link.` No accept/decline action.
   - Revoked or declined when inspected from the link: `This invitation is no longer available.` / `Ask the family coordinator if you still need access.` Do not reveal whether the invited person or coordinator ended it.
   - Accepted by another account: `This invitation has already been accepted.` / `Use the account that accepted it, or ask the family coordinator for help.` Do not name that account.
   - Access ended: `Your access from this invitation has ended.` / `No shared family details are visible. Ask the family coordinator if this seems wrong.` No stale receipt, case title, task, or message may flash.
   - Temporary service failure: `Passage cannot check this invitation right now. Nothing was joined or changed.` / `Try again`. Environment/configuration narration remains out of persona copy.

Packet P2 lifecycle interaction bar:

- `Create replacement link` is not a resend. Before rotation, present: `The old link will stop working immediately. Passage will create one new link and will not send it.` Primary confirmation `Create replacement link`; secondary `Keep current link`. After success, apply the same one-time copy rules. Exact replay shows no raw link and directs the coordinator to create another replacement only if the first new link was lost.
- `Cancel invitation` is available only for a still-pending invitation. Require a short reason, repeat the person's name and outcome, and use a final `Cancel invitation` action. Success says `Invitation canceled. The old link cannot be accepted.` History remains.
- An accepted invitation never offers cancel/rotation. Its active participant row offers `End access`. The confirmation states which human `Can see` areas close on the participant's next request/reload, requires a short reason, and preserves history. Final action `End access` uses the danger treatment; cancel/back remains easier to reach than accidental confirmation.
- Decline, coordinator cancellation, replacement, expiry, acceptance, and access-ended are text-distinct outcomes. Color may reinforce them but never carry meaning alone.
- Activity copy is human: `Jordan accepted the family invitation`, `Maya created a replacement link`, `Jordan declined the invitation`, `Maya ended Jordan's access`. Never render event keys, IDs, raw status strings, token hints, or database reasons.

Interaction hierarchy and visual rules:

- Use Cormorant Garamond only for display headings and Montserrat for controls, labels, instructions, dates, errors, and facts. Preserve warm ivory surfaces, quiet hairlines/shadows, and low-saturation purple for available/action, blue for informational/waiting, green for accepted/active, and muted red only for decline/revoke/error.
- At 1440, `/family/people` may use a restrained main column plus a narrow context rail, but the invite action and current access list dominate. Do not create a dense admin table or card grid.
- At 390 and 360, every screen is one readable column. Facts stack label over value; names, emails, purpose, category labels, and absolute timestamps wrap without clipping. Primary actions are full-width in normal document flow. No sticky action bar may obscure focused controls or the iOS browser viewport.
- Progressive disclosure is permitted for form entry, decline, replacement, and revocation confirmation. It may not hide visibility, proof, expiry, delivery truth, or failure recovery behind a tooltip or hover.
- All raw enums are mapped centrally: `updates -> Family updates`, `tasks -> Shared tasks`, `decisions -> Family decisions`, `documents -> Shared documents`, `service -> Service plans`, and `proof -> Completion updates`. Only labels with a complete reachable participant capability may be selectable as P1 promises.

Responsive and accessibility acceptance:

- Verify creation, first receipt, replay/no-token receipt, available inspection, wrong-account denial, acceptance pending, accepted receipt, `/participant`, rotation, expired, decline, pending cancellation, access-ended, and service-failure states at 1440 x 900, 390 x 844, and 360 x 800.
- Every enabled control is at least Passage's stricter 48 by 48 CSS-pixel target. Focus is clearly visible and not obscured. Tab order follows visual order; native buttons/links/inputs/fieldset semantics are retained. No click-only card action, hover-only instruction, keyboard trap, or programmatic focus jump to a success toast.
- Form errors use persistent text, `aria-invalid`, and field association; an error summary receives programmatic focus only after failed submit and links/describes the affected fields. Known corrections are stated. The form data remains available.
- Pending, copy success/failure, creation success/replay, acceptance/decline/revoke results, and refreshed list counts are programmatically announced with an appropriate `status` or `alert` region. Do not put `aria-live` on the submit button itself or announce decorative state labels repeatedly.
- Absolute proof/expiry times use semantic `time` elements and include date, clock time, and timezone. Relative time may be supplemental only.
- Text contrast and non-text focus/control contrast pass WCAG AA; states have visible words/icons in addition to color. At 200% text zoom and the 360/390 layouts, instructions, recovery, and actions reflow without two-dimensional scrolling. `document.scrollWidth` must equal `document.clientWidth`.
- No console warning/error, hydration recovery, page error, unhandled rejection, failed application request, duplicate-submit flash, stale participant detail flash, or protected coordinator-content flash is acceptable.

Seven-question comprehension acceptance:

- Every inspected state must answer from rendered copy alone: where the person is; what needs attention; the one action now; what happens after it; what receipt/history is saved; who can see the result; and one recovery action.
- A five-second first-screen check must identify `Not sent by Passage`, `Can see`, expiry, and the primary action without opening help. A participant must be able to say, accurately, `I am not joining the funeral home, I cannot decide for the family, and I will see only these named items.`
- Prohibited persona copy includes `received`, `resend`, `delivered`, or `opened` without evidence; `RLS`, `RPC`, `projection`, `durable`, `server verified`, `event spine`, `token digest/hint`, UUIDs, raw categories/states/events, fixture/cycle/QA/Preview/deploy/readiness narration, or support references that expose internal IDs.

Privacy, token, and shared-route stop conditions:

- FAIL if a participant token uses `inspect_organization_invitation`, if staff and participant actions share one acceptance command, if a GET/prefetch can accept, if the one-time raw link is persisted or rendered as a prefetchable navigation link, if any screen says Passage sent/emailed the invitation, or if a participant lands in a coordinator/operations/browser-demo surface.
- FAIL if pre-auth inspection exposes invited email, owner email, roster, participant/case/document/message data, Auth existence, token metadata, or another participant; if wrong-user denial enumerates the invited/accepting account; or if revoked access flashes stale family data.
- FAIL if category labels are cosmetic while the query ignores scope. Hiding a link is not enough: the route/query must deny a missing category.
- FAIL if staff invitation inspection/acceptance regresses. The unified route must preserve staff role/location receipt, POST-only first acceptance, replay, role landing, and family-access boundary.
- PARTIAL if source interaction semantics pass but any required hosted state, independent browser context, responsive cell, clipboard failure, cross-session reload, console/runtime record, or exact authority/cardinality evidence is missing.

Research grounding and effect:

- W3C WCAG 2.2 Accessible Authentication (Minimum) requires a path that avoids unaided recall/transcription and specifically recognizes password-manager/autofill and copy/paste mechanisms. This keeps paste enabled for invitation/account inputs and prohibits puzzle-like or retyped-code-only sign-in: `https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html`.
- W3C Status Messages requires waiting, success, result, and error updates that do not move focus to be programmatically determinable. This drives persistent announced pending/result/copy/list updates rather than color or button-label-only feedback: `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`.
- W3C Error Identification and Error Suggestion require text that identifies the affected input and provides a known correction. This drives field-linked errors, preserved form input, and one exact recovery action: `https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html` and `https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion`.
- W3C Focus Not Obscured, Focus Visible, Reflow, and Target Size informed the no-sticky-obstruction rule, visible keyboard focus, 360/390 single-column layout, and Passage's stricter 48-pixel controls (above WCAG's 24-pixel minimum): `https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum`, `https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html`, `https://www.w3.org/WAI/WCAG22/Understanding/reflow.html`, and `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum`.

Development handoff:

1. Build Packet P1 in the isolated participant candidate by manually reconciling the current staff invite route; do not overwrite current urgent/messaging/governance work or duplicate continuity migrations.
2. Implement the unified typed inspection discriminator, participant-specific POST action, invitation-aware login copy, authenticated coordinator `/family/people`, dedicated `/participant` landing, centralized human category labels, and P1 `updates` scope enforcement together.
3. Add the one-time non-prefetchable copy receipt, replay/lost-token recovery, non-enumerating wrong-user and terminal states, exact staff regression coverage, and deterministic persona-language/token-leak assertions before calling P1 source complete.
4. Keep Packet P2 controls absent or explicitly unavailable until rotation, decline, pending cancellation, access ending, history, and revocation-denial behavior are implemented together.
5. Hand the exact P1 source/data/parity packet to distinct Independent QA. Packet P3 remains responsible for the complete independent multi-session 1440/390/360 hosted matrix and redacted evidence.

Release truth at UX handoff:

- **Source QA:** NOT RUN for participant implementation; UX acceptance only.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** UX PASS FOR ENGINEERING START / PLANNED NON-PRODUCTION / NO READINESS CREDIT.
- Roadmap classification: this handoff does not change product direction, milestone order, pricing, readiness doctrine, or score. The implementation packet materially advances participant persona coverage and must update the canonical roadmap and living context in the same PR.
- Owner gate: none. Auto-advance is to the distinct Development Engineer without asking Steve.

### Participant invitation P1 - Engineering authority-gap gate - 2026-07-29 19:24 -07:00

Status: **DOCUMENTED BEFORE SCHEMA SOURCE CHANGE / NO DATABASE APPLY**.

- Development Engineer: `/root/eng_participant_p1`.
- Exact implementation base: `a8996ae6944f10b3695e09ff6968615e251212bc` plus the PM and UX context-only handoffs above in isolated worktree `.release-train-clean/.participant-candidate`.
- Gap proven from committed source: `20260726040000_family_case_workflow_grant.sql` delegates family case visibility to `can_view_continuity_space`, which admits an active participant without checking `continuity_participants.category_scope`. The later message predicate correctly requires `updates`, but direct workflow/task/event reads do not. A non-`updates` participant can therefore query a linked case even though P1 must fail closed.
- Required change: replace only `passage_private.can_view_workflow_as_family(uuid)` so the active space owner remains authorized while a participant must be active, be the signed-in user, and have `updates` in `category_scope`. Existing `can_view_workflow`, `can_view_task`, and `can_view_workflow_event` already delegate to this predicate.
- Frontend reason: `/participant` may offer `Open family updates` only when the same durable category grant authorizes the linked `/case/[id]/today` query. A hidden link without the database predicate would be cosmetic access control.
- Breakage if skipped: a participant invited for another future purpose could bypass the landing page and read family case, task, proof-summary, or event projections directly through exposed SELECT policies.
- Migration risk and recovery: the change intentionally removes previously over-broad participant reads but preserves the continuity-space owner and existing funeral-home staff/director branches. Recovery is to restore the previous predicate body from `20260726040000_family_case_workflow_grant.sql`; no table, row, token, event, or fixture mutation is needed.
- Data/environment boundary: source migration only, timestamp later than `20260729063305`; isolated project `uyacxqtsiwlvtmhxvoxr` is the only future QA target. This role will not apply it. Production `qsveqfchwylsbncsfgxe` remains prohibited.

### Participant invitation P1 - Engineering handoff - 2026-07-29 19:58 -07:00

Status: **ENGINEERING SOURCE COMPLETE / HANDOFF TO DISTINCT INDEPENDENT QA / NOT RELEASED**.

- Development Engineer: `/root/eng_participant_p1`; received the complete PM and UX handoffs above. Exact base remains `a8996ae6944f10b3695e09ff6968615e251212bc`; this worktree is intentionally uncommitted for later integration onto the moving release line.
- Implemented P1 only: authenticated `/family/people` owner projection and family-space setup; `updates`-only participant invitation creation through the existing idempotent RPC; one-time non-navigation copy receipt with `Not sent by Passage`; unified typed staff/participant invitation inspection; invitation-aware sign-in; separate participant and staff POST acceptance actions; durable acceptance receipt; `/participant` reconstructed from the two participant projection RPCs; and an `updates`-gated linked `/case/[id]/today` destination.
- Authority correction: documented before code, then added source migration `20260730021524_participant_updates_case_scope.sql`. It narrows only the existing family-workflow predicate to the active space owner or an active `updates` participant. No database or fixture was touched.
- P2 controls remain absent: no replacement-link rotation, decline, pending cancellation, participant revocation, or access-history mutation is presented as available. A replay never reconstructs the raw token. P2 and P3 remain required before the participant-invitation lifecycle is complete.
- Parity and roadmap: four P1 contracts are required by the active parity checker; the canonical roadmap records this as source-only with no checkpoint credit. Category labels are centralized and every new persona surface uses human labels.
- Focused gates passed: participant security/source guard **19/19**; parity **18/18**; Server Action export guard with four participant bindings; persona language; agent context; release governance; operational route; runtime isolation; Vercel branch/deploy gate **19/19**; TypeScript; and `git diff --check`.
- Added but **NOT RUN**: rollback-only SQL matrix `supabase/tests/participant_updates_case_scope.sql`, covering active owner, active `updates` participant, non-`updates`, revoked, unrelated, workflow/task/event visibility, private-helper ACL, and cardinality preservation. It requires the isolated migration plus retained Cycle 7B lineage and must be run by distinct QA.
- Optimized build: **PARTIAL / NOT VERIFIED in this isolated worktree**. Compilation and TypeScript reached PASS using the shared pinned dependency tree, but the first build could not fetch pinned Google fonts and the external-module workaround produced an untrustworthy local runner invariant. The integrated clean candidate that owns its own `node_modules` must rerun the optimized build; no PASS is claimed here.
- Hosted browser, cross-session persistence, staff regression, clipboard failure, wrong-user acceptance, exact row/event cardinality, SQL/RLS, advisors, and 1440/390/360 evidence: **NOT RUN**. No screenshots or database evidence were created.
- **Source QA:** ENGINEERING GATES PASS / INDEPENDENT QA NOT RUN.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / UNCOMMITTED P1 CANDIDATE / NO READINESS CREDIT.
- Next role: distinct Independent QA inspects the exact integrated diff, runs the rollback-only database matrix plus existing participant invitation/replay/race coverage, reruns the optimized build in a clean dependency-owning candidate, and returns failures to PM/Engineering before any Preview packet is considered.

### Participant invitation P1 - independent-review return and replacement Engineering handoff - 2026-07-29 20:34 -07:00

Status: **REPLACEMENT ENGINEERING SOURCE COMPLETE / SOURCE PARTIAL / HANDOFF TO DISTINCT INDEPENDENT RE-REVIEW**.

- **Role instance / prior handoff:** Development Engineer `/root/eng_participant_p1` resumed the uncommitted P1 candidate after distinct independent pre-freeze review returned the preceding 19:58 source packet. The prior Engineering source claim is **INVALIDATED for bearer containment and participant least privilege**. PM classification was FIX NOW as one bounded P0/P1 source packet. The complete PM brief, UX handoff, Engineering authority-gap record, prior Engineering handoff, governing docs, roadmap, persona architecture, plain-language policy, and Engineering role brief were read before this replacement.
- **Independent findings closed in source:** the raw invitation bearer had entered `next`, OAuth `redirectTo`, and OTP `emailRedirectTo`; an `updates` participant inherited raw workflow/task/event/proof/review SELECT through the family predicate; the migration granted a private predicate that its SQL matrix expected to be private; `/family` did not reach People; wrong-account and accepted-receipt recovery looped without a truthful account switch; the participant loader silently selected the first active space; UI purpose allowed 500 characters while the RPC permits 240; pending/error/receipt accessibility was incomplete; and invitation/login copy exposed runtime/configuration narration. String-presence tests alone are not SQL or hosted evidence, so all P1 parity rows now remain `source_partial`.
- **Bearer containment:** `lib/supabase/proxy.ts` immediately exchanges `/invite/<bearer>` for a 30-minute secure httpOnly, same-site invitation-intent cookie and redirects to opaque `/invite/continue` with `private, no-store` and `Referrer-Policy: no-referrer`. `/invite/continue` is explicitly excluded from re-exchange. The raw route has only a fail-closed fallback. Inspection, staff acceptance, participant acceptance, and accepted-state replay read the intent server-side. Login, OAuth, OTP, password return, errors, and receipt navigation carry only `/invite/continue`, never the bearer. The login page derives account-creation eligibility from the server-held intent rather than parsing a token from `next`.
- **Account and receipt recovery:** wrong-email, another-account, and accepted-receipt replay denial suppress all accept controls and show `Use another account`. That action signs out the current Supabase session while preserving the httpOnly invitation intent, then returns to invitation-aware sign-in. Accepted-state GET replay is attempted only after the inspection reports accepted; a denial renders no saved receipt or protected detail. Available-state first acceptance remains POST-only through separate staff and participant Server Actions.
- **Least-privilege data replacement:** migration `20260730021524_participant_updates_case_scope.sql` now keeps `passage_private.can_view_workflow_as_family(uuid)` owner-only and revokes authenticated/private execution. Participants therefore receive zero direct `workflows`, `tasks`, `workflow_events`, `task_proofs`, or `task_proof_reviews` rows through the inherited RLS branches. New authenticated-only `public.list_participant_family_updates()` re-derives `auth.uid()`, active participant, active space, and `updates` scope and returns only human fields across every active family space; it returns no workflow/task/event/proof/review/organization/member identifier. `/participant` uses that bounded function plus the existing own-space/own-participant projections and no longer queries raw case tables or links to a UUID case route.
- **Matrix correction:** the rollback-only matrix now expects authenticated private-function execution to be absent, creates two active update spaces for one participant, proves both bounded rows, inspects the result keys for protected identifiers, and directly asserts zero raw workflow/task/event/proof/review visibility for updates, non-updates, revoked, and unrelated identities. It preserves retained five-relation cardinality and terminates with unconditional rollback. The SQL matrix is added but **NOT RUN**; no SQL or migration was applied.
- **Reachability, comprehension, and accessibility:** `/family` now exposes a 48-pixel `People` destination. Invitation purpose is 240 characters in HTML and Server Action validation. Creation fields use explicit IDs, `aria-invalid`, field-associated error descriptions, an alert summary focused after failed submit, preserved native inputs, and live pending/result/copy announcements. Acceptance pending has a separate polite status region. Persona header copy no longer exposes runtime labels or configuration reasons. Public delivery truth remains `Not sent by Passage`; P2 mutation controls remain absent.
- **Parity and roadmap:** the staff inspection/acceptance contracts now bind the secure continue route; the four P1 contracts are `source_partial`; the participant update contract binds the new bounded RPC and explicit raw-table denials. The canonical roadmap records the invalidated first source design, replacement boundaries, un-applied/unhosted state, and no score increase. Packet P2 remains explicitly queued for replacement-link rotation, decline, pending cancellation, access ending, expiry recovery, and human history. Packet P3 remains responsible for the complete independent multi-session hosted closure.
- **Changed replacement files beyond the existing P1 candidate:** `app/family/page.tsx`; `components/family/FamilyJourney.module.css`; `app/invite/[token]/{page.tsx,actions.ts,AcceptInvitationButton.tsx}`; `app/invite/continue/page.tsx`; `app/login/{page.tsx,LoginClient.tsx,Auth.module.css}`; `app/family/people/{InviteParticipantForm.tsx,actions.ts,People.module.css}`; `app/participant/{page.tsx,Participant.module.css}`; `lib/auth/{invitation-intent.ts,invitation-intent-cookie.ts}`; `lib/supabase/proxy.ts`; `lib/continuity/participants.ts`; `supabase/migrations/20260730021524_participant_updates_case_scope.sql`; `supabase/tests/participant_updates_case_scope.sql`; participant/parity/Server Action guards; frontend/backend contract ledger; roadmap; and this context.
- **Source gates:** participant security/source guard **23/23 PASS**; frontend/backend parity fixture/integration **18/18 PASS**; parity ledger **25 contracts PASS**; Server Action export guard **5 participant bindings PASS**; persona-language PASS; agent-context PASS; release-governance PASS; operational-route gate PASS; runtime-isolation PASS; Vercel deploy gate **19/19 PASS**; messaging-security regression **23/23 PASS**; direct TypeScript `tsc --noEmit` PASS; optimized Next.js 16.1.6 build PASS with `/invite/continue` and `/participant` dynamic routes. The build emitted only the known multi-lockfile inferred-workspace-root warning. Local production-server boundary smoke proved the raw path returns `307` only to `/invite/continue`, the response cookie is `HttpOnly`, `SameSite=lax`, `Path=/`, and 30-minute bounded, the continue route returns `200` without a redirect loop, the fail-closed page has no console/page error, and 1440, 390, 360, plus 720-at-200%-zoom checks had equal client/scroll width. This is local source smoke, not hosted Preview evidence. `git diff --check` PASS is recorded after this context update.
- **No mutation boundary:** no staging, commit, push, branch publication, PR mutation, Preview, deployment, environment/Auth configuration, database/Auth/data write, Supabase migration apply, or Production action occurred. Production project `qsveqfchwylsbncsfgxe` was not accessed.
- **Source QA:** REPLACEMENT ENGINEERING GATES PASS / DISTINCT INDEPENDENT RE-REVIEW AND SQL EXECUTION REQUIRED.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / UNCOMMITTED REPLACEMENT P1 CANDIDATE / NO READINESS CREDIT.
- **Auto-advance target:** distinct Independent QA reviews the exact uncommitted replacement diff, then distinct Data QA applies the source migration only to isolated `uyacxqtsiwlvtmhxvoxr` and runs the rollback matrix plus existing invitation create/inspect/accept/replay/race coverage. Only after exact data PASS may a frozen publishable head enter distinct review, Development Head, non-production Deploy, and independent multi-session 1440/390/360 hosted QA. P2/P3 gaps remain explicit; no owner/founder prompt is required.

### Participant invitation P1 - terminal-state and recovery re-review correction - 2026-07-29 20:54 -07:00

Status: **INDEPENDENT RE-REVIEW FAIL PRESERVED / ENGINEERING CORRECTION COMPLETE / SOURCE PARTIAL / NOT RELEASED**.

- **Role instance / prior handoff:** Development Engineer `/root/eng_participant_p1` received a distinct independent re-review FAIL against the 20:34 replacement candidate. The release train classified all four findings as FIX NOW within P1; the earlier source-gate result is retained as pre-correction evidence and does not authorize publication.
- **Minimum-safe terminal states:** `/invite/continue` now renders full inviter, family, relationship, purpose, category, and expiry details only for an actionable `available` invitation or a verified same-user acceptance receipt. Accepted without a verified receipt, expired, revoked, and access-ended states use generic status and recovery copy. Explicit inspection errors suppress terminal and available details. Focused assertions inspect the terminal component source and prohibit all protected invitation fields there.
- **Local-only account recovery:** `Use another account` calls Supabase `signOut({ scope: 'local' })`, inspects `signOutResult.error`, and redirects to a truthful fail-closed retry state if local sign-out fails. The source guard requires local scope, result inspection, and the failure route and prohibits a bare `signOut()` call.
- **Non-looping recovery:** existing access routes to `/participant`; access-ended routes to `/participant` to inspect current shared access; expired, revoked, invalid, and otherwise unavailable immutable states return to Passage instead of retrying the identical invitation route. Same-route retry remains only for transient inspection failures. No terminal state reconstructs or exposes the raw invitation bearer.
- **Projection copy correction:** family invitation and participant landing copy now state the implemented boundary: the coordinator grants the `Family updates` category and Passage maps eligible progress events into plain language. Unsupported claims that a family/care team separately chose each update or that the update is separately `approved` were removed from persona surfaces and the parity contract.
- **Roadmap classification:** this is a required privacy, recovery, and comprehension correction inside the already-planned participant P1 packet. It does not change product direction, milestone order, readiness doctrine, pricing, or the whole-platform score. The canonical roadmap and living context were updated together.
- **Final correction verification:** participant invitation security/source guard **26/26 PASS**; frontend/backend parity fixture/integration **18/18 PASS**; parity ledger **25 contracts PASS**; Server Action guard **5 participant bindings PASS**; persona-language PASS; agent-context PASS; release-governance PASS; operational-route PASS; runtime-isolation PASS; Vercel branch/deploy gate **19/19 PASS**; messaging-security regression **23/23 PASS**; direct TypeScript `tsc --noEmit` PASS; optimized Next.js 16.1.6 build PASS with `/invite/continue` and `/participant` dynamic routes; and `git diff --check` PASS. The build emitted only the known multi-lockfile inferred-workspace-root warning.
- **Local invitation boundary:** a fresh isolated browser session opened a raw 32-character invitation URL and reached only `/invite/continue`. HTTP evidence showed `307`, `private, no-store`, `Referrer-Policy: no-referrer`, and a 30-minute `HttpOnly; SameSite=lax; Path=/` intent cookie. The fail-closed page rendered `Check this invitation safely.` with a transient `Try again` recovery, returned no console or page errors, and had equal client/scroll widths at 1440, 390, 360, and 720 at 200% zoom. Terminal accepted/expired/revoked/access-ended fixtures require the later hosted/data-backed matrix; source assertions, not this transient local state, prove their protected-field exclusions.
- **No mutation boundary:** no staging, commit, push, branch publication, PR mutation, Preview, deployment, environment/Auth change, database/Auth/data write, migration apply, or Production action occurred. Production project `qsveqfchwylsbncsfgxe` was not accessed.
- **Source QA:** CORRECTED ENGINEERING GATES PASS / DISTINCT INDEPENDENT RE-REVIEW AND SQL EXECUTION REQUIRED.
- **Hosted Preview QA:** NOT RUN.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / UNCOMMITTED CORRECTED P1 CANDIDATE / NO READINESS CREDIT.
- **Auto-advance target:** finish the full source/build/local boundary rerun, freeze the uncommitted diff, and return it to distinct Independent QA. SQL/Data QA and hosted P3 remain later gates; no owner/founder prompt is required.

### Participant invitation P1 - Data QA PARTIAL test-harness correction - 2026-07-29 21:16 -07:00

Status: **DATA QA PARTIAL PRESERVED / TEST-HARNESS CORRECTION IN ENGINEERING / NOT RELEASED**.

- **Role and exact reviewed input:** Development Engineer `/root/eng_participant_p1` received the controlling Data QA handoff from distinct reviewer `/root/qa_gateway_d80` against frozen bot-authored head `3169957c4e305a2b612f6b2346dd157b243eab92`. Independent Agent Review had passed that exact product diff. Data QA authorized and used only isolated project `uyacxqtsiwlvtmhxvoxr`; Production project `qsveqfchwylsbncsfgxe` was untouched.
- **Exact immutable source evidence:** reviewed migration Git blob `ab9be171cf083f8253f1322f9092121f9b347b81`, SHA-256 `5eb3d1af0da231e7484ecb9754103b9c6ab751b32ea4d729d5b3f94842aff2b7`; committed SQL test Git blob `3afaae3cc9ea0e71215a9fcae3b4e114242b3f4c`, SHA-256 `982da6e91ccffc131674cc52d105ad2e36a70f7d3453d0be46e7ba487679174c`. The exact migration was applied through the authorized Supabase migration path and recorded in `supabase_migrations.schema_migrations` as version `20260730040617`, name `participant_updates_case_scope`.
- **Why exact Data QA is PARTIAL:** the immutable committed test first failed with SQLSTATE `55000` because it hardcoded source filename timestamp `20260730021524` as the remote apply-history version. A runtime-only substitution to the recorded version then failed with SQLSTATE `23505` because the fixture inserted two active continuity spaces for one owner, correctly violating `continuity_spaces_one_active_per_owner`. These are deterministic test-only defects; they do not invalidate the applied migration blob, but they prevent an exact immutable SQL PASS.
- **Adapted behavior evidence, not source PASS:** reviewer `/root/qa_gateway_d80` ran a runtime-adapted matrix changing only the history-version assumption and the second space owner. No persisted adapted source artifact or hash was reported; none is invented here. That adapted matrix passed: one updates participant held exactly two active grants across two spaces; only bounded human fields were returned; protected identifiers were absent; the active owner retained access; the participant was denied all five raw relations and the private helper; documents-only, revoked, and unrelated identities were denied; repeated projection was stable and nonmutating; and every fixture change ended in unconditional rollback.
- **Retained authority/cardinality proof:** owner raw access was workflow `1`, tasks `2`, events `5`, proofs `1`, reviews `1`. The retained active updates participant had bounded projection `1`, raw access `0` across all five relations, and `protected_keys_absent = true`; the revoked participant had projection/raw access `0`. Final retained cardinality was workflows `5`, tasks `6`, events `21`, proofs `3`, reviews `3`, continuity spaces `1`, continuity participants `2`, retained workflow `1`; all `750000*` fixture rows were `0`.
- **ACL, RLS, and advisor classification:** `public.list_participant_family_updates()` is `STABLE SECURITY DEFINER` with empty `search_path`, qualified references, and execute only for `postgres` plus `authenticated`; `anon`, `service_role`, and `PUBLIC` are denied. `passage_private.can_view_workflow_as_family(uuid)` is executable only by `postgres`; every other role is denied. All raw tables have RLS enabled. Security advisors returned four WARN: the target authenticated security-definer function is explicitly classified intentional and bounded; three other warnings are pre-existing urgent lint, the messaging helper mutable `search_path`, and leaked-password protection being off. Performance advisors returned 43 INFO with no new target finding.
- **Bounded Engineering correction:** the migration file and product behavior remain byte-for-byte unchanged. The rollback test now accepts the normal apply-history version by locating the exact migration name and validating its feature statements plus live catalog behavior instead of hardcoding a timestamp. The fixture adds a second synthetic owner, preserves the valid one-active-space-per-owner constraint, and asserts that the same updates participant is actively granted into exactly two spaces. No product, RLS, RPC, ACL, migration, or user-facing surface is changed.
- **Research grounding:** current Supabase migration guidance distinguishes Git migration files from the remote `supabase_migrations.schema_migrations` history and documents that the remote table tracks applied versions independently. The current changelog contains no migration-history change that alters this correction; the relevant July 2026 database breaking notice concerns extension version pinning, not migration tracking. This changed the test from filename-timestamp equality to exact name, feature statement, and catalog lineage while retaining runtime authority assertions.
- **Roadmap classification:** test/evidence correction only. It does not change product direction, scope, milestone order, pricing, readiness doctrine, or score. The roadmap and living context are updated together because the prior statement that the migration was unapplied is now stale.
- **Replacement source identity and verification:** corrected SQL test Git blob `10a4c32be005b27a8969f3cad677e41396988f1b`, SHA-256 `25e6d31652231065bbfa07b74c9a0b51ab2af9170c3782ee0e36792205fac2f4`. The migration remains unchanged at blob `ab9be171cf083f8253f1322f9092121f9b347b81`, SHA-256 `5eb3d1af0da231e7484ecb9754103b9c6ab751b32ea4d729d5b3f94842aff2b7`. Eight focused correction assertions PASS; participant source guard **26/26 PASS**; parity fixture/integration **18/18 PASS**; parity ledger **25 contracts PASS**; Server Action guard **5 participant bindings PASS**; persona-language, agent-context, release-governance, operational-route, runtime-isolation, and Vercel deploy gates PASS; direct TypeScript PASS; optimized Next.js 16.1.6 build PASS; and `git diff --check` PASS. The build emitted only the known multi-lockfile inferred-workspace-root warning. The corrected exact SQL itself is deliberately **NOT RUN** by Engineering; distinct Data QA must execute the immutable committed file.
- **Hosted Preview QA:** NOT RUN for this replacement.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / DATA QA PARTIAL / NO READINESS CREDIT.
- **Auto-advance target:** freeze one bot-authored local `[skip deploy]` replacement commit on top of `3169957c4e305a2b612f6b2346dd157b243eab92`, then distinct Independent Agent Review and `/root/qa_gateway_d80` rerun the exact immutable SQL. No owner/founder prompt is required.

### Participant invitation P1 - fail-closed function search-path assertion correction - 2026-07-29 21:25 -07:00

Status: **INDEPENDENT REVIEW FAIL PRESERVED / ASSERTION CORRECTED / SOURCE PARTIAL / NOT RELEASED**.

- **Role and returned head:** Development Engineer `/root/eng_participant_p1` received an independent-review rejection of bot-authored test/evidence head `8f5a435c364dd2ce30447ff7439472a3eec77028`. The prior Data QA PARTIAL, isolated migration application, adapted runtime PASS, ACL/RLS/advisor classification, exact hashes, and zero readiness credit remain controlling evidence.
- **Fail-open defect:** the first replacement checked `array_to_string(function_row.proconfig, ',') not like '%search_path=%'` inside a negative `exists` predicate. If `proconfig` were missing, `array_to_string` and `NOT LIKE` would evaluate to SQL `NULL`; the row would not satisfy the predicate and the matrix could incorrectly continue. The 21:16 source-verification claim is therefore invalidated for exact function `search_path` enforcement only.
- **Fail-closed replacement:** the catalog preflight now counts the two exact function OIDs and requires the count to equal `2`. A function contributes only when it is `STABLE SECURITY DEFINER`, its `proconfig` contains exact `search_path=""`, `pg_options_to_table` returns exactly one `search_path` option whose value equals `quote_ident('')`, and no `search_path` option has a distinct nonempty value. Missing `proconfig`, a missing option, a nonempty path, either missing function, invoker mode, or non-stable volatility reduces the count and returns SQLSTATE `55000`.
- **Adversarial source coverage:** the participant security guard now validates the exact two-function catalog assertion and mutates its source twice. Removing the exact empty configuration and substituting `search_path=public` are both required to fail the guard. Focused result is **29/29 PASS**, including the three new search-path checks.
- **Preserved data and product boundaries:** the distinct-owner/two-active-space fixture, the same participant's exactly two updates grants, migration-name/feature/catalog lineage, all bounded projection and raw-table/private-helper denial assertions, unconditional rollback, and every prior runtime behavior assertion remain unchanged. No product route, copy, RPC, RLS policy, ACL, migration, table, or readiness score changed.
- **Exact replacement source identity:** corrected SQL test Git blob `26e3c56c6816eeeacdf6792b8b0a1f41baefad0e`, SHA-256 `9e0efa8172f040e8332052a279362cbddf9da0d54ee433ae9faeb43f830d24b1`; corrected focused guard blob `4a10bdd9481e588380c0fcd6731eaabd99412f6b`, SHA-256 `f0eb180aef4057b015bcfc0ec6dc7c49c431abd3bb3c1cde9558dce204a6acf4`. The product migration remains unchanged at blob `ab9be171cf083f8253f1322f9092121f9b347b81`, SHA-256 `5eb3d1af0da231e7484ecb9754103b9c6ab751b32ea4d729d5b3f94842aff2b7`.
- **Research grounding:** the current Supabase breaking-change index has no change to PostgreSQL function `proconfig` semantics relevant to this assertion. Repository precedent in participant advisor hardening uses exact `proconfig @> array['search_path=""']`; the messaging rollback matrix uses `pg_options_to_table` with exact `option_value = quote_ident('')`. The replacement combines those precedents and a two-OID count so SQL three-valued logic fails closed.
- **Verification state:** focused participant guard **29/29 PASS**, including missing/nonempty `search_path` mutants; parity fixture/integration **18/18 PASS**; parity ledger **25 contracts PASS**; Server Action guard **5 participant bindings PASS**; persona-language, agent-context, release-governance, operational-route, runtime-isolation, and Vercel deploy gates PASS; direct TypeScript PASS; optimized Next.js 16.1.6 build PASS; direct fail-open-token exclusion PASS; and `git diff --check` PASS. The build emitted only the known multi-lockfile inferred-workspace-root warning. Engineering did **NOT RUN** SQL; distinct Data QA still owns the immutable database execution.
- **Hosted Preview QA:** NOT RUN for this correction.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE PARTIAL / DATA QA PARTIAL / NO READINESS CREDIT.
- **Auto-advance target:** freeze one bot-authored local `[skip deploy]` head on top of `8f5a435c364dd2ce30447ff7439472a3eec77028`, then return the exact immutable packet to distinct review and `/root/qa_gateway_d80` for the full SQL rerun. No owner/founder prompt is required.

### Participant invitation P1 - combined-candidate integration Engineering handoff - 2026-07-29 21:52 -07:00

- **Role instance / handoff:** combined-candidate Integration Engineer `/root`. Received exact participant head `87c74ae710de1bb78ba679223a74e49d5fe9e122` after Independent Agent Review PASS by `/root/eng_gateway_boundary`, exact isolated Data QA PASS by `/root/qa_participant_exact_87c`, and Development Head approval by `/root/devhead_participant_87c` for incorporation only.
- **Integration branch and base:** created local branch `integrate/participant-87c-combined` from clean combined candidate `25f99dc68682d98751db01a9fc894ed77375f208`. The existing `release/10h-delivery-candidate` branch, configured release branch, remotes, PRs, deployments, Auth, database, environment, and Production were not changed.
- **Integration commits:** participant commits `3169957c4e305a2b612f6b2346dd157b243eab92`, `8f5a435c364dd2ce30447ff7439472a3eec77028`, and `87c74ae710de1bb78ba679223a74e49d5fe9e122` were cherry-picked in order as Bot-authored local commits `d9947b49782c1a5db71eb1526315ed64afa38bf9`, `c2fb186`, and `b1f7f6c`. The only conflict was an append-only living-context collision. Both histories were retained; no product source conflict required judgment.
- **Immutable packet binding:** the integrated migration remains Git blob `ab9be171cf083f8253f1322f9092121f9b347b81`, SHA-256 `5eb3d1af0da231e7484ecb9754103b9c6ab751b32ea4d729d5b3f94842aff2b7`. The exact SQL matrix remains blob `26e3c56c6816eeeacdf6792b8b0a1f41baefad0e`, SHA-256 `9e0efa8172f040e8332052a279362cbddf9da0d54ee433ae9faeb43f830d24b1`. The focused guard remains blob `4a10bdd9481e588380c0fcd6731eaabd99412f6b`, SHA-256 `f0eb180aef4057b015bcfc0ec6dc7c49c431abd3bb3c1cde9558dce204a6acf4`. The prior twice-run isolated SQL PASS therefore remains bound to unchanged data artifacts, but combined-head source and hosted gates must still rerun.
- **Combined source verification:** participant invitation guard `29/29` PASS; workflow messaging security `23/23` PASS; parity fixture/integration `18/18` PASS; parity ledger `25` contracts PASS; Server Action export guard with five participant bindings PASS; persona language PASS; agent context PASS; release governance PASS; operational route gate PASS; runtime isolation PASS; Vercel ignore-build matrix PASS; TypeScript PASS; and `git diff --check` PASS.
- **Optimized build:** PARTIAL on this exact local integration head. Next.js compilation could not begin because the restricted runner returned `EACCES` while `next/font` retried and failed to fetch Cormorant Garamond and Montserrat. No font response was mocked, copied, intercepted, or bypassed. The exact participant head and the pre-integration combined candidate each have prior clean optimized-build PASS evidence, but that does not substitute for a fresh combined-head result.
- **QA infrastructure debt:** the affected cell is the fresh local optimized build for the combined integration head. Owner role is Deploy and exact-head QA. Recovery test is a clean build in the authorized Vercel Preview builder or another runner with normal access to the unchanged `next/font/google` assets, followed by font request, computed-family, layout-shift, and full route proof. Until that succeeds, build status is PARTIAL and the integrated head cannot receive Development Head approval or publication.
- **Roadmap freshness classification:** packet incorporation advances already-recorded participant P1 scope and changes no direction, milestone order, readiness doctrine, pricing, or score. The participant commits already update the canonical roadmap and living context. No additional roadmap change is required for this integration-only commit.
- **Source QA:** ENGINEERING GATES PASS EXCEPT OPTIMIZED BUILD PARTIAL / DISTINCT COMBINED-HEAD QA NOT RUN.
- **Hosted Preview QA:** NOT RUN.
- **Independent Agent Review:** NOT RUN on the combined integration head.
- **Development Head / Release Authority:** REQUIRED after exact combined-head QA and review.
- **Production Deployment:** NOT DEPLOYED.
- **Production QA:** NOT RUN.
- **Overall release state:** COMBINED SOURCE PARTIAL / LOCAL ONLY / NO READINESS CREDIT.
- **Auto-advance target:** freeze this context-bearing local integration head, then distinct combined-head QA and Independent Agent Review rerun all exact source gates. If source passes, the Development Head may authorize one non-production Preview build specifically to close the font/build and hosted participant P1 evidence. No owner prompt is required.

### Replacement Preview operator demo recovery - 2026-08-12 20:40 -07:00

- **Role instance / handoff:** Development Engineer and Deploy-prep role `/root/eng_preview_operator_demo_config` received the exact e73 public-demo candidate and the PM/UX acceptance bar from the release-train root. The bounded goal is a deterministic Steve demo entry for Director, Staff, and Vendor while the exact replacement Preview cannot read the reserved server-session credentials.
- **Root cause:** the seven sensitive operator-demo environment variables exist in Vercel Preview and are scoped only to `release/10h-delivery`. The replacement source branch is `feature/public-demo-launch`. Vercel does not retain or reveal a sensitive value while editing its branch scope, so extending the scope would overwrite the working hidden values. No Vercel environment variable was edited, copied, exposed, or deleted.
- **Isolated authority evidence:** read-only verification against isolated project `uyacxqtsiwlvtmhxvoxr` found reserved confirmed Auth identities for Director, Staff, and Vendor and active scoped authority for each role. Emails and credentials were not recorded. No database write was performed, and Production project `qsveqfchwylsbncsfgxe` was not accessed.
- **Development action:** `app/demo/actions.ts` now preserves configured server sign-in when branch-scoped credentials are available and otherwise sends the selected operator to a browser-only example route. `app/demo/operator/[persona]/page.tsx`, `OperatorDemo.tsx`, and `OperatorDemo.module.css` add one coherent Director, Staff, and Vendor route family with role-scoped example work, three role actions, visible receipts, keyboard focus after each action, reset, mobile layouts, and explicit language that no real record is changed or message sent. `scripts/test-public-conversion.js` binds the fallback targets, role identities, privacy boundary, receipts, focus behavior, 48px controls, responsive rule, and line-ending-independent recovery assertions.
- **Product boundary:** these routes are explicitly guided browser examples. They do not authenticate, call a mutation, persist to storage, or present themselves as server-verified workspaces. The real server-authorized operator paths remain unchanged and continue to be used when the reserved Preview credentials are configured.
- **Roadmap freshness classification:** NO material direction, scope, milestone-order, readiness-doctrine, persona-coverage, or architecture change. This is a bounded recovery for an already-recorded demo acceptance gap, so the canonical roadmap does not require a change.
- **Engineering verification:** public conversion PASS; persona-language PASS; runtime configuration PASS; Vercel ignore-build PASS; frontend/backend parity 19/19 PASS; Server Action export guard PASS; direct TypeScript PASS; optimized Next.js 16.1.6 build PASS with 29/29 static pages and `/demo/operator/[persona]` emitted. The build produced only the known multi-lockfile inferred-root warning.
- **Source QA:** ENGINEERING GATES PASS / DISTINCT SOURCE QA NOT RUN.
- **Hosted Preview QA:** NOT RUN for this fallback head. Required next matrix is Director, Staff, and Vendor at 1440, 390, 360, 200 percent zoom, keyboard-only operation, reset and failure recovery, overflow, targets, focus, console, hydration, runtime, and plain-language checks.
- **Production Deployment:** NOT DEPLOYED. Production configuration and data remain untouched.
- **Production QA:** NOT RUN.
- **Overall release state:** SOURCE REPAIR READY FOR DISTINCT QA / HOSTED PREVIEW PARTIAL / NO PRODUCTION CLAIM.
- **Auto-advance target:** freeze one Bot-authored `[skip deploy]` commit, hand the exact head to distinct Source QA, then publish one branch-only replacement Preview and run the complete operator matrix. No owner prompt is required.
