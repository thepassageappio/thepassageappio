import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const familyJourney = readFileSync(resolve(root, 'components/family/FamilyIntentJourney.tsx'), 'utf8');
const rootLayout = readFileSync(resolve(root, 'app/layout.tsx'), 'utf8');
const messagePage = readFileSync(resolve(root, 'app/case/[id]/messages/page.tsx'), 'utf8');
const messageThread = readFileSync(resolve(root, 'components/messaging/MessageThread.tsx'), 'utf8');

assert.match(
  familyJourney,
  /<small className=\{styles\.intentBoundary\}>/,
  'the browser-demo boundary must be present in the initial server and client render',
);
assert.doesNotMatch(
  familyJourney,
  /\{\s*restored\s*&&\s*<small className=\{styles\.intentBoundary\}>/,
  'hydration must not insert the browser-demo boundary after mount',
);
assert.equal(
  existsSync(resolve(root, 'app/case/[id]/today/loading.tsx')),
  false,
  'the authenticated case Today route must not stream a different route-level main before its resolved initial tree',
);
assert.doesNotMatch(
  rootLayout,
  /PassageZeroProvider/,
  'the browser-demo state provider must not wrap authenticated case routes globally',
);
for (const route of [
  'app/family/page.tsx',
  'app/family/pass/page.tsx',
  'app/demo/page.tsx',
  'app/demo/family/page.tsx',
  'app/demo/family/pass/page.tsx',
  'app/receive/page.tsx',
  'app/director/intake/page.tsx',
]) {
  assert.match(
    readFileSync(resolve(root, route), 'utf8'),
    /PassageZeroProvider/,
    `${route} must retain a scoped browser-demo provider for its sandbox consumer`,
  );
}
assert.doesNotMatch(
  messagePage,
  /PassageZeroProvider|usePassageZero/,
  'the authenticated Messages route must remain outside browser-demo state',
);
assert.doesNotMatch(
  messageThread,
  /Date\.now\(|Math\.random\(|toLocale|localStorage|sessionStorage|typeof window/,
  'the Messages client boundary must not derive initial text from variable client input',
);

console.log('PASS deterministic initial render guards for family and authenticated case routes');
