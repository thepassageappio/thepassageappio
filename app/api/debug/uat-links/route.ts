import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: one more fresh magic link for uat-denial-staff-b, the last
// remaining leg of item 8's staff-side verification. Deleted immediately
// after use.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: 'uat-denial-staff-b@thepassageapp.io',
    options: { redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2Fstaff' },
  });

  return Response.json({ ok: !error, error: error?.message ?? null, actionLink: data?.properties?.action_link ?? null });
}
