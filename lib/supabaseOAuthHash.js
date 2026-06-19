export async function consumeSupabaseOAuthHash(supabase) {
  if (typeof window === 'undefined' || !supabase?.auth) return null;
  const rawHash = String(window.location.hash || '');
  if (!rawHash || !rawHash.includes('access_token=')) return null;

  const params = new URLSearchParams(rawHash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken || typeof supabase.auth.setSession !== 'function') {
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  if (error) throw error;
  return data?.session || null;
}

export function destinationWithoutHash(destination) {
  if (typeof window === 'undefined') return destination || '/';
  const url = new URL(destination || '/', window.location.origin);
  url.hash = '';
  return url.toString();
}
