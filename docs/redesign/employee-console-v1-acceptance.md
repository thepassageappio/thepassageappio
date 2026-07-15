# Employee console V1 handoff

## Destination

- `pages/funeral-home/my-work.js`
- `styles/EmployeeConsole.module.css`

## Product intent

This is a purpose-built employee surface, not a compressed director dashboard. It answers five questions in order:

1. What is my one next commitment?
2. What is queued after it?
3. What am I waiting on, and when do I check again?
4. What exact decision needs escalation?
5. What proof did the case and family receive after I handled it?

The default view is deliberately narrow. Desktop adds a persistent role rail and shift summary, while mobile preserves the same hierarchy with horizontally scrollable work-state controls.

## Included states

- `normal`: one next commitment, queue, record-proof action, blocked/escalation action
- `waiting`: named outside owner, explicit next check, fallback plan
- `escalated`: exact decision request and family notification boundary
- `handled`: timestamped outcomes and family-visible/case-visible proof
- `empty`: calm clear-desk confirmation with handled-work evidence

All data is synthetic. The concept makes no legal, privacy, medical, or compliance claims.

## Interaction acceptance

- View controls expose current state (`aria-current` on desktop and `aria-pressed` on mobile).
- View changes move keyboard focus to the new state heading.
- Selecting a queued task promotes it into the one-next-commitment card.
- Record and escalation actions announce an outcome through a polite live region.
- Focus styles are visible; touch targets are at least 38px and primary controls at least 47px.
- Layout is designed at 360/390px first, adds a tablet composition at 700px, and a distinct desktop rail at 1080px.
- Reduced-motion preference disables smooth scrolling and motion.

## Central integration notes

- Copy the two destination files to the same paths on PR #18.
- This page intentionally imports only `next/head`, React, and its CSS module.
- It does not require new packages, environment variables, APIs, or backend writes.
- Recommended browser QA: 390x844 and 1440x1000; visit all five views, promote a queue item, record proof, and raise an escalation; verify zero console warnings/errors.
