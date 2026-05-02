# Passage Codex Operating Guide

## Product Context

Passage is a production Next.js + Supabase + Stripe + Resend + Twilio app for families, participants, funeral homes, and trusted local vendors navigating the life-to-death transition.

Passage is not a checklist app. It is a coordination and execution layer: one calm place to know what matters now, who owns it, what is waiting, and how proof is recorded.

Primary audiences:
- Families in an urgent red-path moment after a death.
- Planning users on the green path who want to make things easier for family later.
- Participants assigned specific responsibilities.
- Funeral homes using Passage as a white-labeled family command center.
- Trusted vendors surfaced only inside relevant tasks.

Current business goal:
Get Passage demo-safe and pilot-ready, then recruit local funeral home pilots, family beta users, and trusted vendors without increasing product complexity.

## What Good Looks Like

Every meaningful screen should answer:
- What do I do now?
- Who is responsible?
- How will I know it happened?
- What is Passage tracking for me?

For grieving users, default to action first, then reassurance, then minimal explanation.

For funeral homes, show workload reduction immediately:
- Active cases
- Tasks handled
- Waiting responses
- Calls avoided
- Export data for their existing system

For vendors, keep the marketplace task-native:
- No generic directory
- No browsing
- No ads
- Only 1-2 trusted options inside tasks where help is useful

## Agent Permissions

Codex may proceed without asking for:
- Bug fixes
- Build and lint fixes
- Small UI polish that reduces hesitation
- Copy edits that increase clarity and trust
- Demo-data hardening
- Test and QA improvements
- Documentation and backlog updates
- Drafting outreach, demo scripts, one-pagers, and customer interview guides

Codex must ask before:
- Changing pricing amounts
- Sending real emails or SMS to customers, vendors, funeral homes, or leads
- Applying production database SQL
- Deleting user-facing functionality
- Changing legal, compliance, privacy, or medical claims materially
- Deploying irreversible production data changes
- Spending money or starting paid campaigns

## Engineering Rules

- Keep changes surgical and consistent with existing patterns.
- Do not redesign broad surfaces unless the user explicitly asks.
- Prefer existing helpers, tables, and routes.
- Do not invent new systems when a current task/status/audit pattern can carry the work.
- Production Supabase migrations may not auto-run; if schema changes are needed, provide SQL clearly.
- Never fake execution states. Unknown means waiting for confirmation.
- All real actions should create visible proof: recipient, timestamp, actor, status.

## Core Workstreams

### 1. Product Refinement
- QA red, green, participant, funeral home, and vendor paths.
- Reduce first-screen hesitation.
- Ensure every action has proof, waiting, failure, and follow-up states.
- Keep pages clean at 100% Chrome view.

### 2. Execution and Orchestration
- Map tasks into execution modes:
  - Fully automated
  - Assisted execution
  - Guided manual
- Move tasks from guided manual toward assisted or automated when realistic.
- Add proof requirements and next action clarity to every task.

### 3. Funeral Home B2B
- Keep funeral home module separate from red/green paths while reusing estate/task/status infrastructure.
- Make dashboard demo-safe for local one-location and multi-location funeral homes.
- Keep CSV export/import visible as adoption trust.
- Make "act on behalf of family" central.

### 4. Marketplace and Vendors
- Vendors appear only in tasks.
- Funeral homes can prefer, hide, or override vendors.
- Families should feel helped, not sold to.
- Track referrals and future transaction value without overbuilding payment flows.

### 5. Growth and Customer Discovery
- Maintain beta/demo pipeline.
- Draft funeral home outreach.
- Turn interviews into product requirements.
- Keep objections and demo feedback visible.

## Recurring Review Prompts

Use these prompts for recurring Codex sessions.

### Daily Product Operator

Review the repo and current backlog. Return:
1. Top production risk
2. Top user hesitation
3. Top B2B/demo risk
4. Three small fixes Codex can do now
5. Anything requiring owner approval

### Weekly CEO Loop

Act as my product and growth operator for Passage. Review code, docs, known QA feedback, customer notes, and current priorities. Return:
1. Biggest product risk
2. Biggest growth opportunity
3. Next 5 tasks Codex should do
4. One decision I need to make
5. Draft prompts for each Codex task

### Funeral Home Demo QA

Run the product as:
- One-location funeral director
- Multi-location funeral home operator
- Family invited by funeral home
- Passage admin demoing the product

Score each path 1-10 and list blockers before pilots.

### Grieving User QA

Run red path for:
- Unexpected death at home
- Expected death under hospice
- Hospital death
- Already past first steps

Check whether the user sees exactly one clear next action, understands authority, and lands in a saved command center.

