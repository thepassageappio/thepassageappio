
export function safeInternalPath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try {
    const url = new URL(value, 'https://passage.local');
    if (url.origin !== 'https://passage.local') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function loginPath(next: string, error?: string) {
  const params = new URLSearchParams({ next: safeInternalPath(next, '/') });
  if (error) params.set('error', error);
  return `/login?${params.toString()}`;
}

