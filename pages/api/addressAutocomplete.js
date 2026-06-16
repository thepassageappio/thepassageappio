import { getRequestIp, rateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function cleanLimitKey(value, max = 140) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:+-]/g, '').slice(0, max) || 'missing';
}

function enforceAddressLookupLimit(req, { q, placeId }) {
  const policy = getRateLimitPolicy('providerLookup');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['address-lookup', getRequestIp(req), placeId ? 'details' : 'autocomplete', cleanLimitKey(placeId || q).toLowerCase()].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

function clean(value, limit = 220) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_message || 'Address lookup failed.');
  return data;
}

function assertGoogleStatus(data = {}) {
  if (!data.status || data.status === 'OK' || data.status === 'ZERO_RESULTS') return;
  throw new Error(data.error_message || `Google Places returned ${data.status}.`);
}

function parsePlaceAddress(place = {}) {
  const parts = {};
  (place.address_components || []).forEach((component) => {
    const types = component.types || [];
    if (types.includes('street_number')) parts.streetNumber = component.long_name;
    if (types.includes('route')) parts.route = component.long_name;
    if (types.includes('locality')) parts.city = component.long_name;
    if (types.includes('postal_town') && !parts.city) parts.city = component.long_name;
    if (types.includes('sublocality') && !parts.city) parts.city = component.long_name;
    if (types.includes('administrative_area_level_1')) {
      parts.state = component.short_name;
      parts.stateName = component.long_name;
    }
    if (types.includes('postal_code')) parts.postalCode = component.long_name;
    if (types.includes('country')) parts.country = component.short_name;
  });
  return {
    placeName: place.name || '',
    placeId: place.place_id || '',
    formattedAddress: place.formatted_address || '',
    street: [parts.streetNumber, parts.route].filter(Boolean).join(' '),
    city: parts.city || '',
    state: parts.state || '',
    stateName: parts.stateName || '',
    postalCode: parts.postalCode || '',
    country: parts.country || '',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const q = clean(req.query.q);
  const placeId = clean(req.query.placeId, 120);
  const limit = enforceAddressLookupLimit(req, { q, placeId });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Too many address lookups. Please wait before searching again.', retryAfterSeconds: limit.retryAfterSeconds });
  }
  if (!GOOGLE_KEY) return res.status(200).json({ configured: false, predictions: [] });
  if (!q && !placeId) return res.status(400).json({ error: 'Address or placeId required.' });

  try {
    if (placeId) {
      const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?' + new URLSearchParams({
        place_id: placeId,
        fields: 'address_components,formatted_address,name,place_id',
        key: GOOGLE_KEY,
      }).toString();
      const details = await fetchJson(detailsUrl);
      assertGoogleStatus(details);
      return res.status(200).json({ configured: true, address: parsePlaceAddress(details.result || {}) });
    }

    const autocompleteUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' + new URLSearchParams({
      input: q,
      types: 'geocode',
      components: 'country:us',
      key: GOOGLE_KEY,
    }).toString();
    const autocomplete = await fetchJson(autocompleteUrl);
    assertGoogleStatus(autocomplete);
    const predictions = (autocomplete.predictions || []).slice(0, 5).map((prediction) => ({
      placeId: prediction.place_id || '',
      description: prediction.description || '',
      mainText: prediction.structured_formatting?.main_text || prediction.description || '',
      secondaryText: prediction.structured_formatting?.secondary_text || '',
    })).filter((prediction) => prediction.placeId && prediction.description);
    return res.status(200).json({ configured: true, predictions });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Address lookup failed.' });
  }
}
