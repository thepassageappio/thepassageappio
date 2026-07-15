# Passage Zero

This directory is a clean-room rebuild of Passage.

Nothing in this application imports, extends, wraps, or visually references the legacy product. Git history remains for auditability; the application tree does not.

## Product thesis

Passage is the consented coordination layer around a death. One family-controlled record moves through hospice, funeral home, cemetery, vendors, and estate administration without forcing a grieving person to repeatedly reconstruct the same story.

## Experience model

The shared continuity rail is the only cross-persona primitive:

`family intent -> granted scope -> receiving organization -> accepted case -> owned commitment -> visible proof`

- Families make bounded, reversible sharing decisions.
- Directors see operational risk, ownership, waiting, and proof.
- Staff see only their next commitment, blockers, and expected evidence.
- Partners receive only the scope explicitly granted to that handoff.

## Clean-room constraints

- No legacy Passage source imports.
- No inherited route, component, token, or layout structure.
- No serif display typography.
- No bone/pine/clay palette.
- No dashboard made from a grid of statistic cards.
- No legal, compliance, medical, or authority claim without the governed claims gate.
- Mobile and desktop are deliberately composed, not merely stacked.

## Technical baseline

- Next.js 16 App Router
- React 19
- TypeScript
- CSS without an external component library
- Synthetic demo data until isolated Supabase infrastructure is provisioned

