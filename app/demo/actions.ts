'use server';

import { redirect } from 'next/navigation';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';

export type DemoPersona = 'family' | 'director' | 'staff' | 'vendor';

const demoTargets: Record<DemoPersona, string> = {
  family: '/start/next',
  director: '/director',
  staff: '/staff',
  vendor: '/partner',
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
  if (
    !Object.hasOwn(demoTargets, persona)
    || process.env.VERCEL_ENV !== 'preview'
    || process.env.PASSAGE_PREVIEW_DEMO_SESSIONS_ENABLED !== 'true'
    || !configuration.available
    || configuration.runtime !== 'preview'
    || configuration.projectRef !== 'uyacxqtsiwlvtmhxvoxr'
    || !configuration.passwordAuthEnabled
  ) {
    redirect('/?demo=unavailable');
  }

  const credential = demoCredential(persona);
  if (!credential.email || credential.password.length < 24) {
    redirect('/?demo=unavailable');
  }
  const client = await createPassageServerClient();
  if (!client) redirect('/?demo=unavailable');

  await client.auth.signOut();
  const result = await client.auth.signInWithPassword(credential);
  if (result.error || !result.data.user || result.data.user.email?.toLowerCase() !== credential.email.toLowerCase()) {
    await client.auth.signOut();
    redirect('/?demo=unavailable');
  }
  redirect(demoTargets[persona]);
}
