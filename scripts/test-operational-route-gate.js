const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'lib', 'auth', 'operational-route-gate.ts');
const source = fs.readFileSync(sourcePath, 'utf8').replace(/^import type .*;\r?\n/m, '');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleBox = { exports: {} };
vm.runInNewContext(compiled, { module: moduleBox, exports: moduleBox.exports }, { filename: sourcePath });

const { canRenderVerifiedOperationalChild, DIRECTOR_INVITATION_PATH, isolatedPreviewInvitationEnabled, operationalRecoveryPath } = moduleBox.exports;
const approved = { available: true, runtime: 'preview', projectRef: 'uyacxqtsiwlvtmhxvoxr', passwordAuthEnabled: true };

assert.equal(isolatedPreviewInvitationEnabled(approved), true);
assert.equal(canRenderVerifiedOperationalChild(DIRECTOR_INVITATION_PATH, approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/team', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/activity', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/intake', approved), false);
assert.equal(canRenderVerifiedOperationalChild('/staff', approved), true);
assert.equal(canRenderVerifiedOperationalChild(`${DIRECTOR_INVITATION_PATH}/extra`, approved), false);
for (const denied of [
  { ...approved, available: false },
  { ...approved, runtime: 'demo' },
  { ...approved, runtime: 'production' },
  { ...approved, projectRef: 'qsveqfchwylsbncsfgxe' },
  { ...approved, passwordAuthEnabled: false },
]) assert.equal(canRenderVerifiedOperationalChild(DIRECTOR_INVITATION_PATH, denied), false);

assert.equal(operationalRecoveryPath(DIRECTOR_INVITATION_PATH, '/director'), DIRECTOR_INVITATION_PATH);
assert.equal(operationalRecoveryPath('/director/team', '/director'), '/director/team');
assert.equal(operationalRecoveryPath('/director/activity', '/director'), '/director/activity');
assert.equal(operationalRecoveryPath('/staff', '/staff'), '/staff');
assert.equal(operationalRecoveryPath('/director', '/director'), '/director');
assert.equal(operationalRecoveryPath('/director/invitations/new/extra', '/director'), '/director');
console.log('PASS operational route gate fail-closed matrix');
