import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: isolating whether /auth/finish's setSession() failure is
// specific to a churned test account (many sessions generated in quick
// succession) or a real, reproducible bug on a completely clean account.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: 'e2e-clean-test-820b@thepassageapp.io',
    options: { redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2Fcase%2Fstart' },
  });

  return Response.json({ ok: !error, error: error?.message ?? null, actionLink: data?.properties?.action_link ?? null });
}
