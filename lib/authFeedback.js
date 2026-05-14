export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function friendlyAuthError(error) {
  const message = String(error?.message || error || '').trim();
  if (!message) return 'We could not send that sign-in link. Check the email and try again.';
  if (/invalid.*email/i.test(message) || /email.*invalid/i.test(message)) {
    return 'Enter a valid email address, like name@example.com.';
  }
  if (/rate|too many/i.test(message)) {
    return 'Too many sign-in attempts. Wait a moment, then try again.';
  }
  return message;
}

