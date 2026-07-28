'use strict';

const DEMO_EXPIRY_TIME_ZONE = 'America/Los_Angeles';
const EXPIRY_HOURS = Object.freeze({
  '24h': 24,
  '72h': 72,
  '7d': 168,
});

function deriveDemoExpiry(activatedAt, expiryId) {
  const activatedAtMs = Date.parse(activatedAt);
  const hours = EXPIRY_HOURS[expiryId];
  if (!Number.isFinite(activatedAtMs) || !hours) return null;
  return new Date(activatedAtMs + hours * 60 * 60 * 1000).toISOString();
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
    || typeof candidate.activatedAt !== 'string'
    || !Number.isFinite(Date.parse(candidate.activatedAt))
  ) return null;

  const activatedAt = new Date(candidate.activatedAt).toISOString();
  const expectedExpiry = deriveDemoExpiry(activatedAt, candidate.expiryId);
  if (!expectedExpiry) return null;

  if (candidate.expiresAt !== undefined) {
    if (typeof candidate.expiresAt !== 'string' || !Number.isFinite(Date.parse(candidate.expiresAt))) return null;
    if (new Date(candidate.expiresAt).toISOString() !== expectedExpiry) return null;
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
  const instant = Date.parse(expiresAt);
  if (!Number.isFinite(instant)) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEMO_EXPIRY_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(instant));
}

module.exports = {
  DEMO_EXPIRY_TIME_ZONE,
  deriveDemoExpiry,
  formatDemoExpiry,
  normalizeDemoTransferDraft,
};
