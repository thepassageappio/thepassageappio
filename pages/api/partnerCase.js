import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getTaskPlaybook } from '../../lib/taskPlaybooks';
import { recordStatusEvent } from '../../lib/taskStatus';
import { isPassageAdmin } from '../../lib/adminAccess';

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

function schemaColumnError(error) {
  const message = String(error?.message || error || '');
  return /schema cache|column .* does not exist|Could not find the .* column|generated column|cannot insert a non-DEFAULT value into column/i.test(message);
}

async function createFamilyParticipantLink({ workflowId, taskId, familyName, familyEmail, familyPhone, now }) {
  const email = String(familyEmail || '').trim().toLowerCase();
  if (!workflowId || !email) return { created: false, reason: 'missing_family_email' };

  const inviteToken = randomUUID();
  const base = {
    email,
    name: String(familyName || email).trim(),
    phone: familyPhone || null,
    role: 'family_coordinator',
    invite_status: 'draft',
    invite_token: inviteToken,
    created_at: now,
    updated_at: now,
  };
  const attempts = [
    { estate_id: workflowId, ...base, task_id: taskId || null },
    { estate_id: workflowId, ...base },
    {
      estate_id: workflowId,
      email,
      role: 'family_coordinator',
      invite_status: 'draft',
      invite_token: inviteToken,
      created_at: now,
      updated_at: now,
    },
    {
      workflow_id: workflowId,
      email,
      name: String(familyName || email).trim(),
      phone: familyPhone || null,
      role: 'family_coordinator',
      invite_status: 'draft',
      invite_token: inviteToken,
      task_id: taskId || null,
      created_at: now,
      updated_at: now,
    },
  ];

  for (const row of attempts) {
    const result = await admin.from('estate_participants').insert([row]).select('id,invite_token,invite_status').maybeSingle();
    if (!result.error) {
      return {
        created: true,
        id: result.data?.id || null,
        inviteToken: result.data?.invite_token || inviteToken,
        inviteStatus: result.data?.invite_status || row.invite_status || 'draft',
      };
    }
    if (!schemaColumnError(result.error)) return { created: false, error: result.error.message };
  }

  return { created: false, error: 'Could not create family participant link with the available schema.' };
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
    locationName,
    locationAddress,
    locationCity,
    locationState,
    locationZip,
    locationCountry,
    locationPlaceId,
    isPrepaid,
    totalCaseValue,
    prepaidAmount,
    demo,
    demoType,
    demoLogoUrl,
    demoPrimaryColor,
    pronouncementDate,
    releaseDate,
    arrangementDate,
    visitationDate,
    funeralDate,
    burialDate,
    shivaDate,
    receptionDate,
    obituaryDeadline,
  } = req.body || {};

  const normalizedCaseType = caseType === 'preneed' || caseType === 'prepaid' ? 'preneed' : 'immediate';
  const subjectName = String(personName || deceasedName || '').trim();
  if (!subjectName) return res.status(400).json({ error: 'Add the person or family name to create a case.' });

  try {
    const email = user.email.toLowerCase();
    const isAdminDemo = isPassageAdmin(email);
    if (demo && !isAdminDemo) {
      return res.status(403).json({ error: 'Demo cases are only available to Passage admins.' });
    }
    let { data: membership } = await admin
      .from('organization_members')
      .select('organization_id, role, status, organizations(id,name,type)')
      .ilike('email', email)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();
    const partnerLocation = {
      name: String(locationName || '').trim() || null,
      address: String(locationAddress || '').trim() || null,
      city: String(locationCity || '').trim() || null,
      state: String(locationState || '').trim() || null,
      postal_code: String(locationZip || '').trim() || null,
      country: String(locationCountry || '').trim() || null,
      place_id: String(locationPlaceId || '').trim() || null,
    };
    const hasPartnerLocation = Object.values(partnerLocation).some(Boolean);
    const timelineAnchors = [
      ['pronouncement', 'Official pronouncement', pronouncementDate, 'Official death pronouncement date if known.'],
      ['release', 'Release / pickup', releaseDate, 'Hospital, facility, hospice, or pickup timing if known.'],
      ['arrangement', 'Arrangement meeting', arrangementDate, 'Known arrangement meeting date.'],
      ['visitation', 'Wake / visitation', visitationDate, 'Known wake, visitation, calling hours, or shiva date.'],
      ['funeral', 'Funeral / memorial service', funeralDate, 'Known funeral or memorial service date.'],
      ['burial', 'Burial / committal', burialDate, 'Known burial, committal, cremation, or cemetery date.'],
      ['shiva', 'Shiva / mourning period', shivaDate, 'Known shiva or mourning-period start date.'],
      ['reception', 'Reception / gathering', receptionDate, 'Known reception or family gathering date.'],
      ['obituary_deadline', 'Obituary deadline', obituaryDeadline, 'Known obituary submission or publication deadline.'],
    ].filter(item => item[2]).map(item => ({ event_type: item[0], name: item[1], date: item[2], notes: item[3] }));
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
    if (demo && organizationId) {
      organizationName = String(funeralHomeName || '').trim() || organizationName;
      await admin.from('organizations').update({
        name: organizationName,
        from_name: organizationName,
        logo_url: String(demoLogoUrl || '').trim() || null,
        primary_color: String(demoPrimaryColor || '').trim() || '#6b8f71',
        support_email: email,
        white_label_enabled: true,
        updated_at: now,
      }).eq('id', organizationId);
    }
    const { data: workflow, error: workflowError } = await admin.from('workflows').insert([{
      user_id: user.id,
      name: `${demo ? 'Demo - ' : ''}${subjectName} - ${normalizedCaseType === 'immediate' ? 'family case' : 'planning case'}`,
      estate_name: subjectName,
      deceased_name: normalizedCaseType === 'immediate' ? subjectName : null,
      date_of_death: normalizedCaseType === 'immediate' ? (dateOfDeath || null) : null,
      coordinator_name: coordinatorName || '',
      coordinator_email: coordinatorEmail || email,
      coordinator_phone: coordinatorPhone || null,
      status: 'active',
      activation_status: 'activated',
      trigger_type: 'death_confirmed',
      path: normalizedCaseType === 'immediate' ? 'red' : 'green',
      mode: normalizedCaseType === 'immediate' ? 'red' : 'green',
      setup_stage: normalizedCaseType === 'immediate' ? 'active' : 'ready',
      organization_id: organizationId,
      organization_case_reference: demo ? (caseReference || `DEMO-${String(demoType || 'CASE').toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`) : (caseReference || null),
      partner_created_by: user.id,
      orchestration_summary: {
        partner_case_type: normalizedCaseType,
        partner_setup_stage: `partner_${normalizedCaseType}_created`,
        partner_financials: {
          is_prepaid: Boolean(isPrepaid || caseType === 'prepaid'),
          total_case_value: String(totalCaseValue || '').trim() || null,
          prepaid_amount: String(prepaidAmount || '').trim() || null,
        },
        partner_location: hasPartnerLocation ? partnerLocation : null,
        timeline_anchors: timelineAnchors,
        missing_timeline_watch: normalizedCaseType === 'immediate' ? [
          !pronouncementDate ? 'official pronouncement date' : '',
          !releaseDate ? 'release or pickup date' : '',
          !arrangementDate ? 'arrangement meeting date' : '',
          !visitationDate ? 'wake / visitation date' : '',
          !funeralDate ? 'funeral or memorial date' : '',
          !burialDate ? 'burial / cremation date' : '',
          !shivaDate ? 'shiva or mourning-period date' : '',
          !obituaryDeadline ? 'obituary deadline' : '',
        ].filter(Boolean) : [],
        demo_type: demo ? (demoType || 'local') : null,
      },
      created_at: now,
      updated_at: now,
    }]).select('id').single();
    if (workflowError) throw workflowError;

    if (timelineAnchors.length) {
      await admin.from('estate_events').insert(timelineAnchors.map(anchor => ({
        estate_id: workflow.id,
        event_type: anchor.event_type,
        name: anchor.name,
        title: anchor.name,
        date: anchor.date,
        location_name: partnerLocation.name || null,
        location_address: partnerLocation.address || null,
        notes: anchor.notes,
        description: anchor.notes,
        actor: email,
        created_at: now,
      }))).then(() => {}, () => {});
    }

    const sourceTasks = normalizedCaseType === 'immediate' ? PARTNER_TASKS : PRENEED_TASKS;
    const rows = sourceTasks.map(([title, description], index) => {
      const playbook = getTaskPlaybook(title);
      return {
        workflow_id: workflow.id,
        user_id: user.id,
        title,
        description,
        category: 'service',
        priority: index < 3 ? 'urgent' : 'high',
        due_days_after_trigger: index < 3 ? 1 : 3,
        status: 'pending',
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
    const { data: createdTasks, error: tasksError } = await admin.from('tasks').insert(rows).select('id,title,workflow_id');
    if (tasksError) throw tasksError;
    const familyParticipant = await createFamilyParticipantLink({
      workflowId: workflow.id,
      taskId: createdTasks?.[0]?.id || null,
      familyName: coordinatorName || 'Family coordinator',
      familyEmail: coordinatorEmail || email,
      familyPhone: coordinatorPhone || null,
      now,
    });
    if (familyParticipant.created) {
      await admin.from('estate_events').insert([{
        estate_id: workflow.id,
        event_type: 'family_participant_link_created',
        title: 'Family command-center link prepared',
        description: `${coordinatorEmail || email} can accept access to this Passage case.`,
        actor: email,
      }]).then(() => {}, () => {});
    }

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
        detail: `${second.title} prepared for the family. Waiting for confirmation.`,
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
        created_at: now,
      }]).then(() => {}, () => {});
    }

    await admin.from('estate_access').insert([{
      workflow_id: workflow.id,
      user_id: user.id,
      email,
      role: 'external_partner',
      status: 'active',
      created_at: now,
      updated_at: now,
    }]).then(() => {}, () => {});

    return res.status(200).json({ success: true, workflowId: workflow.id, organizationId, familyParticipant });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not create partner case.' });
  }
}
