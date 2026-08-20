import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: generates real magic-sign-in links for the [UAT-DENIAL] test
// fixtures so item 8 (browser-level denial matrix) can be run with real
// authenticated sessions instead of SQL simulation. Deleted immediately
// after use.
const IDENTITIES: { email: string; next: string }[] = [
  { email: 'uat-denial-director-a@thepassageapp.io', next: '/director' },
  { email: 'uat-denial-staff-a@thepassageapp.io', next: '/staff' },
  { email: 'uat-denial-director-b@thepassageapp.io', next: '/director' },
  { email: 'uat-denial-staff-b@thepassageapp.io', next: '/staff' },
];

export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const results = [];
  for (const identity of IDENTITIES) {
    const { data, error } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: identity.email,
      options: { redirectTo: `https://www.thepassageapp.io/auth/finish?next=${encodeURIComponent(identity.next)}` },
    });
    results.push({
      email: identity.email,
      ok: !error,
      errorMessage: error?.message ?? null,
      errorName: error?.name ?? null,
      errorStatus: error?.status ?? null,
      errorCode: error?.code ?? null,
      errorFull: error ? JSON.stringify(Object.getOwnPropertyNames(error).reduce((acc, k) => ({ ...acc, [k]: (error)[k] }), {})) : null,
      actionLink: data?.properties?.action_link ?? null,
    });
  }
  return Response.json({ ok: true, results });
}
