import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const DEFAULT_TASKS = [
  ['Obtain official pronouncement of death', 'Confirm pronouncement source, transportation timing, and who signs the death certificate.'],
  ['Order death certificates - minimum 15 copies', 'Collect information needed for the certificate order and record order status.'],
  ['Meet with funeral director to finalize arrangements', 'Confirm service type, timing, approvals, pricing, and family decisions.'],
  ['Prepare for funeral home meeting', 'Generate the family-ready intake summary so the arrangement meeting starts with the right facts.'],
];

function parseCsv(text) {
  const rows = [];
  let cell = '';
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function slugify(value) {
  return String(value || 'partner').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'partner';
}

function headerKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const COLUMN_ALIASES = {
  deceased_name: ['deceased_name', 'decedent_name', 'decedent', 'person_who_died', 'person_name', 'case_name', 'name'],
  primary_contact_name: ['primary_contact_name', 'family_contact', 'family_contact_name', 'informant_name', 'next_of_kin_name', 'coordinator_name', 'contact_name'],
  primary_contact_email: ['primary_contact_email', 'family_email', 'family_contact_email', 'informant_email', 'next_of_kin_email', 'coordinator_email', 'contact_email', 'email'],
  primary_contact_phone: ['primary_contact_phone', 'phone', 'family_phone', 'family_contact_phone', 'informant_phone', 'next_of_kin_phone', 'coordinator_phone', 'contact_phone'],
  date_of_death: ['date_of_death', 'death_date', 'dod'],
  case_reference: ['case_reference', 'case_id', 'case_number', 'contract_number', 'record_id', 'reference'],
  source_system: ['source_system', 'system', 'export_source', 'case_management_system'],
  pronouncement_date: ['pronouncement_date', 'official_pronouncement', 'pronouncement'],
  release_date: ['release_date', 'pickup_date', 'removal_date', 'transfer_date'],
  arrangement_date: ['arrangement_date', 'arrangement_meeting', 'arrangements_date'],
  visitation_date: ['visitation_date', 'wake_date', 'calling_hours_date'],
  funeral_date: ['funeral_date', 'service_date', 'memorial_date'],
  burial_date: ['burial_date', 'committal_date', 'cemetery_date', 'cremation_date'],
  shiva_date: ['shiva_date', 'mourning_date', 'mourning_period_date'],
  reception_date: ['reception_date', 'gathering_date'],
  obituary_deadline: ['obituary_deadline', 'obituary_due_date', 'publication_deadline'],
  service_details: ['service_details', 'service_notes', 'arrangement_notes', 'service_summary'],
  notes: ['notes', 'case_notes', 'internal_notes'],
};

function buildHeaderIndex(headers, mapping = {}) {
  const direct = Object.fromEntries(headers.map((h, i) => [headerKey(h), i]));
  const canonical = {};
  for (const [field, header] of Object.entries(mapping || {})) {
    const key = headerKey(header);
    if (key && direct[key] != null) canonical[field] = direct[key];
  }
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (canonical[field] != null) continue;
    const match = aliases.map(headerKey).find(alias => direct[alias] != null);
    if (match) canonical[field] = direct[match];
  }
  return canonical;
}

function cell(row, index, key) {
  const idx = index[key];
  return idx == null ? '' : String(row[idx] || '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const { csv, funeralHomeName, mapping } = req.body || {};
  if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'Upload the Passage CSV template first.' });

  const parsed = parseCsv(csv);
  if (parsed.length < 2) return res.status(400).json({ error: 'CSV needs a header row and at least one case row.' });

  const headers = parsed[0].map(h => h.trim());
  const index = buildHeaderIndex(headers, mapping);
  const required = ['deceased_name', 'primary_contact_name', 'primary_contact_email'];
  const missing = required.filter(h => index[h] == null);
  if (missing.length) return res.status(400).json({ error: `Missing required case field: ${missing.join(', ')}. Passage accepts its template plus common exports such as decedent name, family contact, contact email, case number, and service date.` });

  const email = user.email.toLowerCase();
  let { data: membership } = await admin
    .from('organization_members')
    .select('organization_id, organizations(name)')
    .ilike('email', email)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  let organizationId = membership?.organization_id || null;
  const organizationName = membership?.organizations?.name || String(funeralHomeName || '').trim() || `${email}'s Funeral Home`;
  if (!organizationId) {
    const { data: org, error: orgError } = await admin.from('organizations').insert([{
      type: 'funeral_home',
      name: organizationName,
      slug: `${slugify(organizationName)}-${randomUUID().slice(0, 6)}`,
      support_email: email,
      from_name: organizationName,
      white_label_enabled: true,
      created_by: user.id,
    }]).select('id').single();
    if (orgError) return res.status(500).json({ error: orgError.message });
    organizationId = org.id;
    await admin.from('organization_members').insert([{ organization_id: organizationId, user_id: user.id, email, role: 'owner', status: 'active' }]).then(() => {}, () => {});
  }

  const now = new Date().toISOString();
  const created = [];
  for (let r = 1; r < parsed.length; r += 1) {
    const row = parsed[r];
    const deceasedName = cell(row, index, 'deceased_name');
    const contactName = cell(row, index, 'primary_contact_name');
    const contactEmail = cell(row, index, 'primary_contact_email');
    if (!deceasedName || !contactName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail || '')) {
      return res.status(400).json({ error: `Row ${r + 1} is missing deceased_name, primary_contact_name, or a valid primary_contact_email.` });
    }
    const timelineAnchors = [
      ['pronouncement', 'Official pronouncement', cell(row, index, 'pronouncement_date'), 'Imported official death pronouncement timing.'],
      ['release', 'Release / pickup', cell(row, index, 'release_date'), 'Imported release, pickup, removal, or transfer timing.'],
      ['arrangement', 'Arrangement meeting', cell(row, index, 'arrangement_date'), 'Imported arrangement meeting timing.'],
      ['visitation', 'Wake / visitation', cell(row, index, 'visitation_date'), 'Imported wake, visitation, calling hours, or shiva timing.'],
      ['funeral', 'Funeral / memorial service', cell(row, index, 'funeral_date'), 'Imported funeral, memorial, or service timing.'],
      ['burial', 'Burial / committal', cell(row, index, 'burial_date'), 'Imported burial, committal, cremation, or cemetery timing.'],
      ['shiva', 'Shiva / mourning period', cell(row, index, 'shiva_date'), 'Imported shiva or mourning-period timing.'],
      ['reception', 'Reception / gathering', cell(row, index, 'reception_date'), 'Imported reception or family gathering timing.'],
      ['obituary_deadline', 'Obituary deadline', cell(row, index, 'obituary_deadline'), 'Imported obituary submission or publication deadline.'],
    ].filter(item => item[2]).map(item => ({ event_type: item[0], name: item[1], date: item[2], notes: item[3] }));

    const { data: workflow, error: workflowError } = await admin.from('workflows').insert([{
      user_id: user.id,
      name: `${deceasedName} - imported family case`,
      estate_name: deceasedName,
      deceased_name: deceasedName,
      date_of_death: cell(row, index, 'date_of_death') || null,
      coordinator_name: contactName,
      coordinator_email: contactEmail,
      coordinator_phone: cell(row, index, 'primary_contact_phone') || null,
      status: 'active',
      trigger_type: 'death_confirmed',
      path: 'red',
      mode: 'red',
      setup_stage: 'active',
      organization_id: organizationId,
      organization_case_reference: cell(row, index, 'case_reference') || null,
      partner_created_by: user.id,
      orchestration_summary: {
        partner_case_type: 'immediate',
        partner_setup_stage: 'partner_csv_imported',
        source_system: cell(row, index, 'source_system') || 'csv_import',
        timeline_anchors: timelineAnchors,
        missing_timeline_watch: [
          !cell(row, index, 'date_of_death') ? 'date of death' : '',
          !cell(row, index, 'arrangement_date') ? 'arrangement meeting date' : '',
          !cell(row, index, 'funeral_date') ? 'funeral or memorial date' : '',
          !cell(row, index, 'burial_date') ? 'burial, cremation, or cemetery date' : '',
          !cell(row, index, 'obituary_deadline') ? 'obituary deadline' : '',
        ].filter(Boolean),
      },
      created_at: now,
      updated_at: now,
    }]).select('id').single();
    if (workflowError) return res.status(500).json({ error: workflowError.message });

    if (timelineAnchors.length) {
      await admin.from('estate_events').insert(timelineAnchors.map(anchor => ({
        estate_id: workflow.id,
        event_type: anchor.event_type,
        name: anchor.name,
        title: anchor.name,
        date: anchor.date,
        notes: anchor.notes,
        description: anchor.notes,
        actor: organizationName,
        created_at: now,
      }))).then(() => {}, () => {});
    }

    const importedNotes = [cell(row, index, 'service_details'), cell(row, index, 'notes')].filter(Boolean).join('\n\n');
    if (importedNotes) {
      await admin.from('estate_events').insert([{
        estate_id: workflow.id,
        event_type: 'partner_import_note',
        title: 'Imported note',
        description: importedNotes,
        actor: organizationName,
        created_at: now,
      }]).then(() => {}, () => {});
    }

    const tasks = DEFAULT_TASKS.map(([title, description], taskIndex) => {
      const playbook = getTaskPlaybook(title);
      return {
        workflow_id: workflow.id,
        user_id: user.id,
        title,
        description,
        category: 'service',
        priority: taskIndex < 3 ? 'urgent' : 'high',
        due_days_after_trigger: taskIndex < 3 ? 1 : 3,
        status: 'draft',
        playbook,
        playbook_key: playbook.playbookKey || null,
        automation_level: playbook.automationLevel || 'MANUAL',
        execution_kind: playbook.executionKind || 'record',
        waiting_on: playbook.waitingOn || null,
        partner_owner_role: playbook.partnerOwnerRole || 'funeral_home_director',
        funeral_home_eligible: true,
        proof_required: playbook.proofRequired || 'confirmation',
        created_at: now,
        updated_at: now,
      };
    });
    const { error: tasksError } = await admin.from('tasks').insert(tasks);
    if (tasksError) return res.status(500).json({ error: tasksError.message });
    created.push(workflow.id);
  }

  return res.status(200).json({ success: true, imported: created.length, workflowIds: created });
}
