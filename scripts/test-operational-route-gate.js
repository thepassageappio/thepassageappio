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

const { canRenderVerifiedOperationalChild, DIRECTOR_INVITATION_PATH, isolatedPreviewInvitationEnabled, operationalRecoveryPath, staffInvitationEnabled } = moduleBox.exports;
const approved = { available: true, runtime: 'preview', projectRef: 'uyacxqtsiwlvtmhxvoxr', passwordAuthEnabled: true };

assert.equal(isolatedPreviewInvitationEnabled(approved), true);
assert.equal(canRenderVerifiedOperationalChild(DIRECTOR_INVITATION_PATH, approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/team', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/activity', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/intake', approved), true);
assert.equal(canRenderVerifiedOperationalChild('/director/intake/extra', approved), false);
assert.equal(canRenderVerifiedOperationalChild('/staff', approved), true);
assert.equal(canRenderVerifiedOperationalChild(`${DIRECTOR_INVITATION_PATH}/extra`, approved), false);
for (const denied of [
  { ...approved, available: false },
  { ...approved, runtime: 'demo' },
  // NOT runtime: 'production' here -- production is now a legitimate, separately
  // tested allow case for the invitation path (see staffInvitationEnabled below).
  { ...approved, projectRef: 'qsveqfchwylsbncsfgxe' },
  { ...approved, passwordAuthEnabled: false },
]) assert.equal(canRenderVerifiedOperationalChild(DIRECTOR_INVITATION_PATH, denied), false);

// CRITICAL, added 2026-08-20 after a real production regression: every
// assertion above only ever checked the isolated-preview-approved config.
// Nothing here ever asserted that /director, /staff, and the Case
// Room/work-detail routes actually render under a real PRODUCTION runtime
// config -- so a version of this gate that silently required
// isolatedPreviewInvitationEnabled (preview-only) for every operational
// path, not just the invitation page, passed this entire suite while
// replacing every real director/staff page with a placeholder for every
// real user in production. This is the assertion that would have caught
// it; do not remove it.
const production = { available: true, runtime: 'production', projectRef: 'qsveqfchwylsbncsfgxe', passwordAuthEnabled: false };
assert.equal(canRenderVerifiedOperationalChild('/director', production), true);
assert.equal(canRenderVerifiedOperationalChild('/staff', production), true);
assert.equal(canRenderVerifiedOperationalChild('/director/team', production), true);
assert.equal(canRenderVerifiedOperationalChild('/director/activity', production), true);
assert.equal(canRenderVerifiedOperationalChild('/director/intake', production), true);
assert.equal(canRenderVerifiedOperationalChild('/director/cases/11111111-1111-1111-1111-111111111111', production), true);
assert.equal(canRenderVerifiedOperationalChild('/staff/work/11111111-1111-1111-1111-111111111111', production), true);
assert.equal(canRenderVerifiedOperationalChild('/director/urgent/11111111-1111-1111-1111-111111111111', production), true);
// Staff invitation creation is enabled in real production too (2026-08-20):
// the feature itself has no preview-only dependency, only its rollout did.
assert.equal(staffInvitationEnabled(production), true);
assert.equal(canRenderVerifiedOperationalChild(DIRECTOR_INVITATION_PATH, production), true);
assert.equal(canRenderVerifiedOperationalChild('/unknown/path', production), false);
// Still denied everywhere else: demo runtime, and an unavailable environment.
assert.equal(staffInvitationEnabled({ ...production, runtime: 'demo' }), false);
assert.equal(staffInvitationEnabled({ ...production, available: false }), false);

assert.equal(operationalRecoveryPath(DIRECTOR_INVITATION_PATH, '/director'), DIRECTOR_INVITATION_PATH);
assert.equal(operationalRecoveryPath('/director/team', '/director'), '/director/team');
assert.equal(operationalRecoveryPath('/director/activity', '/director'), '/director/activity');
assert.equal(operationalRecoveryPath('/director/intake', '/director'), '/director/intake');
assert.equal(operationalRecoveryPath('/staff', '/staff'), '/staff');
assert.equal(operationalRecoveryPath('/director', '/director'), '/director');
assert.equal(operationalRecoveryPath('/director/invitations/new/extra', '/director'), '/director');
console.log('PASS operational route gate fail-closed matrix');
