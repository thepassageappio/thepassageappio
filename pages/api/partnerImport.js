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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const { csv, funeralHomeName } = req.body || {};
  if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'Upload the Passage CSV template first.' });

  const parsed = parseCsv(csv);
  if (parsed.length < 2) return res.status(400).json({ error: 'CSV needs a header row and at least one case row.' });

  const headers = parsed[0].map(h => h.trim().toLowerCase());
  const required = ['deceased_name', 'primary_contact_name', 'primary_contact_email'];
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length) return res.status(400).json({ error: `Missing required column: ${missing.join(', ')}` });

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
    await admin.from('organization_members').insert([{ organization_id: organizationId, user_id: user.id, email, role: 'owner', status: 'active' }]).catch(() => {});
  }

  const index = Object.fromEntries(headers.map((h, i) => [h, i]));
  const now = new Date().toISOString();
  const created = [];
  for (let r = 1; r < parsed.length; r += 1) {
    const row = parsed[r];
    const deceasedName = row[index.deceased_name]?.trim();
    const contactName = row[index.primary_contact_name]?.trim();
    const contactEmail = row[index.primary_contact_email]?.trim();
    if (!deceasedName || !contactName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail || '')) {
      return res.status(400).json({ error: `Row ${r + 1} is missing deceased_name, primary_contact_name, or a valid primary_contact_email.` });
    }
    const { data: workflow, error: workflowError } = await admin.from('workflows').insert([{
      user_id: user.id,
      name: `${deceasedName} - imported family case`,
      estate_name: deceasedName,
      deceased_name: deceasedName,
      date_of_death: row[index.date_of_death] || null,
      coordinator_name: contactName,
      coordinator_email: contactEmail,
      coordinator_phone: row[index.phone] || null,
      status: 'active',
      path: 'partner',
      mode: 'funeral_home_case',
      setup_stage: 'partner_csv_imported',
      activation_status: 'draft',
      organization_id: organizationId,
      organization_case_reference: row[index.case_reference] || null,
      partner_created_by: user.id,
      created_at: now,
      updated_at: now,
    }]).select('id').single();
    if (workflowError) return res.status(500).json({ error: workflowError.message });

    if (row[index.notes]) {
      await admin.from('estate_events').insert([{
        estate_id: workflow.id,
        event_type: 'partner_import_note',
        title: 'Imported note',
        description: row[index.notes],
        actor: organizationName,
        created_at: now,
      }]).catch(() => {});
    }

    const tasks = DEFAULT_TASKS.map(([title, description], taskIndex) => {
      const playbook = getTaskPlaybook(title);
      return {
        workflow_id: workflow.id,
        user_id: user.id,
        title,
        description,
        category: taskIndex < 3 ? 'service' : 'coordination',
        priority: taskIndex < 3 ? 'urgent' : 'high',
        status: 'draft',
        playbook,
        playbook_key: playbook.key || null,
        automation_level: playbook.automationLevel || null,
        execution_kind: playbook.executionKind || null,
        waiting_on: playbook.waitingOn || null,
        funeral_home_eligible: true,
        proof_required: playbook.proofRequired || 'confirmation',
        created_at: now,
        updated_at: now,
      };
    });
    await admin.from('tasks').insert(tasks);
    created.push(workflow.id);
  }

  return res.status(200).json({ success: true, imported: created.length, workflowIds: created });
}
