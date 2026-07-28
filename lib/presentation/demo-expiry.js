'use strict';

const DEMO_EXPIRY_TIME_ZONE = 'America/Los_Angeles';
const EXPIRY_HOURS = Object.freeze({
  '24h': 24,
  '72h': 72,
  '7d': 168,
});
const CANONICAL_ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function canonicalIsoInstant(value) {
  if (typeof value !== 'string' || !CANONICAL_ISO_INSTANT.test(value)) return null;
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) return null;
  const normalized = new Date(instant).toISOString();
  return normalized === value ? normalized : null;
}

function deriveDemoExpiry(activatedAt, expiryId) {
  const canonicalActivation = canonicalIsoInstant(activatedAt);
  const hours = EXPIRY_HOURS[expiryId];
  if (!canonicalActivation || !hours) return null;
  try {
    const derived = new Date(Date.parse(canonicalActivation) + hours * 60 * 60 * 1000).toISOString();
    return canonicalIsoInstant(derived);
  } catch {
    return null;
  }
}

function normalizeDemoTransferDraft(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value;
  if (
    typeof candidate.recipientId !== 'string'
    || !candidate.recipientId
    || !Array.isArray(candidate.scopeIds)
    || candidate.scopeIds.length === 0
    || candidate.scopeIds.some((item) => typeof item !== 'string' || !item)
    || typeof candidate.expiryId !== 'string'
    || !EXPIRY_HOURS[candidate.expiryId]
  ) return null;

  const activatedAt = canonicalIsoInstant(candidate.activatedAt);
  if (!activatedAt) return null;
  const expectedExpiry = deriveDemoExpiry(activatedAt, candidate.expiryId);
  if (!expectedExpiry) return null;

  if (candidate.expiresAt !== undefined) {
    if (canonicalIsoInstant(candidate.expiresAt) !== expectedExpiry) return null;
  }

  return {
    recipientId: candidate.recipientId,
    scopeIds: [...new Set(candidate.scopeIds)],
    expiryId: candidate.expiryId,
    activatedAt,
    expiresAt: expectedExpiry,
  };
}

function formatDemoExpiry(expiresAt) {
  const canonicalExpiry = canonicalIsoInstant(expiresAt);
  if (!canonicalExpiry) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEMO_EXPIRY_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(canonicalExpiry));
}

module.exports = {
  canonicalIsoInstant,
  DEMO_EXPIRY_TIME_ZONE,
  deriveDemoExpiry,
  formatDemoExpiry,
  normalizeDemoTransferDraft,
};
