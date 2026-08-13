import assert from 'node:assert/strict';
import { readFile as rawReadFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

async function readFile(path, encoding) {
  const source = await rawReadFile(path, encoding);
  return typeof source === 'string' ? source.replace(/\r\n/g, '\n') : source;
}

async function loadTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: path,
    reportDiagnostics: true,
  });
  const module = { exports: {} };
  const context = {
    AbortController,
    DOMException,
    clearTimeout,
    module,
    exports: module.exports,
    require(specifier) {
      throw new Error(`Unexpected runtime import in ${path}: ${specifier}`);
    },
    setTimeout,
  };
  vm.runInNewContext(compiled.outputText, context, { filename: path });
  return module.exports;
}

const directory = await loadTypeScriptModule(
  'lib/provider-discovery/synthetic-directory.ts',
);
const controller = await loadTypeScriptModule(
  'lib/provider-discovery/search-controller.ts',
);

assert.equal(directory.rankSyntheticProviders('n', 6).length, 0);
assert.equal(
  directory.rankSyntheticProviders('Northstar Funeral Home', 6)
    .map((result) => result.sourceKey)
    .join(','),
  'northstar-beaverton,northstar-portland',
);
assert.equal(
  directory.rankSyntheticProviders('97206', 6)[0].sourceKey,
  'northstar-portland',
);
assert.equal(
  directory.rankSyntheticProviders('Beaverton', 6)[0].sourceKey,
  'cedar-stone-beaverton',
);
for (const query of [
  '10 main street new york',
  'new york 10 main',
  'street 10 york new',
  '10001 main',
]) {
  assert.equal(
    directory.rankSyntheticProviders(query, 6)[0]?.sourceKey,
    'main-street-new-york',
    `Expected order-independent New York address match for ${query}`,
  );
}
assert.equal(
  directory.rankSyntheticProviders('new york northstar', 6).length,
  0,
  'Tokens from different providers must not be merged into a false match',
);
assert.equal(directory.rankSyntheticProviders('or', 99).length, 6);
assert.equal(
  directory.getSyntheticDirectoryForTests()
    .filter((result) => result.handoffAvailability === 'connected_preview')
    .length,
  1,
);

const requestGate = controller.createSearchRequestGate();
const first = requestGate.start();
const second = requestGate.start();
assert.equal(first.signal.aborted, true);
assert.equal(first.isCurrent(), false);
assert.equal(second.isCurrent(), true);
requestGate.cancel();
assert.equal(second.signal.aborted, true);
assert.equal(second.isCurrent(), false);

assert.equal(controller.nextActiveOption(-1, 3, 1), 0);
assert.equal(controller.nextActiveOption(-1, 3, -1), 2);
assert.equal(controller.nextActiveOption(2, 3, 1), 0);
assert.equal(controller.nextActiveOption(0, 3, -1), 2);
assert.equal(controller.nextActiveOption(0, 0, 1), -1);

const component = await readFile(
  'components/family/provider-discovery/FuneralHomeDiscovery.tsx',
  'utf8',
);
const demoFamilyPage = await readFile('app/demo/family/page.tsx', 'utf8');
const authenticatedFamilyPage = await readFile('app/family/page.tsx', 'utf8');
const familyIntentJourney = await readFile(
  'components/family/FamilyIntentJourney.tsx',
  'utf8',
);
const transferComposer = await readFile(
  'components/family/TransferComposer.tsx',
  'utf8',
);

assert.ok(
  demoFamilyPage.includes('providerMode="browser_demo"'),
  'The demo route must explicitly compose browser-demo provider behavior',
);
assert.ok(
  !demoFamilyPage.includes('confirmProviderSelection'),
  'The demo route must not import or pass the authenticated confirmation action',
);
assert.ok(
  authenticatedFamilyPage.includes('providerMode="authenticated"')
    && authenticatedFamilyPage.includes('confirmProviderSelection={confirmProviderSelection}'),
  'The authenticated family route must explicitly retain its durable confirmation action',
);
assert.ok(
  !component.includes("from '@/app/family/provider-discovery/actions'"),
  'The shared client renderer must not statically import the authenticated Server Action into the demo graph',
);
for (const source of [familyIntentJourney, transferComposer]) {
  assert.ok(
    source.includes('ProviderDiscoveryModeProps'),
    'Every shared composition layer must carry the explicit provider mode',
  );
}
assert.ok(
  component.includes("providerMode: 'browser_demo'")
    && component.includes("providerMode: 'authenticated'"),
  'The provider renderer must define the discriminated browser-demo and authenticated modes',
);
assert.ok(
  component.includes('rankSyntheticProviders(trimmed, 6)'),
  'Browser-demo search must reuse the pure deterministic directory ranking',
);
assert.ok(
  component.includes("providerMode === 'browser_demo'"),
  'Browser-demo behavior must be selected only from the explicit route-composed mode',
);
assert.ok(
  component.includes("providerMode !== 'authenticated'"),
  'Authenticated endpoint and action paths must fail closed behind the authenticated mode',
);
assert.ok(
  !component.includes('window.location')
    && !component.includes('usePathname')
    && !component.includes('process.env'),
  'Provider mode must not be inferred from the URL, pathname, hostname, or environment',
);
for (const contract of [
  'role="combobox"',
  'aria-autocomplete="list"',
  'aria-activedescendant',
  'role="listbox"',
  'role="option"',
  'Use this funeral home',
  'Enter funeral home details manually',
  'Nothing is sent to',
  'Choose a funeral home',
  'Search by funeral home name, street, city, or ZIP code.',
  'Funeral home name or address',
  'Looking for funeral homes...',
  "We couldn't search right now. Nothing was saved. Try again or enter the details manually.",
  "We couldn't confirm whether it was saved. Reload and check your funeral home before trying again.",
]) {
  assert.ok(component.includes(contract), `Missing component contract: ${contract}`);
}
const comboboxChange = component.match(
  /onChange=\{\(event\) => \{\s*gate\.current\?\.cancel\(\);[\s\S]{0,240}?setQuery\(event\.target\.value\);/,
);
assert.ok(
  comboboxChange,
  'Every input change must invalidate the active request before updating the debounced query',
);
assert.ok(component.includes('<button onClick={startManual} type="button">\n            Edit details'));
assert.ok(!component.includes("saved.sourceKind === 'manual'"));
assert.ok(component.includes("sourceKind: 'manual'"));
assert.ok(component.includes('const editSource = candidate ?? saved;'));

const componentCss = await readFile(
  'components/family/provider-discovery/FuneralHomeDiscovery.module.css',
  'utf8',
);
const mobileCss = componentCss.slice(componentCss.indexOf('@media (max-width: 520px)'));
assert.ok(mobileCss.includes('.results {\n    position: static;'));
assert.ok(mobileCss.includes('max-height: min(320px, 40vh);'));
assert.ok(componentCss.includes('min-height: 3.5rem;'));
assert.ok(componentCss.includes('min-height: 3rem;'));

const familyPage = await readFile('app/family/page.tsx', 'utf8');
const familyJourneyCss = await readFile(
  'components/family/FamilyJourney.module.css',
  'utf8',
);
assert.ok(
  familyPage.includes(
    '<a className={styles.skipLink} href="#family-journey">Skip to handoff</a>',
  ),
  'Family page must retain the Skip to handoff target',
);
const skipLinkRule = familyJourneyCss.match(/\.skipLink\s*\{([\s\S]*?)\}/)?.[1] ?? '';
for (const targetContract of [
  'display: inline-flex;',
  'align-items: center;',
  'min-height: 48px;',
]) {
  assert.ok(
    skipLinkRule.includes(targetContract),
    `Skip to handoff must retain its 48px target contract: ${targetContract}`,
  );
}

const searchRoute = await readFile(
  'app/family/provider-discovery/search/route.ts',
  'utf8',
);
assert.ok(searchRoute.includes('request.json()'));
assert.ok(!searchRoute.includes('searchParams'));
assert.ok(!searchRoute.includes('console.'));

const migration = [
  await readFile(
    'supabase/migrations/20260723092402_family_provider_discovery.sql',
    'utf8',
  ),
  await readFile(
    'supabase/migrations/20260813035045_a16_new_york_sample.sql',
    'utf8',
  ),
].join('\n');
for (const contract of [
  'family_provider_one_active_per_space',
  'pg_advisory_xact_lock',
  'family_provider_selection.confirmed',
  'family_provider_selection.superseded',
  'passage_private.can_view_continuity_space',
  'passage_private.can_manage_continuity_space',
  'workflow_events_cycle_7b_append_only',
  'workflow_events_authorized_select',
  'family_provider_selection_id',
  "'main-street-new-york'",
  "'10 Main Street'",
  "'New York'",
  "'10001'",
]) {
  assert.ok(migration.includes(contract), `Missing migration contract: ${contract}`);
}
const isolatedSystemIdentifier = '7656983981618135123';
function hasPositiveClusterGuard(source, identifier) {
  return source.includes('pg_catalog.pg_control_system()')
    && source.includes(`${identifier}::bigint`)
    && source.includes('is distinct from')
    && source.includes('exact isolated cluster attestation failed');
}
assert.ok(hasPositiveClusterGuard(migration, isolatedSystemIdentifier));
assert.ok(!hasPositiveClusterGuard(migration, '7656983981618135124'));
assert.ok(!migration.includes("current_setting('passage.project_ref'"));
assert.ok(!migration.includes(
  'grant select on table public.family_provider_selections to authenticated',
));
assert.ok(!migration.includes('family_provider_event_authorized_select'));

const publicProjection = migration.slice(
  migration.indexOf(
    'create or replace function public.get_family_provider_selection_projection',
  ),
  migration.indexOf(
    'alter table public.family_provider_selections enable row level security',
  ),
);
const publicProjectionResult = publicProjection.slice(
  publicProjection.indexOf('returns table ('),
  publicProjection.indexOf('language sql stable'),
);
for (const forbidden of [
  'selection_id',
  'continuity_space_id uuid,',
  'source_kind',
  'source_key',
  'dataset_version',
  'request_digest',
  'event_id',
]) {
  assert.ok(
    !publicProjectionResult.includes(forbidden),
    `Public provider projection exposes ${forbidden}`,
  );
}

const reversal = await readFile(
  'supabase/tests/family_provider_discovery_reversibility.sql',
  'utf8',
);
const sqlAuthorityMatrix = await readFile(
  'supabase/tests/family_provider_discovery.sql',
  'utf8',
);
const advisorHardening = await readFile(
  'supabase/migrations/20260813043536_a16_provider_directory_fk_indexes.sql',
  'utf8',
);
assert.equal(
  advisorHardening.match(/^create index if not exists /gm)?.length,
  2,
  'A16 advisor hardening must contain exactly two idempotent indexes',
);
assert.ok(
  !/^\s*(?:insert|update|delete|alter\s+table|grant|revoke|create\s+policy|drop)\b/im.test(
    advisorHardening,
  ),
  'A16 advisor hardening must not mutate rows, authority, RPCs, RLS, or existing objects',
);
for (const guard of [
  '7656983981618135123::bigint',
  "where name = 'family_provider_discovery'",
  "where name = 'a16_new_york_sample'",
  'qsveqfchwylsbncsfgxe',
]) {
  assert.ok(advisorHardening.includes(guard), `Missing A16 advisor guard: ${guard}`);
}
assert.ok(
  /Expected unverified-user denial'[\s\S]{0,120}sqlstate '28000'/.test(
    sqlAuthorityMatrix,
  ),
  'Unverified provider confirmation must assert the authoritative verified-email SQLSTATE 28000 denial',
);
for (const [indexName, columnName] of [
  ['synthetic_provider_directory_organization_id_idx', 'organization_id'],
  [
    'synthetic_provider_directory_organization_location_id_idx',
    'organization_location_id',
  ],
]) {
  assert.ok(
    advisorHardening.includes(`create index if not exists ${indexName}`),
    `Missing idempotent A16 advisor index: ${indexName}`,
  );
  assert.ok(
    advisorHardening.includes(
      `pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = '${columnName}'`,
    ),
    `Missing exact A16 advisor index postcondition: ${indexName}`,
  );
  assert.ok(
    sqlAuthorityMatrix.includes(`'passage_private.${indexName}'::regclass`),
    `SQL authority matrix must require A16 advisor index: ${indexName}`,
  );
  assert.ok(
    reversal.includes(`to_regclass('passage_private.${indexName}') is not null`),
    `Reversal must prove A16 advisor index absence: ${indexName}`,
  );
}
for (const contract of [
  '(select count(*) from public.family_provider_selections) <> 0',
  "to_regclass('public.family_provider_selections') is not null",
  "to_regclass('passage_private.synthetic_provider_directory') is not null",
  "to_regprocedure(\n       'public.get_family_provider_selection_projection(uuid)'",
  "to_regprocedure(\n       'passage_private.get_family_provider_selection_projection(uuid)'",
  "'workflow_events_family_provider_selection_id_fkey'",
  "'workflow_events_previous_family_provider_selection_id_fkey'",
  "policyname = 'family_provider_selection_authorized_select'",
  "'c7a00001-7a00-47a0-87a0-000000000001'",
  "'c7a00002-7a00-47a0-87a0-000000000002'",
  "'c7b10001-7b00-47b0-87b0-000000000001'",
  "'c7b20003-7b00-47b0-87b0-000000000003'",
  "case_reference = 'NS-2051'",
]) {
  assert.ok(reversal.includes(contract), `Missing reversal contract: ${contract}`);
}
for (const staleSharedLabCount of [
  '(select count(*) from public.organizations) <> 1',
  '(select count(*) from public.organization_locations) <> 1',
  '(select count(*) from public.workflows) <> 2',
  '(select count(*) from public.tasks) <> 3',
  '(select count(*) from public.workflow_events) <> 8',
]) {
  assert.ok(
    !reversal.includes(staleSharedLabCount),
    `Reversal must not depend on shared-lab global count: ${staleSharedLabCount}`,
  );
}

console.log('family provider discovery source contracts: PASS');
