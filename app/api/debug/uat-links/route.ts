import { createPassageServiceClient } from '@/lib/supabase/service';

// TEMPORARY: verifying the new D2C trial banner (app/case/[id]/layout.tsx).
// Deleted immediately after use.
export async function GET() {
  const service = createPassageServiceClient();
  if (!service) return Response.json({ ok: false, error: 'service client unavailable' });

  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: 'uat-d2c-banner-owner@thepassageapp.io',
    options: { redirectTo: 'https://www.thepassageapp.io/auth/finish?next=%2Fcase%2F1a99a781-9a81-4632-b193-2b81671ef252%2Ftoday' },
  });

  return Response.json({ ok: !error, error: error?.message ?? null, actionLink: data?.properties?.action_link ?? null });
}
