'use server';

import { redirect } from 'next/navigation';
import { hasConfiguredOperatorDemoSession } from '@/lib/presentation/operator-demo-availability';
import { createPassageServerClient } from '@/lib/supabase/server';

export type DemoPersona = 'director' | 'staff' | 'vendor';

const demoTargets: Record<DemoPersona, string> = {
  director: '/director',
  staff: '/staff',
  vendor: '/partner',
};

const guidedDemoTargets: Record<DemoPersona, string> = {
  director: '/demo/operator/director',
  staff: '/demo/operator/staff',
  vendor: '/demo/operator/vendor',
};

function demoCredential(persona: DemoPersona) {
  const prefix = `PASSAGE_PREVIEW_DEMO_${persona.toUpperCase()}`;
  return {
    email: process.env[`${prefix}_EMAIL`]?.trim() ?? '',
    password: process.env[`${prefix}_PASSWORD`] ?? '',
  };
}

export async function startPreviewDemo(formData: FormData) {
  const persona = String(formData.get('persona') ?? '') as DemoPersona;
  if (!Object.hasOwn(demoTargets, persona)) redirect('/demo?demo=configuration');
  if (!hasConfiguredOperatorDemoSession(persona)) redirect(guidedDemoTargets[persona]);

  const credential = demoCredential(persona);
  if (!credential.email || credential.password.length < 24) {
    redirect(guidedDemoTargets[persona]);
  }
  let client;
  try {
    client = await createPassageServerClient();
  } catch {
    redirect(guidedDemoTargets[persona]);
  }
  if (!client) redirect(guidedDemoTargets[persona]);

  let signedOut;
  try {
    signedOut = await client.auth.signOut();
  } catch {
    redirect(guidedDemoTargets[persona]);
  }
  if (signedOut.error) redirect(guidedDemoTargets[persona]);

  let result;
  try {
    result = await client.auth.signInWithPassword(credential);
  } catch {
    await bestEffortSignOut(client);
    redirect(guidedDemoTargets[persona]);
  }
  if (result.error) {
    await bestEffortSignOut(client);
    redirect(guidedDemoTargets[persona]);
  }
  if (!result.data.user || result.data.user.email?.toLowerCase() !== credential.email.toLowerCase()) {
    await bestEffortSignOut(client);
    redirect(guidedDemoTargets[persona]);
  }
  redirect(demoTargets[persona]);
}

async function bestEffortSignOut(
  client: NonNullable<Awaited<ReturnType<typeof createPassageServerClient>>>,
) {
  try {
    await client.auth.signOut();
  } catch {
    // The guided fallback opens no protected page and makes no server claim.
  }
}
