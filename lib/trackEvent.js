export function trackEvent(event, props = {}) {
  if (typeof window === 'undefined' || !event) return;
  const payload = JSON.stringify({
    event,
    path: window.location.pathname + window.location.search,
    source: 'web_app',
    props,
  });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/trackEvent', blob)) return;
    }
  } catch {}
  fetch('/api/trackEvent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
