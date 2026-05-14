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

  return `<!doctype html><html><body style="margin:0;background:${C.bg};font-family:Georgia,serif;color:${C.ink};">
    <div style="padding:28px 16px;">
      <div style="max-width:580px;margin:0 auto;background:${C.card};border:1px solid ${C.border};border-radius:18px;padding:28px;">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:1px solid ${C.border};padding-bottom:14px;margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${LOGO_URL}" alt="" width="38" height="38" style="display:block;border-radius:9px;" />
            <div>
            <div style="font-size:24px;line-height:1;color:${C.ink};font-weight:900;">${PASSAGE_BRAND.name}</div>
            <div style="font-size:12px;color:${C.mid};margin-top:3px;">${PASSAGE_BRAND.tagline}</div>
            </div>
          </div>
          <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.sage};font-weight:900;text-align:right;">${escapeHtml(eyebrow)}</div>
        </div>
        <h1 style="font-size:26px;line-height:1.18;margin:0 0 12px;font-weight:400;color:${C.ink};">${escapeHtml(title)}</h1>
        ${intro ? `<p style="font-size:15px;line-height:1.7;color:${C.mid};margin:0 0 16px;">${escapeHtml(intro)}</p>` : ''}
        ${bodySections}
        ${ctaLabel && ctaUrl ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${C.sage};color:#fff;text-decoration:none;border-radius:13px;padding:13px 18px;font-size:15px;font-weight:900;margin-top:8px;">${escapeHtml(ctaLabel)}</a>` : ''}
        <p style="font-size:12px;line-height:1.6;color:#a09890;margin:20px 0 0;border-top:1px solid ${C.border};padding-top:14px;">${escapeHtml(footer)}</p>
      </div>
    </div>
  </body></html>`;
}
