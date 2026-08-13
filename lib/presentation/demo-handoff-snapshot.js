'use strict';

const { canonicalIsoInstant, deriveDemoExpiry } = require('./demo-expiry');

const DEMO_HANDOFF_SCHEMA = 'passage.family.handoff';
const DEMO_HANDOFF_VERSION = 1;
const ALLOWED_INTENTS = new Set(['planning', 'urgent']);
const ALLOWED_SCOPE_IDS = new Set(['identity', 'care', 'wishes', 'documents', 'notes']);
const ALLOWED_EXPIRY_IDS = new Set(['24h', '72h', '7d']);
const ALLOWED_HANDOFF_AVAILABILITY = new Set(['connected_preview', 'save_only']);
const RECEIVER_ROLE = 'Not contacted by Passage';

function boundedString(value, maximum, allowEmpty = false) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if ((!allowEmpty && !normalized) || normalized.length > maximum) return null;
  return normalized;
}

function normalizeAddress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const line1 = boundedString(value.line1, 160, true);
  const line2 = value.line2 === undefined ? undefined : boundedString(value.line2, 160, true);
  const locality = boundedString(value.locality, 100, true);
  const administrativeArea = boundedString(value.administrativeArea, 80, true);
  const postalCode = boundedString(value.postalCode, 20, true);
  const countryCode = boundedString(value.countryCode, 2);
  const formatted = boundedString(value.formatted, 500);
  if (
    line1 === null
    || line2 === null
    || locality === null
    || administrativeArea === null
    || postalCode === null
    || countryCode === null
    || formatted === null
  ) return null;
  return Object.freeze({
    line1,
    ...(line2 ? { line2 } : {}),
    locality,
    administrativeArea,
    postalCode,
    countryCode: countryCode.toUpperCase(),
    formatted,
  });
}

function normalizeReceiver(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const selectionId = boundedString(value.selectionId, 160);
  const displayName = boundedString(value.displayName, 160);
  const address = normalizeAddress(value.address);
  if (
    !selectionId
    || value.source !== 'browser_demo'
    || !displayName
    || !address
    || !ALLOWED_HANDOFF_AVAILABILITY.has(value.handoffAvailability)
    || value.role !== RECEIVER_ROLE
  ) return null;
  return Object.freeze({
    selectionId,
    source: 'browser_demo',
    displayName,
    address,
    handoffAvailability: value.handoffAvailability,
    role: RECEIVER_ROLE,
  });
}

function normalizeDemoHandoffSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.schema !== DEMO_HANDOFF_SCHEMA || value.version !== DEMO_HANDOFF_VERSION) return null;
  if (value.intent !== null && !ALLOWED_INTENTS.has(value.intent)) return null;
  const receiver = normalizeReceiver(value.receiver);
  if (!receiver || !Array.isArray(value.scopeIds) || value.scopeIds.length === 0) return null;
  if (
    value.scopeIds.some((scopeId) => typeof scopeId !== 'string' || !ALLOWED_SCOPE_IDS.has(scopeId))
    || new Set(value.scopeIds).size !== value.scopeIds.length
    || !ALLOWED_EXPIRY_IDS.has(value.expiryId)
  ) return null;
  const activatedAt = canonicalIsoInstant(value.activatedAt);
  const expiresAt = canonicalIsoInstant(value.expiresAt);
  const expectedExpiry = activatedAt ? deriveDemoExpiry(activatedAt, value.expiryId) : null;
  if (!activatedAt || !expiresAt || expiresAt !== expectedExpiry) return null;
  return Object.freeze({
    schema: DEMO_HANDOFF_SCHEMA,
    version: DEMO_HANDOFF_VERSION,
    intent: value.intent,
    receiver,
    scopeIds: Object.freeze([...value.scopeIds]),
    expiryId: value.expiryId,
    activatedAt,
    expiresAt,
  });
}

function createDemoHandoffSnapshot(input) {
  return normalizeDemoHandoffSnapshot({
    schema: DEMO_HANDOFF_SCHEMA,
    version: DEMO_HANDOFF_VERSION,
    intent: input.intent,
    receiver: input.receiver,
    scopeIds: input.scopeIds,
    expiryId: input.expiryId,
    activatedAt: input.activatedAt,
    expiresAt: input.expiresAt,
  });
}

module.exports = {
  createDemoHandoffSnapshot,
  DEMO_HANDOFF_SCHEMA,
  DEMO_HANDOFF_VERSION,
  normalizeDemoHandoffSnapshot,
};
