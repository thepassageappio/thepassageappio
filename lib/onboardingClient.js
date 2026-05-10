export async function recordOnboardingProgress(supabase, stage, details = {}) {
  if (!supabase?.auth || !stage) return { ok: false, skipped: true };
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return { ok: false, skipped: true };
    const response = await fetch('/api/onboardingProgress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ stage, details }),
    });
    const json = await response.json().catch(() => ({}));
    return { ok: response.ok, ...json };
  } catch (error) {
    console.warn('recordOnboardingProgress:', error);
    return { ok: false, error: error?.message || 'Could not record onboarding progress.' };
  }
}
