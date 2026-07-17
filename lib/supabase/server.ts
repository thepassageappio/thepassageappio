
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRuntimeConfiguration } from '@/lib/runtime-config';

export async function createPassageServerClient() {
  const configuration = getRuntimeConfiguration();
  if (!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey) return null;

  const cookieStore = await cookies();
  return createServerClient(configuration.supabaseUrl, configuration.supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. proxy.ts performs refresh writes.
        }
      },
    },
  });
}

