const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function clean(value) {
  return String(value || '').trim().slice(0, 180);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_message || 'Provider search failed.');
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!GOOGLE_KEY) {
    return res.status(200).json({ configured: false, results: [] });
  }

  const query = clean(req.query.q);
  const kind = clean(req.query.kind);
  const near = clean(req.query.near);
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

    return res.status(200).json({ configured: true, results });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Provider search failed.' });
  }
}
