#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const routes = [
  'app/page.tsx',
  'app/demo/page.tsx',
  'app/funeral-home/page.tsx',
  'app/pricing/page.tsx',
  'app/guides/page.tsx',
  'app/guides/first-funeral-home-conversation/page.tsx',
  'app/story/page.tsx',
  'app/trust/page.tsx',
  'app/care-providers/page.tsx',
  'app/family/page.tsx',
];

for (const route of routes) assert(fs.existsSync(route), `missing public route: ${route}`);

const home = read('app/page.tsx');
const shell = read('components/public/PublicShell.tsx');
const publicStyles = `${read('components/public/PublicShell.module.css')}\n${read('components/public/PublicPage.module.css')}`;
const demo = read('app/demo/page.tsx');
const demoAction = read('app/demo/actions.ts');
const demoFamily = read('app/demo/family/page.tsx');
const demoFamilyPass = read('app/demo/family/pass/page.tsx');
const familyIntent = read('components/family/FamilyIntentJourney.tsx');
const transferComposer = read('components/family/TransferComposer.tsx');
const activePass = read('components/family/ActivePass.tsx');
const familyTypes = read('components/family/types.ts');
const demoModel = read('lib/demo.ts');
const urgentNext = read('app/start/next/UrgentNextClient.tsx');
const startContext = read('app/start/StartWizardContext.tsx');
const startPage = read('app/start/page.tsx');
const startButton = read('app/start/StartNewRequestButton.tsx');
const globals = read('app/globals.css');
const familyStyles = read('components/family/FamilyJourney.module.css');
const shellStyles = read('components/public/PublicShell.module.css');
const pricing = read('app/pricing/page.tsx');
const trust = read('app/trust/page.tsx');
const care = read('app/care-providers/page.tsx');
const family = read('app/family/page.tsx');
const login = read('app/login/LoginClient.tsx');
const layout = read('app/layout.tsx');
const roadmap = read('docs/product/operational-readiness-roadmap.md');
const operatingContext = read('docs/agent-operating-context.md');
const operationalBoundary = read('components/auth/OperationalBoundary.tsx');
const partnerBoundary = read('components/auth/PartnerBoundary.tsx');
const plainLanguage = read('lib/presentation/plain-language.ts');
const directorPage = read('app/director/page.tsx');
const staffPage = read('app/staff/page.tsx');
const directorCase = read('app/director/cases/[workflowId]/page.tsx');
const sandboxRepository = read('lib/sandbox/repository.ts');

assert(home.includes('Everyone knows what happens next.'));
assert(home.includes("href: '/start'") && home.includes("href: '/funeral-home'") && home.includes("href: '/demo'"));
for (const label of ['Family help', 'Funeral homes', 'Pricing', 'Guides', 'Our Story', 'Trust', 'Sign in', 'Get help now']) assert(shell.includes(label));
assert(shell.includes('Reading these pages does not create an account or family record.'));
assert(demo.includes('export const metadata: Metadata'));
assert(demo.includes('Example information only.'));
assert(demo.includes('does not create family records, send messages, make purchases, or process payments'));
assert.equal((demoAction.match(/redirect\('\/demo\?demo=unavailable'\)/g) ?? []).length, 4);
assert(pricing.includes('does not currently publish self-serve plan prices'));
assert(pricing.includes('Nothing is purchased on this page.'));
assert(!/\$\d|per month|per year|contact sales/i.test(pricing));
for (const state of ['Prepared', 'Saved', 'Sent or delivered', 'Verified']) assert(trust.includes(state));
assert(care.includes('Self-serve care-provider accounts are not available'));
assert(family.includes("href: '/demo/family'") && family.includes("href: '/start'"));
assert(!family.includes("href: '/login'"));
assert(login.includes('Email me a secure sign-in link'));

assert.equal((familyIntent.match(/<h1/g) ?? []).length, 1);
assert.equal((transferComposer.match(/<h1/g) ?? []).length, 0);
assert.equal((transferComposer.match(/<h2/g) ?? []).length, 4);
assert.equal((demoFamily.match(/<main/g) ?? []).length, 1);
assert.equal((demoFamilyPass.match(/<main/g) ?? []).length, 0);
assert.equal((activePass.match(/<main/g) ?? []).length, 2);
assert(activePass.includes('id="active-pass"'));
for (const source of [demoModel, urgentNext, demoFamily, demoFamilyPass, familyIntent, transferComposer, activePass, familyTypes]) {
  assert(!/\bPreview\b|family space|later partner slice/i.test(source));
}
assert(demoFamily.includes('Private browser demo · choices stay on this device.'));
assert(demoFamilyPass.includes('Private browser demo · choices stay on this device.'));
assert(familyIntent.includes('nothing is sent or shared'));
assert(familyIntent.includes('does not contact anyone, create a case, or send a handoff—even after you finish'));
assert(activePass.includes('No real funeral home or family record was contacted or changed.'));

for (const [route, target] of [
  ['app/resources/page.tsx', '/guides'],
  ['app/blog/page.tsx', '/guides'],
  ['app/our-story/page.tsx', '/story'],
  ['app/mission/page.tsx', '/story'],
]) assert(read(route).includes(`permanentRedirect('${target}')`));

assert(/min-height:\s*48px/g.test(publicStyles));
assert(/\.footerBrand\s*\{\s*min-height:\s*48px;/.test(shellStyles));
const globalFloor = globals.slice(globals.indexOf('Public/demo comprehension floor'));
assert(globalFloor.includes('.top-shell__environment'));
assert(globalFloor.includes('.gateway__footer a { min-height: 48px;'));
assert(globalFloor.includes('.gateway__footer span { font-size: 14px;'));
const familyFloor = familyStyles.slice(familyStyles.indexOf('The private browser demo is used under stress'));
for (const selector of ['.skipLink', '.wordmark', '.steps button', '.stageActions button', '.passObject > button', '.revokePanel button', '.closedPage > a']) assert(familyFloor.includes(selector));
assert(familyFloor.includes('.closedPage > a { min-height: 48px;'));
assert(familyFloor.includes('.closedPage > a { font-size: 14px;'));

assert(layout.includes("@fontsource/cormorant-garamond/500.css"));
assert(layout.includes("@fontsource/montserrat/400.css"));
assert(!layout.includes('next/font/google'));
assert(layout.includes("template: '%s | Passage'"));
assert(fs.existsSync('app/icon.svg'));
const favicon = fs.readFileSync('app/favicon.ico');
assert(favicon.length > 22, 'favicon.ico must contain an ICO directory and image');
assert.deepEqual([...favicon.subarray(0, 6)], [0, 0, 1, 0, 1, 0], 'favicon.ico must declare one ICO image');
assert(favicon[6] > 0 && favicon[7] > 0, 'favicon.ico must declare non-zero dimensions');
const faviconImageLength = favicon.readUInt32LE(14);
const faviconImageOffset = favicon.readUInt32LE(18);
assert.equal(faviconImageOffset, 22, 'favicon.ico image must begin after its directory');
assert.equal(faviconImageOffset + faviconImageLength, favicon.length, 'favicon.ico image length must match the file');
assert(!/fonts\.googleapis|fonts\.gstatic/.test(`${layout}\n${globals}`));

assert(startContext.includes('requestId: stored.requestId || window.crypto.randomUUID()'));
assert(startContext.includes('requestId: window.crypto.randomUUID()'));
assert(urgentNext.includes(".eq('creation_request_id', draft.requestId)"));
assert(!urgentNext.includes(".order('submitted_at'"));
assert(urgentNext.includes('Request a callback from Northstar Funeral Home'));
assert(!urgentNext.includes('Request a callback from Passage'));
assert(urgentNext.includes("urgent_intake_create:${draft.requestId}"));
assert(urgentNext.includes('formatSavedTime(state.receipt.occurredAt)'));
const urgentAction = read('app/start/actions.ts');
assert(urgentAction.includes('Sign in to save this and request a callback.'));
assert(!urgentAction.includes('create a free account'));
assert(startPage.includes('<StartNewRequestButton />'));
assert(startButton.includes('reset();') && startButton.includes("router.push('/start/situation')"));
assert(operationalBoundary.includes('This page isn’t available to your account.'));
assert(operationalBoundary.includes('Your access has ended.'));
assert(operationalBoundary.includes('No case, task, or request details were shown, and nothing changed.'));
assert(partnerBoundary.includes('No case, task, or request details were shown, and nothing changed.'));
assert(plainLanguage.includes('/\\bfamily$/i.test(safe) ? safe : `${safe} family`'));
for (const source of [directorPage, staffPage, directorCase]) assert(source.includes('humanFamilyName('));
assert(!directorCase.includes("'Authorized case'") && !directorCase.includes("'Managed location'"));
for (const name of ['Sofia Rivera', 'Maya Rivera', 'Elena Torres', 'Avery Brooks']) assert(sandboxRepository.includes(name));
assert(sandboxRepository.includes("assignedMembershipId: 'membership-avery'"));
assert(sandboxRepository.includes("firstAssigneeMembershipId: 'membership-avery'"));
assert(sandboxRepository.includes("SANDBOX_STORAGE_KEY = 'passage.zero.operational-truth.v4'"));

const publicCopy = routes.map(read).join('\n');
for (const prohibited of [/\bprojection\b/i, /authority predicate/i, /event spine/i, /durable assignment/i, /\bqa-approved\b/i, /\breadiness score\b/i, /\bfixture\b/i]) {
  assert(!prohibited.test(publicCopy), `public copy contains internal language: ${prohibited}`);
}

assert(roadmap.includes('family account and invitation access are unavailable from the current public route'));
assert(operatingContext.includes('family account and invitation access are unavailable from the current public route'));

console.log('PASS public conversion, browser-demo truth, local fonts, icon, and urgent recovery contract');
