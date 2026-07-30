#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const demoSource = read('lib/demo.ts');
const compiledDemo = ts.transpileModule(demoSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const demoModule = { exports: {} };
vm.runInNewContext(compiledDemo, { module: demoModule, exports: demoModule.exports }, {
  filename: path.join(root, 'lib/demo.ts'),
});

const { continuity, demoCase, personas } = demoModule.exports;
const expected = {
  family: {
    boundary: 'FICTIONAL SAMPLE',
    name: 'Maya',
    role: 'Family coordinator',
    action: 'Choose what to share',
    detail: 'Explore fictional Rivera family information. Changes stay in this browser and nobody is contacted.',
    cta: 'Explore sample',
    href: '/family',
    accessibleName: 'Explore the fictional family coordinator sample',
    pendingLabel: 'Opening sample…',
  },
  director: {
    boundary: 'SECURE WORKSPACE',
    name: 'Funeral-home director',
    role: 'Authorized directors',
    action: 'Open the director workspace',
    detail: 'Sign in with an authorized funeral-home account. A director sample is not included on this page.',
    cta: 'Sign in',
    href: '/login?next=%2Fdirector',
    accessibleName: 'Sign in to the secure funeral-home director workspace',
    pendingLabel: 'Opening secure sign in…',
  },
  staff: {
    boundary: 'SECURE WORKSPACE',
    name: 'Funeral-home staff',
    role: 'Authorized staff members',
    action: 'Open assigned work',
    detail: 'Sign in with an authorized funeral-home account. A staff sample is not included on this page.',
    cta: 'Sign in',
    href: '/login?next=%2Fstaff',
    accessibleName: 'Sign in to the secure funeral-home staff workspace',
    pendingLabel: 'Opening secure sign in…',
  },
  receive: {
    boundary: 'FICTIONAL SAMPLE',
    name: 'Elena',
    role: 'Receiving director',
    action: 'Review a Transfer Pass',
    detail: 'Explore a fictional handoff. Preview actions stay in this browser and do not create a real case.',
    cta: 'Explore sample',
    href: '/receive',
    accessibleName: 'Explore the fictional receiving-director sample',
    pendingLabel: 'Opening sample…',
  },
};

assert.equal(personas.length, 4);
for (const persona of personas) {
  assert.deepEqual(
    Object.fromEntries(Object.keys(expected[persona.id]).map((key) => [key, persona[key]])),
    expected[persona.id],
    `${persona.id} boundary mapping drifted`,
  );
  for (const word of persona.cta.toLowerCase().split(/\s+/)) {
    assert.ok(persona.accessibleName.toLowerCase().includes(word), `${persona.id} accessible name must contain visible action word ${word}`);
  }

  if (persona.boundary === 'FICTIONAL SAMPLE') {
    assert.equal(persona.cta, 'Explore sample');
    assert.ok(['/family', '/receive'].includes(persona.href));
    assert.doesNotMatch(persona.href, /^\/(?:login|director|staff)/);
  } else {
    assert.equal(persona.cta, 'Sign in');
    assert.match(persona.href, /^\/login\?next=%2F(?:director|staff)$/);
    assert.ok(!['/family', '/receive'].includes(persona.href));
  }
}
assert.ok(new Set(personas.map((persona) => persona.cta)).size > 1, 'All four gateway actions must not share one label');
assert.deepEqual(
  Array.from(continuity, (step) => step.meta),
  ['EXAMPLE COMPLETE', 'EXAMPLE COMPLETE', 'EXAMPLE CURRENT', 'EXAMPLE NEXT'],
);
assert.deepEqual(Object.keys(demoCase), ['person']);

const pageSource = read('app/page.tsx');
const shellSource = read('components/core/TopShell.tsx');
const railSource = read('components/core/ContinuityRail.tsx');
const flowSource = read('components/core/GatewayPersonaFlow.tsx');
const layoutSource = read('app/layout.tsx');
const faviconSource = read('app/favicon.ico/route.ts');
const gatewaySources = [pageSource, shellSource, railSource, flowSource, demoSource].join('\n');

assert.match(shellSource, /FICTIONAL SAMPLES · SECURE WORKSPACES REQUIRE SIGN-IN/);
assert.match(pageSource, /No real case is shown here/);
assert.match(pageSource, /FICTIONAL FAMILY EXAMPLE/);
assert.match(pageSource, /Sample journey · no real case created/);
assert.match(pageSource, /CHOOSE A SAMPLE OR SECURE WORKSPACE/);
assert.match(pageSource, /Family and receiving-director samples use fictional information; their actions may save only in this browser and contact nobody\./);
assert.match(pageSource, /Director and staff options open secure sign-in for authorized team members\./);
assert.match(pageSource, /If access fails, use your invitation or ask your funeral-home administrator\./);
assert.match(pageSource, /ONE FICTIONAL JOURNEY/);
assert.equal(demoCase.person, 'Sofia Rivera');
assert.match(pageSource, /demoCase\.person.*sample journey/);
assert.doesNotMatch(gatewaySources, /CHANGES STAY ON THIS DEVICE/i);
assert.doesNotMatch(gatewaySources, /\bLIVE\b/);
assert.doesNotMatch(gatewaySources, /NS-2051|08:42|Last aligned|MARCUS/);
assert.doesNotMatch(pageSource, /demoCase\.(?:id|lastSync|location|familyLead)/);
assert.doesNotMatch(flowSource, /↗/);
assert.match(flowSource, />→</);

assert.match(flowSource, /aria-live="polite"/);
assert.match(flowSource, /role="status"/);
assert.match(flowSource, /event\.button !== 0/);
for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) assert.match(flowSource, new RegExp(`event\\.${modifier}`));
assert.match(flowSource, /pendingIdRef\.current/);
assert.match(flowSource, /event\.preventDefault\(\)/);
assert.match(flowSource, /window\.addEventListener\('pageshow'/);
assert.doesNotMatch(flowSource, /prefetch=\{false\}/);

assert.ok(fs.existsSync(path.join(root, 'app/favicon.ico/route.ts')), 'The /favicon.ico route must exist');
assert.match(faviconSource, /<svg[\s>]/);
assert.match(faviconSource, /Content-Type': 'image\/svg\+xml/);
assert.match(layoutSource, /url: '\/favicon\.ico'/);
assert.match(railSource, /status = 'SAMPLE'/);

console.log('PASS gateway sample/workspace boundaries, copy, destinations, pending feedback, rail, and favicon regression');
