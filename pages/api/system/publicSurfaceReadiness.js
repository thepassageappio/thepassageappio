import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const GOOGLE_ADDRESS_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const publicChecks = [
  {
    path: '/',
    requires: ['Open sample funeral-home console', 'Start urgent path', 'Plan ahead'],
  },
  {
    path: '/funeral-home',
    requires: ['Open sample console', 'Director sign in', 'Book a pilot walkthrough'],
  },
  {
    path: '/vendors',
    requires: ['Apply to join', 'Vendor owner sign in', 'Vendor employee sign in'],
  },
  {
    path: '/participants',
    requires: ['Participant sign in', 'Open your assigned request'],
  },
  {
    path: '/pricing',
    requires: ['Get help now', '$79'],
  },
  {
    path: '/contact',
    requires: ['Submit inquiry'],
  },
  {
    path: '/blog',
    requires: ['Your Loved One Had 47 Passwords. Now What?'],
  },
];

const forbiddenPublicText = [
  'b2b fishing',
  'fishing rods',
  'Live scaffold',
  'Admin roadmap',
  'source of truth for P0',
  'DEMO DATA - FOR DEMONSTRATION ONLY',
  'Says:',
  'Say:',
  'support email loading',
  'green path',
  'red path',
  'yellow path',
];

async function requireSystemAccess(req) {
  const internal = await verifyDeliveryRequest(req);
  if (internal.ok && internal.source === 'internal') return { ok: true, source: 'internal' };

  if (!authClient) return { ok: false, status: 500, error: 'Supabase auth is not configured.' };
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await authClient.auth.getUser(token);
  const email = String(data?.user?.email || '').toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'System admin access required.' };
  return { ok: true, source: 'admin', user: data.user };
}

function visibleText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const results = [];
  for (const check of publicChecks) {
    const url = `${SITE_URL}${check.path}`;
    try {
      const response = await fetch(url, { redirect: 'follow' });
      const html = await response.text();
      const text = visibleText(html);
      const missing = check.requires.filter(item => !text.includes(item));
      const forbidden = forbiddenPublicText.filter(item => text.toLowerCase().includes(item.toLowerCase()));
      results.push({
        path: check.path,
        url,
        status: response.status,
        ok: response.ok && missing.length === 0 && forbidden.length === 0,
        missing,
        forbidden,
      });
    } catch (error) {
      results.push({
        path: check.path,
        url,
        status: 0,
        ok: false,
        missing: check.requires,
        forbidden: [],
        error: error.message || 'Public page check failed.',
      });
    }
  }

  const blockers = results
    .filter(result => !result.ok)
    .flatMap(result => {
      const notes = [];
      if (result.status < 200 || result.status >= 400) notes.push(`${result.path} returned ${result.status || 'no response'}.`);
      if (result.missing?.length) notes.push(`${result.path} is missing: ${result.missing.join(', ')}.`);
      if (result.forbidden?.length) notes.push(`${result.path} contains forbidden public copy: ${result.forbidden.join(', ')}.`);
      if (result.error) notes.push(`${result.path}: ${result.error}`);
      return notes;
    });

  if (!GOOGLE_ADDRESS_KEY) {
    blockers.push('Google address autocomplete is not configured. Add GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in Vercel production.');
  }

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: blockers.length ? 'needs_work' : 'ready',
    results,
    integrations: {
      googleAddressAutocomplete: Boolean(GOOGLE_ADDRESS_KEY),
    },
    blockers,
  });
}
