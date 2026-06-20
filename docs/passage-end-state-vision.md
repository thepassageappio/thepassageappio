# Passage — End-State Vision (the rebuild's north star)

Status: canonical vision. Every sprint converges here. Owner-approved direction (calm guided OS).
Companion docs: docs/sprint-01-calm-guided-os-rebuild.md (active sprint), pages/system/admin/saas-roadmap.js (owner roadmap), docs/agent-operating-context.md (loop mandate).

## 1. The end state in one paragraph

Passage is the operating system for everything that has to happen after — and before — a death. It is the best death-tech product in the world because it makes the hardest administrative work of people's lives feel calm, guided, and handled: a grieving family on a phone always sees the one thing that needs them next; a funeral-home director runs every case from a single trustworthy command surface; employees, vendors, and participants each get exactly their slice with one owner, one waiting point, one next action, one prepared output, and one proof trail. The same calm system serves the public website and the logged-in app, on mobile and desktop, so the product feels like one continuous, beautiful, dependable place from first visit to final proof.

## 2. Design doctrine (best practice, non-negotiable)

Grounded in the death-tech landscape and grief-aware design research:

- A guide, not a dashboard, for emotional load. Grief reduces attention; default to one clear next action and progressive disclosure. Dense dashboards are for operators (directors), never for grieving families.
- Visual calm: restrained palette (cream, sage, warm neutrals), generous spacing, plain language. Calm signals seriousness and trust.
- Pause and resume: grief is nonlinear. Nothing punishes stepping away; progress is soft ("8 of 23 — no rush").
- No emotional landmines: careful notifications, no jarring reminders tied to the deceased, warm copy ("Waiting on you," never "Pending action owner").
- One spine underneath, simple surface on top: smart orchestration, single computed status, proof for every action.
- Mobile-first AND desktop-first-class: the family lives on mobile; operators live on desktop. Both are designed, neither retrofitted.
- Enterprise reliability: accessible (WCAG 2.1 AA), fast (LCP < 2.5s mobile), permissioned (RLS), auditable, and demoable on seeded data.

Comparable-market note: Empathy leads B2C bereavement via a human Care Team plus software, distributed through insurers. Passage's differentiated end state is the funeral-home-led operating network: the director's business and the family's experience run on the same spine, so coordination, proof, and reporting are native — not a concierge bolted onto a claim.

## 3. The unifying architecture — how everything comes together

One spine, many calm surfaces. The connective tissue:

- Task orchestration spine: every unit of work is an operating step with one owner, one waiting point, one primary action, one prepared output, one proof event, one visibility boundary, and an automation level (manual / semi-automated / automated). All personas read and write the same spine; no persona has a private, divergent task model.
- Single computed status (lib/designSystem.js deriveCalmStatus): the UI renders status from the spine, viewer-relative (Needs you / Waiting on {who} / In review / Done / Blocked / Not started). UI can never contradict the data.
- One shell, role-aware home: identical header/footer/nav/auth primitives across public site and app; the home is the same component filtered by role. No stitched, divergent dashboards.
- Proof and audit layer: every real action (assign, send, complete, pay, export) writes recipient, timestamp, actor, status, next action. Proof powers both family reassurance and operator reporting.
- Reporting layer: reads the same spine + proof to produce decision-grade dashboards and exports per persona, plus owner-only business health.
- Visibility model: one role model makes it obvious who can see, assign, send, complete, and report; families never see operator internals, vendors/participants see only their scoped request.

Everything is the spine seen from a different seat. That is why it comes together instead of feeling piecemeal.

## 4. End state by persona

### Families / users (B2C, mobile-first)
A calm "Today" home that opens on the one thing that needs them, then a short "when you're ready" list, then "waiting on others — nothing to do." Each task: plain status, why it matters, what it unblocks, one primary action, a guide one tap away. Pre-need (LifeVault-style) lets people organize documents and wishes before a loss. The public site mirrors this calm and earns trust before sign-in. Success: a grieving, non-technical person on a phone always knows the next step and never feels lost.

### Funeral-home directors (desktop-first operator)
A single command surface — "My Day" — showing case risk, staff load, waiting points, family updates, quote/vendor decisions, service-window pressure, proof gaps, and revenue/billing readiness. Assign work, communicate with families, resolve vendor quotes, and run the business from reports. Success: a director runs every active case with confidence from one page and can prove value without exposing internal strategy externally.

### Funeral-home employees (desktop + mobile)
"My Work": assigned client steps first, each as one simple pattern — what's needed, what you do next, who's waiting, the prepared message/output, status, proof, and how to escalate to the director. Deeper automation detail stays collapsed. Success: an employee never interprets internal mechanics; they execute clear steps and save proof.

### Vendors and their employees (scoped)
A scoped request lane/sheet: own the request, see what's waiting, the timing, the quote/approval/payment gate, and the proof to save on completion — and nothing else. Vendor employees get the same scoped surface, assignable within the vendor org, with reliability/quote-response reporting feeding the director. Success: vendors approve-and-get-paid before work, deliver, and save proof, with zero exposure to the family record.

### Participants (scoped, invited)
A single scoped operating sheet: owner, waiting point, prepared output, proof destination, visibility, and one response path — no full-record exposure. Success: an invited participant completes their one ask without needing the whole story.

### System admin / owner (internal)
One canonical roadmap, evidence, QA, pilot health, abuse/rate-limit readiness, and business metrics under System Admin only — never leaking to customer surfaces. Success: the owner sees true product and business state in one cabinet.

## 5. Cross-cutting systems at end state

- Task orchestration & spine: timing-aware next-action scoring; every step classified manual / semi-automated / automated with the next improvement that raises its level; dependencies and history under progressive disclosure.
- Dashboards: role-aware, calm for families, dense and decision-grade for operators; all built from the same spine + a shared component set.
- Reporting & accountability: operational health (open/overdue/stale/owner gaps/proof gaps/time-to-close), family communication, employee load, vendor reliability, and owner-only revenue readiness — all exportable.
- Automation & proactive guidance: recommend the next action from days-since/until-death, service dates, stale waiting, missing proof, role, and emotional load; draft the right message to the right party with review-before-send and delivery logging; cooldowns/rate limits/abuse controls on all sends.
- Communication & proof: audience-aware messages, review-before-send, visibility boundaries, and a complete proof trail.
- Trust, security, compliance: RLS, signed webhooks, secret hygiene, accessibility, and no internal language on public surfaces.

## 6. Desktop and mobile end state

- Mobile (families, on-the-go employees, vendors, participants): thumb-reach bottom nav, 44px targets, one primary action per screen, real sheet scrolling, soft progress, offline-tolerant reads.
- Desktop (directors, staff at a desk, reporting): multi-pane operator layouts — case list + detail + context — with the same shell, tokens, and status model scaled up. Density is earned by role, never imposed on the grieving.
- One system, two postures: identical design tokens, components, and spine; the layout adapts, the meaning never changes.

## 7. How it comes together — one thread

A death occurs. The family's urgent path gives a directive first-hour plan on mobile. The funeral home picks up the case; the director's My Day shows it with risk and next actions. The director assigns steps to employees (My Work) and routes a need to a vendor (scoped quote -> approve -> pay -> complete -> proof). The family sees only their calm "Today": confirm the funeral home, upload a certificate, add a sibling — each unblocking downstream steps. Participants get single scoped asks. Every action writes proof; reporting turns proof into the director's operational and revenue picture and the owner's business health. The same calm design carries the public site that brought them in. One spine, every seat, start to proof.

## 8. Definition of done (the whole-rebuild bar)

The rebuild is complete when, on the new shell + design system + single-status spine:

1. Every public and app surface is rebuilt on the shared system; no legacy stitched pages remain.
2. Families reach the next action in 3 taps on mobile; operators run a case from one desktop surface.
3. Single legible status everywhere; no internal vocabulary on user-facing UI.
4. All five operator/family/vendor/participant/admin journeys pass end-to-end on seeded demo data.
5. Reporting and dashboards for every persona read from the spine + proof.
6. Accessibility AA, LCP < 2.5s mobile, zero hydration warnings, publicSurfaceReadiness clean.
7. agent:check + clean build + Playwright (desktop + 390x844 + 360x640) green; owner-gated production release.

## 9. Roadmap convergence

The owner roadmap phases ladder directly to this end state: Phase 0 full experience rebuild (shell + tokens + single status + surface migration) -> command workflow (director/employee) -> reporting & accountability -> automation & proactive guidance -> enterprise beta readiness. Each sprint is a coherent slice of this vision, never net-new surface area until the spine is green. Sprint 1 establishes the shell, tokens, single-status spine, and the first migrated surfaces; subsequent sprints migrate the remaining surfaces and deepen operator dashboards, reporting, and automation toward this end state.

## Sources (PM research pass)

- Empathy product + about: https://www.empathy.com/product , https://www.empathy.com/about
- BMO x Empathy bereavement support (Jan 2026): https://newsroom.bmo.com/2026-01-07-BMO-Insurance-Introduces-Enhanced-Bereavement-Support-Through-Collaboration-with-Technology-Company-Empathy
- Designing for Death — UX guide for end-of-life products: https://matthewlarn.medium.com/designing-for-death-a-ux-guide-for-end-of-life-products-98983f885014
- Stardust — end-of-life planning (UX Design Awards 2025): https://ux-design-awards.com/winners/2025-2-stardust-end-of-life-planning-and-support
- UX writing for difficult topics (death/danger): https://ux-writing-hub.beehiiv.com/p/the-ux-writing-of-difficult-topics-like-death-and-danger
