import { createClient } from '@supabase/supabase-js';
import { getRequestIp, durableRateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const admin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function cleanLimitKey(value, max = 140) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:+-]/g, '').slice(0, max) || 'missing';
}

async function enforceLookupLimit(req, { query, kind, near }) {
  const policy = getRateLimitPolicy('providerLookup');
  if (!policy) return { allowed: true };
  return durableRateLimit(admin, {
    key: ['provider-search', getRequestIp(req), cleanLimitKey(query || kind).toLowerCase(), cleanLimitKey(near).toLowerCase()].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: policy.maxRequests,
  });
}

function clean(value) {
  return String(value || '').trim().slice(0, 180);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_message || 'Provider search failed.');
  return data;
}

function normalize(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(funeral|home|homes|inc|llc|corp|corporation|group)\b/g, '').replace(/\s+/g, ' ').trim();
}

async function partnerFuneralHomeResults(query) {
  if (!admin || !query) return [];
  const selections = [
    'id,name,support_phone,support_email,website,place_id,google_place_id',
    'id,name,support_phone,support_email,website,place_id',
    'id,name,support_phone,support_email,website',
    'id,name',
  ];
  let orgs = [];
  for (const selection of selections) {
    const { data, error } = await admin.from('organizations').select(selection).limit(250);
    if (!error) {
      orgs = data || [];
      break;
    }
  }
  const key = normalize(query);
  return (orgs || [])
    .filter(org => {
      const orgKey = normalize(org.name);
      return orgKey && key && (orgKey.includes(key) || key.includes(orgKey));
    })
    .slice(0, 3)
    .map(org => ({
      source: 'passage_partner',
      organizationId: org.id,
      placeId: org.place_id || org.google_place_id || '',
      name: org.name || 'Passage partner funeral home',
      address: '',
      phone: org.support_phone || '',
      website: org.website || '',
      mapsUrl: '',
      partnerLabel: 'Passage partner',
    }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = clean(req.query.q);
  const kind = clean(req.query.kind);
  const near = clean(req.query.near);
  const limit = await enforceLookupLimit(req, { query, kind, near });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 60));
    return res.status(429).json({ error: 'Too many provider searches. Please wait before searching again.', retryAfterSeconds: limit.retryAfterSeconds });
  }
  const partnerResults = /funeral/i.test(kind || query) ? await partnerFuneralHomeResults(query || kind) : [];
  if (!GOOGLE_KEY) {
    return res.status(200).json({ configured: false, results: partnerResults });
  }

  if (!query && !kind) return res.status(400).json({ error: 'Search term required.' });

  try {
    const searchTerm = [query || kind, near ? `near ${near}` : ''].filter(Boolean).join(' ');
    const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json?' + new URLSearchParams({
      query: searchTerm,
      key: GOOGLE_KEY,
    }).toString();
    const search = await fetchJson(searchUrl);
    const candidates = (search.results || []).slice(0, 4);
    const results = [];

    for (const place of candidates) {
      let details = {};
      if (place.place_id) {
        const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?' + new URLSearchParams({
          place_id: place.place_id,
          fields: 'name,formatted_address,formatted_phone_number,international_phone_number,website,url,place_id',
          key: GOOGLE_KEY,
        }).toString();
        const detailData = await fetchJson(detailsUrl).catch(() => ({}));
        details = detailData.result || {};
      }
      results.push({
        placeId: place.place_id || details.place_id || '',
        name: details.name || place.name || 'Provider',
        address: details.formatted_address || place.formatted_address || '',
        phone: details.formatted_phone_number || details.international_phone_number || '',
        website: details.website || '',
        mapsUrl: details.url || (place.place_id ? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.place_id)}&query=${encodeURIComponent(details.name || place.name || searchTerm)}` : ''),
      });
    }

    const seen = new Set(partnerResults.map(item => normalize(item.name)));
    const merged = partnerResults.concat(results.filter(item => {
      const key = normalize(item.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }));
    return res.status(200).json({ configured: true, results: merged });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Provider search failed.' });
  }
}