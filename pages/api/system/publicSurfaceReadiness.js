import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const GOOGLE_ADDRESS_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const EXPECTED_COMMIT = process.env.VERCEL_GIT_COMMIT_SHA || '';

const publicChecks = [
  {
    path: '/',
    requires: ['Open sample case', 'Start urgent path', 'Plan ahead'],
  },
  {
    path: '/funeral-home',
    requires: ['A calmer way to keep families and staff aligned.', 'Open sample case', 'Customer login'],
  },
  {
    path: '/funeral-home/login',
    requires: ['Customers sign in. Prospects learn or book a demo.', 'Customer login', 'New customer workspace', 'Learn functionality'],
  },
  {
    path: '/funeral-home/sample-case',
    requires: ['Show one family case from intake to proof.', 'Case clarity', 'How the workspace helps'],
  },
  {
    path: '/funeral-home/workspace-demo',
    requires: ['Sample funeral-home workspace', 'What opens after sign-in', 'Staff queue showing who owns what'],
  },
  {
    path: '/care-providers',
    requires: ['Help families leave care with a clearer next step.', 'Start partner inquiry', 'Purpose of this page', 'not an operating dashboard'],
  },
  {
    path: '/vendors',
    requires: ['Apply to join', 'Vendor owner sign in', 'Vendor employee sign in'],
  },
  {
    path: '/participants',
    requires: ['Help with one clear request', 'Participant sign in', 'Open your assigned request'],
  },
  {
    path: '/participating?demo=1',
    requires: ['Private family request', 'Open the family request assigned to you.', 'Best next step', 'What gets saved'],
  },
  {
    path: '/share?dn=Eleanor%20Price&cn=Price%20family',
    requires: ['Service and gathering details', 'This output is saved as family-record proof'],
  },
  {
    path: '/vendors/request?demo=1',
    requires: ['Sample scoped vendor request', 'One request, not a family file.', 'Simple request path'],
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
  'System admin',
  'Roadmap',
  'QA checklist',
  'Pilot health',
  'ARR math',
  'ARR target',
  'ARR path',
  '$300k',
  '300k',
  'Sprint 2',
  'Sprint 3',
  'Sprint 4',
  'paid-pilot',
  'paid fit',
  'paid-fit',
  'pilot proof loop',
  'tracked internally',
  'sales and QA',
  'conversion decision',
  'scale outreach',
  'owner-only',
  'owner only',
  'founder narration',
  'internal roadmap',
  'Internal note',
  'source of truth',
  'assigned task spine',
  'task spine',
  'case spine',
  'coordination spine',
  'Simple request spine',
  'Proof console',
  'proof console',
  'funeral-home console',
  'sample funeral-home console',
  'Spine',
  'Proof and notify',
  'Tracked platform fee',
  'Funeral home share:',
  'Passage share:',
  'admin walkthrough',
  'Proof / reporting',
  '? loved beyond measure',
  'source of truth for P0',
  'DEMO DATA - FOR DEMONSTRATION ONLY',
  'Says:',
  'Say:',
  'support email loading',
  'green path',
  'red path',
  'yellow path',
  'green_path',
  'red_path',
  'yellow_path',
  'launch grade',
  'pilot conversion',
  'New partner',
  'Private partner workspace',
];

const forbiddenPublicMarkup = [
  'partner_pilot',
  'partner-pilot',
  'pilot-proof',
  'pilot_proof',
  'paid-pilot',
  'paid_pilot',
  'utm_campaign=partner-pilot',
  'utm_campaign=funeral-home-partner-pilot',
  'utm_campaign=pilot-proof',
  'utm_campaign=pilot-walkthrough',
];

const personaSourceChecks = [
  {
    path: 'components/App.js',
    label: 'Family homepage and dashboard source',
    requires: ['Open sample case', 'Start urgent path', 'Prepare during care', 'Plan ahead', 'One family record', 'Active plan', 'Who owns each next step', 'Prepared output'],
    forbids: ['Plan ahead ???', 'Active plan ???', ' ?? Proof: ', 'Task output', 'Who owns each task', 'Coordinate people, tasks, and messages ??? all in one place.', '???', 'Open sample funeral-home console', 'Spine Journey Providers Lifecycle'],
  },
  {
    path: 'pages/funeral-home/dashboard.js',
    label: 'Funeral-home dashboard source',
    requires: ['Recommended next action', '1. Do next:', 'Message to send or use', 'Waiting on', 'Save proof', 'partnerPlanDisplayName'],
    forbids: ['First-day pilot setup', 'Start pilot billing', 'Pilot-safe', 'pilot controls', 'partner spine', 'Billing: ${partnerPlan.plan}', 'Task / request', 'Proof loop', 'Task action'],
  },
  {
    path: 'pages/participating.js',
    label: 'Participant request source',
    requires: ['Open the family request assigned to you.', 'Your one request', 'Action needed', 'Waiting on', 'Status and proof', 'Access boundary'],
    forbids: ['Task response', 'task the family assigned to you', 'assigned tasks', 'more tasks assigned to you', 'Respond to assigned task', 'task status', 'The task stays open', 'keeps the task open', 'keeps the task visible'],
  },
  {
    path: 'pages/vendors/onboard.js',
    label: 'Vendor onboarding source',
    requires: ['Required: business name, service ZIPs, and email', 'Add business name, service ZIPs, and email to submit', 'Recommended next action: book a vendor conversation', 'Nothing appears to families until Passage approves the partner'],
    forbids: ['marketplace fee', 'public marketplace inbox', 'browse family records'],
  },
  {
    path: 'pages/vendors/request.js',
    label: 'Vendor request source',
    requires: ['Sample scoped vendor request', 'One request, not a family file.', 'Simple request path', 'Action needed', 'Waiting on', 'Status and proof'],
    forbids: ['family case and task', 'scoped task requests', 'task spine'],
  },
  {
    path: 'components/CareProviderLanding.js',
    label: 'Care-provider source',
    requires: ['Help families leave care with a clearer next step.', 'Purpose of this page', 'not an operating dashboard', 'Partner inquiry', 'Add organization name and contact email to send the inquiry', 'Recommended next action: book a short walkthrough', 'Family owned', 'Scoped access', 'Proof based'],
    forbids: ['task outcomes', 'operating dashboard', 'partner spine'],
  },
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

async function readSourceText(relativePath) {
  const normalized = String(relativePath || '').replace(/^[\/]+/, '');
  if (!normalized || normalized.includes('..')) throw new Error('Invalid source path.');
  const ref = EXPECTED_COMMIT || 'main';
  const url = `https://raw.githubusercontent.com/thepassageappio/thepassageappio/${ref}/${normalized}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Source fetch returned ${response.status}.`);
  return response.text();
}

async function runPersonaSourceChecks() {
  return Promise.all(personaSourceChecks.map(async check => {
    try {
      const source = await readSourceText(check.path);
      const missing = check.requires.filter(item => !source.includes(item));
      const forbidden = check.forbids.filter(item => source.includes(item));
      return {
        type: 'source',
        path: check.path,
        label: check.label,
        ok: missing.length === 0 && forbidden.length === 0,
        missing,
        forbidden,
      };
    } catch (error) {
      return {
        type: 'source',
        path: check.path,
        label: check.label,
        ok: false,
        missing: check.requires,
        forbidden: [],
        error: error.message || 'Source check failed.',
      };
    }
  }));
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
      const releaseCommit = response.headers.get('x-passage-commit') || '';
      const releaseMismatch = Boolean(EXPECTED_COMMIT && releaseCommit !== EXPECTED_COMMIT);
      const missing = check.requires.filter(item => !text.includes(item));
      const lowerText = text.toLowerCase();
      const lowerHtml = html.toLowerCase();
      const forbiddenText = forbiddenPublicText.filter(item => lowerText.includes(item.toLowerCase()));
      const forbiddenMarkup = forbiddenPublicMarkup.filter(item => lowerHtml.includes(item.toLowerCase()));
      const forbidden = [...new Set([...forbiddenText, ...forbiddenMarkup])];
      results.push({
        path: check.path,
        url,
        status: response.status,
        ok: response.ok && missing.length === 0 && forbidden.length === 0 && !releaseMismatch,
        missing,
        forbidden,
        releaseCommit,
        expectedCommit: EXPECTED_COMMIT,
        releaseMismatch,
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

  const sourceResults = await runPersonaSourceChecks();
  const allResults = [...results, ...sourceResults];

  const blockers = allResults
    .filter(result => !result.ok)
    .flatMap(result => {
      const notes = [];
      if (result.status < 200 || result.status >= 400) notes.push(`${result.path} returned ${result.status || 'no response'}.`);
      if (result.missing?.length) notes.push(`${result.path} is missing: ${result.missing.join(', ')}.`);
      if (result.forbidden?.length) notes.push(`${result.path} contains forbidden public/persona copy: ${result.forbidden.join(', ')}.`);
      if (result.releaseMismatch) notes.push(`${result.path} is not serving the current deployment. Expected ${result.expectedCommit || "current commit"}, got ${result.releaseCommit || "no X-Passage-Commit header"}.`);
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
    sourceResults,
    release: {
      expectedCommit: EXPECTED_COMMIT,
      checkedSite: SITE_URL,
    },
    integrations: {
      googleAddressAutocomplete: Boolean(GOOGLE_ADDRESS_KEY),
    },
    blockers,
  });
}