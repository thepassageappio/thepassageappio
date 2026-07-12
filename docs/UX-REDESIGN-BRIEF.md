# Passage — UX Redesign Brief ("Threshold")

Source-of-truth brief for the full UX redesign of The Passage App IO (www.thepassageapp.io). Read this first, then `AGENTS.md` and the live Supabase schema, before doing redesign work. Prior redesign artifacts are saved in the workspace folder `Passage-UX-Redesign/` (00-system-findings.md, 01-current-state-critique.md, 01-design-system-foundation.html, 02-information-architecture.md, and a hero-screens mockup HTML).

## Founding truth
A founder helped plan his grandmother's funeral while navigating Medicaid and care decisions. The people were kind; the system failed everyone — documents got lost, context didn't travel, coordination collapsed back onto the family. Passage exists to make the family record travel cleanly across every party who needs it. Design must be warm and empathetic for grieving families, enterprise-grade for funeral homes, frictionless for vendors, and immediately trustworthy at onboarding.

## Mandate
Greenfield redesign. The owner (Steve) is open to a complete teardown and rebuild of the UI/UX/IA. Do NOT preserve current pages, layouts, or the existing CalmKit patterns just because they exist.
- Fixed source of truth (keep): the Supabase data model, user roles/RLS, and feature scope. These define WHAT the product does and who the users are. Ground everything here; never invent backend facts.
- Greenfield (rebuild): visual design, UX, information architecture, interaction patterns.

## Current-state read (why we're rebuilding)
The backend spine and product thesis are strong and stay. The UI grew by accretion into per-persona monoliths (e.g. large `estate.js`, `App.js`) so it reads as several apps stitched together. Two type systems collide with no rules. CalmKit is a decent palette but not a system — sage-on-cream reads generic-wellness, not trustworthy-and-timeless — with no elevation, grid, motion, or iconography stance. The highest-stakes surface (the urgent/red path) is currently the least calm. Keep exactly one CalmKit idea: viewer-relative status. Rebuild it.

## Design language — "Threshold"
- Palette: deep Pine (authority, continuity) + warm Clay (humanity) on Bone paper. Earthy, accessible status colors. No siren-red.
- Type: Fraunces for emotional "moments"; Inter for mechanisms. One rule at every decision: "moment or mechanism?"
- One kit, two temperatures: Family (warm, mobile-first, one-thing-at-a-time) and Operator (structured, dense-capable, desktop console). One system, not two apps.
- Emotional register by user: Family = calm, compassionate, low-friction, one clear next action. Funeral home/vendor/admin = efficient, structured, purpose-built, zero ambiguity.

## Information architecture — object-shaped
One Passage record, navigated identically from every role. Sections: Today · Horizon · Tasks · People · Documents · Estate · Medical · Wishes · Messages · Audit. Purpose-built consoles per role (Family, Funeral Home, Vendor, Admin). Hard wall around System Admin. Map every screen to the real Supabase tables and current routes.

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
Enterprise-grade reliability/structure for B2B. Warmth and emotional safety for grieving B2C — never cold, clinical, or alarming. Zero ambiguity in task ownership. The family record must feel portable and living, not a static folder. B2C onboarding completable under emotional duress (minimal friction, clear progress, compassionate copy). Every portal purpose-built, not a bolted-on tab.

## Systems
GitHub repo: `thepassageappio/thepassageappio` (Next.js). Live data model: Supabase (use the Supabase MCP for tables/roles/RLS). Also live: the Passage site, Vercel, HubSpot, Stripe. Design references: Apple, Notion, Everplans, Tomorrow, Salesforce Health Cloud.
