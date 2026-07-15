# Passage — UX Redesign Brief ("Threshold")

Source-of-truth brief for the full UX redesign of The Passage App IO (www.thepassageapp.io). Read this first, then `AGENTS.md` and the live Supabase schema, before doing redesign work. Prior redesign artifacts live in `docs/redesign/` in this repo (committed 2026-07-12 — do not look for a workspace-folder copy, the repo is the durable copy).

**Required reading alongside this brief: `docs/redesign/08-visual-craft-standard.md`.** Owner correction 2026-07-12: early mockups were functionally right but visually flat. Every deliverable from here forward — mockup or shipped code — must meet that craft bar (layered shadows, generous pill-radius, gradient buttons with real depth, real SVG icons not color boxes, glass surfaces, refined type scale). `docs/redesign/01-design-system-foundation.html` v2 is the reference implementation.

**Owner correction 2026-07-14 (second round, "I'm not happy"): required reading, `docs/redesign-diagnosis-2026-07-14.md`.** The redesign so far was executed as a re-skin of existing pages -- colors, fonts, shadows, radii -- while preserving old page structure and content density "byte-identical." That was the safe call while the data model was fixed, but it means the actual IA never changed and pages still read as dense, old-app-in-new-clothes. See the "Design direction refinement" and "Mandate" sections below for what changes going forward.

## Founding truth
A founder helped plan his grandmother's funeral while navigating Medicaid and care decisions. The people were kind; the system failed everyone — documents got lost, context didn't travel, coordination collapsed back onto the family. Passage exists to make the family record travel cleanly across every party who needs it. Design must be warm and empathetic for grieving families, enterprise-grade for funeral homes, frictionless for vendors, and immediately trustworthy at onboarding.

## Design direction refinement — 2026-07-14 (owner-approved, reconciles inspiration references with the warmth mandate)

The owner shared three "best website design" references (Teenage Engineering, Fabric, Appwrite) as craft-quality benchmarks, then clarified the target register directly: *"It's ideas, our job is to turn it into emotional warmth but modern, millennial and Gen Z, and funeral homes."* Also, separately: *"Remember less is more, Apple made empathy, how do we level this up?"*

Reconciled direction — this is a synthesis, not a copy job:

- **Not literal.** Those three references are bold, dark-mode-leaning, high-contrast tech/generative-art aesthetics. Do not port dark backgrounds, aggressive gradients, or a tech-brand mood directly onto family-facing surfaces — that register reads wrong for a product used by someone whose parent or grandparent just died.
- **What IS transferable:** the craft discipline those sites share regardless of palette — confident large-type hierarchy, generous negative space, one restrained signature visual motif per screen rather than many competing elements, real depth/layering (not flat cards), and tight color discipline (one or two accent colors used deliberately, not scattered across a page). Threshold's existing Pine/Clay/Bone system already gives Passage its own restrained palette; the craft principles apply within that palette, not as a reason to introduce a new one.
- **Two audiences, one system, different confidence levels.** Family-facing surfaces stay warm, calm, and emotionally paced (per "Apple made empathy" — the goal is answering "what do I do, and why should I trust this" in as few words/elements as possible, with warmth in copy and motion, not clinical density). Funeral-home/operator surfaces can carry more restrained confidence and structure (closer to what a millennial/Gen Z funeral director or family member coordinating on their phone would expect from modern software) but should still not read as a dense, generic B2B SaaS dashboard — restraint applies there too, just with a more structured, efficient tone rather than a soft one.
- **Per-page discipline going forward:** every simplification or visual-craft pass should be graded against "what's the one thing this screen needs to say, what can move to progressive disclosure or be cut entirely, and does it still feel warm and human after the cut" — not just "does it use the right colors" and not just "does it match the original wireframe density" (the wireframes themselves may need trimming further).

## Mandate
Greenfield redesign. The owner (Steve) is open to a complete teardown and rebuild of the UI/UX/IA. Do NOT preserve current pages, layouts, or the existing CalmKit patterns just because they exist.
- **Updated 2026-07-14 (owner-approved, supersedes the line below):** the Supabase data model, roles, and feature scope are no longer fixed constraints. The owner has explicitly authorized backend/schema changes to follow the frontend rebuild where genuinely needed: *"the backend needs to follow the frontend, I gave it greenfield permission, as long as we are clear on what needs to be done backend to keep up let's make sure it's clear."* See `AGENTS.md`'s "Backend Authorization Update — 2026-07-14" for the full authorization and its condition (a written, explicit list of required schema changes and why, using real Supabase migrations, before they're applied -- not reckless or undocumented data loss).
- ~~Fixed source of truth (keep): the Supabase data model, user roles/RLS, and feature scope. These define WHAT the product does and who the users are. Ground everything here; never invent backend facts.~~ (superseded 2026-07-14, see above)
- Greenfield (rebuild): visual design, UX, information architecture, interaction patterns, **and now backend/schema where the frontend rebuild requires it.**
- **Scope correction 2026-07-14:** "greenfield" means an actual IA and component rebuild, not a re-skin that keeps every field/section/panel from the old pages and only changes color/font/shadow values. Where a page's density or structure doesn't match the wireframes' intent (or the wireframes themselves are too dense per the "less is more" direction above), rebuild the structure, don't just repaint it.

## Current-state read (why we're rebuilding)
The backend spine and product thesis are strong and stay. The UI grew by accretion into per-persona monoliths (e.g. large `estate.js`, `App.js`) so it reads as several apps stitched together. Two type systems collide with no rules. CalmKit is a decent palette but not a system — sage-on-cream reads generic-wellness, not trustworthy-and-timeless — with no elevation, grid, motion, or iconography stance. The highest-stakes surface (the urgent/red path) is currently the least calm. Keep exactly one CalmKit idea: viewer-relative status. Rebuild it.

## Design language — "Threshold"
- Palette: deep Pine (authority, continuity) + warm Clay (humanity) on Bone paper. Earthy, accessible status colors. No siren-red.
- Type: Fraunces for emotional "moments"; Inter for mechanisms. One rule at every decision: "moment or mechanism?"
- One kit, two temperatures: Family (warm, mobile-first, one-thing-at-a-time) and Operator (structured, dense-capable, desktop console). One system, not two apps.
- Emotional register by user: Family = calm, compassionate, low-friction, one clear next action. Funeral home/vendor/admin = efficient, structured, purpose-built, zero ambiguity.
- Visual craft bar: see `docs/redesign/08-visual-craft-standard.md` — layered shadows, generous pill-radius, gradient CTAs with depth, real SVG iconography, glass/gradient surfaces used sparingly, refined type scale. This is not optional polish; it's part of the spec.
- See "Design direction refinement" above for how this palette/craft bar reconciles with the owner's "modern, millennial and Gen Z, funeral homes" and "less is more, Apple made empathy" direction.

## Information architecture — object-shaped
One Passage record, navigated identically from every role. Sections: Today · Horizon · Tasks · People · Documents · Estate · Medical · Wishes · Messages · Audit. Purpose-built consoles per role (Family, Funeral Home, Vendor, Admin). Hard wall around System Admin. Map every screen to the real Supabase tables and current routes. **As of 2026-07-14, if the real schema doesn't cleanly support this object-shaped model, that is now a legitimate backend change to propose (with the written "what and why" list), not a reason to keep the old persona-monolith pages.**

## Task spine & coordination logic
Passage coordinates participants as a calm, intelligent guide — not a ticketing system. Design: how tasks are generated, how the right people are looped in at the right moment, how handoffs are surfaced, and how the system communicates what's waiting without creating anxiety. Zero ambiguity in ownership: every open item has one clear owner and one clear next action. Viewer-relative status ("your move" vs "waiting on Rivera Funeral Home").

## Admin access model
Dedicated Admin Portal, role-based via Supabase RLS. Secure "view/impersonate as [user]" so support can see any Passage from the user's perspective without hacks. Document the model and wireframe the Admin Portal.

## Demo instance strategy
Produce demo instances with NO weird/demo pages ever visible in production. Preferred: a seeded demo organization/tenant with realistic fake data, gated by env/feature-flag; and/or a separate demo environment (Vercel preview deployment or `demo.thepassageapp.io`). Provide a one-command reset/reseed. This shapes the sprint plan — the funeral-home demo path must be production-ready first.

## Deliverables (sequence)
1. UX design system foundation (Threshold): type, color, spacing, component tone, emotional register per user type.
2. User journey maps: grieving family/B2C (first-time, mid-process, returning), funeral-home professional, vendor, admin/internal. Each: entry point → key decisions → friction to eliminate → emotional state per stage → exit/completion.
3. Wireframes + annotated mockups (low-to-mid fidelity, interaction notes), each showing navigation state, empty states, loaded states, and role variants. FUNERAL-HOME DEMO PATH FIRST (Funeral Home Portal, Dashboard funeral-home variant, a Passage record + Tasks/task-spine, Invite, Documents), then: Landing, Login, Create Account, Forgot Password, Dashboard (family/vendor/admin variants), Create a Passage, Timeline, Contacts, Estates, Medical, Funeral Preferences, Messages, Notifications, Settings, Admin Portal, Vendor Portal.
4. Task spine & coordination logic.
5. Sprint plan: prioritized sprints, each with goal, pages/features, dependencies, definition of "done"; sequence so the funeral-home demo path is production-ready first.

## Constraints (hold throughout)
Enterprise-grade reliability/structure for B2B. Warmth and emotional safety for grieving B2C — never cold, clinical, or alarming. Zero ambiguity in task ownership. The family record must feel portable and living, not a static folder. B2C onboarding completable under emotional duress (minimal friction, clear progress, compassionate copy). Every portal purpose-built, not a bolted-on tab. Visual execution must meet `docs/redesign/08-visual-craft-standard.md` — no flat borderline-wireframe mockups treated as final.

## Systems
GitHub repo: `thepassageappio/thepassageappio` (Next.js). Live data model: Supabase (use the Supabase MCP for tables/roles/RLS — including migrations now that schema changes are authorized where the frontend requires them). Also live: the Passage site, Vercel, HubSpot, Stripe. Design references: Apple, Notion, Everplans, Tomorrow, Salesforce Health Cloud — plus Teenage Engineering / Fabric / Appwrite for craft-quality discipline only (see "Design direction refinement" above), not literal styling.
