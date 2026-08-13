#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const routeFiles = [
  'app/page.tsx',
  'app/demo/page.tsx',
  'app/demo/family/page.tsx',
  'app/demo/family/pass/page.tsx',
  'app/demo/operator/[persona]/page.tsx',
  'app/funeral-home/page.tsx',
  'app/pricing/page.tsx',
  'app/guides/page.tsx',
  'app/guides/first-funeral-home-conversation/page.tsx',
  'app/story/page.tsx',
  'app/trust/page.tsx',
  'app/care-providers/page.tsx',
];
for (const file of routeFiles) assert(fs.existsSync(file), `missing public route: ${file}`);

const home = read('app/page.tsx');
const shell = read('components/public/PublicShell.tsx');
const publicPage = read('components/public/PublicPage.tsx');
const publicStyles = `${read('components/public/PublicShell.module.css')}\n${read('components/public/PublicPage.module.css')}`;
const demo = read('app/demo/page.tsx');
const demoAction = read('app/demo/actions.ts');
const operatorDemo = read('app/demo/operator/OperatorDemo.tsx');
const operatorDemoStyles = read('app/demo/operator/OperatorDemo.module.css');
const demoReset = read('app/demo/DemoReset.tsx');
const demoResetStyles = read('app/demo/DemoReset.module.css');
const demoModel = read('lib/demo.ts');
const topShell = read('components/core/TopShell.tsx');
const familyIntent = read('components/family/FamilyIntentJourney.tsx');
const transferComposer = read('components/family/TransferComposer.tsx');
const activePass = read('components/family/ActivePass.tsx');
const familyStyles = read('components/family/FamilyJourney.module.css');
const provider = read('lib/sandbox/provider.tsx');
const repository = read('lib/sandbox/repository.ts');
const layout = read('app/layout.tsx');
const packageJson = JSON.parse(read('package.json'));
const globals = read('app/globals.css');
const startNextPage = read('app/start/next/page.tsx');
const startStyles = read('app/start/Start.module.css');

assert(home.includes('Everyone knows what happens next.'));
for (const route of ['/start', '/funeral-home', '/demo']) assert(home.includes(`href: '${route}'`));
for (const label of ['Family help', 'Funeral homes', 'Pricing', 'Guides', 'Our Story', 'Trust', 'Sign in', 'Get help now']) assert(shell.includes(label));
assert(shell.includes('Reading these pages does not create an account or family record.'));

assert(demoModel.includes("href: '/demo/family'"));
assert(demoModel.includes("action: 'Try the family demo'"));
assert(!demoModel.includes("action: 'Start without signing in'"));
assert(demo.includes('href="/start"') && demo.includes('Get help now'));
assert(demo.includes('<DemoReset />'));
assert(demo.includes('No team session opened and no record changed.'));
for (const code of ['configuration', 'credentials', 'signout', 'signin', 'identity']) assert(demo.includes(`${code}:`));
for (const code of ['configuration', 'signout', 'signin', 'identity']) assert(demoAction.includes(`demo=${code}`));
assert(!demoAction.includes("family: '/start"));
for (const persona of ['director', 'staff', 'vendor']) assert(demoAction.includes(`${persona}: '/demo/operator/${persona}'`));
for (const identity of ['Elena Torres', 'Maya Chen', 'Jordan Lee']) assert(operatorDemo.includes(identity));
for (const boundary of ['Guided browser demo.', 'Nothing is saved to a real record or sent to anyone.', 'Family details', 'Not shared']) assert(operatorDemo.includes(boundary));
assert(operatorDemo.includes('receiptRef.current?.focus()'));
assert(/min-height:\s*48px/.test(operatorDemoStyles));
assert(/@media \(max-width:\s*720px\)/.test(operatorDemoStyles));
assert(topShell.includes('FAMILY EXAMPLE STAYS IN THIS BROWSER · TEAM EXAMPLE ACTIVITY IS SHARED'));
assert(!topShell.includes('CHANGES STAY ON THIS DEVICE'));

assert(demoReset.includes('Reset the family demo'));
assert(demoReset.includes('Shared director, staff, and vendor example activity was not reset.'));
assert(demoReset.includes("window.localStorage.removeItem(FAMILY_INTENT_KEY)"));
assert(demoReset.includes("window.sessionStorage.removeItem(FAMILY_HANDOFF_KEY)"));
assert(demoReset.includes('resultRef.current?.focus()'));
assert((demoReset.match(/catch/g) ?? []).length >= 2, 'reset must handle independent storage failures');
assert(/min-height:\s*48px/.test(demoResetStyles));

assert(familyIntent.includes('try {') && familyIntent.includes('window.localStorage.getItem'));
assert(familyIntent.includes('window.localStorage.setItem'));
assert(familyIntent.includes('It remains selected for this visit only.'));
assert(transferComposer.includes('How long should they have access?'));
assert(transferComposer.includes('Review who can open what.'));
assert(!transferComposer.includes('How long should the bridge stay open?'));
assert(!transferComposer.includes('One receiver. A clear boundary.'));
assert(transferComposer.includes("router.push('/demo/family/pass')"));
assert(transferComposer.includes('The example handoff was not created. Nothing was saved. Your choices are still here. Try again.'));
assert(transferComposer.includes('activationRecovery.current?.focus()'));
assert(transferComposer.includes('ref={activationRecovery} role="alert" tabIndex={-1}'));
const activationStorageFailure = transferComposer.indexOf("window.sessionStorage.setItem('passage.family.transfer.v1'");
const activationDispatch = transferComposer.indexOf("type: 'issue_transfer_pass'");
const activationFailureReturn = transferComposer.slice(activationStorageFailure).search(/focusActivationRecovery\(\);\r?\n\s+return;/) + activationStorageFailure;
assert(activationStorageFailure >= 0 && activationFailureReturn > activationStorageFailure && activationDispatch > activationFailureReturn, 'failed activation storage must return before dispatch');

assert(activePass.includes('await navigator.clipboard.writeText'));
assert(activePass.includes('The code was not copied. It is selected now. Use your device Copy command.'));
assert(activePass.includes('range.selectNodeContents(manualCode.current)'));
assert(activePass.includes('confirmHeading.current?.focus()'));
assert(activePass.includes("event.key === 'Escape'"));
assert(activePass.includes('closeTrigger.current?.focus()'));
assert(activePass.includes('The example handoff was not closed. It remains open. Nothing changed. Try again or keep it open.'));
assert(activePass.includes('closeRecovery.current?.focus()'));
assert(activePass.includes('ref={closeRecovery} role="alert" tabIndex={-1}'));
const closeStorageCleanup = activePass.indexOf("window.sessionStorage.removeItem('passage.family.transfer.v1')", activePass.indexOf('function revoke()'));
const closeDispatch = activePass.indexOf("type: 'revoke_transfer_pass'", activePass.indexOf('function revoke()'));
const closeFailureReturn = activePass.slice(closeStorageCleanup).search(/closeRecovery\.current\?\.focus\(\)\);\r?\n\s+return;/) + closeStorageCleanup;
assert(closeStorageCleanup >= 0 && closeFailureReturn > closeStorageCleanup && closeDispatch > closeFailureReturn, 'failed close storage must return before dispatch');
assert(activePass.includes('closedHeading.current?.focus()'));
assert(/\.revokePanel button[\s\S]*min-height:\s*48px/.test(familyStyles));
assert(/\.recoveryMessage[\s\S]*font-size:\s*14px/.test(familyStyles));

assert(repository.includes('export function readSandboxResult'));
assert(repository.includes('export function clearSandboxStorage'));
assert(repository.includes('export function writeSandbox'));
assert((repository.match(/catch \{/g) ?? []).length >= 3, 'sandbox storage read, cleanup, and write must fail safely');
assert(provider.includes('persistenceIssue'));
assert(provider.includes('recordRef.current = next'));
assert(provider.includes('dispatchAtomic'));
assert(provider.includes("if (!result.persisted)"));
assert(transferComposer.includes('dispatchAtomic({'));
assert(activePass.includes('dispatchAtomic({'));

for (const [file, target] of [
  ['app/resources/page.tsx', '/guides'],
  ['app/blog/page.tsx', '/guides'],
  ['app/our-story/page.tsx', '/story'],
  ['app/mission/page.tsx', '/story'],
]) assert(read(file).includes(`permanentRedirect('${target}')`));

const guides = read('app/guides/page.tsx');
assert(guides.includes("href: '/guides/first-funeral-home-conversation'"));
assert.equal((guides.match(/availabilityLabel: 'Coming soon'/g) ?? []).length, 5);
assert(publicPage.includes('card.availabilityLabel'));
for (const [file, destination] of [
  ['app/story/page.tsx', "href: '/demo'"],
  ['app/trust/page.tsx', "href: '/demo/family'"],
  ['app/care-providers/page.tsx', "href: '/funeral-home'"],
  ['app/guides/page.tsx', "href: '/start'"],
]) assert(read(file).includes(destination), `${file} missing page-specific action`);

assert(layout.includes("@fontsource/cormorant-garamond/500.css"));
assert(layout.includes("@fontsource/montserrat/400.css"));
assert(!layout.includes('next/font/google'));
assert.equal(packageJson.dependencies['@fontsource/cormorant-garamond'], '5.3.0');
assert.equal(packageJson.dependencies['@fontsource/montserrat'], '5.3.0');
assert(!/fonts\.googleapis|fonts\.gstatic/.test(`${layout}\n${globals}`));

assert(/min-height:\s*48px/.test(publicStyles));
assert(globals.includes('.gateway__help a { min-height: 48px;'));
assert(!/suppressHydrationWarning/.test(`${familyIntent}\n${transferComposer}\n${activePass}`));

assert(startNextPage.includes('href="/start/people"'), 'unavailable urgent step must return to the saved details');
assert(startNextPage.includes('Review your details'), 'unavailable urgent step must name its recovery action');
assert(/\.recoveryLink\s*\{[\s\S]*?min-height:\s*48px/.test(startStyles), 'urgent recovery link must meet the 48px target floor');

const reachableStartSources = [
  'app/start/page.tsx',
  'app/start/situation/page.tsx',
  'app/start/people/page.tsx',
  'app/start/next/page.tsx',
  'app/start/next/UrgentNextClient.tsx',
  'app/start/actions.ts',
  'lib/urgent/hosted.ts',
  'lib/urgent/situations.ts',
].map(read).join('\n');
assert(!/[\u2013\u2014]/u.test(reachableStartSources), 'reachable urgent copy must not contain em dash or en dash characters');

const userFacing = routeFiles.concat([
  'components/public/PublicPage.tsx',
  'components/public/PublicShell.tsx',
  'components/family/FamilyIntentJourney.tsx',
  'components/family/TransferComposer.tsx',
  'components/family/ActivePass.tsx',
  'lib/demo.ts',
]).map(read).join('\n');
for (const prohibited of [/\bprojection\b/i, /authority predicate/i, /event spine/i, /durable assignment/i, /\bqa-approved\b/i, /\breadiness score\b/i, /\bfixture\b/i, /[—–]/]) {
  assert(!prohibited.test(userFacing), `public copy contains prohibited language: ${prohibited}`);
}

const demoExpiry = require('../lib/presentation/demo-expiry');
const activatedAt = '2026-07-27T03:38:00.000Z';
assert.equal(demoExpiry.deriveDemoExpiry(activatedAt, '24h'), '2026-07-28T03:38:00.000Z');
assert.equal(demoExpiry.deriveDemoExpiry(activatedAt, '72h'), '2026-07-30T03:38:00.000Z');
assert.equal(demoExpiry.deriveDemoExpiry(activatedAt, '7d'), '2026-08-03T03:38:00.000Z');
for (const malformed of ['0', '2026-02-30T00:00:00.000Z', '2026-07-27', 'not-a-date']) assert.equal(demoExpiry.canonicalIsoInstant(malformed), null);

console.log('PASS public conversion, demo boundary, browser failure recovery, local fonts, and page-specific actions');
