import { escapeHtml, passageEmailShell } from './brandedEmail';
import { routeEmailRecipients } from './notificationSafety';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function validReceiptEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

export async function sendSubmissionReceipt({
  to,
  subject = 'We received your Passage request',
  eyebrow = 'Request received',
  title = 'Thanks for reaching out to Passage.',
  intro = 'We received your request and will get back to you as soon as possible.',
  sections = [],
  ctaLabel = 'Return to Passage',
  ctaPath = '/',
  replyTo,
}) {
  if (!process.env.RESEND_API_KEY || !validReceiptEmail(to)) return { skipped: true };

  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const ctaUrl = /^https?:\/\//.test(String(ctaPath || '')) ? ctaPath : `${SITE_URL}${ctaPath || '/'}`;
  const html = passageEmailShell({
    eyebrow,
    title,
    intro,
    sections,
    ctaLabel,
    ctaUrl,
    footer: 'You can reply to this email if anything needs to change. Powered by Passage | thepassageapp.io',
  });

  const route = routeEmailRecipients([to]);
  if (!route.actual.length) return { skipped: true, qaOverride: route.qaOverride };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: route.actual,
      reply_to: replyTo || process.env.SUPPORT_EMAIL || process.env.RESEND_SUPPORT_EMAIL || 'support@thepassageapp.io',
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.warn('submission receipt not sent:', detail);
    return { error: detail || 'Resend rejected receipt email.' };
  }

  return { sent: true, qaOverride: route.qaOverride, intended: route.intended, actual: route.actual };
}

export function detailRows(rows) {
  return Object.entries(rows || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `${escapeHtml(label)}: <strong style="color:#1a1916;">${escapeHtml(value)}</strong>`)
    .join('<br/>');
}
