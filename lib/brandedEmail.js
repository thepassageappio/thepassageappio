import { PASSAGE_BRAND, brandMarkUrl } from './brand';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
};

const LOGO_URL = brandMarkUrl('light', true);

export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function passageEmailShell({
  eyebrow = 'Passage',
  title,
  intro,
  preheader,
  sections = [],
  ctaLabel,
  ctaUrl,
  footer = 'Powered by Passage | thepassageapp.io',
}) {
  const bodySections = sections.map(section => `
    <div style="background:${section.tone === 'soft' ? C.sageFaint : C.card};border:1px solid ${section.tone === 'soft' ? '#c8deca' : C.border};border-radius:14px;padding:14px 16px;margin:14px 0;">
      ${section.label ? `<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.sage};font-weight:900;margin-bottom:6px;">${escapeHtml(section.label)}</div>` : ''}
      <div style="font-size:14px;line-height:1.65;color:${C.mid};">${section.html || escapeHtml(section.text || '')}</div>
    </div>
  `).join('');

  const safeCtaUrl = ctaUrl ? escapeHtml(ctaUrl) : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      @media screen and (max-width: 560px) {
        .passage-email-wrap { padding: 16px 10px !important; }
        .passage-email-card { padding: 20px 18px !important; border-radius: 16px !important; }
        .passage-email-header { display: block !important; }
        .passage-email-mark { margin-bottom: 10px !important; }
        .passage-email-eyebrow { text-align: left !important; margin-top: 10px !important; }
        .passage-email-title { font-size: 27px !important; line-height: 1.15 !important; }
        .passage-email-body { font-size: 16px !important; line-height: 1.62 !important; }
        .passage-email-button { display: block !important; text-align: center !important; width: auto !important; }
      }
    </style>
  </head><body style="margin:0;background:${C.bg};font-family:Georgia,serif;color:${C.ink};">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>` : ''}
    <div class="passage-email-wrap" style="padding:28px 16px;">
      <div class="passage-email-card" style="max-width:580px;margin:0 auto;background:${C.card};border:1px solid ${C.border};border-radius:18px;padding:28px;">
        <div class="passage-email-header" style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:1px solid ${C.border};padding-bottom:14px;margin-bottom:18px;">
          <div class="passage-email-mark" style="display:flex;align-items:center;gap:10px;">
            <img src="${LOGO_URL}" alt="" width="38" height="38" style="display:block;border-radius:9px;" />
            <div>
            <div style="font-size:24px;line-height:1;color:${C.ink};font-weight:900;">${PASSAGE_BRAND.name}</div>
            <div style="font-size:12px;color:${C.mid};margin-top:3px;">${PASSAGE_BRAND.tagline}</div>
            </div>
          </div>
          <div class="passage-email-eyebrow" style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.sage};font-weight:900;text-align:right;">${escapeHtml(eyebrow)}</div>
        </div>
        <h1 class="passage-email-title" style="font-size:26px;line-height:1.18;margin:0 0 12px;font-weight:400;color:${C.ink};">${escapeHtml(title)}</h1>
        ${intro ? `<p class="passage-email-body" style="font-size:15px;line-height:1.7;color:${C.mid};margin:0 0 16px;">${escapeHtml(intro)}</p>` : ''}
        ${bodySections}
        ${ctaLabel && safeCtaUrl ? `<a class="passage-email-button" href="${safeCtaUrl}" style="display:inline-block;background:${C.sage};color:#fff;text-decoration:none;border-radius:13px;padding:13px 18px;font-size:15px;font-weight:900;margin-top:8px;">${escapeHtml(ctaLabel)}</a>` : ''}
        ${safeCtaUrl ? `<p style="font-size:12px;line-height:1.6;color:#a09890;margin:14px 0 0;">If the button does not work, copy and paste this link:<br><a href="${safeCtaUrl}" style="color:${C.sage};word-break:break-all;">${safeCtaUrl}</a></p>` : ''}
        <p style="font-size:12px;line-height:1.6;color:#a09890;margin:20px 0 0;border-top:1px solid ${C.border};padding-top:14px;">${escapeHtml(footer)}</p>
      </div>
    </div>
  </body></html>`;
}

export function passageSubject(label, detail) {
  const cleanLabel = String(label || 'Update').trim();
  const cleanDetail = String(detail || '').trim();
  return cleanDetail ? `Passage: ${cleanLabel}: ${cleanDetail}` : `Passage: ${cleanLabel}`;
}
