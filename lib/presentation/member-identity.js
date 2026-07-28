'use strict';

const internalPreviewText = /\b(?:Cycle\s*\d+[A-Z]?|QA|fixture|test(?:ing)?|preview|synthetic|hosted|deploy(?:ment)?|staging)\b/i;
const emailAddress = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;

function containsInternalPreviewText(value) {
  return internalPreviewText.test(value) || emailAddress.test(value);
}

function humanizePreviewLabel(value, fallback = 'Information available') {
  const cleaned = value
    .replace(/\s*-\s*Cycle\s+\d+[A-Z]?\s+QA\s*$/i, '')
    .replace(/\s+Cycle\s+\d+[A-Z]?\s*$/i, '')
    .trim();
  if (!cleaned || containsInternalPreviewText(cleaned)) return fallback;
  return cleaned;
}

function humanizePreviewIdentity(value, role) {
  const roleFallback = role === 'director' || role === 'owner'
    ? 'Authorized director'
    : role === 'staff'
      ? 'Authorized staff member'
      : 'Authorized team member';
  if (containsInternalPreviewText(value)) return roleFallback;
  const cleaned = humanizePreviewLabel(value, roleFallback);
  if (/^cycle\d+[a-z-]*$/i.test(cleaned)) return roleFallback;
  return cleaned;
}

function humanizeMemberIdentity(displayName, email, role) {
  const genuineName = displayName?.trim();
  if (genuineName) return humanizePreviewIdentity(genuineName, role);
  if (email?.trim()) return humanizePreviewIdentity(email.trim(), role);
  if (role === 'director' || role === 'owner') return 'Authorized director';
  if (role === 'staff') return 'Authorized staff member';
  return 'Authorized team member';
}

module.exports = {
  containsInternalPreviewText,
  humanizeMemberIdentity,
  humanizePreviewIdentity,
  humanizePreviewLabel,
};
