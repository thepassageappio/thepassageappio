import { redirect } from 'next/navigation';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Landing point for a D2C subscriber: the redirectTo target of the invite
// email sent by provisionD2cFamilyRecordIfNeeded, and the link
// /pricing/success now points to. Resolves the signed-in user's own family
// record and sends them straight there -- no id to remember or type in.
export default async function CaseIndexPage() {
  const client = await createPassageServerClient();
  if (!client) redirect('/');
  const user = await verifiedUser(client);
  if (!user) redirect(loginPath('/case'));

  const { data } = await client.from('workflows').select('id').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
  const workflow = data as { id: string } | null;
  if (workflow) redirect(`/case/${workflow.id}/today`);

  // Signed in, no family record yet -- most often a legacy subscriber from
  // before auto-provisioning existed. /case/start checks their subscription
  // and either lets them create their record or sends them to /pricing --
  // never assume "no record" means "never paid."
  redirect('/case/start');
}
