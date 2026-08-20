import type { ReactNode } from 'react';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';
import { TrialBanner } from '@/components/operations/TrialBanner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TrialStatusRow = { is_gated: boolean; is_paid: boolean; trial_ends_at: string | null };

// Only the estate's owner ever sees this -- an invited participant's own
// d2c_trial_status() reflects their own account, not the estate they were
// invited into, so showing it to them would be actively misleading.
export default async function CaseDetailLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await createPassageServerClient();
  const user = client ? await verifiedUser(client) : null;
  let trialStatus: TrialStatusRow | null = null;

  if (client && user) {
    const workflow = await client.from('workflows').select('user_id').eq('id', id).maybeSingle();
    if ((workflow.data as { user_id: string | null } | null)?.user_id === user.id) {
      const result = await client.rpc('d2c_trial_status');
      if (!result.error) trialStatus = (Array.isArray(result.data) ? result.data[0] : result.data) as TrialStatusRow ?? null;
    }
  }

  return (
    <>
      {trialStatus && <TrialBanner context="estate" isGated={trialStatus.is_gated} isPaid={trialStatus.is_paid} trialEndsAt={trialStatus.trial_ends_at} />}
      {children}
    </>
  );
}
