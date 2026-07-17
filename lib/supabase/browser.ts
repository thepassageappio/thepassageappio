
'use client';

import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getPassageBrowserClient(url: string, publishableKey: string) {
  browserClient ??= createBrowserClient(url, publishableKey);
  return browserClient;
}

