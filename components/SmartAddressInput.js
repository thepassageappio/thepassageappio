import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_COLORS = {
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  card: '#fff',
  bg: '#f6f3ee',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
};

const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b/i;

export function parseAddressText(value = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  const postalMatch = text.match(/\b\d{5}(?:-\d{4})?\b/);
  const stateMatch = text.match(statePattern);
  const parts = text.split(',').map(part => part.trim()).filter(Boolean);
  const state = stateMatch ? stateMatch[1].toUpperCase() : '';
  const postalCode = postalMatch ? postalMatch[0] : '';
  let city = '';
  if (parts.length >= 2) {
    const stateIndex = parts.findIndex(part => state && new RegExp(`\\b${state}\\b`, 'i').test(part));
    if (stateIndex > 0) city = parts[stateIndex - 1];
    else if (parts.length >= 3) city = parts[parts.length - 3];
  }
  const street = parts.length > 1 ? parts[0] : '';
  return {
    formattedAddress: text,
    street,
    city,
    state,
    postalCode,
    country: /\bcanada\b/i.test(text) ? 'CA' : /\b(united states|usa|u\.s\.)\b/i.test(text) ? 'US' : '',
  };
}

export function parseGooglePlaceAddress(place) {
  const parts = {};
  (place?.address_components || []).forEach((component) => {
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
    placeName: place?.name || '',
    placeId: place?.place_id || '',
    formattedAddress: place?.formatted_address || '',
    street: [parts.streetNumber, parts.route].filter(Boolean).join(' '),
    city: parts.city || '',
    state: parts.state || '',
    stateName: parts.stateName || '',
    postalCode: parts.postalCode || '',
    country: parts.country || '',
  };
}

function loadGooglePlaces(callback) {
  if (typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return;
  if (window.google?.maps?.places) {
    callback();
    return;
  }
  const existing = document.getElementById('passage-google-places');
  if (existing) {
    existing.addEventListener('load', callback, { once: true });
    setTimeout(callback, 700);
    return;
  }
  const script = document.createElement('script');
  script.id = 'passage-google-places';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
  script.async = true;
  script.onload = callback;
  document.head.appendChild(script);
}

export default function SmartAddressInput({
  label,
  value,
  onChange,
  onAddress,
  placeholder = 'Start typing an address or place',
  colors = DEFAULT_COLORS,
  inputStyle = {},
  compact = false,
  hint,
}) {
  const C = { ...DEFAULT_COLORS, ...colors };
  const [parsed, setParsed] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [lookupState, setLookupState] = useState('idle');
  const [open, setOpen] = useState(false);
  const latestLookup = useRef(0);
  const hasPlacesKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const inputRef = useCallback((node) => {
    if (!node || node.dataset.passageAddressAttached) return;
    loadGooglePlaces(() => {
      if (!window.google?.maps?.places || node.dataset.passageAddressAttached) return;
      node.dataset.passageAddressAttached = 'true';
      const autocomplete = new window.google.maps.places.Autocomplete(node, {
        types: ['establishment', 'geocode'],
        fields: ['address_components', 'formatted_address', 'name', 'place_id'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const next = parseGooglePlaceAddress(place);
        setParsed(next);
        onChange?.(next.formattedAddress || next.placeName || node.value, next);
        onAddress?.(next);
      });
    });
  }, [onAddress, onChange]);

  useEffect(() => {
    const query = String(value || '').trim();
    if (hasPlacesKey || query.length < 3) {
      setSuggestions([]);
      setLookupState('idle');
      return undefined;
    }
    const lookupId = Date.now();
    latestLookup.current = lookupId;
    setLookupState('loading');
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/addressAutocomplete?q=' + encodeURIComponent(query));
        const json = await response.json().catch(() => ({}));
        if (latestLookup.current !== lookupId) return;
        if (!response.ok || json.configured === false) {
          setSuggestions([]);
          setLookupState(json.configured === false ? 'not_configured' : 'error');
          return;
        }
        setSuggestions(json.predictions || []);
        setLookupState((json.predictions || []).length ? 'ready' : 'empty');
        setOpen(true);
      } catch (_error) {
        if (latestLookup.current !== lookupId) return;
        setSuggestions([]);
        setLookupState('error');
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [hasPlacesKey, value]);

  const chips = useMemo(() => {
    const data = parsed || parseAddressText(value);
    return [
      data.city,
      data.state,
      data.postalCode,
      data.country,
    ].filter(Boolean);
  }, [parsed, value]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    const nextParsed = parseAddressText(nextValue);
    setParsed(nextParsed);
    setOpen(true);
    onChange?.(nextValue, nextParsed);
    onAddress?.(nextParsed);
  };

  const chooseSuggestion = async (suggestion) => {
    if (!suggestion?.placeId) return;
    setOpen(false);
    setLookupState('loading');
    try {
      const response = await fetch('/api/addressAutocomplete?placeId=' + encodeURIComponent(suggestion.placeId));
      const json = await response.json().catch(() => ({}));
      const next = json.address || parseAddressText(suggestion.description);
      setParsed(next);
      setSuggestions([]);
      setLookupState('selected');
      onChange?.(next.formattedAddress || suggestion.description, next);
      onAddress?.(next);
    } catch (_error) {
      const fallback = parseAddressText(suggestion.description);
      setParsed(fallback);
      setLookupState('error');
      onChange?.(suggestion.description, fallback);
      onAddress?.(fallback);
    }
  };

  return (
    <div style={{ display: 'grid', gap: compact ? 4 : 6, position: 'relative' }}>
      {label && <label style={{ fontSize: compact ? 9.8 : 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</label>}
      <input
        ref={inputRef}
        type="text"
        autoComplete="street-address"
        value={value || ''}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `1.5px solid ${C.border}`,
          borderRadius: compact ? 10 : 11,
          background: C.card,
          padding: compact ? '8px 10px' : '11px 12px',
          color: C.ink,
          fontFamily: 'Georgia,serif',
          fontSize: compact ? 13 : 14,
          outline: 'none',
          ...inputStyle,
        }}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 40, left: 0, right: 0, top: label ? (compact ? 62 : 74) : (compact ? 38 : 47), background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 14px 34px rgba(55,45,35,.16)', overflow: 'hidden' }}>
          {suggestions.map((suggestion) => (
            <button key={suggestion.placeId} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(suggestion)} style={{ width: '100%', border: 'none', borderBottom: `1px solid ${C.border}`, background: C.card, color: C.ink, padding: compact ? '9px 10px' : '11px 12px', textAlign: 'left', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              <span style={{ display: 'block', fontSize: compact ? 12.5 : 13.5, fontWeight: 900, lineHeight: 1.25 }}>{suggestion.mainText || suggestion.description}</span>
              {suggestion.secondaryText && <span style={{ display: 'block', color: C.mid, fontSize: compact ? 11 : 12, lineHeight: 1.35, marginTop: 2 }}>{suggestion.secondaryText}</span>}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ color: C.soft, fontSize: compact ? 10.5 : 11 }}>
          {hint || (hasPlacesKey ? 'Choose a suggestion to fill city, state, ZIP, and country.' : lookupState === 'loading' ? 'Checking address suggestions. Typed addresses still parse city, state, and ZIP.' : lookupState === 'not_configured' ? 'Typed addresses still parse city, state, and ZIP. Google suggestions need a server key.' : lookupState === 'error' ? 'Address suggestions are unavailable right now; typed addresses still parse city, state, and ZIP.' : 'Type the address here. Suggestions appear when the Google address key is configured; typed addresses still parse city, state, and ZIP.')}
        </span>
        {chips.map(chip => (
          <span key={chip} style={{ border: `1px solid ${C.sage}22`, background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '2px 7px', fontSize: 10.5, fontWeight: 900 }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
