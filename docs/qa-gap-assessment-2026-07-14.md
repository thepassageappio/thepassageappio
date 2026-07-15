# Persona QA Gap Assessment -- 2026-07-14

Owner feedback that triggered this: "I'm still feeling underwhelmed here after wireframes and mapping the customer journey, I really expected an improvement. Especially focused on user onboarding red and green paths and funeral home... we need a true QA and end-to-end assessed on different personas on where we missed the mark."

This is the second time the owner has said the redesign is underwhelming. This doc does not soften that. Every finding below is from a real browser session against **live production** (`www.thepassageapp.io`), using the routes and pass criteria already defined in `docs/persona-qa-spine.md`, `docs/funeral-home-flawless-qa.md`, and `docs/operational-scenario-qa.md`. No fixes were made -- this is assessment only, per the owner's explicit instruction.

## The headline finding

The Threshold depth-pass shipped earlier today fixed the shared chrome (nav, marketing pages, mission/story/trust). But **the three surfaces the owner explicitly called out -- red-path onboarding, green-path onboarding, and the funeral-home operating console -- are not touched by that fix at all.** They are still running on the pre-Threshold visual system entirely: no Fraunces headlines, no layered shadows, no pill-radius consistency, flat cards, and in the red path's case, a color that directly violates AGENTS.md's own "no siren-red anywhere" rule.

This lines up exactly with what the earlier greenfield audit (`docs/agent-operating-context-2026-07-14-run10.md`) already flagged as the real gap: `pages/urgent.js`, `pages/estate.js`, and `pages/funeral-home/dashboard.js` are three of the five untouched Tier 2 monoliths. The owner is not wrong that the redesign feels underwhelming where it matters most -- the pages he's actually looking at when he says that are the pages that haven't been redesigned yet.

## Persona 1: Red path -- "someone just passed" (`/urgent`)

Routes walked: `/urgent` (real, unauthenticated, full onboarding flow, situation-by-situation), `/estate?demo=1&persona=red-family` (family command center after activation).

**What works, genuinely:**
- The copy is the best writing in the product. "You do not have to hold every next step at once," "This is normal to not know," "Nothing here sends an email, text, or outside request until you choose a specific action" -- this is exactly the calm, non-alarming register the persona spine asks for.
- The progressive question flow (situation -> who's present -> pronouncement -> funeral home) is genuinely well-sequenced: one decision at a time, each answer immediately reflected back ("Good. Passage will keep the official confirmation tied to the next transportation and funeral-home steps"), never more than what's needed for the next move. This is good UX bones.

**Where it misses the bar, specifically:**

1. **This page is not on the Threshold design system at all.** The header reads "Passage / Family coordination record" in plain text with no logo mark, no glass nav, no pill shape -- completely different from the sticky glass header now live on the homepage and every marketing page. The situation-picker options ("Unexpected at home," "Under hospice care," etc.) are flat bordered rectangles with ~8px corners, not the 16px/pill-radius Threshold card standard. Selected-state buttons ("I am here," "Already confirmed") fill solid pine-green but with plain rounded-rect corners, not full pill. There is no Fraunces serif anywhere on this page -- every heading is sans-serif, which contradicts AGENTS.md's own "moment vs. mechanism" type rule (this is the single highest-stakes "moment" in the entire product).
2. **The "Minutes" urgency card uses a rose/pink background with a red-toned border** -- this is the literal "siren-red" AGENTS.md says never to use, sitting on the page a family opens in the worst hour of their life. Compare to `/mission`'s "URGENT HELP" treatment, which correctly uses the warm clay/terracotta family instead. These two pages disagree with each other on what color "urgent" is.
3. **The save form at the bottom is a bare, unstyled form**: plain-bordered text inputs, a native browser `mm/dd/yyyy` date picker (not a styled date control), a solid rectangular "Save with Google" button with minimal corner rounding and no shadow. It reads like a placeholder form, not the front door of the product.
4. **Real defect, not a style opinion:** on `/estate?demo=1&persona=red-family`, several of the stage-summary cards render literal `??` characters -- "Waiting ?? 2 open," "Waiting on earlier step ?? 1 open" -- appearing six times across the "What Passage is tracking" grid. This is a broken template/icon interpolation, visible to any real family using the product today. This is the single most embarrassing, easiest-to-fix item in this whole assessment.
5. **The estate command center reads as a dashboard, not a family record.** Dense grid of status cards, small corner radii, no shadow, tight spacing, amber/rose badge colors that don't match the Threshold palette. Persona-qa-spine.md's own P0 checklist asks "does it reduce anxiety and show one next move" -- this page shows four separate "next move" surfaces at once (a stage grid, an "Open work" list, a "Passage prepared" carousel, and a notification-awareness panel), which is the opposite of the one-thing-at-a-time pattern the onboarding flow above it just established.

**Bottom line:** the writing earns the "calm" register the brief asks for; the visuals actively undercut it. A grieving user opening this page today sees plain HTML-form aesthetics and a pink alert box, not the premium, considered product the marketing pages now promise.

## Persona 2: Green path -- "I want to plan ahead" (`/planning`)

Route walked: `/planning`, real unauthenticated flow.

**What works:** the three reassurance cards at the top ("Two trusted confirmations," "Nothing sends automatically," "One calm family record") are well-written and correctly scoped, and this page does inherit the SiteChrome glass header, so the very top of the page looks current.

**Where it misses the bar, specifically:**

1. **This is the "data entry" risk the team's own persona doc already predicted, confirmed exactly as written.** `docs/persona-qa-spine.md` scores the green path 8.4 and names the specific remaining risk: "Payoff needs to feel more like 'my family is protected' and less like data entry." Walking the live page confirms it: immediately after the three reassurance cards, the page presents **twelve form fields in a single unbroken vertical stack** with no sectioning, no pacing, no progressive disclosure -- Person this plan protects, Your email, Primary trusted contact, Primary contact email, Second trusted contact, Second contact email, Healthcare proxy, Proxy email, Burial or cremation preference, Service preference, Faith or cultural notes, Documents location -- then one submit button.
2. **This directly contradicts the red path's own onboarding pattern**, which is right next to it in the product and asks one question at a time with contextual reassurance after each answer. The two onboarding entry points the owner called out by name do not feel like they belong to the same product: one paces itself, one is a wall of a form.
3. Field styling is plain bordered rectangles, no visual distinction between required and optional fields beyond the placeholder text ("Optional"), and no Fraunces usage inside the form itself (only the top-of-page heading is serif).

**Bottom line:** the entry copy is calm, then the actual task -- the thing a green-path user has to do -- is exactly the "checklist"/"data entry" feeling the brief explicitly said to avoid, and it's a bigger version of that problem than the red path has.

## Persona 3: Funeral-home professional (`/funeral-home/staff` -> dashboard)

Routes walked: `/funeral-home/staff` (login/entry), `/funeral-home/dashboard?demo=1&persona=fh-director...` (director), `/funeral-home/dashboard?demo=1&persona=fh-employee...&role=staff` (employee/staff).

**What works, genuinely -- this is the one bright spot:** `/funeral-home/staff` is fully on Threshold. Glass pill header, Fraunces headline ("Open the work assigned to you"), three icon-led explainer cards with soft tinted backgrounds, a pine-solid pill "Email link" button and a pill-outline "Continue with Google" button. If the owner looks at this one page in isolation he'll see real, current design work. The problem is everything past sign-in.

**Where it misses the bar, specifically:**

1. **The dashboard itself is entirely pre-Threshold**, same as the red path: flat white/tinted cards with ~8px corners, zero shadow anywhere (including on the primary "Recommended next action" card with the main CTA), no Fraunces headlines on any dashboard screen, small pill-ish buttons that don't match the marketing pages' button system. This is `pages/funeral-home/dashboard.js`, the 449KB file that's been correctly identified as blocking further progress for three runs now.
2. **The director view renders the exact same stat block twice.** "Active cases / Work handled by Passage / Waiting for response / Needs help" appears once near the top of the page, then again, with identical numbers (2 / 1 / 3 / 1), inside a second "My Day" section a few screens down. This reads as either a real duplicate-render bug or two navigation states stacked on one screen instead of properly tabbed -- either way it directly violates the persona spine's own P0 checklist item: "Is there one primary action, not a vertical pile of competing panels?"
3. **The employee/staff view does not clearly read as staff-scoped.** Per `docs/funeral-home-flawless-qa.md`'s own pass criteria: "Employee sees assigned work first, not owner/admin clutter" and "Director-facing controls are hidden or clearly unavailable." What's actually live: the staff URL lands on a page still titled "FUNERAL-HOME DASHBOARD -- Hudson Valley Funeral Group," shows the same "Operating boundary" explainer (Family sees / Staff sees / Export keeps) that reads like onboarding material rather than a working queue, and shows the identical stat numbers (2 / 1 / 3 / 1) as the director view. Nothing on screen visually distinguishes "this is the restricted staff view" from "this is the director's full view" -- which is the exact buyer objection the QA script names ("Will staff actually use this during the day?").
4. The underlying data model is genuinely solid -- case detail shows coordinator, case value, action needed, owner, waiting-on, proof/status, and family-update fields all correctly populated, which confirms the Q1 finding that the data layer and RLS/feature scope are intact and this is a presentation-layer gap, not a functional one.

**Bottom line:** the front door (`/funeral-home/staff`) is the best single page in this whole assessment. Everything behind it -- the actual console a director or staff member lives in all day -- is unshipped Threshold work plus at least one real duplicate-rendering bug.

## What this means, plainly

Every "underwhelmed" reaction the owner has had traces back to the same root cause: **the pages he's most likely to actually look at and use (onboarding, the funeral-home console) are the three biggest files still on the old design**, while the pages that got redesigned first (marketing/mission/story/trust) are pages a returning owner or pilot funeral home rarely revisits. The redesign is real and good where it's shipped; it just hasn't reached the surfaces that matter most yet.

## Prioritized fix list (assessment only -- not yet started)

Ordered by what would most directly move the owner's stated disappointment, not by engineering convenience:

1. **Fix the `??` rendering bug on `/estate`.** Smallest possible fix, highest embarrassment-per-line-of-code. Should ship same-day, independent of everything else below.
2. **Re-skin `/urgent` (pages/urgent.js, 76.3KB) to Threshold**, including replacing the rose/pink "Minutes" card with the clay/terracotta treatment already proven on `/mission`. This is the single page the owner is most likely to picture when he thinks "the red path."
3. **Re-pace `/planning` (pages/planning.js)** to use the same one-question-at-a-time pattern as `/urgent` instead of a 12-field form wall. This is a UX/IA change, not just a shadow pass -- higher effort than #2 but directly answers the "less like data entry" risk the team already knew about.
4. **Re-skin `pages/estate.js` (313KB)** -- the family command center both paths land on. Needs an actual IA simplification pass (fewer simultaneous panels), not just color/shadow tokens.
5. **`pages/funeral-home/dashboard.js` (449KB)** -- the single biggest lift, and the one the owner just named as the top overall priority. Needs the extraction punch list executed (still blocked on tooling as of this writing, being re-attempted now per separate instruction), a Threshold re-skin, the duplicate stat-block bug fixed, and a genuinely distinct staff-vs-director visual mode so the two roles don't look identical.

## Verification method

Real Chrome browser navigation against `https://www.thepassageapp.io` (production), not text/HTML fetches -- screenshots taken at each step and held for reference. Demo-mode query params used only where the QA docs specify them (`?demo=1&persona=...`), per `docs/operational-scenario-qa.md`'s instruction not to mutate production data; no real family record was saved during the `/urgent` or `/planning` walkthroughs (form fields were exercised but never submitted). Full-matrix mobile-viewport screenshots (the 390px column in `docs/funeral-home-flawless-qa.md`'s Browser QA Matrix) were not completed this pass -- window resize was attempted but the screenshot tool in this environment continued rendering at its fixed capture size, so mobile-specific findings above are not yet independently verified and should be treated as a follow-up, not assumed fine.
