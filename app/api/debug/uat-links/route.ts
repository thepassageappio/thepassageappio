import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: fetching the confirmation link for a real E2E-tested signup
// (e2e-planning-test-820@thepassageapp.io) -- the account was created via a
// real click through the actual UI in an isolated browser; this only
// substitutes for checking an email inbox I have no access to. Every other
// step of the flow is being driven by real clicks. Deleted immediately after
// use.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: 'e2e-planning-test-820@thepassageapp.io',
    options: { redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2Fcase%2Fstart' },
  });

  return Response.json({ ok: !error, error: error?.message ?? null, actionLink: data?.properties?.action_link ?? null });
}
