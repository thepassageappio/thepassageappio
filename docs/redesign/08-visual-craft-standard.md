# Visual Craft Standard (mandatory for every Threshold deliverable)

Added 2026-07-12, owner-directed correction: v1 mockups were functionally correct but visually flat — "looks like shit... needs to look much sleeker apple with empathy." This document codifies the fix as the baseline bar for everything produced under this redesign from here forward, mockup or shipped code. `01-design-system-foundation.html` v2 is the reference implementation — copy its tokens and patterns exactly rather than re-deriving them.

## The standard, concretely

**Shadows are layered and warm, never flat.** Two elevation levels, each a *pair* of shadows (a tight near-shadow + a soft far-shadow), tinted toward ink/pine rather than pure black:
```
--e1: 0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
--e2: 0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
--e3: 0 8px 20px -6px rgba(20,30,25,.14), 0 24px 48px -20px rgba(20,30,25,.18);
```
A flat `border:1px solid #ccc` with no shadow is a defect, not a placeholder.

**Radius is generous and scaled, not a single flat value.** `--r-xs:8px` (chips) · `--r-sm:12px` (inputs) · `--r-md:18px` (cards) · `--r-lg:26px` (hero surfaces) · `--r-full:999px` (buttons, pills, avatars). Buttons are always pill-shaped, never boxy.

**Buttons carry a gradient and a real shadow, not a flat fill.** Primary: `linear-gradient(155deg, var(--pine-600), var(--pine-800))` with a colored drop-shadow (`0 8px 16px -6px rgba(15,42,36,.35)`), lifts 1px on hover. Clay CTA gets the equivalent clay-tinted treatment. Flat single-color buttons with no depth read as a wireframe, not a product.

**Real icons, never colored boxes.** Every place a v1 mockup used a flat colored `<div>` as an icon placeholder is a defect. Use simple inline SVG line icons (stroke-width 1.6, round caps/joins, 19–22px) inside a soft tinted rounded square (`--r-xs`/`--r-sm`, `var(--pine-100)` fill). This is a five-minute fix with real payoff — an unstyled box reads unfinished even when everything else is right.

**Type carries real hierarchy and negative letter-spacing at large sizes.** Fraunces headlines use tight letter-spacing (`-.015em` to `-.02em`) and a lighter optical weight (~440–480, not 500–600) so they read editorial, not just "big bold serif." Body copy gets `letter-spacing:-.005em` and generous `line-height` (1.55–1.65). Never leave browser-default tracking on a 40px+ headline.

**Surfaces get a glass or gradient treatment where it earns its keep.** Sticky nav: `backdrop-filter: blur(14px) saturate(1.4)` over a translucent bone fill. Hero backgrounds and dark operator shells: subtle diagonal gradients (`155deg`–`165deg`), not flat single-color fills. This is restraint, not decoration — one glass surface and one gradient per screen is enough.

**Generous whitespace over dense whitespace.** If a v1 spacing value was `16px`/`20px` between major blocks, the v2 equivalent is `28px`–`40px`+. Sections get 80–110px of breathing room between them, not 40–70px. Apple's calm reads through *restraint via space*, not through more decoration.

**Hover/interaction states are implied even in static mockups.** Cards get `transition: transform .25s var(--ease), box-shadow .25s var(--ease)` and a `translateY(-2px to -3px)` + deepened shadow on hover — include this in every mockup's CSS even though a static screenshot won't show it, because it's the spec engineering will implement from.

**Status pills get a resting dot, a soft tinted fill, and a hairline border in the matching hue** — not just a flat background chip. See `.status-pill .sdot` pattern in the v2 design system file.

## Non-negotiables carried over unchanged from the brief
No siren-red. Fraunces for moments / Inter for mechanisms. No bounce or celebratory motion on death-adjacent actions (the extra polish above is about depth and craft, not playfulness). Earthy, accessible status colors.

## Process going forward
Before treating any new mockup or doc as "done," check it against this file. If a card has a flat 1px border and no shadow, if a button is a flat rectangle, if an icon is a colored box, or if a headline has default letter-spacing at 40px+ — it fails the standard and needs the same pass `01-design-system-foundation.html` and `hero-screens-mockup.html` v2 got on 2026-07-12.

Referenced from `docs/UX-REDESIGN-BRIEF.md` as required reading alongside the brief itself, so this survives across sessions regardless of which agent picks the work back up.
