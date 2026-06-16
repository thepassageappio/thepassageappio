import { createClient } from '@supabase/supabase-js';
import { syncLeadToHubSpot } from '../../lib/hubspot';
import { getRequestIp, rateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function cleanLimitKey(value, max = 160) {
  return String(value || '').replace(/[^a-zA-Z0-9@._:+-]/g, '').slice(0, max) || 'missing';
}

function enforceFuneralHomeRequestLimit(req, user, scope = 'intake') {
  const policy = getRateLimitPolicy(scope === 'action' ? 'vendorCommerce' : 'contactIntake');
  if (!policy) return { allowed: true };
  const body = req.body || {};
  const provider = body.provider || {};
  const identity = [
    'funeral-home-request',
    scope,
    req.method,
    getRequestIp(req),
    cleanLimitKey(user?.email || user?.id || 'no-user').toLowerCase(),
    cleanLimitKey(body.workflowId || body.estateId || body.requestId || 'no-record'),
    cleanLimitKey(provider.name || body.providerName || body.action || 'no-provider').toLowerCase(),
  ].join(':');
  return rateLimit({ key: identity, windowSeconds: policy.windowSeconds, maxRequests: policy.maxRequests });
}

function clean(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function normalize(value) {
  return clean(value, 240).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(funeral|home|homes|inc|llc|corp|corporation|group)\b/g, '').replace(/\s+/g, ' ').trim();
}

function isMissingTable(error) {
  const msg = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || msg.includes('could not find the table') || msg.includes('schema cache');
}

async function userFromRequest(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { user: null };
  const { data, error } = await authClient.auth.getUser(token);
  return { user: data?.user || null, error };
}

async function canAccessWorkflow(user, workflow) {
  if (!user || !workflow) return false;
  const email = String(user.email || '').toLowerCase();
  if (workflow.user_id && String(workflow.user_id) === String(user.id)) return true;
  if (workflow.coordinator_email && String(workflow.coordinator_email).toLowerCase() === email) return true;

  const { data: participant } = await admin
    .from('estate_participants')
    .select('id')
    .eq('workflow_id', workflow.id)
    .eq('email', email)
      .maybeSingle();
  if (participant) return true;

  if (!workflow.organization_id) return false;
  const { data: member } = await admin
    .from('organization_members')
    .select('id,organization_id')
    .eq('organization_id', workflow.organization_id)
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();
  return !!member;
}

async function findMatchingOrganization(providerName, placeId) {
  const selections = [
    'id,name,type,support_email,support_phone,website,google_place_id,place_id',
    'id,name,type,support_email,support_phone,website,place_id',
    'id,name,type,support_email,support_phone,website',
    'id,name',
  ];
  let orgs = [];
  for (const selection of selections) {
    const { data, error } = await admin.from('organizations').select(selection).limit(500);
    if (!error) {
      orgs = data || [];
      break;
    }
  }
  const nameKey = normalize(providerName);
  if (!nameKey && !placeId) return null;
  return (orgs || []).find(org => {
    if (placeId && (String(org.place_id || '') === placeId || String(org.google_place_id || '') === placeId)) return true;
    const orgKey = normalize(org.name);
    if (!orgKey || !nameKey) return false;
    return orgKey === nameKey || orgKey.includes(nameKey) || nameKey.includes(orgKey);
  }) || null;
}

async function writeLead({ user, workflow, provider, request, matchedOrg }) {
  const notes = {
    category: 'Funeral home request',
    urgency: request.urgency,
    workflow_id: workflow.id,
    workflow_name: workflow.name || workflow.estate_name || workflow.deceased_name || '',
    requested_provider_name: provider.name,
    place_id: provider.placeId || '',
    address: provider.address || '',
    phone: provider.phone || '',
    website: provider.website || '',
    maps_url: provider.mapsUrl || '',
    matched_organization_id: matchedOrg?.id || null,
    family_permission_to_contact: request.familyPermission !== false,
    notes: request.notes || '',
    source_url: SITE_URL + '/estate?id=' + encodeURIComponent(workflow.id),
    created_at: new Date().toISOString(),
  };
  await admin.from('leads').insert([{
    email: user?.email || workflow.coordinator_email || null,
    first_name: user?.user_metadata?.full_name || workflow.coordinator_name || null,
    flow_type: matchedOrg ? 'partner_warm_inbound' : 'funeral_home_outreach',
    source: 'funeral_home_request',
    notes: JSON.stringify(notes),
  }]).then(() => {}, () => {});
}

async function logEstateEvent(workflowId, type, payload) {
  await admin.from('estate_events').insert([{
    estate_id: workflowId,
    event_type: type,
    title: type === 'funeral_home_request_accepted' ? 'Funeral home accepted request' : 'Funeral home request saved',
    description: payload?.providerName || '',
    notes: JSON.stringify(payload || {}),
    created_at: new Date().toISOString(),
  }]).then(() => {}, () => {});
}

export default async function handler(req, res) {
  const { user } = await userFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Sign in to save this funeral-home request.' });

  if (req.method === 'GET') {
    const workflowId = clean(req.query.workflowId || req.query.estateId, 80);
    if (!workflowId) return res.status(400).json({ error: 'Missing estate.' });
    const { data: workflow } = await admin.from('workflows').select('id,user_id,coordinator_email,organization_id').eq('id', workflowId).maybeSingle();
    if (!await canAccessWorkflow(user, workflow)) return res.status(403).json({ error: 'You do not have access to this family record.' });
    const { data, error } = await admin.from('funeral_home_requests').select('*').eq('workflow_id', workflowId).order('requested_at', { ascending: false });
    if (error && isMissingTable(error)) return res.status(200).json({ requests: [], unavailable: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ requests: data || [] });
  }

  if (req.method === 'POST') {
    const postLimit = enforceFuneralHomeRequestLimit(req, user, 'intake');
    if (!postLimit.allowed) {
      res.setHeader('Retry-After', String(postLimit.retryAfterSeconds || 3600));
      return res.status(429).json({ error: 'Too many funeral-home requests were saved recently. Review the existing request before adding another.', retryAfterSeconds: postLimit.retryAfterSeconds });
    }
    const body = req.body || {};
    const workflowId = clean(body.workflowId || body.estateId, 80);
    const provider = body.provider || {};
    const providerName = clean(provider.name || body.providerName, 240);
    if (!workflowId || !providerName) return res.status(400).json({ error: 'Choose a funeral home before saving the request.' });

    const { data: workflow } = await admin
      .from('workflows')
      .select('id,user_id,name,estate_name,deceased_name,coordinator_name,coordinator_email,organization_id')
      .eq('id', workflowId)
      .maybeSingle();
    if (!await canAccessWorkflow(user, workflow)) return res.status(403).json({ error: 'You do not have access to this family record.' });

    const placeId = clean(provider.placeId || provider.place_id, 220);
    const matchedOrg = await findMatchingOrganization(providerName, placeId);
    const status = matchedOrg ? 'matched_partner' : 'outreach_needed';
    const requestRow = {
      workflow_id: workflowId,
      requested_by_user_id: user.id,
      requested_by_email: user.email || null,
      requested_by_name: clean(user.user_metadata?.full_name || body.requestedByName || workflow.coordinator_name, 160) || null,
      requested_provider_name: providerName,
      place_id: placeId || null,
      address: clean(provider.address || body.address, 500) || null,
      city: clean(provider.city, 120) || null,
      state: clean(provider.state, 60) || null,
      zip: clean(provider.zip || provider.postalCode, 40) || null,
      country: clean(provider.country, 60) || null,
      phone: clean(provider.phone, 80) || null,
      website: clean(provider.website, 240) || null,
      maps_url: clean(provider.mapsUrl || provider.maps_url, 500) || null,
      matched_organization_id: matchedOrg?.id || null,
      status,
      urgency: clean(body.urgency, 30) || 'normal',
      source: clean(body.source, 80) || 'estate',
      family_permission_to_contact: body.familyPermission !== false,
      notes: clean(body.notes, 1200) || null,
      estimated_case_value: body.estimatedCaseValue || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin.from('funeral_home_requests').insert([requestRow]).select('*').single();
    if (error && isMissingTable(error)) {
      await writeLead({ user, workflow, provider: { ...provider, name: providerName, placeId }, request: body, matchedOrg });
      return res.status(200).json({ success: true, tableUnavailable: true, matchedOrganization: matchedOrg, request: requestRow });
    }
    if (error) return res.status(500).json({ error: error.message });

    await writeLead({ user, workflow, provider: { ...provider, name: providerName, placeId }, request: body, matchedOrg });
    await logEstateEvent(workflowId, 'funeral_home_request_saved', { providerName, matchedOrganizationId: matchedOrg?.id || null, status });
    await syncLeadToHubSpot({
      admin,
      eventType: matchedOrg ? 'partner_funeral_home_request' : 'non_partner_funeral_home_request',
      source: 'funeral_home_request',
      sourceId: data.id,
      contact: {
        email: user.email || workflow.coordinator_email,
        name: clean(user.user_metadata?.full_name || body.requestedByName || workflow.coordinator_name, 160),
        persona: 'family',
        lifecycleStage: 'marketingqualifiedlead',
      },
      company: {
        name: providerName,
        website: provider.website,
        phone: provider.phone,
        companyType: 'funeral_home',
        address: {
          address: provider.address || body.address,
          city: provider.city,
          state: provider.state,
          zip: provider.zip || provider.postalCode,
        },
      },
      deal: {
        name: `${matchedOrg ? 'Partner inbound' : 'Family-requested funeral home'}: ${providerName}`,
        persona: 'funeral_home',
        description: `A family using Passage requested ${providerName}. Status: ${status}. Urgency: ${requestRow.urgency}. Workflow: ${workflow.name || workflow.estate_name || workflow.deceased_name || workflow.id}. Permission to contact: ${requestRow.family_permission_to_contact ? 'yes' : 'no'}.`,
      },
      payload: { requestId: data.id, workflowId, providerName, status, matchedOrganizationId: matchedOrg?.id || null, urgency: requestRow.urgency },
    });

    return res.status(200).json({ success: true, matchedOrganization: matchedOrg, request: data });
  }

  if (req.method === 'PATCH') {
    const actionLimit = enforceFuneralHomeRequestLimit(req, user, 'action');
    if (!actionLimit.allowed) {
      res.setHeader('Retry-After', String(actionLimit.retryAfterSeconds || 300));
      return res.status(429).json({ error: 'Too many inbound request actions were attempted recently. Refresh the request and wait before trying again.', retryAfterSeconds: actionLimit.retryAfterSeconds });
    }
    const body = req.body || {};
    const requestId = clean(body.requestId, 80);
    const action = clean(body.action, 40);
    if (!requestId || !['accept', 'decline', 'convert', 'archive'].includes(action)) return res.status(400).json({ error: 'Choose a valid inbound action.' });

    const { data: request, error: requestError } = await admin
      .from('funeral_home_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    if (requestError) return res.status(500).json({ error: requestError.message });
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (!request.matched_organization_id) return res.status(400).json({ error: 'This request is not matched to a Passage partner yet.' });

    const { data: member } = await admin
      .from('organization_members')
      .select('id,organization_id,role,status,email')
      .eq('organization_id', request.matched_organization_id)
      .or(`user_id.eq.${user.id},email.eq.${String(user.email || '').toLowerCase()}`)
      .maybeSingle();
    if (!member || String(member.status || 'active').toLowerCase() !== 'active') return res.status(403).json({ error: 'Only the requested partner can update this inbound.' });

    const nextStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : action === 'convert' ? 'converted' : 'archived';
    const updates = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
      accepted_at: action === 'accept' ? new Date().toISOString() : request.accepted_at,
      declined_at: action === 'decline' ? new Date().toISOString() : request.declined_at,
      converted_at: action === 'convert' ? new Date().toISOString() : request.converted_at,
    };
    const { data: updated, error } = await admin.from('funeral_home_requests').update(updates).eq('id', requestId).select('*').single();
    if (error) return res.status(500).json({ error: error.message });

    if (action === 'accept' && request.workflow_id) {
      await admin.from('workflows')
        .update({ organization_id: request.matched_organization_id, updated_at: new Date().toISOString() })
        .eq('id', request.workflow_id)
        .is('organization_id', null)
        .then(() => {}, () => {});
      await logEstateEvent(request.workflow_id, 'funeral_home_request_accepted', { providerName: request.requested_provider_name, organizationId: request.matched_organization_id });
    }

    return res.status(200).json({ success: true, request: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
