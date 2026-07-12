# User Journey Maps

Rebuilt 2026-07-12. Format per stage: entry point → key decisions → friction to eliminate → emotional state → exit/completion.

## 1. Grieving family — first-time (urgent flow, `flow_type=immediate`)

| Stage | Entry point | Key decisions | Friction to eliminate | Emotional state |
|---|---|---|---|---|
| Arrival | Funeral home hands them a code, or they search "what do I do after a death" | Do I start now or later? | Any account-creation friction before they see value | Shock, disorientation |
| First steps | Landing → "Something happened recently" path | Which 3 things matter today | Asking for information they don't have yet (no forced full intake) | Overwhelmed, needs permission to do less |
| Coordination setup | `coordination_setup_started` → `coordination_active` | Who else needs to be looped in | Re-entering info the funeral home already has | Slightly steadier, still raw |
| Mid-process | Daily/every-other-day check-ins | Approve drafts (obituary, messages) vs. delegate | Notification overload; ambiguous "who does what" | Fatigue, decision fatigue |
| Exit | Service completed, `workflows.status = completed` | Keep the record (memorial, documents) or archive | Being abruptly cut off from something they lived in for weeks | Relief mixed with loss of the "container" |

**Design implication:** the "Your move" queue must never show more than 1–2 items at once during the urgent phase; everything else is deliberately deferred, not hidden-and-forgotten.

## 2. Grieving family — mid-process (returning user, `coordination_active`)

| Stage | Entry point | Key decisions | Friction | Emotional state |
|---|---|---|---|---|
| Return visit | Notification (email/SMS) or direct login | What changed since I left | Losing place / not knowing what's new vs. old | Cautious, bracing |
| Orient | Today view | Is anything urgent right now | Stale or duplicate tasks from earlier in the flow | Wary |
| Act | Complete 1 task | Approve, delegate, or snooze | No visible way to say "not today" without guilt | Guarded relief when action is easy |
| Loop others in | People section | Who still needs access | Manually re-explaining context to late-joining relatives | Protective of the family's privacy |
| Exit | Task done | — | Silence after action (no confirmation of what happens next) | Wants reassurance it "went somewhere" |

## 3. Planning-ahead user (`flow_type=planning`, `workflow_templates.persona_type` standard/spouse/parent/business_owner)

| Stage | Entry point | Key decisions | Friction | Emotional state |
|---|---|---|---|---|
| Discovery | Marketing site, "plan ahead" CTA | Is this morbid or responsible | Copy that feels like a will-writing service, not a gift to family | Mild avoidance, needs reframing |
| Setup | Create Account → persona selection | How much to fill in now vs. later | Long-form intake with no save-and-exit | Cautiously in control |
| Ongoing maintenance | Periodic reminders | What's stale (old documents, old contacts) | Nagging tone, guilt-based reminders | Wants competence, not pressure |
| Trigger-ready | Workflow armed (`activation_status=ready`) | Who are the activators/witnesses | Unclear what actually happens when triggered | Wants certainty and control |
| Exit (this journey doesn't "end") | — | Periodic light-touch review | Feeling forgotten by the product between updates | Quiet confidence the record is current |

## 4. Funeral-home professional (director and staff, `organization_members`)

| Stage | Entry point | Key decisions | Friction | Emotional state |
|---|---|---|---|---|
| Intake | New `funeral_home_requests` or referral | Assign a director (`partner_owner_role`) | Manual re-keying of family info from phone/in-person intake | Busy, transactional |
| Case setup | Funeral Home Portal → new case | Which workflow template, what to delegate to family vs. staff | Duplicate work across funeral-home software and Passage | Efficiency-focused |
| Active coordination | Daily case list | Which of 14 cases needs attention today | No single view of "unowned" or "waiting on us" across all cases | Time-pressured, juggling |
| Family-facing moments | Message drafts, document requests | What to draft for the family vs. send directly | Sending something that reads as generic/corporate to a grieving family | Wants to look competent and caring |
| Exit / close | Service completed | Export/report, invoice reconciliation | Manually compiling reports for owners/GMs | Wants proof of value for renewal |

**Design implication:** this is the funeral-home demo path — director view must answer "what's waiting on me right now, across every family" in one glance (see hero mockup Screen 3).

## 5. Vendor (florist, caterer, transport — `vendors`, `vendor_requests`)

| Stage | Entry point | Key decisions | Friction | Emotional state |
|---|---|---|---|---|
| Request received | `vendor_requests.status=requested` notification | Can I fulfill this, by when | Unclear scope (vendors shouldn't see full family record) | Cautious, wants clear boundaries |
| Quote | Submit quote (`quoted`) | Price, timeline | Chasing payment status manually | Transactional |
| Payment | `payment_collection_status` progression | Trust that Passage holds/releases payment fairly | Not knowing if/when they'll be paid | Needs trust signals |
| Fulfillment | `scheduled` → `completed` | Proof of completion | No easy way to confirm delivery/service without extra tools | Wants a clean paper trail |
| Exit | `payout_status=paid` | — | Delayed payout visibility | Relief, will they get repeat business |

## 6. Admin / internal (System Admin, support)

| Stage | Entry point | Key decisions | Friction | Emotional state |
|---|---|---|---|---|
| Support ticket | User reports an issue | Do I need to see their Passage to help | Currently: service-role DB access, no scoped UI (see 00-system-findings.md) | Wants speed without overreach |
| View-as | Admin Portal → "View as [user]" | What can I safely see vs. touch | No audit trail of admin views today | Wants to feel authorized, not snooping |
| Resolve | Fix or escalate | Log the interaction | No standard place to record what was done | Wants closure |
| Platform health | Pilot health / QA dashboards | What's at risk this week | Signal buried across multiple admin pages | Wants one clear picture |
| Exit | Ticket closed | — | No visible confirmation to the family that it was handled with care | Wants the family to never know something broke |
