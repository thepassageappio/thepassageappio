import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const PARTNER_TASKS = [
  ['Obtain official pronouncement of death', 'Confirm pronouncement source, transportation timing, and who signs the death certificate.'],
  ['Order death certificates — minimum 15 copies', 'Collect information needed for the certificate order and record order status.'],
  ['Meet with funeral director to finalize arrangements', 'Confirm service type, timing, approvals, pricing, and family decisions.'],
  ['Draft and submit the obituary', 'Collect obituary facts, family review, publication deadline, and submission proof.'],
  ['Contact the cemetery or crematorium', 'Confirm availability, document needs, fees, timing, and next approval.'],
  ['Prepare for funeral home meeting', 'Generate the family-ready intake summary so the arrangement meeting starts with the right facts.'],
];

function slugify(value) {
  return String(value || 'partner')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'partner';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.id || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const {
    funeralHomeName,
    deceasedName,
    dateOfDeath,
    coordinatorName,
    coordinatorEmail,
    coordinatorPhone,
    caseReference,
  } = req.body || {};

  if (!deceasedName || !String(deceasedName).trim()) return res.status(400).json({ error: 'Add the deceased name to create a case.' });

  try {
    const email = user.email.toLowerCase();
    let { data: membership } = await admin
      .from('organization_members')
      .select('organization_id, role, status, organizations(id,name,type)')
      .ilike('email', email)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    let organizationId = membership?.organization_id || null;
    if (!organizationId) {
      const name = String(funeralHomeName || '').trim() || `${coordinatorName || email}'s Funeral Home`;
      const slugBase = slugify(name);
      const { data: org, error: orgError } = await admin.from('organizations').insert([{
        type: 'funeral_home',
        name,
        slug: `${slugBase}-${randomUUID().slice(0, 6)}`,
        support_email: email,
        from_name: name,
        white_label_enabled: true,
        created_by: user.id,
      }]).select('id').single();
      if (orgError) throw orgError;
      organizationId = org.id;
      const { error: memberError } = await admin.from('organization_members').insert([{
        organization_id: organizationId,
        user_id: user.id,
        email,
        role: 'owner',
        status: 'active',
      }]);
      if (memberError) throw memberError;
    }

    const now = new Date().toISOString();
    const { data: workflow, error: workflowError } = await admin.from('workflows').insert([{
      user_id: user.id,
      name: `${deceasedName} - family case`,
      estate_name: deceasedName,
      deceased_name: deceasedName,
      date_of_death: dateOfDeath || null,
      coordinator_name: coordinatorName || '',
      coordinator_email: coordinatorEmail || email,
      coordinator_phone: coordinatorPhone || null,
      status: 'active',
      path: 'partner',
      mode: 'funeral_home_case',
      setup_stage: 'partner_case_created',
      activation_status: 'draft',
      organization_id: organizationId,
      organization_case_reference: caseReference || null,
      partner_created_by: user.id,
      created_at: now,
      updated_at: now,
    }]).select('id').single();
    if (workflowError) throw workflowError;

    const rows = PARTNER_TASKS.map(([title, description], index) => {
      const playbook = getTaskPlaybook(title);
      return {
        workflow_id: workflow.id,
        user_id: user.id,
        title,
        description,
        category: index < 3 ? 'service' : 'coordination',
        priority: index < 3 ? 'urgent' : 'high',
        due_days_after_trigger: index < 3 ? 1 : 3,
        status: 'draft',
        playbook,
        playbook_key: playbook.key || null,
        automation_level: playbook.automationLevel || null,
        execution_kind: playbook.executionKind || null,
        waiting_on: playbook.waitingOn || null,
        partner_owner_role: playbook.partnerOwnerRole || 'funeral_home_director',
        funeral_home_eligible: true,
        proof_required: playbook.proofRequired || 'confirmation',
        created_at: now,
        updated_at: now,
      };
    });
    const { error: tasksError } = await admin.from('tasks').insert(rows);
    if (tasksError) throw tasksError;

    await admin.from('estate_access').insert([{
      workflow_id: workflow.id,
      user_id: user.id,
      email,
      role: 'external_partner',
      status: 'active',
      created_at: now,
      updated_at: now,
    }]).catch(() => {});

    return res.status(200).json({ success: true, workflowId: workflow.id, organizationId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not create partner case.' });
  }
}
