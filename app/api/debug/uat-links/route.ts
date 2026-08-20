import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: verifying the new custom SMTP config actually sends through
// Resend with Passage branding. Deleted immediately after use.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const { data, error } = await service.auth.admin.inviteUserByEmail(
    'smtp-verify-test@thepassageapp.io',
    { redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2F' },
  );

  return Response.json({ ok: !error, error: error?.message ?? null, userId: data?.user?.id ?? null });
}
