export type PassageRuntime = 'demo' | 'preview' | 'production';

export type RuntimeConfiguration = {
  runtime: PassageRuntime | null;
  supabaseUrl: string | null;
  supabasePublishableKey: string | null;
  projectRef: string | null;
  googleAuthEnabled: boolean;
  emailAuthEnabled: boolean;
  passwordAuthEnabled: boolean;
  available: boolean;
  reason: string | null;
};

const runtimeValues = new Set<PassageRuntime>(['demo', 'preview', 'production']);

function projectRefFromUrl(value: string, allowLocal: boolean): string | null {
  try {
    const url = new URL(value);
    if (
      allowLocal
      && url.protocol === 'http:'
      && url.hostname === '127.0.0.1'
      && /^\d{2,5}$/.test(url.port)
      && Number(url.port) > 0
      && Number(url.port) <= 65535
      && !url.username
      && !url.password
      && (url.pathname === '/' || url.pathname === '')
      && !url.search
      && !url.hash
    ) return 'local';

    const suffix = '.supabase.co';
    if (url.protocol !== 'https:' || !url.hostname.endsWith(suffix) || url.port || url.username || url.password) return null;
    const ref = url.hostname.slice(0, -suffix.length);
    return /^[a-z0-9]{20}$/.test(ref) ? ref : null;
  } catch {
    return null;
  }
}

export function getRuntimeConfiguration(): RuntimeConfiguration {
  const rawRuntime = process.env.PASSAGE_RUNTIME;
  const runtime = runtimeValues.has(rawRuntime as PassageRuntime)
    ? rawRuntime as PassageRuntime
    : null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || null;
  const configuredProjectRef = process.env.PASSAGE_SUPABASE_PROJECT_REF?.trim() || null;
  const allowLocal = runtime !== 'production' && process.env.PASSAGE_ALLOW_LOCAL_SUPABASE === 'true';
  const urlProjectRef = supabaseUrl ? projectRefFromUrl(supabaseUrl, allowLocal) : null;
  const googleAuthEnabled = process.env.PASSAGE_GOOGLE_AUTH_ENABLED === 'true';
  const emailAuthEnabled = process.env.PASSAGE_EMAIL_AUTH_ENABLED === 'true';
  const passwordAuthEnabled = process.env.PASSAGE_PREVIEW_PASSWORD_AUTH_ENABLED === 'true'
    && process.env.VERCEL_ENV === 'preview'
    && runtime === 'preview'
    && urlProjectRef === 'uyacxqtsiwlvtmhxvoxr';
  const base = { runtime, supabaseUrl, supabasePublishableKey, projectRef: urlProjectRef, googleAuthEnabled, emailAuthEnabled, passwordAuthEnabled };

  if (process.env.VERCEL_ENV === 'production' && runtime !== 'production') {
    return { ...base, available: false, reason: 'Production runtime configuration is unavailable.' };
  }
  if (process.env.VERCEL_ENV === 'preview' && runtime !== 'preview') {
    return { ...base, available: false, reason: 'Preview runtime configuration is unavailable.' };
  }

  if (!runtime) {
    return { ...base, available: false, reason: 'Passage runtime is not configured.' };
  }
  if (!supabaseUrl || !supabasePublishableKey || !urlProjectRef) {
    return { ...base, available: false, reason: 'Secure sign-in is not configured for this environment.' };
  }
  if (!configuredProjectRef || configuredProjectRef !== urlProjectRef) {
    return { ...base, available: false, reason: 'This environment is not bound to its approved data project.' };
  }

  const expectedRef = runtime === 'production'
    ? process.env.PASSAGE_PRODUCTION_SUPABASE_PROJECT_REF?.trim()
    : process.env.PASSAGE_DEMO_SUPABASE_PROJECT_REF?.trim();

  if (!expectedRef || expectedRef !== urlProjectRef) {
    return { ...base, available: false, reason: runtime === 'production' ? 'Production data binding is unavailable.' : 'The isolated demo data binding is unavailable.' };
  }

  return { ...base, available: true, reason: null };
}

export function publicRuntimeLabel(runtime: PassageRuntime | null) {
  if (runtime === 'demo') return 'Synthetic demo · no external messages';
  if (runtime === 'preview') return 'Isolated preview · no external messages';
  if (runtime === 'production') return 'Production';
  return 'Environment unavailable';
}
