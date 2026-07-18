const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'lib', 'runtime-config.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const environment = {};
const moduleBox = { exports: {} };
vm.runInNewContext(compiled, {
  module: moduleBox,
  exports: moduleBox.exports,
  process: { env: environment },
  URL,
  Set,
}, { filename: sourcePath });

const { getRuntimeConfiguration } = moduleBox.exports;
const isolatedRef = 'uyacxqtsiwlvtmhxvoxr';
const productionRef = 'qsveqfchwylsbncsfgxe';
const isolatedUrl = `https://${isolatedRef}.supabase.co`;
const productionUrl = `https://${productionRef}.supabase.co`;

function configure(overrides = {}) {
  for (const key of Object.keys(environment)) delete environment[key];
  Object.assign(environment, {
    VERCEL_ENV: 'preview',
    PASSAGE_RUNTIME: 'preview',
    NEXT_PUBLIC_SUPABASE_URL: isolatedUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
    PASSAGE_SUPABASE_PROJECT_REF: isolatedRef,
    PASSAGE_DEMO_SUPABASE_PROJECT_REF: isolatedRef,
    PASSAGE_PRODUCTION_SUPABASE_PROJECT_REF: productionRef,
    PASSAGE_ALLOW_LOCAL_SUPABASE: 'false',
    PASSAGE_PREVIEW_PASSWORD_AUTH_ENABLED: 'true',
    ...overrides,
  });
  return getRuntimeConfiguration();
}

const approvedPreview = configure();
assert.equal(approvedPreview.available, true);
assert.equal(approvedPreview.projectRef, isolatedRef);
assert.equal(approvedPreview.passwordAuthEnabled, true);

const productionBoundPreview = configure({
  NEXT_PUBLIC_SUPABASE_URL: productionUrl,
  PASSAGE_SUPABASE_PROJECT_REF: productionRef,
  PASSAGE_DEMO_SUPABASE_PROJECT_REF: productionRef,
});
assert.equal(productionBoundPreview.available, false);
assert.equal(productionBoundPreview.reason, 'Preview data binding cannot use the production project.');

const missingProductionBoundary = configure({ PASSAGE_PRODUCTION_SUPABASE_PROJECT_REF: '' });
assert.equal(missingProductionBoundary.available, false);
assert.equal(missingProductionBoundary.reason, 'Preview data binding cannot use the production project.');

assert.equal(configure({ PASSAGE_SUPABASE_PROJECT_REF: productionRef }).available, false);
assert.equal(configure({ PASSAGE_DEMO_SUPABASE_PROJECT_REF: productionRef }).available, false);
assert.equal(configure({ PASSAGE_RUNTIME: 'production' }).available, false);

const approvedProduction = configure({
  VERCEL_ENV: 'production',
  PASSAGE_RUNTIME: 'production',
  NEXT_PUBLIC_SUPABASE_URL: productionUrl,
  PASSAGE_SUPABASE_PROJECT_REF: productionRef,
});
assert.equal(approvedProduction.available, true);
assert.equal(approvedProduction.passwordAuthEnabled, false);

console.log('PASS runtime configuration isolates Preview from Production');
