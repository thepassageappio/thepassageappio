# Redesign Diagnosis -- 2026-07-14

Owner reaction that triggered this: "Way too much content on every tab, this isn't SaaS best practice, go back to the wireframes and vision, I'm unhappy... Mobile I see inconsistencies on font." Followed by a design north star: "Remember less is more, Apple made empathy, how do we level this up?"

This is diagnosis only. Nothing below has been fixed. Every claim is backed by either a direct file:line reference from the live repo or a real screenshot taken against production this session.

## The one-sentence answer

**The redesign was executed as a re-skin (colors, fonts, shadows, radii) of the existing pages, with an explicit, repeated engineering promise to keep every field, section, and piece of copy "byte-identical."** That promise was the right call for not breaking a live, RLS-connected app with no test suite -- but it also means the actual information architecture never changed. The wireframes and IA doc call for something structurally different (one record component, four role-based consoles, progressive disclosure, drawers instead of full navigation) than what exists today (persona-monolith pages with every field visible at once, now wearing new colors). Density and font inconsistency are two symptoms of the same root cause: the content model was never rebuilt, only repainted.

## Part 1: wireframe/IA drift

`docs/redesign/02-information-architecture.md` says this about the current app, in its own words, written by whoever scoped this project: *"Current state is 'several apps stitched together' (per brief) -- per-persona monolith pages (`estate.js`, large `App.js`). Threshold IA replaces persona-monolith pages with one record component tree, parameterized by viewer role and console skin. This is the single biggest engineering lever in the sprint plan: build the record once, wrap it four ways."*

That rebuild -- the actual architectural change the brief called for -- has not happened on any shipped page. What shipped instead, page by page:

**`/urgent` (pages/urgent.js).** Wireframe calls for a guided, one-decision-at-a-time flow (this part is actually followed well -- see the QA doc from earlier today). But `docs/redesign/04-wireframes-annotated.md`'s interaction notes call for skeleton loading states and confirmation micro-moments, not a plain HTML form with a native date picker at the end, and not the flat, un-elevated card stack (Stabilize/Coordinate/Organize, the situation picker) that's live today. The page has real copy discipline; it has zero of the wireframe's or the visual-craft-standard's actual polish.

**`/estate` (pages/estate.js, 313KB).** This is the clearest case of the density problem. The wireframe's "A2/A3" pattern calls for a persistent record with sections in a sub-nav, task detail opening in a drawer so context is never lost. What's live: a single long-scrolling page stacking a "still on track" banner, a funeral-home-connection search panel, a 7-cell stage grid, an open-work list, a "Passage prepared" carousel, and a notification-awareness panel -- all visible simultaneously, all at once, on first load. This is the opposite of "one record, sectioned, progressive disclosure." It is the old estate.js content, unchanged, wearing new badge colors.

**`/funeral-home/dashboard` (pages/funeral-home/dashboard.js, 449KB).** Wireframe A2 explicitly says: *"clicking a task opens a right-side drawer (not a full navigation) so the director never loses case-list context."* What's live: a stat block that (per this morning's QA pass) renders twice on the same screen, a case detail that expands inline in the same long page rather than a drawer, and a staff/employee view that is visually and structurally almost identical to the full director view -- exactly the "several apps stitched together" problem the IA doc was written to solve, still present today.

**`/planning` (pages/planning.js).** This is the one page in today's sample that most closely follows the wireframe's actual token system (real Fraunces/Inter, real `--e1`/`--e2` shadow variables, real pine/clay/bone palette, all defined locally at the top of the file). But it still renders as a 12-field wall with no pacing, because the *content model* -- one form, every field -- was never restructured, only the paint was.

## Part 2: is this a density problem or a wireframe problem?

Both, and the owner's north star ("less is more, Apple made empathy") is the right corrective for either. Concretely, held against Apple/Notion/Linear-caliber restraint rather than just "matches the wireframe":

- `/estate` has five simultaneous panels competing for attention on load. Apple-caliber would show one: the single next action, full width, with everything else -- stage grid, notification log, prepared-outputs carousel -- behind a tap/expand. The wireframe's own "drawer, not full navigation" instruction already points this direction; it just wasn't followed even loosely.
- `/planning`'s 12-field form is the starkest violation of "what's the one thing this screen needs to say." The one thing a green-path visitor needs to do first is name themselves and one trusted contact -- two fields, not twelve. Everything else (proxy, disposition, faith tradition, documents location) is real but belongs behind "add more later," inside the estate, exactly as the page's own intro copy already promises ("You can fill in the rest inside the estate") and then immediately contradicts by showing all twelve fields anyway.
- `/funeral-home/dashboard`'s duplicate stat block is a legibility failure independent of density philosophy -- it's simply showing the same four numbers twice on one screen, which no density standard defends.
- None of the four surfaces reviewed today lean on progressive disclosure (expand/detail patterns) anywhere. Everything found is either fully visible or fully hidden behind a page navigation; there is no "tap to see more" pattern in use yet on any Tier 2 page.

## Part 3: font inconsistency -- exact file:line evidence, not one example

There are **two separate, competing typography systems** live in the codebase right now, and which one a page gets depends entirely on whether that specific page has been individually re-skinned.

**System A (old, still the site-wide default):** `lib/typography.js` defines `PASSAGE_FONT.family = 'Georgia, "Times New Roman", serif'`. `pages/_app.js` (lines ~114-131, the global `<style jsx global>` block) applies this as the `font-family` on `html, body` for the entire site: *"font-family: ${PASSAGE_FONT.family}"*. This means **every page and every element that doesn't explicitly override its font falls back to Georgia serif** -- the pre-Threshold system font. This one file is the single root cause of "inconsistent fonts on mobile": it's not that fonts are randomly wrong, it's that the site has never switched its own base/fallback font off the old system.

**System B (new, Threshold, opt-in per page):** `lib/designSystem.js` exports `SANS` (Inter stack) and `TYPE`; individual pages that got re-skinned (`pages/mission.js`, `pages/story.js`, `pages/trust.js`, `pages/planning.js`, `components/SiteChrome.js`, `components/calm/CalmPublicChrome.js`) each independently `@import` Google Fonts Fraunces/Inter and hardcode their own local `:root` CSS custom properties (`--pine-600`, `--e1`, `--e2`, etc.) inside their own `<style jsx global>` blocks, rather than consuming one shared token source. Every one of these pages defined its own copy of the same tokens instead of importing a single file -- which is itself a driver of future drift, not just past drift.

**Confirmed hardcoded Georgia usage, counted directly against the live files, not estimated:**

| File | Hardcoded `Georgia,serif` / `Georgia, serif` occurrences | What this means |
|---|---:|---|
| `pages/funeral-home/dashboard.js` | **156** | Nearly every button, input, label, and heading in the entire funeral-home console explicitly hardcodes the old serif font inline, element by element -- this is not an oversight in one spot, it's the page's actual typography, set 156 separate times. |
| `pages/urgent.js` | 7 | `main`, `h1`, `h2`, `.triage-title`, `.stabilize-title`, `.playbook-title`, and the loading-state overlay all explicitly declare `Georgia, serif` -- the red path's headlines are old-system by explicit declaration, not just inheritance. |
| `pages/estate.js` | 6 explicit + effectively all interactive elements | 6 direct `Georgia` declarations, plus dozens of buttons/inputs set to `fontFamily: 'inherit'`, which resolves to the page's inherited body font -- Georgia, from `pages/_app.js`. The estate command center both onboarding paths land on is typographically almost entirely on the old system. |
| `pages/_app.js` -> `lib/typography.js` | 1 (but site-wide) | The global fallback for the entire site is still Georgia. Any future page that forgets to explicitly opt into Threshold fonts will silently render in the old serif by default. |

**Why this produces visible mobile inconsistency specifically:** a real user's session crosses these files constantly -- sign in at `/funeral-home/staff` (Inter/Fraunces, Threshold, correct) and land on `/funeral-home/dashboard` (Georgia, old, 156 hardcoded instances) in the same flow. Or start at `/` (Threshold) and continue to `/urgent` (Georgia) or `/estate` (Georgia, inherited). The font visibly changes mid-journey because the two systems are real, both live, and assigned per-page rather than centrally.

## What this diagnosis does NOT say

It does not say the redesign failed or that the visual language (Pine/Clay/Bone, Fraunces, pill radius, layered shadow) is wrong -- where it's actually been applied (`/mission`, `/story`, `/trust`, `/funeral-home/staff`, the shared nav) it looks and reads correctly, and matches the brief. The problem is coverage and restraint, not direction: roughly half of the highest-traffic pages haven't received the token system at all, and none of the pages reviewed -- including the ones that have the right colors and fonts -- have had an actual content/density edit pass applied. Repainting a dense page does not make it a calm one.

## Not yet done (deliberately, per the owner's instruction to diagnose before fixing)

- No per-page simplification plan has been written yet.
- No files have been changed.
- No decision has been made about whether `lib/typography.js` should be deleted in favor of `lib/designSystem.js`, or how the four untouched/partially-touched Tier 2 files (`estate.js`, `urgent.js`, `funeral-home/dashboard.js`, and by extension `App.js`) get their density reduced, not just their colors changed.

Next step, on the owner's signal: a concrete, page-by-page simplification plan graded against "what's the one thing this screen needs to say, what moves to progressive disclosure or gets cut, does it still feel warm after the cut" -- not against matching the wireframe's original density, since the wireframes themselves may need trimming further.
