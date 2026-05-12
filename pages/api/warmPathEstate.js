import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';
import { saveFuneralHomePipelineRequest } from '../../lib/funeralHomePipeline';

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

function careContextLabel(context = {}) {
  const providerType = clean(context.provider_type || context.care_provider_type || '').toLowerCase();
  if (providerType === 'care_facility') return 'care facility';
  if (providerType === 'senior_living') return 'senior living community';
  if (providerType === 'home_care') return 'home care team';
  return 'hospice or care team';
}

function careTeamName(context = {}) {
  return clean(context.care_team_name || context.facility_name || context.hospice_agency);
}

function careTeamContact(context = {}) {
  return clean(context.care_team_contact || context.facility_contact || context.hospice_contact);
}

function careTeamPhone(context = {}) {
  return clean(context.care_team_phone || context.facility_phone || context.hospice_phone);
}

function buildWarmPathTasks(context = {}) {
  const careLabel = careContextLabel(context);
  const teamName = careTeamName(context);
  const teamContact = careTeamContact(context);
  const teamPhone = careTeamPhone(context);
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
      'Record care team and first call path',
      `Save the ${careLabel}, on-call or release contact, and the first call path if death occurs.`,
      'medical',
      'high',
      'confirm hospital or facility release',
      { execution_kind: 'record', waiting_on: `${careLabel} contact`, proof_required: 'care contact and first call path recorded' }
    ),
    warmTask(
      'Prepare the when-it-happens plan',
      `Prepare the first-hour plan so the family knows who calls the ${careLabel}, who calls the funeral home, and what proof to record.`,
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
      'Prepare contacts, dates, preferences, care context, missing items, and proof needs for the funeral home to review when approved.',
      'service',
      'normal',
      'prepare for funeral home meeting',
      { execution_kind: 'packet', automation_level: 'PACKET', waiting_on: 'family approval', funeral_home_eligible: true, proof_required: 'handoff packet reviewed' }
    ),
  ].map(task => {
    if (task.title === 'Record care team and first call path' && (teamName || teamContact || teamPhone)) {
      return { ...task, status: 'handled', notes: `Care context saved: ${[teamName, teamContact, teamPhone].filter(Boolean).join(' - ')}` };
    }
    if (task.title === 'Record preferred funeral home or undecided status' && context.funeral_home_name) {
      return { ...task, status: 'handled', notes: `Preferred funeral home: ${context.funeral_home_name}` };
    }
    return task;
  });
}

function dateOnly(value) {
  const text = clean(value);
  if (!text) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function timelineAnchorsForContext(context = {}) {
  return [
    ['pronouncement', 'Official pronouncement', dateOnly(context.pronouncement_date), 'Known only if the family already has it.'],
    ['arrangement', 'Arrangement meeting', dateOnly(context.arrangement_date), 'Planning date captured before the funeral-home handoff.'],
    ['funeral', 'Funeral / memorial service', dateOnly(context.service_date), 'Service or memorial date if already known.'],
    ['burial', 'Burial / committal', dateOnly(context.burial_date), 'Burial, committal, cemetery, or cremation date if already known.'],
    ['shiva', 'Shiva / mourning period', dateOnly(context.shiva_date), 'Shiva or mourning-period date if already known.'],
    ['reception', 'Reception / gathering', dateOnly(context.reception_date), 'Reception or family gathering date if already known.'],
  ].filter(item => item[2]).map(item => ({
    event_type: item[0],
    name: item[1],
    date: item[2],
    notes: item[3],
  }));
}

function missingTimelineWatch(context = {}) {
  return [
    !dateOnly(context.date_of_death) ? 'Date of death when it occurs' : '',
    !dateOnly(context.pronouncement_date) ? 'Pronouncement time and source' : '',
    'Removal or transfer time',
    !dateOnly(context.arrangement_date) ? 'Arrangement meeting date' : '',
    !dateOnly(context.service_date) ? 'Service or memorial date' : '',
    !dateOnly(context.burial_date) ? 'Burial, committal, cemetery, or cremation date' : '',
  ].filter(Boolean);
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
    lifecycle_phase: 'care_preparation',
    provider_type: clean(req.body?.providerType) || clean(req.body?.careProviderType) || 'hospice',
    care_setting: clean(req.body?.careSetting),
    for_whom: lovedOneName,
    family_coordinator: coordinatorName,
    caregiver_name: clean(req.body?.caregiverName),
    hospice_agency: clean(req.body?.hospiceAgency),
    hospice_contact: clean(req.body?.hospiceContact),
    hospice_phone: clean(req.body?.hospicePhone),
    facility_name: clean(req.body?.facilityName),
    facility_contact: clean(req.body?.facilityContact),
    facility_phone: clean(req.body?.facilityPhone),
    care_team_name: clean(req.body?.careTeamName) || clean(req.body?.hospiceAgency) || clean(req.body?.facilityName),
    care_team_contact: clean(req.body?.careTeamContact) || clean(req.body?.hospiceContact) || clean(req.body?.facilityContact),
    care_team_phone: clean(req.body?.careTeamPhone) || clean(req.body?.hospicePhone) || clean(req.body?.facilityPhone),
    funeral_home_name: clean(req.body?.funeralHomeName),
    funeral_home_address: clean(req.body?.funeralHomeAddress),
    funeral_home_city: clean(req.body?.funeralHomeCity),
    funeral_home_state: clean(req.body?.funeralHomeState),
    funeral_home_zip: clean(req.body?.funeralHomeZip),
    funeral_home_country: clean(req.body?.funeralHomeCountry),
    funeral_home_place_id: clean(req.body?.funeralHomePlaceId),
    authority_contact: clean(req.body?.authorityContact),
    disposition_preference: clean(req.body?.dispositionPreference),
    service_preference: clean(req.body?.servicePreference),
    expected_window: clean(req.body?.expectedWindow),
    date_of_death: dateOnly(req.body?.dateOfDeath),
    pronouncement_date: dateOnly(req.body?.pronouncementDate),
    arrangement_date: dateOnly(req.body?.arrangementDate),
    service_date: dateOnly(req.body?.serviceDate),
    burial_date: dateOnly(req.body?.burialDate),
    shiva_date: dateOnly(req.body?.shivaDate),
    reception_date: dateOnly(req.body?.receptionDate),
    notes: clean(req.body?.notes),
  };
  const timelineAnchors = timelineAnchorsForContext(warmContext);

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
      activation_status: 'activated',
      trigger_type: 'death_confirmed',
      path: 'warm',
      mode: 'warm',
      setup_stage: 'care_preparation',
      orchestration_summary: {
        ...(existing?.orchestration_summary || {}),
        lifecycle_phase: 'care_preparation',
        warm_path_context: warmContext,
        hospice_context: warmContext,
        timeline_anchors: timelineAnchors,
        missing_timeline_watch: missingTimelineWatch(warmContext),
        trusted_advisors: {
          ...(existing?.orchestration_summary?.trusted_advisors || {}),
          hospice_or_care_team: warmContext.care_team_contact || warmContext.care_team_name || null,
          funeral_home: warmContext.funeral_home_name ? {
            name: warmContext.funeral_home_name,
            address: warmContext.funeral_home_address || null,
            city: warmContext.funeral_home_city || null,
            state: warmContext.funeral_home_state || null,
            postal_code: warmContext.funeral_home_zip || null,
            country: warmContext.funeral_home_country || null,
            place_id: warmContext.funeral_home_place_id || null,
          } : null,
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
    if (warmContext.funeral_home_name) {
      const pipelineResult = await saveFuneralHomePipelineRequest({
        admin,
        user,
        workflow,
        provider: {
          name: warmContext.funeral_home_name,
          address: warmContext.funeral_home_address,
          city: warmContext.funeral_home_city,
          state: warmContext.funeral_home_state,
          zip: warmContext.funeral_home_zip,
          country: warmContext.funeral_home_country,
          placeId: warmContext.funeral_home_place_id,
        },
        source: 'warm_path',
        urgency: 'planning',
        familyPermission: true,
        notes: 'Warm-path care-prep record saved a preferred funeral home. No outreach was sent automatically.',
        sourceUrl: '/hospice',
      });
      if (pipelineResult?.success) {
        await admin.from('estate_events').insert([{
          estate_id: workflow.id,
          event_type: 'funeral_home_request_saved',
          title: pipelineResult.matchedOrganization ? 'Partner funeral home request saved' : 'Funeral home request saved for Passage review',
          description: pipelineResult.matchedOrganization
            ? `${warmContext.funeral_home_name} is a Passage partner. The request is available in the partner inbound queue.`
            : `${warmContext.funeral_home_name} was saved as a family-requested funeral home for Passage outreach review.`,
          payload: {
            provider: {
              name: warmContext.funeral_home_name,
              address: warmContext.funeral_home_address,
              city: warmContext.funeral_home_city,
              state: warmContext.funeral_home_state,
              zip: warmContext.funeral_home_zip,
              place_id: warmContext.funeral_home_place_id,
            },
            request_id: pipelineResult.request?.id || null,
            matched_organization_id: pipelineResult.matchedOrganization?.id || null,
          },
          created_at: now,
        }]).then(() => {}, () => {});
      }
    }

    const tasks = buildWarmPathTasks(warmContext).map(task => ({
      ...task,
      workflow_id: workflow.id,
      user_id: user.id,
      last_actor: ['handled', 'completed', 'done'].includes(task.status) ? coordinatorName : null,
      last_action_at: ['handled', 'completed', 'done'].includes(task.status) ? now : null,
      created_at: now,
      updated_at: now,
    }));
    const { error: taskError } = await admin.from('tasks').upsert(tasks, { onConflict: 'workflow_id,title', ignoreDuplicates: false });
    if (taskError) return res.status(500).json({ error: taskError.message || 'Could not save warm-path tasks.' });

    if (timelineAnchors.length) {
      const eventTypes = timelineAnchors.map(item => item.event_type);
      const { data: existingEvents } = await admin
        .from('estate_events')
        .select('id,event_type')
        .eq('estate_id', workflow.id)
        .in('event_type', eventTypes);
      for (const anchor of timelineAnchors) {
        const existingEvent = (existingEvents || []).find(item => item.event_type === anchor.event_type);
        const row = {
          estate_id: workflow.id,
          event_type: anchor.event_type,
          name: anchor.name,
          title: anchor.name,
          date: anchor.date,
          notes: anchor.notes,
          description: anchor.notes,
          actor: coordinatorName,
        };
        if (existingEvent?.id) await admin.from('estate_events').update(row).eq('id', existingEvent.id).then(() => {}, () => {});
        else await admin.from('estate_events').insert([row]).then(() => {}, () => {});
      }
    }

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
