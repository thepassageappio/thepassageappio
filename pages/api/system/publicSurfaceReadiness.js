import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const GOOGLE_ADDRESS_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
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
    forbids: ['Task action', 'task outcomes'],
  },
  {
    path: '/funeral-home/workspace-demo',
    requires: ['Sample funeral-home workspace', 'What opens after sign-in', 'Staff queue showing who owns what', 'Work card contract'],
    forbids: ['Task card contract', 'Every task card', 'Task action', 'task outcomes'],
  },
  {
    path: '/care-providers',
    requires: ['Help families leave care with a clearer next step.', 'Start care-team inquiry', 'Purpose of this page', 'not an operating dashboard'],
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
    forbids: ['family or funeral home accepts it', 'Viewed, accepted'],
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
    path: 'lib/vendorLifecycle.js',
    label: 'Vendor lifecycle wording source',
    requires: ['Quote Approved', 'Quote approved. Payment checkout is the next step.', 'approve and pay'],
    forbids: ['Family Accepted', 'Family accepted the quote', 'accept and pay'],
  },
  {
    path: 'pages/funeral-home/sample-case.js',
    label: 'Funeral-home sample case wording source',
    requires: ['Work action', 'work outcomes'],
    forbids: ['Task action', 'task outcomes'],
  },
  {
    path: 'lib/communicationEvents.js',
    label: 'Communication event wording source',
    requires: ['Work assigned', 'Work updated', 'Work needs help', 'Work status updated'],
    forbids: ['Task assigned', 'Task updated', 'Task needs help', 'Task status updated'],
  },
  {
    path: 'pages/api/partnerHandleTask.js',
    label: 'Funeral-home work update API wording',
    requires: ['Work needs help', 'Work waiting', 'Work handled', 'funeral-home case', 'Needs-help note saved'],
    forbids: ['Task needs help', 'Task waiting', 'Task handled', 'partner case', 'Blocker saved', 'retry this task action'],
  },
  {
    path: 'pages/api/tasks/[id]/assign.js',
    label: 'Next-step assignment API wording',
    requires: ['Next-step owner', 'Next step not found', 'family record'],
    forbids: ['Task owner', 'Task not found', 'task spine'],
  },
  {
    path: 'pages/api/tasks/[id]/reminder.js',
    label: 'Reminder API wording',
    requires: ['Reminder: Passage request waiting for you', 'own the request, mark it done', 'family record'],
    forbids: ['Reminder: Passage task waiting for you', 'task spine'],
  },
  {
    path: 'pages/api/tasks/[id]/send.js',
    label: 'Request send API wording',
    requires: ['request handoff', 'family record'],
    forbids: ['task handoff', 'task spine', 'duplicate task'],
  },
  {
    path: 'pages/api/tasks/[id]/status.js',
    label: 'Work status API wording',
    requires: ['Work update', 'Work item not found', 'needs-help note', 'Work event'],
    forbids: ['Task update', 'Task not found', 'blocker note', 'Task spine event'],
  },
  {
    path: 'pages/api/vendorRequests/create.js',
    label: 'Vendor request create API wording',
    requires: ['what you own', 'Send quote or own request', 'Save completion proof', 'Saved in Passage', 'Choose a valid request update'],
    forbids: ['what you accepted', 'Accept or send quote', 'Mark completed', 'Saved to the spine', 'Invalid request status', 'This vendor does not match this task'],
  },
  {
    path: 'lib/taskActions.js',
    label: 'Shared action confirmation source',
    requires: ['own this next step', 'Proof saved. This next step is marked done.', 'own this request', 'accepted a request'],
    forbids: ['own this task', 'This task is marked done', 'accepted a task', 'handled a task', 'marked a task waiting', 'updated a task', "normalized === 'acknowledged'"],
  },
  {
    path: 'lib/taskWorkspace.js',
    label: 'Shared workspace wording source',
    requires: ['Prepared output and proof trail', 'Prepared output, next action, owner, and proof.', 'proof panel'],
    forbids: ['Prepared task output', 'Task output and proof trail', 'before the task is closed', 'task proof panel', 'keep the task waiting', 'Task execution packet'],
  },
  {
    path: 'lib/communicationCenter.js',
    label: 'Shared communication wording source',
    requires: ['Accept the request, mark it done', 'tell the coordinator what is needed', 'work item remains the source of truth', 'proof stays on the scoped request'],
    forbids: ['Accept it, mark it done', 'what is blocking you', 'unblock', 'record the blocker', 'Waiting for an owner', 'task remains the source of truth', 'proof stays on the task'],
  },
  {
    path: 'components/SiteChrome.js',
    label: 'Shared navigation source',
    requires: ['showSystemAdminLink', 'system_admin_action_clicked', '>Admin</Link>', ': PUBLIC_LINKS'],
    forbids: ["? [...PUBLIC_LINKS, ['System admin', '/system/admin']]", 'Roadmap', 'QA checklist', 'Pilot health', 'Abuse controls'],
  },
  {
    path: 'components/App.js',
    label: 'Family homepage and dashboard source',
    requires: ['Open sample case', 'Start urgent path', 'Prepare during care', 'Plan ahead', 'One family record', 'Active plan', 'Who owns each next step', 'Prepared output', "You've been asked to handle a next step", 'Handoff ready', 'Same family record across planning, urgent help, funeral-home handoffs, and participant views.', 'own this next step', 'family-record work connected to you'],
    forbids: ['Plan ahead ???', 'Active plan ???', ' ?? Proof: ', 'Task output', 'Who owns each task', 'Coordinate people, tasks, and messages ??? all in one place.', '???', 'Open sample funeral-home console', 'Spine Journey Providers Lifecycle', "You've been assigned a task", 'estate task in Passage', 'accept the task', 'task details', 'Partner ready', 'partner dashboard', 'assigned a task', 'estate task plan', 'real estate tasks later', 'Same record across planning, urgent, partner, and participant views.', 'characters ??', ' tasks</div>', 'pd.label} ??', "label: 'Tasks'"],
  },
  {
    path: 'pages/funeral-home/workspace-demo.js',
    label: 'Funeral-home workspace demo source',
    requires: ['Sample funeral-home workspace', 'Work card contract', 'Work action', 'work outcomes'],
    forbids: ['Task card contract', 'Every task card', 'Task action', 'task outcomes'],
  },
  {
    path: 'pages/funeral-home/dashboard.js',
    label: 'Funeral-home dashboard source',
    requires: ['Recommended next action', '1. Do next:', 'Message to send or use', 'Waiting on', 'Save proof', 'partnerPlanDisplayName'],
    forbids: ['First-day pilot setup', 'Start pilot billing', 'Pilot-safe', 'pilot controls', 'partner spine', 'Billing: ${partnerPlan.plan}', 'Task / request', 'Proof loop', 'Task action', 'Open tasks', 'Waiting tasks', 'Handled tasks', 'Demo proof saved. The task', 'Could not update this task.', 'Could not assign this task.', 'task owner', 'task notification', 'demo task', 'Partner task owner', 'each task', '0 tasks need an owner', 'Only open tasks', 'open partner task', 'close tasks', 'Scoped to the task', 'Close task with this proof', 'Update partner task', 'closes the task', 'close the task', 'Task status', 'tasks are assigned', 'Partner invite opened', 'partner dashboard', 'partner account', 'partner workspace', 'Partner dashboard', 'Partner setup path', 'Partner account setup', 'Preferred in tasks', 'Create partner workspace', 'partner case', 'partner queue', 'partner case list', 'partner setup and reporting', 'partner action', 'Quote accepted', 'Trial plan', 'Trial/demo visible'],
  },
  {
    path: 'pages/funeral-home/setup.js',
    label: 'Funeral-home setup source',
    requires: ['Funeral-home setup', 'Recommended next action', 'Add required info: funeral-home name and main location address.', 'First next-step owner', 'work outcome'],
    forbids: ['Partner setup', 'First task owner', 'task outcome', 'Could not create the partner dashboard.'],
  },
  {
    path: 'pages/participants.js',
    label: 'Participant landing source',
    requires: ['You open one clear request', 'Passage shows what is needed', 'Own the request, ask for help, show what is waiting, save a note, or mark done with proof.'],
    forbids: ['Passage shows the task', 'Accept it, ask for help'],
  },
  {
    path: 'pages/api/participantAction.js',
    label: 'Participant action API wording',
    requires: ['accepted this request', 'needs help with this request', 'updated this request', 'Request: <strong', 'No matching request found', 'Assigned request', 'proof or needs-help note'],
    forbids: ['accepted this task', 'needs help with this task', 'updated this task', 'Task: <strong', 'task updated', 'No matching task found', 'Assigned task', 'proof or blocker note'],
  },
  {
    path: 'pages/participating.js',
    label: 'Participant request source',
    requires: ['Open the family request assigned to you.', 'Your one request', 'Action needed', 'Waiting on', 'Status and proof', 'Access boundary', 'Choose I own this if you can help', 'Respond to your request'],
    forbids: ['Task response', 'task the family assigned to you', 'assigned tasks', 'more tasks assigned to you', 'Respond to assigned task', 'Respond to assigned request', 'Accept it if you can help', 'mark waiting if you are stuck', 'Accept it, ask for help', 'accept it, mark what is waiting', 'You can accept it', 'task status', 'The task stays open', 'keeps the task open', 'keeps the task visible'],
  },
  {
    path: 'pages/funeral-home/index.js',
    label: 'Funeral-home public source',
    requires: ['A calmer way to keep families and staff aligned.', 'assigned work and context', 'Could not start checkout.'],
    forbids: ['assigned tasks', 'Could not start partner checkout', 'ARR target', '$300k', 'pilot proof'],
  },
  {
    path: 'pages/hospice.js',
    label: 'Hospice and care-prep source',
    requires: ['waiting points', 'Care-provider inquiries', 'Provider handoff'],
    forbids: ['stuck points', 'Care-provider partnerships', 'task spine'],
  },
  {
    path: 'pages/contact.js',
    label: 'Contact source',
    requires: ['Funeral home inquiry', 'provider conversations immediately'],
    forbids: ['Funeral home / partner inquiry', 'partner conversations immediately'],
  },
  {
    path: 'pages/vendors/onboard.js',
    label: 'Vendor onboarding source',
    requires: ['Required: business name, service ZIPs, and email', 'Add business name, service ZIPs, and email to submit', 'Recommended next action: book a vendor conversation', 'Nothing appears to families until Passage approves the provider'],
    forbids: ['marketplace fee', 'public marketplace inbox', 'browse family records', 'support partner', 'approves the partner', 'Funeral home partner information'],
  },
  {
    path: 'pages/api/vendorRequests/decision.js',
    label: 'Vendor quote decision API wording',
    requires: ['before it can be approved', 'family_accepted', "status: action === 'approve_quote' ? 'waiting' : 'blocked'"],
    forbids: ['before it can be accepted', 'quote accepted for', 'quote was not accepted for'],
  },
  {
    path: 'pages/vendors/request.js',
    label: 'Vendor request source',
    requires: ['Sample scoped vendor request', 'One request, not a family file.', 'Simple request path', 'Action needed', 'Waiting on', 'Status and proof', 'full family record', 'public listing or open inbox', 'Save completion proof', 'family or funeral home can approve', 'Quote sent'],
    forbids: ['family case and task', 'scoped task requests', 'task spine', 'full estate', 'public marketplace inbox', 'payout internals', 'Payment and fee details', 'Mark completed', 'can accept it before work starts', 'Requested, quoted, accepted, completed.', 'Service instructions', 'family or funeral home accepts it', 'Viewed, accepted', '>Accepted<'],
  },
  {
    path: 'pages/api/system/automationSpineReadiness.js',
    label: 'Automation readiness API source',
    requires: ['taskAutomationReadiness', 'automationReadyPercent', 'semiAutomated', 'topBlockers', 'automation_coverage'],
    forbids: [],
  },
  {
    path: 'lib/inMemoryRateLimit.js',
    label: 'Durable public rate-limit source',
    requires: ['durableRateLimit', 'rate_limit_buckets', 'local_guard'],
    forbids: [],
  },
  {
    path: 'pages/api/saveLead.js',
    label: 'Lead intake validation source',
    requires: ['isRealEmail', 'durableRateLimit', 'Please enter a real email address.'],
    forbids: ["console.log('Passage lead:'"],
  },
  {
    path: 'pages/api/stripeWebhook.js',
    label: 'Stripe webhook replay guard source',
    requires: ['STRIPE_SIGNATURE_TOLERANCE_SECONDS', 'timestampSeconds', 'ageSeconds'],
    forbids: [],
  },
  {
    path: 'pages/api/addressAutocomplete.js',
    label: 'Address lookup server key source',
    requires: ['process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY'],
    forbids: ['NEXT_PUBLIC_GOOGLE_PLACES_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
  },
  {
    path: 'pages/api/providerSearch.js',
    label: 'Provider lookup server key source',
    requires: ['process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY', 'durableRateLimit'],
    forbids: ['NEXT_PUBLIC_GOOGLE_PLACES_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
  },
  {
    path: 'supabase/migrations/20260618161000_harden_public_intake_security.sql',
    label: 'Public intake RLS hardening migration',
    requires: ['drop policy if exists "lead intake can create leads"', 'rate_limit_buckets', 'service role manages leads'],
    forbids: ['TO "authenticated", "anon" WITH CHECK (true)'],
  },
  {
    path: 'pages/system/admin/automation-spine-readiness.js',
    label: 'Automation readiness admin source',
    requires: ['Automation coverage', 'Automation ready', 'Semi-auto', 'Manual', 'automated or semi-automated'],
    forbids: [],
  },
  {
    path: 'components/CareProviderLanding.js',
    label: 'Care-provider source',
    requires: ['Help families leave care with a clearer next step.', 'Purpose of this page', 'not an operating dashboard', 'Care team inquiry', 'Add organization name and contact email to send the inquiry', 'Recommended next action: book a short walkthrough', 'Family owned', 'Scoped access', 'Proof based'],
    forbids: ['task outcomes', 'full operating dashboard', 'partner spine', 'Partner inquiry', 'Start partner inquiry', 'Send partner inquiry', 'Partner fit', 'Partner paths', 'partnership inquiry', 'downstream partners', 'Partnerships are reviewed'],
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