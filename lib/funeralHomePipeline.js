import { syncLeadToHubSpot } from './hubspot';

export function cleanPipelineValue(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function normalizeProviderName(value) {
  return cleanPipelineValue(value, 240)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(funeral|home|homes|inc|llc|corp|corporation|group)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isPipelineMissingTable(error) {
  const msg = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || msg.includes('could not find the table') || msg.includes('schema cache');
}

export async function findMatchingFuneralHomeOrganization(admin, providerName, placeId = '') {
  if (!admin) return null;
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
  const nameKey = normalizeProviderName(providerName);
  if (!nameKey && !placeId) return null;
  return (orgs || []).find(org => {
    if (placeId && (String(org.place_id || '') === placeId || String(org.google_place_id || '') === placeId)) return true;
    const orgKey = normalizeProviderName(org.name);
    if (!orgKey || !nameKey) return false;
    return orgKey === nameKey || orgKey.includes(nameKey) || nameKey.includes(orgKey);
  }) || null;
}

async function writePipelineLead({ admin, user, workflow, provider, request, matchedOrg }) {
  if (!admin) return;
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
    source_url: request.sourceUrl || '',
    created_at: new Date().toISOString(),
  };
  await admin.from('leads').insert([{
    email: user?.email || workflow.coordinator_email || null,
    first_name: user?.user_metadata?.full_name || workflow.coordinator_name || null,
    flow_type: matchedOrg ? 'partner_warm_inbound' : 'funeral_home_outreach',
    source: request.source || 'funeral_home_request',
    notes: JSON.stringify(notes),
  }]).then(() => {}, () => {});
}

export async function saveFuneralHomePipelineRequest({
  admin,
  user,
  workflow,
  provider = {},
  source = 'estate',
  urgency = 'normal',
  notes = '',
  familyPermission = true,
  estimatedCaseValue = null,
  sourceUrl = '',
  syncCrm = true,
}) {
  const providerName = cleanPipelineValue(provider.name || provider.providerName, 240);
  if (!admin || !workflow?.id || !providerName) return { skipped: true };

  const placeId = cleanPipelineValue(provider.placeId || provider.place_id, 220);
  const matchedOrg = await findMatchingFuneralHomeOrganization(admin, providerName, placeId);
  const status = matchedOrg ? 'matched_partner' : 'outreach_needed';
  const now = new Date().toISOString();
  const requestRow = {
    workflow_id: workflow.id,
    requested_by_user_id: user?.id || workflow.user_id || null,
    requested_by_email: user?.email || workflow.coordinator_email || null,
    requested_by_name: cleanPipelineValue(user?.user_metadata?.full_name || workflow.coordinator_name, 160) || null,
    requested_provider_name: providerName,
    place_id: placeId || null,
    address: cleanPipelineValue(provider.address, 500) || null,
    city: cleanPipelineValue(provider.city, 120) || null,
    state: cleanPipelineValue(provider.state, 60) || null,
    zip: cleanPipelineValue(provider.zip || provider.postalCode, 40) || null,
    country: cleanPipelineValue(provider.country, 60) || null,
    phone: cleanPipelineValue(provider.phone, 80) || null,
    website: cleanPipelineValue(provider.website, 240) || null,
    maps_url: cleanPipelineValue(provider.mapsUrl || provider.maps_url, 500) || null,
    matched_organization_id: matchedOrg?.id || null,
    status,
    urgency: cleanPipelineValue(urgency, 30) || 'normal',
    source,
    family_permission_to_contact: familyPermission !== false,
    notes: cleanPipelineValue(notes, 1200) || null,
    estimated_case_value: estimatedCaseValue || null,
    updated_at: now,
  };

  let data = null;
  const { data: existing, error: existingError } = await admin
    .from('funeral_home_requests')
    .select('id')
    .eq('workflow_id', workflow.id)
    .eq('requested_provider_name', providerName)
    .maybeSingle();

  if (existingError && isPipelineMissingTable(existingError)) {
    await writePipelineLead({ admin, user, workflow, provider: { ...provider, name: providerName, placeId }, request: { source, urgency, notes, familyPermission, sourceUrl }, matchedOrg });
    return { success: true, tableUnavailable: true, matchedOrganization: matchedOrg, request: requestRow };
  }

  if (existing?.id) {
    const result = await admin.from('funeral_home_requests').update(requestRow).eq('id', existing.id).select('*').single();
    if (result.error) {
      if (isPipelineMissingTable(result.error)) return { success: true, tableUnavailable: true, matchedOrganization: matchedOrg, request: requestRow };
      return { error: result.error };
    }
    data = result.data;
  } else {
    const result = await admin.from('funeral_home_requests').insert([requestRow]).select('*').single();
    if (result.error) {
      if (isPipelineMissingTable(result.error)) return { success: true, tableUnavailable: true, matchedOrganization: matchedOrg, request: requestRow };
      return { error: result.error };
    }
    data = result.data;
  }

  await writePipelineLead({ admin, user, workflow, provider: { ...provider, name: providerName, placeId }, request: { source, urgency, notes, familyPermission, sourceUrl }, matchedOrg });

  if (syncCrm) {
    await syncLeadToHubSpot({
      admin,
      eventType: matchedOrg ? 'partner_funeral_home_request' : 'non_partner_funeral_home_request',
      source,
      sourceId: data?.id || workflow.id,
      contact: {
        email: user?.email || workflow.coordinator_email,
        name: cleanPipelineValue(user?.user_metadata?.full_name || workflow.coordinator_name, 160),
        persona: 'family',
        lifecycleStage: 'marketingqualifiedlead',
      },
      company: {
        name: providerName,
        website: provider.website,
        phone: provider.phone,
        companyType: 'funeral_home',
        address: {
          address: provider.address,
          city: provider.city,
          state: provider.state,
          zip: provider.zip || provider.postalCode,
        },
      },
      deal: {
        name: `${matchedOrg ? 'Partner inbound' : 'Family-requested funeral home'}: ${providerName}`,
        persona: 'funeral_home',
        description: `A family using Passage requested ${providerName}. Status: ${status}. Urgency: ${urgency}. Workflow: ${workflow.name || workflow.estate_name || workflow.deceased_name || workflow.id}. Permission to contact: ${familyPermission !== false ? 'yes' : 'no'}.`,
      },
      payload: { requestId: data?.id || null, workflowId: workflow.id, providerName, status, matchedOrganizationId: matchedOrg?.id || null, urgency },
    });
  }

  return { success: true, matchedOrganization: matchedOrg, request: data || requestRow };
}
