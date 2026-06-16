export const PASSAGE_DISCOVERY_MEETING_URL = 'https://meetings-na2.hubspot.com/steven-t';

function publicCampaignLabel(source = '') {
  return String(source || '')
    .replace(/partner[_\s-]*pilot/gi, 'starter rollout')
    .replace(/pilot[_\s-]*proof/gi, 'sample case')
    .replace(/pilot[_\s-]*walkthroughs?/gi, 'product walkthrough')
    .replace(/\bpilot\b/gi, 'starter rollout');
}

export function calendlyUrl({ name = '', email = '', source = '' } = {}) {
  const params = new URLSearchParams();
  const normalizedName = String(name || '').trim();
  if (normalizedName) {
    const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);
    if (firstName) params.set('firstname', firstName);
    if (lastNameParts.length) params.set('lastname', lastNameParts.join(' '));
  }
  if (email) params.set('email', email);
  if (source) {
    params.set('utm_source', 'passage');
    params.set('utm_medium', 'website');
    params.set('utm_campaign', publicCampaignLabel(source).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }
  const query = params.toString();
  return query ? `${PASSAGE_DISCOVERY_MEETING_URL}?${query}` : PASSAGE_DISCOVERY_MEETING_URL;
}

export function isMeetingCategory(category = '') {
  const value = String(category || '').toLowerCase();
  return value.includes('demo')
    || value.includes('walkthrough')
    || value.includes('meeting')
    || value.includes('funeral home')
    || value.includes('partner inquiry')
    || value.includes('vendor conversation')
    || value.includes('hospice')
    || value.includes('care facility');
}
