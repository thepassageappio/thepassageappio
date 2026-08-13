import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

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
for (const contract of [
  '(select count(*) from public.organizations) <> 1',
  '(select count(*) from public.organization_locations) <> 1',
  '(select count(*) from public.workflows) <> 2',
  '(select count(*) from public.tasks) <> 3',
  '(select count(*) from public.workflow_events) <> 8',
  "'c7a00001-7a00-47a0-87a0-000000000001'",
  "'c7a00002-7a00-47a0-87a0-000000000002'",
  "'c7b10001-7b00-47b0-87b0-000000000001'",
  "'c7b20003-7b00-47b0-87b0-000000000003'",
  "case_reference = 'NS-2051'",
]) {
  assert.ok(reversal.includes(contract), `Missing reversal contract: ${contract}`);
}

console.log('family provider discovery source contracts: PASS');
