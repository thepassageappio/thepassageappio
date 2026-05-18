import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const admin = supabaseUrl && supabaseService ? createClient(supabaseUrl, supabaseService) : null;

function present(value) {
  return Boolean(String(value || '').trim());
}

function hubspotToken() {
  return process.env.HUBSPOT_SERVICE_API_KEY
    || process.env.HUBSPOT_SERVICE_KEY
    || process.env.HUBSPOT_ACCESS_TOKEN
    || process.env.HUBSPOT_PRIVATE_APP_TOKEN
    || '';
}

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

const routeMap = [
  {
    id: 'family_lead',
    label: 'Family lead',
    sources: ['/urgent', '/planning', '/guides', '/contact', '/api/saveLead'],
    eventTypes: ['web_lead', 'support_inquiry'],
    creates: ['contact', 'deal when urgent or meeting intent exists'],
    pipelineEnv: 'HUBSPOT_D2C_PIPELINE',
    stageEnv: 'HUBSPOT_D2C_NEW_STAGE',
    fallback: 'HUBSPOT_DEFAULT_PIPELINE / HUBSPOT_DEFAULT_DEALSTAGE',
  },
  {
    id: 'paid_family_customer',
    label: 'Paid family customer',
    sources: ['Stripe checkout webhook'],
    eventTypes: ['checkout_completed'],
    creates: ['contact', 'closed-won deal'],
    pipelineEnv: 'HUBSPOT_D2C_PIPELINE',
    stageEnv: 'HUBSPOT_D2C_CLOSED_WON_STAGE',
    fallback: 'HUBSPOT_CLOSED_WON_DEALSTAGE / HUBSPOT_DEFAULT_DEALSTAGE',
  },
  {
    id: 'funeral_home_lead',
    label: 'Funeral-home lead or warm inbound',
    sources: ['/funeral-home', 'family-requested funeral home', 'partner invite'],
    eventTypes: ['partner_funeral_home_request', 'non_partner_funeral_home_request', 'support_inquiry'],
    creates: ['contact', 'company', 'deal'],
    pipelineEnv: 'HUBSPOT_FUNERAL_HOME_PIPELINE',
    stageEnv: 'HUBSPOT_FUNERAL_HOME_NEW_STAGE',
    fallback: 'HUBSPOT_DEFAULT_PIPELINE / HUBSPOT_DEFAULT_DEALSTAGE',
  },
  {
    id: 'vendor_lead',
    label: 'Vendor lead/application',
    sources: ['/vendors/onboard', '/contact?category=Vendor conversation'],
    eventTypes: ['vendor_application', 'support_inquiry'],
    creates: ['contact', 'company', 'deal'],
    pipelineEnv: 'HUBSPOT_VENDOR_PIPELINE',
    stageEnv: 'HUBSPOT_VENDOR_APPLIED_STAGE',
    fallback: 'HUBSPOT_DEFAULT_PIPELINE / HUBSPOT_DEFAULT_DEALSTAGE',
  },
  {
    id: 'care_provider_lead',
    label: 'Hospice, assisted-living, or care-provider lead',
    sources: ['/care-providers', '/contact?category=Care provider'],
    eventTypes: ['care_provider_inquiry', 'support_inquiry'],
    creates: ['contact', 'company', 'deal'],
    pipelineEnv: 'HUBSPOT_CARE_PIPELINE',
    stageEnv: 'HUBSPOT_CARE_NEW_STAGE',
    fallback: 'HUBSPOT_DEFAULT_PIPELINE / HUBSPOT_DEFAULT_DEALSTAGE',
  },
  {
    id: 'marketplace_revenue',
    label: 'Vendor marketplace revenue',
    sources: ['vendor quote accepted', 'vendor payment checkout'],
    eventTypes: ['vendor_quote', 'vendor_payment'],
    creates: ['deal once payment loop is enabled'],
    pipelineEnv: 'HUBSPOT_MARKETPLACE_PIPELINE',
    stageEnv: 'HUBSPOT_MARKETPLACE_PAYMENT_PENDING_STAGE',
    fallback: 'Roadmap until vendor payments leave dry-run',
  },
];

async function checkHubSpot() {
  const token = hubspotToken();
  if (!present(token)) return { ok: false, configured: false, error: 'HubSpot service API key is missing.' };
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1&properties=email', {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(error => ({ ok: false, status: 0, json: async () => ({ message: error.message }) }));
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      configured: true,
      status: response.status,
      error: body?.message || body?.error || 'HubSpot contact read check failed.',
    };
  }
  return { ok: true, configured: true, status: response.status, reachable: true };
}

async function recentCrmRows() {
  if (!admin) return { ok: false, rows: [], error: 'Supabase service role is not configured.' };
  const selections = [
    'id,source,event_type,source_id,email,company_name,hubspot_contact_id,hubspot_company_id,hubspot_deal_id,status,error,created_at,updated_at,payload',
    'id,source,event_type,email,company_name,status,error,created_at',
  ];
  for (const selection of selections) {
    const { data, error } = await admin
      .from('crm_sync_events')
      .select(selection)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error) return { ok: true, rows: data || [], error: null };
    if (error.code !== '42703' && !String(error.message || '').toLowerCase().includes('schema cache')) {
      return { ok: false, rows: [], error: error.message };
    }
  }
  return { ok: false, rows: [], error: 'crm_sync_events is not readable with the expected columns.' };
}

function routeStatus(route, rows) {
  const eventSet = new Set(route.eventTypes);
  const recent = rows.filter(row => eventSet.has(row.event_type));
  const env = {
    pipeline: route.pipelineEnv,
    pipelineConfigured: present(process.env[route.pipelineEnv]),
    stage: route.stageEnv,
    stageConfigured: present(process.env[route.stageEnv]),
    fallback: route.fallback,
  };
  return {
    ...route,
    env,
    recentCount: recent.length,
    recent: recent.slice(0, 4).map(row => ({
      id: row.id,
      eventType: row.event_type,
      source: row.source,
      email: row.email,
      companyName: row.company_name,
      status: row.status,
      contactId: row.hubspot_contact_id,
      companyId: row.hubspot_company_id,
      dealId: row.hubspot_deal_id,
      error: row.error,
      createdAt: row.created_at,
    })),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const [hubspot, crm] = await Promise.all([checkHubSpot(), recentCrmRows()]);
  const routes = routeMap.map(route => routeStatus(route, crm.rows || []));
  const missingRecommendedEnv = routes
    .filter(route => route.id !== 'marketplace_revenue')
    .flatMap(route => [
      route.env.pipelineConfigured ? null : route.env.pipeline,
      route.env.stageConfigured ? null : route.env.stage,
    ].filter(Boolean));
  const recentFailures = (crm.rows || []).filter(row => row.status === 'failed' || row.error).slice(0, 8);

  const blockers = [];
  const warnings = [];
  if (!hubspot.ok) blockers.push(hubspot.error || 'HubSpot API check failed.');
  if (!crm.ok) blockers.push(crm.error || 'CRM sync event table is not readable.');
  if (recentFailures.length) warnings.push(`${recentFailures.length} recent CRM sync row${recentFailures.length === 1 ? '' : 's'} need review.`);
  if (missingRecommendedEnv.length) warnings.push(`Recommended pipeline/stage env vars missing: ${[...new Set(missingRecommendedEnv)].join(', ')}.`);

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: blockers.length ? 'needs_work' : 'ready',
    hubspot,
    crm: {
      ok: crm.ok,
      recentRows: (crm.rows || []).length,
      failures: recentFailures,
      error: crm.error || null,
    },
    routes,
    blockers,
    warnings,
  });
}
