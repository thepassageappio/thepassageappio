import 'server-only';
import { getRuntimeConfiguration } from '@/lib/runtime-config';

export type OperatorDemoPersona = 'director' | 'staff' | 'vendor';

export function hasConfiguredOperatorDemoSession(persona: OperatorDemoPersona) {
  const configuration = getRuntimeConfiguration();
  const prefix = `PASSAGE_PREVIEW_DEMO_${persona.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`]?.trim() ?? '';
  const password = process.env[`${prefix}_PASSWORD`] ?? '';

  return process.env.VERCEL_ENV === 'preview'
    && process.env.PASSAGE_PREVIEW_DEMO_SESSIONS_ENABLED === 'true'
    && configuration.available
    && configuration.runtime === 'preview'
    && configuration.projectRef === 'uyacxqtsiwlvtmhxvoxr'
    && configuration.passwordAuthEnabled
    && email.length > 0
    && password.length >= 24;
}

export function hasConfiguredOperatorDemoSessions() {
  return (['director', 'staff', 'vendor'] as const).every(hasConfiguredOperatorDemoSession);
}
