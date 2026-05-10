export const PASSAGE_DISCOVERY_MEETING_URL = 'https://calendly.com/steventurrisi/passage-app-discovery-meeting';

export function calendlyUrl({ name = '', email = '', source = '' } = {}) {
  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (email) params.set('email', email);
  if (source) params.set('a1', source);
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
