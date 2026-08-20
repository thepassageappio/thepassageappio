import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: verifying the new /director/intake page. Deleted immediately after use.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: 'uat-denial-director-a@thepassageapp.io',
    options: { redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2Fdirector%2Fintake' },
  });

  return Response.json({ ok: !error, error: error?.message ?? null, actionLink: data?.properties?.action_link ?? null });
}
