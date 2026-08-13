import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const familyJourney = readFileSync(resolve(root, 'components/family/FamilyIntentJourney.tsx'), 'utf8');

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

console.log('PASS deterministic initial render guards for family and owner case Today');
