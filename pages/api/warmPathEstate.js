import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
function authClient() {
  if (!url || !anon) return null;
  return createClient(url, anon);
}

function adminClient() {
  if (!url || !service) return null;
  return createClient(url, service);
}

function clean(value) {
  return String(value || '').trim();
}

function safeTaskCategory(category) {
  const value = clean(category).toLowerCase();
  const allowed = new Set(['notifications', 'property', 'legal', 'government', 'financial', 'personal', 'memorial', 'digital', 'service', 'logistics', 'medical']);
  return allowed.has(value) ? value : 'personal';
}

function warmTask(title, description, category, priority, playbookKey, extras = {}) {
  const playbook = getTaskPlaybook(playbookKey || title);
  return {
    title,
    description,
    category: safeTaskCategory(category),
    priority: priority || 'normal',
    due_days_after_trigger: extras.due_days_after_trigger ?? 0,
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

function buildWarmPathTasks(context = {}) {
  return [
    warmTask(
      'Name the family coordinator',
      'Choose the person who will own family updates, permissions, and the first handoff if death occurs.',
      'personal',
      'high',
      'confirm activation contacts',
      { execution_kind: 'record', waiting_on: 'family coordinator', proof_required: 'coordinator and backup recorded' }
    ),
    warmTask(
      'Record hospice agency and on-call line',
      'Save the hospice agency, on-call number, nurse or social worker, and the first call path for an expected death.',
      'medical',
      'high',
      'confirm hospital or facility release',
      { execution_kind: 'record', waiting_on: 'hospice contact', proof_required: 'hospice contact and first call path recorded' }
    ),
    warmTask(
      'Prepare the when-it-happens plan',
      'Prepare the first-hour plan so the family knows who calls hospice, who calls the funeral home, and what proof to record.',
      'logistics',
      'high',
      'prepare for funeral home meeting',
      { execution_kind: 'packet', automation_level: 'PACKET', waiting_on: 'family review', proof_required: 'first-hour plan reviewed' }
    ),
    warmTask(
      'Record preferred funeral home or undecided status',
      'Record the preferred funeral home, undecided status, or who should help choose when the family is ready.',
      'service',
      'normal',
      'contact the funeral home',
      { execution_kind: 'record', waiting_on: 'family preference', funeral_home_eligible: true, proof_required: 'funeral home preference saved' }
    ),
    warmTask(
      'Prepare family update list',
      'Create the recipient list and draft wording for close family and friends. Nothing sends until approved.',
      'notifications',
      'normal',
      'notify immediate family members',
      { execution_kind: 'message', automation_level: 'SEND_TRACK', waiting_on: 'recipient list', proof_required: 'recipient list and draft reviewed' }
    ),
    warmTask(
      'Prepare funeral-home handoff packet',
      'Prepare contacts, dates, preferences, hospice context, missing items, and proof needs for the funeral home to review when approved.',
      'service',
      'normal',
      'prepare for funeral home meeting',
      { execution_kind: 'packet', automation_level: 'PACKET', waiting_on: 'family approval', funeral_home_eligible: true, proof_required: 'handoff packet reviewed' }
    ),
  ].map(task => {
    if (task.title === 'Record hospice agency and on-call line' && (context.hospice_agency || context.hospice_contact)) {
      return { ...task, status: 'done', notes: `Hospice context saved: ${[context.hospice_agency, context.hospice_contact, context.hospice_phone].filter(Boolean).join(' - ')}` };
    }
    if (task.title === 'Record preferred funeral home or undecided status' && context.funeral_home_name) {
      return { ...task, status: 'done', notes: `Preferred funeral home: ${context.funeral_home_name}` };
    }
    return task;
  });
}

async function getUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { user: null, token: '' };
  const client = authClient();
  if (!client) return { user: null, token };
  const { data } = await client.auth.getUser(token);
  return { user: data?.user || null, token };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user } = await getUser(req);
  if (!user?.id || !user?.email) return res.status(401).json({ error: 'Sign in once so Passage can save this warm-path workspace.' });
  const admin = adminClient();
  if (!admin) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const lovedOneName = clean(req.body?.lovedOneName);
  if (!lovedOneName) return res.status(400).json({ error: 'Add the name this workspace is for before saving.' });

  const coordinatorName = clean(req.body?.coordinatorName) || user.user_metadata?.full_name || user.email;
  const coordinatorEmail = clean(req.body?.coordinatorEmail) || user.email;
  const now = new Date().toISOString();
  const warmContext = {
    lifecycle_phase: 'hospice_preparation',
    for_whom: lovedOneName,
    family_coordinator: coordinatorName,
    caregiver_name: clean(req.body?.caregiverName),
    hospice_agency: clean(req.body?.hospiceAgency),
    hospice_contact: clean(req.body?.hospiceContact),
    hospice_phone: clean(req.body?.hospicePhone),
    funeral_home_name: clean(req.body?.funeralHomeName),
    authority_contact: clean(req.body?.authorityContact),
    disposition_preference: clean(req.body?.dispositionPreference),
    service_preference: clean(req.body?.servicePreference),
    expected_window: clean(req.body?.expectedWindow),
    notes: clean(req.body?.notes),
  };

  try {
    const { data: existing } = await admin
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .eq('path', 'warm')
      .eq('estate_name', lovedOneName)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const workflowRow = {
      user_id: user.id,
      name: `Preparing for ${lovedOneName}`,
      estate_name: lovedOneName,
      deceased_name: null,
      coordinator_name: coordinatorName,
      coordinator_email: coordinatorEmail,
      coordinator_phone: clean(req.body?.coordinatorPhone),
      status: 'active',
      trigger_type: 'death_confirmed',
      path: 'warm',
      mode: 'warm',
      setup_stage: 'hospice_preparation',
      orchestration_summary: {
        ...(existing?.orchestration_summary || {}),
        lifecycle_phase: 'hospice_preparation',
        warm_path_context: warmContext,
        hospice_context: warmContext,
        timeline_anchors: [],
        missing_timeline_watch: [
          'Date of death when it occurs',
          'Pronouncement time and source',
          'Removal or transfer time',
          'Arrangement meeting date',
          'Service or memorial date',
        ],
        trusted_advisors: {
          ...(existing?.orchestration_summary?.trusted_advisors || {}),
          hospice_or_care_team: warmContext.hospice_contact || warmContext.hospice_agency || null,
          funeral_home: warmContext.funeral_home_name || null,
          healthcare_proxy_or_decision_maker: warmContext.authority_contact || null,
        },
      },
      updated_at: now,
    };

    const workflowResult = existing?.id
      ? await admin.from('workflows').update(workflowRow).eq('id', existing.id).select().single()
      : await admin.from('workflows').insert([{ ...workflowRow, created_at: now }]).select().single();
    if (workflowResult.error || !workflowResult.data?.id) {
      return res.status(500).json({ error: workflowResult.error?.message || 'Passage could not save this warm-path workspace yet.' });
    }

    const workflow = workflowResult.data;
    const tasks = buildWarmPathTasks(warmContext).map(task => ({
      ...task,
      workflow_id: workflow.id,
      user_id: user.id,
      last_actor: task.status === 'done' ? coordinatorName : null,
      last_action_at: task.status === 'done' ? now : null,
      created_at: now,
      updated_at: now,
    }));
    const { error: taskError } = await admin.from('tasks').upsert(tasks, { onConflict: 'workflow_id,title', ignoreDuplicates: false });
    if (taskError) return res.status(500).json({ error: taskError.message || 'Could not save warm-path tasks.' });

    await admin.from('estate_events').insert([{
      estate_id: workflow.id,
      event_type: existing?.id ? 'warm_path_updated' : 'warm_path_started',
      title: existing?.id ? 'Warm-path workspace updated' : 'Warm-path workspace started',
      description: 'Preparing during care workspace saved. Nothing was shared or sent.',
      actor: coordinatorName,
    }]).then(() => {}, () => {});

    return res.status(200).json({ estateId: workflow.id, workflow });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not save warm-path workspace.' });
  }
}
