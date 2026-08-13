#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.env.CANDIDATE_ROOT ? path.resolve(process.env.CANDIDATE_ROOT) : process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const director = read('app/director/page.tsx');
const staff = read('app/staff/page.tsx');
const team = read('app/director/team/page.tsx');
const activity = read('app/director/activity/page.tsx');
const css = read('app/operations-beta.module.css');
const failures = [];

function requireText(source, value, message) {
  if (!source.includes(value)) failures.push(message);
}

function requireOrder(source, values, message) {
  let cursor = -1;
  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    if (next < 0) return failures.push(`${message}: missing ${value}`);
    if (next < cursor) return failures.push(`${message}: ${value} is out of order`);
    cursor = next;
  }
}

requireText(director, 'aria-label="Decision context" className={styles.primaryFacts}', 'Director primary facts are not grouped and labelled.');
requireText(director, 'aria-label="Execution and proof" className={styles.supportingFacts}', 'Director supporting facts are not grouped and labelled.');
requireOrder(director, ['<dt>Case</dt>', '<dt>Owner</dt>', '<dt>Waiting</dt>', '<dt>Due</dt>', '<dt>Visible to</dt>', '<dt>How Passage helps</dt>', '<dt>Passage prepared</dt>', '<dt>Proof destination</dt>'], 'Director fact order');

requireText(staff, 'aria-label="What to do now" className={styles.primaryFacts}', 'Staff primary facts are not grouped and labelled.');
requireText(staff, 'aria-label="Visibility and proof" className={styles.supportingFacts}', 'Staff supporting facts are not grouped and labelled.');
requireOrder(staff, ['<dt>Owner</dt>', '<dt>Waiting</dt>', '<dt>Case boundary</dt>', '<dt>Human action</dt>', '<dt>Visible to</dt>', '<dt>Passage prepared</dt>', '<dt>Proof destination</dt>', '<dt>Next state</dt>'], 'Staff fact order');

requireText(css, '@media (max-width: 760px)', 'The 760 CSS-pixel work-card breakpoint is missing.');
requireText(css, '.workCard :is(.primaryFacts, .supportingFacts) { grid-template-columns: 1fr; }', 'Work-card facts do not collapse to one column at 760 CSS pixels.');
requireText(css, 'min-height: 48px', 'The 48-pixel enabled-control target rule is missing.');
requireText(activity, 'className={styles.facts}', 'Activity must retain the generic facts grid.');
if (activity.includes('primaryFacts') || activity.includes('supportingFacts')) failures.push('Activity must not adopt work-card fact groups.');

requireText(team, "member.user_id ? 'Sign-in linked' : 'No sign-in account linked'", 'Team Account must use human account state.');
requireText(team, 'className={styles.teamDiscriminator}', 'Team member cards need a visible safe discriminator.');
requireText(team, 'Staff access ${nextOrdinal}', 'Exact Team collisions need stable rendered-order labels.');
requireText(team, '&& !grant.revoked_at', 'Team authorized locations must exclude revoked grants.');
if (team.includes('`${displayMember(member)} · sign-in linked`')) failures.push('Team Account repeats the safe fallback identity.');
if (team.includes('<dd>{member.email}</dd>') || team.includes('<dd>{member.id}</dd>')) failures.push('Team visible copy must not expose a member email or id.');
if ((team.match(/displayMember\(member\)/g) ?? []).length !== 1) failures.push('Team must derive the safe primary identity exactly once per staff record.');

if (failures.length) {
  console.error('Responsive hierarchy regression check failed:');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('PASS director/staff hierarchy, reflow, and Team identity source contracts');
