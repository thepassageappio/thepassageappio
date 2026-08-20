import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY diagnostic route -- exercises the exact same
// service.auth.admin.inviteUserByEmail call the Stripe webhook uses, to
// confirm the corrected SUPABASE_SERVICE_ROLE_KEY actually works before
// spending another real payment on an end-to-end test. Deleted immediately
// after use, not meant to ship.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, step: 'client', error: 'service client unavailable (missing env vars)' });

  const testEmail = `steventurrisi+servicerolecheck${Date.now()}@gmail.com`;
  const { data, error } = await service.auth.admin.inviteUserByEmail(testEmail, {
    redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2Fcase',
  });

  if (error) {
    return Response.json({ ok: false, step: 'inviteUserByEmail', errorMessage: error.message, status: error.status, code: error.code ?? null });
  }
  return Response.json({ ok: true, userId: data.user?.id ?? null, testEmail });
}
