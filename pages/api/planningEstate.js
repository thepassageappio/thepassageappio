import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';
import { internalHeaders } from '../../lib/deliveryAuth';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clean(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function safeTaskCategory(category) {
  const value = clean(category).toLowerCase();
  const allowed = new Set(['notifications', 'property', 'legal', 'government', 'financial', 'personal', 'memorial', 'digital', 'service', 'logistics', 'medical']);
  if (allowed.has(value)) return value;
  if (value === 'documents') return 'legal';
  return 'personal';
}

function planningTask(title, description, category, priority, dueDays, playbookKey, extras = {}) {
  const playbook = getTaskPlaybook(playbookKey || title);
  return {
    title,
    description,
    category: safeTaskCategory(category),
    priority: priority || 'normal',
    due_days_after_trigger: dueDays,
    status: 'pending',
    playbook,
    playbook_key: playbook.playbookKey || playbookKey || title,
    automation_level: extras.automation_level || playbook.automationLevel || 'PACKET',
    execution_kind: extras.execution_kind || playbook.executionKind || 'record',
    waiting_on: extras.waiting_on || playbook.waitingOn || 'family record',
    partner_owner_role: extras.partner_owner_role || playbook.partnerOwnerRole || null,
    funeral_home_eligible: Boolean(extras.funeral_home_eligible || playbook.funeralHomeEligible),
    proof_required: extras.proof_required || playbook.proofRequired || 'detail recorded',
  };
}

function buildPlanningTasks(context) {
  const tasks = [
    planningTask(
      'Record planning preferences',
      'Save burial or cremation wishes, service preferences, faith or cultural notes, and who should be contacted first.',
      'personal',
      'high',
      3,
      'record planning preferences',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'family record', proof_required: 'preferences saved' }
    ),
    planningTask(
      'Confirm activation contacts',
      'Keep the trusted people who can confirm and activate the plan visible for the family.',
      'notifications',
      'high',
      3,
      'confirm activation contacts',
      { automation_level: 'SEND_TRACK', execution_kind: 'message', waiting_on: 'activation contacts', proof_required: 'confirmation contacts notified' }
    ),
    planningTask(
      'Identify healthcare proxy or legal decision-maker',
      'Record who can make medical, release, and family decisions if there is confusion later.',
      'legal',
      'high',
      3,
      'identify healthcare proxy or legal decision-maker',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'healthcare proxy or family', proof_required: 'decision-maker recorded' }
    ),
    planningTask(
      'Prepare for funeral home meeting',
      'Generate a one-page family-ready summary with the facts most funeral homes ask for first.',
      'service',
      'normal',
      7,
      'prepare for funeral home meeting',
      { automation_level: 'PACKET', execution_kind: 'packet', waiting_on: 'family record', funeral_home_eligible: true, proof_required: 'prep summary generated' }
    ),
    planningTask(
      'Collect prepayment or pre-need policy details',
      'Record whether funeral expenses are prepaid, insured, or stored with a funeral home so family does not hunt later.',
      'financial',
      'normal',
      7,
      'collect prepayment or pre-need policy details',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'policy or funeral home', funeral_home_eligible: true, proof_required: 'policy or prepayment location saved' }
    ),
    planningTask(
      'Locate medical records and key documents',
      'Record where healthcare proxy forms, advance directives, insurance cards, and medical records can be found.',
      'medical',
      'normal',
      7,
      'locate medical records and key documents',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'family record', proof_required: 'document location saved' }
    ),
  ];

  if (context.cemetery_or_burial_place) {
    tasks.push(planningTask(
      'Confirm cemetery or burial place',
      'Keep cemetery, plot, or burial-place details ready for the funeral home and family.',
      'service',
      'normal',
      7,
      'confirm cemetery requirements',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'cemetery or family record', funeral_home_eligible: true, proof_required: 'cemetery details saved' }
    ));
  }

  if (context.faith_tradition || context.clergy_or_officiant) {
    tasks.push(planningTask(
      'Contact clergy or faith community',
      'Keep clergy, officiant, or faith-tradition notes ready so timing and service requirements are not guessed later.',
      'service',
      'normal',
      7,
      'contact clergy or faith community',
      { automation_level: 'SEND_TRACK', execution_kind: 'message', waiting_on: 'clergy or faith community', funeral_home_eligible: true, proof_required: 'faith guidance saved' }
    ));
  }

  return tasks;
}

async function getUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { user: null, token: '' };
  const { data } = await authClient.auth.getUser(token);
  return { user: data?.user || null, token };
}

async function sendInvite({ token, workflowId, action, personName, coordinatorName, triggerToken }) {
  const headers = {
    'Content-Type': 'application/json',
    ...internalHeaders(),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const confirmUrl = `${SITE_URL}/confirm?token=${encodeURIComponent(triggerToken)}&email=${encodeURIComponent(action.recipient_email || '')}`;
  const body = {
    to: action.recipient_email,
    toName: action.recipient_name,
    toNameFallback: action.recipient_email,
    toPhone: action.recipient_phone,
    taskTitle: action.task_title,
    actionId: action.id,
    deceasedName: personName,
    coordinatorName,
    workflowId,
    actionType: 'invite',
    confirmUrl,
    subject: `Confirmation contact for ${personName || 'a Passage plan'}`,
  };

  try {
    if (action.action_type === 'email' && action.recipient_email) {
      const response = await fetch(`${SITE_URL}/api/sendEmail`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, to: action.recipient_email }),
      });
      return { ok: response.ok, channel: 'email' };
    }
    if (action.action_type === 'sms' && action.recipient_phone) {
      const response = await fetch(`${SITE_URL}/api/sendSMS`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, to: action.recipient_phone, toEmail: action.recipient_email || null }),
      });
      return { ok: response.ok, channel: 'sms' };
    }
  } catch (err) {
    return { ok: false, channel: action.action_type, error: err.message };
  }
  return { ok: false, channel: action.action_type, skipped: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!service) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const { user, token } = await getUser(req);
  if (!user?.id || !user?.email) return res.status(401).json({ error: 'Sign in once so Passage can save this plan.' });

  const personName = clean(req.body?.personName);
  if (!personName) return res.status(400).json({ error: 'Add the name this plan protects before saving.' });

  const executorEmail = normalizeEmail(req.body?.executorEmail);
  const secondConfirmerEmail = normalizeEmail(req.body?.secondConfirmerEmail);
  if (!executorEmail) return res.status(400).json({ error: 'Add the primary confirmation contact email before saving.' });
  if (secondConfirmerEmail && secondConfirmerEmail === executorEmail) {
    return res.status(400).json({ error: 'Use two different emails for the primary and second confirmation contacts.' });
  }

  const now = new Date().toISOString();
  const triggerToken = randomUUID();
  const planningContext = {
    for_whom: clean(req.body?.forWhom),
    date_of_birth: clean(req.body?.dateOfBirth),
    disposition: clean(req.body?.disposition),
    service_type: clean(req.body?.serviceType),
    healthcare_proxy: {
      name: clean(req.body?.healthcareProxyName),
      email: normalizeEmail(req.body?.healthcareProxyEmail),
      phone: clean(req.body?.healthcareProxyPhone),
    },
    proxy_conversation_status: clean(req.body?.proxyConversationStatus),
    faith_tradition: clean(req.body?.faithTradition),
    clergy_or_officiant: clean(req.body?.clergyName),
    cemetery_or_burial_place: clean(req.body?.cemeteryName),
    document_location: clean(req.body?.documentLocation),
    medical_records_location: clean(req.body?.medicalRecordsLocation),
  };

  try {
    const { data: existing } = await admin
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .eq('path', 'green')
      .eq('estate_name', personName)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const workflowRow = {
      user_id: user.id,
      name: `Plan for ${personName}`,
      estate_name: personName,
      deceased_name: null,
      coordinator_name: user.user_metadata?.full_name || user.email,
      coordinator_email: user.email,
      status: 'ready',
      trigger_type: 'death_confirmed',
      path: 'green',
      mode: 'green',
      setup_stage: 'ready',
      trigger_token: existing?.trigger_token || triggerToken,
      trigger_people: [executorEmail, secondConfirmerEmail].filter(Boolean),
      confirmation_count: secondConfirmerEmail ? 2 : 1,
      orchestration_summary: {
        ...(existing?.orchestration_summary || {}),
        planning_context: planningContext,
        trusted_advisors: {
          healthcare_proxy: planningContext.healthcare_proxy.name || null,
          executor: clean(req.body?.executorName) || null,
          cemetery: planningContext.cemetery_or_burial_place || null,
          clergy: planningContext.clergy_or_officiant || null,
          medical_records_location: planningContext.medical_records_location || null,
          document_location: planningContext.document_location || null,
        },
      },
      updated_at: now,
    };

    const workflowResult = existing?.id
      ? await admin.from('workflows').update(workflowRow).eq('id', existing.id).select().single()
      : await admin.from('workflows').insert([{ ...workflowRow, created_at: now }]).select().single();
    if (workflowResult.error || !workflowResult.data?.id) {
      return res.status(500).json({ error: workflowResult.error?.message || 'Passage could not save this planning estate yet.' });
    }

    const workflow = workflowResult.data;
    const tasks = buildPlanningTasks(planningContext).map(task => ({
      ...task,
      workflow_id: workflow.id,
      user_id: user.id,
      created_at: now,
      updated_at: now,
    }));
    const { error: taskError } = await admin.from('tasks').upsert(tasks, { onConflict: 'workflow_id,title', ignoreDuplicates: false });
    if (taskError) return res.status(500).json({ error: taskError.message || 'Could not save planning tasks.' });

    const inviteSeed = [
      {
        name: clean(req.body?.executorName) || 'Primary confirmation contact',
        email: executorEmail,
        phone: clean(req.body?.executorPhone),
        label: 'Primary confirmation contact',
      },
      secondConfirmerEmail ? {
        name: clean(req.body?.secondConfirmerName) || 'Second confirmation contact',
        email: secondConfirmerEmail,
        phone: clean(req.body?.secondConfirmerPhone),
        label: 'Second confirmation contact',
      } : null,
    ].filter(Boolean);

    const actionRows = [];
    for (const contact of inviteSeed) {
      actionRows.push({
        workflow_id: workflow.id,
        action_type: 'email',
        recipient_type: 'person',
        recipient_email: contact.email,
        recipient_phone: contact.phone || null,
        recipient_name: contact.name,
        task_title: contact.label,
        status: 'pending',
        delay_hours: 0,
        created_at: now,
        updated_at: now,
      });
      if (contact.phone) {
        actionRows.push({
          workflow_id: workflow.id,
          action_type: 'sms',
          recipient_type: 'person',
          recipient_email: contact.email,
          recipient_phone: contact.phone,
          recipient_name: contact.name,
          task_title: contact.label,
          status: 'pending',
          delay_hours: 0,
          created_at: now,
          updated_at: now,
        });
      }
    }

    let createdActions = [];
    if (actionRows.length) {
      const { data: actions, error: actionError } = await admin.from('workflow_actions').insert(actionRows).select('*');
      if (actionError) console.warn('planning invite queue:', actionError.message);
      createdActions = actions || [];
    }

    for (const contact of inviteSeed) {
      await admin.from('estate_access').upsert([{
        workflow_id: workflow.id,
        email: contact.email,
        role: 'participant',
        status: 'invited',
        updated_at: now,
      }], { onConflict: 'workflow_id,email', ignoreDuplicates: false }).then(() => {}, () => {});
    }

    const inviteResults = [];
    for (const action of createdActions) {
      inviteResults.push(await sendInvite({
        token,
        workflowId: workflow.id,
        action,
        personName,
        coordinatorName: user.user_metadata?.full_name || user.email,
        triggerToken: workflow.trigger_token,
      }));
    }

    await admin.from('estate_events').insert([{
      estate_id: workflow.id,
      event_type: 'planning_estate_saved',
      title: existing?.id ? 'Planning estate updated' : 'Planning estate saved',
      description: 'Confirmation contacts and planning tasks are saved. Nothing activates until confirmation.',
      actor: user.email,
      created_at: now,
    }]).then(() => {}, () => {});

    return res.status(200).json({
      success: true,
      workflowId: workflow.id,
      workflow,
      inviteResults,
    });
  } catch (err) {
    console.error('planningEstate:', err);
    return res.status(500).json({ error: err.message || 'Passage could not save this planning estate yet.' });
  }
}
