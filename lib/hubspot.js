const HUBSPOT_BASE = 'https://api.hubapi.com';

function token() {
  return process.env.HUBSPOT_SERVICE_API_KEY
    || process.env.HUBSPOT_SERVICE_KEY
    || process.env.HUBSPOT_ACCESS_TOKEN
    || process.env.HUBSPOT_PRIVATE_APP_TOKEN
    || '';
}

function enabled() {
  return !!token();
}

function clean(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function splitName(name = '') {
  const parts = clean(name, 160).split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstname: '', lastname: '' };
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

async function hubspotFetch(path, options = {}) {
  if (!enabled()) return { skipped: true, reason: 'missing_hubspot_token' };
  const response = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(body?.message || text || `HubSpot request failed: ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function searchObject(objectType, propertyName, value, properties = []) {
  if (!value) return null;
  const body = {
    filterGroups: [{ filters: [{ propertyName, operator: 'EQ', value: String(value) }] }],
    properties,
    limit: 1,
  };
  const result = await hubspotFetch(`/crm/v3/objects/${objectType}/search`, { method: 'POST', body: JSON.stringify(body) });
  return result?.results?.[0] || null;
}

async function createObject(objectType, properties) {
  return hubspotFetch(`/crm/v3/objects/${objectType}`, {
    method: 'POST',
    body: JSON.stringify({ properties }),
  });
}

async function updateObject(objectType, objectId, properties) {
  return hubspotFetch(`/crm/v3/objects/${objectType}/${objectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
}

async function upsertContact({ email, name, phone, persona, source, lifecycleStage, message, extra = {} }) {
  const safeEmail = clean(email, 180).toLowerCase();
  if (!safeEmail) return null;
  const names = splitName(name);
  const properties = {
    email: safeEmail,
    firstname: names.firstname || undefined,
    lastname: names.lastname || undefined,
    phone: clean(phone, 80) || undefined,
    lifecyclestage: lifecycleStage || 'lead',
  };
  Object.keys(properties).forEach(key => properties[key] === undefined && delete properties[key]);
  const existing = await searchObject('contacts', 'email', safeEmail, ['email']);
  if (existing?.id) return updateObject('contacts', existing.id, properties);
  return createObject('contacts', properties);
}

async function upsertCompany({ name, domain, website, phone, companyType, source, address = {} }) {
  const safeName = clean(name, 220);
  if (!safeName && !domain && !website) return null;
  const resolvedDomain = clean(domain || website, 220).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const existing = resolvedDomain
    ? await searchObject('companies', 'domain', resolvedDomain, ['name', 'domain'])
    : await searchObject('companies', 'name', safeName, ['name']);
  const properties = {
    name: safeName || resolvedDomain,
    domain: resolvedDomain || undefined,
    website: clean(website, 240) || undefined,
    phone: clean(phone, 80) || undefined,
    city: clean(address.city, 120) || undefined,
    state: clean(address.state, 80) || undefined,
    zip: clean(address.zip, 40) || undefined,
    address: clean(address.address, 300) || undefined,
  };
  Object.keys(properties).forEach(key => properties[key] === undefined && delete properties[key]);
  if (existing?.id) return updateObject('companies', existing.id, properties);
  return createObject('companies', properties);
}

async function createDeal({ name, amount, pipeline, dealstage, persona, source, description, closeDate }) {
  const properties = {
    dealname: clean(name, 220),
    amount: amount ? String(amount) : undefined,
    pipeline: pipeline || process.env.HUBSPOT_DEFAULT_PIPELINE || 'default',
    dealstage: dealstage || process.env.HUBSPOT_DEFAULT_DEALSTAGE || 'appointmentscheduled',
    closedate: closeDate || undefined,
    description: clean(description, 1200) || undefined,
  };
  Object.keys(properties).forEach(key => properties[key] === undefined && delete properties[key]);
  return createObject('deals', properties);
}

async function associate(fromType, fromId, toType, toId) {
  if (!fromId || !toId) return null;
  return hubspotFetch(`/crm/v4/objects/${fromType}/${fromId}/associations/default/${toType}/${toId}`, { method: 'PUT' });
}

async function logCrmSync(admin, row) {
  if (!admin) return;
  await admin.from('crm_sync_events').insert([{
    source: row.source || 'website',
    event_type: row.eventType || row.event_type || 'crm_sync',
    source_id: row.sourceId || row.source_id || null,
    email: row.email || null,
    company_name: row.companyName || row.company_name || null,
    hubspot_contact_id: row.contactId || null,
    hubspot_company_id: row.companyId || null,
    hubspot_deal_id: row.dealId || null,
    status: row.status || 'synced',
    error: row.error || null,
    payload: row.payload || {},
    updated_at: new Date().toISOString(),
  }]).then(() => {}, () => {});
}

export async function syncLeadToHubSpot({ admin, eventType, source, sourceId, contact = {}, company = {}, deal = {}, payload = {} }) {
  if (!enabled()) {
    await logCrmSync(admin, { source, eventType, sourceId, email: contact.email, companyName: company.name, status: 'skipped', error: 'Missing HubSpot service token', payload });
    return { skipped: true };
  }
  try {
    const hsContact = await upsertContact({ ...contact, persona: contact.persona || payload.persona, source });
    const hsCompany = company?.name || company?.domain || company?.website
      ? await upsertCompany({ ...company, source })
      : null;
    const shouldCreateDeal = !!deal?.name;
    const hsDeal = shouldCreateDeal ? await createDeal({ ...deal, source, persona: deal.persona || contact.persona || payload.persona }) : null;

    await Promise.all([
      hsContact?.id && hsCompany?.id ? associate('contacts', hsContact.id, 'companies', hsCompany.id) : null,
      hsDeal?.id && hsContact?.id ? associate('deals', hsDeal.id, 'contacts', hsContact.id) : null,
      hsDeal?.id && hsCompany?.id ? associate('deals', hsDeal.id, 'companies', hsCompany.id) : null,
    ].filter(Boolean));

    await logCrmSync(admin, {
      source,
      eventType,
      sourceId,
      email: contact.email,
      companyName: company.name,
      contactId: hsContact?.id || null,
      companyId: hsCompany?.id || null,
      dealId: hsDeal?.id || null,
      status: 'synced',
      payload,
    });
    return { contact: hsContact, company: hsCompany, deal: hsDeal };
  } catch (error) {
    await logCrmSync(admin, {
      source,
      eventType,
      sourceId,
      email: contact.email,
      companyName: company.name,
      status: 'failed',
      error: error.message,
      payload: { ...payload, hubspot_error: error.body || null },
    });
    return { error };
  }
}
