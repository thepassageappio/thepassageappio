'use server';

import { redirect } from 'next/navigation';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
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
  const configuration = getRuntimeConfiguration();
  if (!Object.hasOwn(demoTargets, persona)) redirect('/demo?demo=configuration');
  if (
    process.env.VERCEL_ENV !== 'preview'
    || process.env.PASSAGE_PREVIEW_DEMO_SESSIONS_ENABLED !== 'true'
    || !configuration.available
    || configuration.runtime !== 'preview'
    || configuration.projectRef !== 'uyacxqtsiwlvtmhxvoxr'
    || !configuration.passwordAuthEnabled
  ) {
    redirect(guidedDemoTargets[persona]);
  }

  const credential = demoCredential(persona);
  if (!credential.email || credential.password.length < 24) {
    redirect(guidedDemoTargets[persona]);
  }
  let client;
  try {
    client = await createPassageServerClient();
  } catch {
    redirect('/demo?demo=configuration');
  }
  if (!client) redirect('/demo?demo=configuration');

  const signedOut = await client.auth.signOut();
  if (signedOut.error) redirect('/demo?demo=signout');

  let result;
  try {
    result = await client.auth.signInWithPassword(credential);
  } catch {
    redirect('/demo?demo=signin');
  }
  if (result.error) {
    await client.auth.signOut();
    redirect('/demo?demo=signin');
  }
  if (!result.data.user || result.data.user.email?.toLowerCase() !== credential.email.toLowerCase()) {
    await client.auth.signOut();
    redirect('/demo?demo=identity');
  }
  redirect(demoTargets[persona]);
}
