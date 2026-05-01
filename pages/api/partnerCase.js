import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';
import { recordStatusEvent } from '../../lib/taskStatus';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const PARTNER_TASKS = [
  ['Obtain official pronouncement of death', 'Confirm pronouncement source, transportation timing, and who signs the death certificate.'],
  ['Order death certificates - minimum 15 copies', 'Collect information needed for the certificate order and record order status.'],
  ['Meet with funeral director to finalize arrangements', 'Confirm service type, timing, approvals, pricing, and family decisions.'],
  ['Draft and submit the obituary', 'Collect obituary facts, family review, publication deadline, and submission proof.'],
  ['Contact the cemetery or crematorium', 'Confirm availability, document needs, fees, timing, and next approval.'],
  ['Prepare for funeral home meeting', 'Generate the family-ready intake summary so the arrangement meeting starts with the right facts.'],
];

const PRENEED_TASKS = [
  ['Record planning preferences', 'Capture burial/cremation wishes, service notes, faith/cultural preferences, and family contacts.'],
  ['Collect prepayment or pre-need policy details', 'Record funding source, policy number, payment status, and who can authorize changes.'],
  ['Confirm activation contacts', 'Name the people who should be contacted when the family needs the plan activated.'],
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
    caseType,
    personName,
    deceasedName,
    dateOfDeath,
    coordinatorName,
    coordinatorEmail,
    coordinatorPhone,
    caseReference,
    demo,
  } = req.body || {};

  const normalizedCaseType = ['immediate', 'preneed', 'prepaid'].includes(caseType) ? caseType : 'immediate';
  const subjectName = String(personName || deceasedName || '').trim();
  if (!subjectName) return res.status(400).json({ error: 'Add the person or family name to create a case.' });

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
    let organizationName = membership?.organizations?.name || String(funeralHomeName || '').trim() || `${coordinatorName || email}'s Funeral Home`;
    if (!organizationId) {
      const name = organizationName;
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
      name: `${subjectName} - ${normalizedCaseType === 'immediate' ? 'family case' : 'planning case'}`,
      estate_name: subjectName,
      deceased_name: normalizedCaseType === 'immediate' ? subjectName : null,
      date_of_death: normalizedCaseType === 'immediate' ? (dateOfDeath || null) : null,
      coordinator_name: coordinatorName || '',
      coordinator_email: coordinatorEmail || email,
      coordinator_phone: coordinatorPhone || null,
      status: 'active',
      path: 'partner',
      mode: normalizedCaseType === 'immediate' ? 'funeral_home_case' : 'funeral_home_preneed',
      setup_stage: `partner_${normalizedCaseType}_created`,
      activation_status: 'draft',
      organization_id: organizationId,
      organization_case_reference: caseReference || null,
      partner_created_by: user.id,
      created_at: now,
      updated_at: now,
    }]).select('id').single();
    if (workflowError) throw workflowError;

    const sourceTasks = normalizedCaseType === 'immediate' ? PARTNER_TASKS : PRENEED_TASKS;
    const rows = sourceTasks.map(([title, description], index) => {
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
    const { data: createdTasks, error: tasksError } = await admin.from('tasks').insert(rows).select('id,title,workflow_id');
    if (tasksError) throw tasksError;

    if (demo && createdTasks?.length) {
      const first = createdTasks[0];
      const second = createdTasks[1] || first;
      const third = createdTasks[2] || first;
      await recordStatusEvent({
        workflowId: workflow.id,
        taskId: first.id,
        status: 'handled',
        actor: `${organizationName} demo staff`,
        channel: 'record',
        recipient: coordinatorName || 'Family coordinator',
        detail: `${first.title} handled for the family.`,
      });
      await recordStatusEvent({
        workflowId: workflow.id,
        taskId: second.id,
        status: 'waiting',
        actor: `${organizationName} demo staff`,
        channel: 'email',
        recipient: coordinatorEmail || email,
        detail: `${second.title} sent to the family. Waiting for confirmation.`,
      });
      await recordStatusEvent({
        workflowId: workflow.id,
        taskId: third.id,
        status: 'blocked',
        actor: `${organizationName} demo staff`,
        channel: 'record',
        recipient: coordinatorName || 'Family coordinator',
        detail: `${third.title} needs one missing family detail before staff can finish it.`,
      });
      await admin.from('notification_log').insert([{
        workflow_id: workflow.id,
        channel: 'email',
        recipient_email: coordinatorEmail || email,
        recipient_name: coordinatorName || 'Family coordinator',
        subject: 'Demo family update from Passage',
        provider: 'demo',
        provider_id: `demo-${randomUUID()}`,
        status: 'waiting',
        sent_at: now,
        created_at: now,
      }]).catch(() => {});
    }

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
