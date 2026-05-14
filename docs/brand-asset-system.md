# Passage Brand Asset System

Passage brand assets are centralized so future refreshes do not require searching every page.

## Source of Truth

- Brand constants: `lib/brand.js`
- React logo component: `components/PassageLogo.js`
- Public assets: `public/brand/*`
- Favicon fallback: `public/favicon.svg`

## Swap Process

1. Add new exported logo files to `public/brand/`.
2. Update paths in `lib/brand.js`.
3. Use `PassageLogo` for website and app UI.
4. Use `brandMarkUrl('light', true)` for email-safe absolute logo URLs.
5. Keep print/PDF outputs on the static light mark unless the output is screen-only.

## Current Rules

- Homepage and urgent path can use the animated held mark.
- Nav, app workspaces, packets, emails, and PDFs use static marks.
- Forest mark is available for high-trust or darker branded surfaces.
- Co-branded partner assets should display the partner logo beside the Passage mark, not replace Passage proof/footer language.
