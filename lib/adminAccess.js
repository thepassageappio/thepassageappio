const DEFAULT_ADMIN_EMAILS = ['thepassageappio@gmail.com', 'steventurrisi@gmail.com'];

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function passageAdminEmails() {
  const configured = String(process.env.PASSAGE_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...configured]));
}

export function isPassageAdmin(email) {
  const normalized = normalizeEmail(email);
  return !!normalized && passageAdminEmails().includes(normalized);
}
