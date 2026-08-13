import assert from 'node:assert/strict';
import snapshot from '../lib/presentation/demo-handoff-snapshot.js';

const reviewed = {
  intent: 'urgent',
  receiver: {
    selectionId: 'demo-provider:main-street-new-york',
    source: 'browser_demo',
    displayName: 'Main Street Memorial Home',
    address: {
      line1: '10 Main Street',
      locality: 'New York',
      administrativeArea: 'NY',
      postalCode: '10001',
      countryCode: 'US',
      formatted: '10 Main Street New York, NY 10001 US',
    },
    handoffAvailability: 'save_only',
    role: 'Not contacted by Passage',
  },
  scopeIds: ['identity'],
  expiryId: '72h',
  activatedAt: '2026-08-13T07:00:00.000Z',
  expiresAt: '2026-08-16T07:00:00.000Z',
};

const created = snapshot.createDemoHandoffSnapshot(reviewed);
assert.ok(created);
assert.equal(created.schema, 'passage.family.handoff');
assert.equal(created.version, 1);
assert.equal(created.receiver.displayName, reviewed.receiver.displayName);
assert.equal(created.receiver.address.formatted, reviewed.receiver.address.formatted);
assert.deepEqual([...created.scopeIds], ['identity']);
assert.equal(created.expiryId, '72h');
assert.equal(created.expiresAt, reviewed.expiresAt);
assert.ok(Object.isFrozen(created));
assert.ok(Object.isFrozen(created.receiver));
assert.ok(Object.isFrozen(created.receiver.address));
assert.ok(Object.isFrozen(created.scopeIds));

const invalid = [
  null,
  '{',
  { ...reviewed },
  { ...created, version: 2 },
  { ...created, intent: 'initial-default' },
  { ...created, expiryId: 'unknown' },
  { ...created, expiresAt: '2026-08-16T08:00:00.000Z' },
  { ...created, scopeIds: [] },
  { ...created, scopeIds: ['identity', 'identity'] },
  { ...created, scopeIds: ['unknown'] },
  { ...created, receiver: { ...created.receiver, displayName: '' } },
  { ...created, receiver: { ...created.receiver, displayName: 'x'.repeat(161) } },
  { ...created, receiver: { ...created.receiver, role: 'Funeral director' } },
  { ...created, receiver: { ...created.receiver, source: 'authenticated' } },
  { ...created, receiver: { ...created.receiver, address: { ...created.receiver.address, formatted: '' } } },
];

for (const value of invalid) {
  assert.equal(
    snapshot.normalizeDemoHandoffSnapshot(value),
    null,
  );
}

const manual = snapshot.createDemoHandoffSnapshot({
  ...reviewed,
  intent: 'planning',
  receiver: {
    ...reviewed.receiver,
    selectionId: 'demo-provider:manual-1',
    displayName: 'Harbor Light Farewell Care',
    address: {
      line1: '22 Bay Street',
      locality: 'Astoria',
      administrativeArea: 'OR',
      postalCode: '97103',
      countryCode: 'US',
      formatted: '22 Bay Street Astoria, OR 97103 US',
    },
  },
  scopeIds: ['documents', 'notes'],
  expiryId: '24h',
  expiresAt: '2026-08-14T07:00:00.000Z',
});
assert.equal(manual?.receiver.displayName, 'Harbor Light Farewell Care');
assert.deepEqual([...(manual?.scopeIds ?? [])], ['documents', 'notes']);
assert.equal(manual?.expiresAt, '2026-08-14T07:00:00.000Z');

console.log('demo handoff reviewed snapshot and corruption matrix: PASS');
