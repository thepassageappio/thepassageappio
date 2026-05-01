import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const CORE_TASKS = [
  {
    title: 'Contact the funeral home',
    description: 'Arrange transportation, first arrangements, documents needed, and itemized pricing.',
    category: 'service',
    priority: 'urgent',
    due_days_after_trigger: 0,
    position: 1,
    playbook_key: 'contact the funeral home',
    automation_level: 'PARTNER_HANDOFF',
    execution_kind: 'call',
    waiting_on: 'funeral home',
    partner_owner_role: 'funeral_home_director',
    funeral_home_eligible: true,
    proof_required: 'transportation or arrangement next step confirmed',
  },
  {
    title: 'Notify immediate family members',
    description: 'Closest family should hear directly before wider announcements or social posts.',
    category: 'notifications',
    priority: 'urgent',
    due_days_after_trigger: 0,
    position: 2,
    playbook_key: 'notify immediate family members',
    automation_level: 'SEND_TRACK',
    execution_kind: 'message',
    waiting_on: 'family confirmation',
    proof_required: 'family notified or assigned',
  },
  {
    title: 'Secure the home and valuables',
    description: 'Lock the residence. Check pets, mail, vehicle, doors, windows, valuables, and urgent safety concerns.',
    category: 'property',
    priority: 'urgent',
    due_days_after_trigger: 0,
    position: 3,
    playbook_key: 'secure the home and valuables',
    automation_level: 'SEND_TRACK',
    execution_kind: 'message',
    waiting_on: 'trusted local person',
    proof_required: 'home check confirmed',
  },
  {
    title: 'Order death certificates - minimum 15 copies',
    description: 'Banks, insurance, government, employers, and probate often require certified originals.',
    category: 'legal',
    priority: 'high',
    due_days_after_trigger: 3,
    position: 4,
    playbook_key: 'order death certificates minimum 15 copies',
    automation_level: 'PARTNER_HANDOFF',
    execution_kind: 'packet',
    waiting_on: 'funeral home or vital records office',
    partner_owner_role: 'funeral_home_director',
    funeral_home_eligible: true,
    proof_required: 'certificate order path confirmed',
  },
  {
    title: 'Notify Social Security Administration',
    description: 'SSA should be notified quickly. Survivor benefits may apply.',
    category: 'government',
    priority: 'normal',
    due_days_after_trigger: 7,
    position: 5,
    playbook_key: 'notify social security administration',
    automation_level: 'PARTNER_HANDOFF',
    execution_kind: 'packet',
    waiting_on: 'funeral director or SSA',
    partner_owner_role: 'funeral_home_director',
    funeral_home_eligible: true,
    proof_required: 'SSA notice or appointment path recorded',
  },
  {
    title: 'Notify primary bank and all financial institutions',
    description: 'Ask what is required for each account before sending documents.',
    category: 'financial',
    priority: 'normal',
    due_days_after_trigger: 7,
    position: 6,
    playbook_key: 'notify primary bank and all financial institutions',
    automation_level: 'PACKET',
    execution_kind: 'packet',
    waiting_on: 'bank or executor',
    proof_required: 'institution instructions recorded',
  },
];

const CORE_OUTCOMES = [
  {
    title: 'Choose who will call the funeral home',
    description: 'One calm call starts transportation, timing, and the first practical decisions.',
    why_it_matters: 'The funeral home often becomes the first coordination hub.',
    recommended_action: 'Confirm who will call or receive the first call, then record what the funeral home needs next.',
    reassurance: 'You only need the next concrete step, not every decision.',
    status: 'needs_owner',
    priority: 'critical',
    timeframe: 'now',
    timeframe_label: 'Now',
    next_action_cta: 'Assign funeral home caller',
    category: 'service',
    position: 1,
  },
  {
    title: 'Notify immediate family',
    description: 'The closest people should hear directly before wider announcements or social posts.',
    why_it_matters: 'This prevents confusion and protects the family from learning through the wrong channel.',
    recommended_action: 'Pick one person to handle the first calls or messages.',
    reassurance: 'Passage can prepare the wording so no one has to invent it while in shock.',
    status: 'needs_owner',
    priority: 'critical',
    timeframe: 'now',
    timeframe_label: 'Now',
    next_action_cta: 'Assign family notification',
    category: 'notifications',
    position: 2,
  },
  {
    title: 'Secure home, pets, and vehicle',
    description: 'A simple check prevents avoidable problems while everyone is focused on grief.',
    why_it_matters: 'Doors, pets, mail, vehicles, and valuables can need practical attention today.',
    recommended_action: 'Ask a trusted local person to check and report back.',
    reassurance: 'This can be delegated. The coordinator does not need to do it alone.',
    status: 'not_started',
    priority: 'high',
    timeframe: 'today',
    timeframe_label: 'Next 72 hours',
    next_action_cta: 'Assign home check',
    category: 'property',
    position: 3,
  },
];

function clean(value) {
  return String(value || '').trim();
}

function cleanContext(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    deathContext: clean(input.deathContext),
    pronouncementStatus: clean(input.pronouncementStatus),
    funeralHomeName: clean(input.funeralHomeName),
    cemeteryName: clean(input.cemeteryName),
    faithTradition: clean(input.faithTradition),
    clergyName: clean(input.clergyName),
    authorityName: clean(input.authorityName),
    hospitalOrHospiceContact: clean(input.hospitalOrHospiceContact),
    medicalRecordsLocation: clean(input.medicalRecordsLocation),
  };
}

function task(title, description, category, priority, dueDays, position, playbookKey, extras = {}) {
  return {
    title,
    description,
    category,
    priority,
    due_days_after_trigger: dueDays,
    position,
    playbook_key: playbookKey || title,
    ...extras,
  };
}

function conditionalTasksFor(context) {
  const tasks = [];
  let position = 7;
  const add = (...args) => tasks.push(task(...args));

  if (context.pronouncementStatus !== 'confirmed') {
    add(
      'Confirm official pronouncement of death',
      'Confirm who has officially pronounced death before transportation, paperwork, or release steps move forward.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm official pronouncement of death',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'doctor, hospice, hospital, or medical examiner', funeral_home_eligible: true, proof_required: 'pronouncement source recorded' }
    );
  }

  if (context.deathContext === 'hospice') {
    add(
      'Call hospice nurse or hospice agency',
      'Hospice usually guides pronouncement, equipment, medications, and funeral home release steps.',
      'medical',
      'urgent',
      0,
      position++,
      'call hospice nurse or hospice agency',
      { automation_level: 'SEND_TRACK', execution_kind: 'call', waiting_on: 'hospice nurse or agency', proof_required: 'hospice next step recorded' }
    );
  }

  if (['hospital', 'facility'].includes(context.deathContext)) {
    add(
      'Confirm hospital or facility release process',
      'Ask what the funeral home needs for pickup, whether a release is signed, and who the family should speak with.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm hospital or facility release process',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'hospital or facility staff', funeral_home_eligible: true, proof_required: 'release process recorded' }
    );
  }

  if (context.deathContext === 'unexpected') {
    add(
      'Confirm emergency or medical examiner next steps',
      'Unexpected deaths may involve 911, law enforcement, or a medical examiner before funeral arrangements can proceed.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm emergency or medical examiner next steps',
      { automation_level: 'EXTERNAL', execution_kind: 'call', waiting_on: '911, police, coroner, or medical examiner', proof_required: 'official next step recorded' }
    );
  }

  if (context.faithTradition || context.clergyName) {
    add(
      'Contact clergy or faith community',
      'Some traditions have timing, preparation, burial, cremation, or service requirements that should be known early.',
      'service',
      'urgent',
      0,
      position++,
      'contact clergy or faith community',
      { automation_level: 'SEND_TRACK', execution_kind: 'message', waiting_on: 'clergy or faith community', funeral_home_eligible: true, proof_required: 'faith timing or service guidance recorded' }
    );
  }

  if (context.cemeteryName) {
    add(
      'Confirm cemetery requirements',
      'Confirm plot, interment timing, paperwork, opening/closing fees, and who coordinates with the funeral home.',
      'service',
      'high',
      1,
      position++,
      'confirm cemetery requirements',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'cemetery', funeral_home_eligible: true, proof_required: 'cemetery requirements recorded' }
    );
  }

  add(
    'Identify healthcare proxy or legal decision-maker',
    context.authorityName ? `Record ${context.authorityName}'s authority and contact path so medical and release questions go to the right person.` : 'Identify who has authority for medical, release, and family decisions if questions arise.',
    'legal',
    'high',
    1,
    position++,
    'identify healthcare proxy or legal decision-maker',
    { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'family or proxy', proof_required: 'decision-maker recorded' }
  );

  add(
    'Locate medical records and key documents',
    'Record where the healthcare proxy, advance directive, medication list, insurance cards, recent medical records, and doctor contacts can be found.',
    'documents',
    'high',
    1,
    position++,
    'locate medical records and key documents',
    { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'family record', proof_required: 'document location saved' }
  );

  return tasks;
}

async function getUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await authClient.auth.getUser(token);
  return data?.user || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!service) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const user = await getUser(req);
  if (!user?.id || !user?.email) {
    return res.status(401).json({ error: 'Please sign in to save this command center.' });
  }

  const deceasedName = clean(req.body?.deceasedName) || 'Loved One';
  const coordinatorName = clean(req.body?.coordinatorName) || user.user_metadata?.full_name || user.email;
  const coordinatorEmail = clean(req.body?.coordinatorEmail) || user.email;
  const dateOfDeath = clean(req.body?.dateOfDeath) || null;
  const primaryOwner = req.body?.primaryOwner || null;
  const context = cleanContext(req.body?.context);

  let existingQuery = admin
    .from('workflows')
    .select('*')
    .eq('user_id', user.id)
    .eq('path', 'red')
    .eq('deceased_name', deceasedName)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (dateOfDeath) existingQuery = existingQuery.eq('date_of_death', dateOfDeath);
  const { data: existing } = await existingQuery.maybeSingle();

  const workflowRow = {
    user_id: user.id,
    name: `Estate of ${deceasedName}`,
    deceased_name: deceasedName,
    coordinator_name: coordinatorName,
    coordinator_email: coordinatorEmail,
    date_of_death: dateOfDeath,
    status: 'active',
    trigger_type: 'death_confirmed',
    path: 'red',
    mode: 'red',
    orchestration_summary: {
      ...(existing?.orchestration_summary || {}),
      chaplain_context: context,
      trusted_advisors: {
        funeral_home: context.funeralHomeName || null,
        cemetery: context.cemeteryName || null,
        clergy: context.clergyName || null,
        healthcare_proxy_or_decision_maker: context.authorityName || null,
        hospital_hospice_or_doctor: context.hospitalOrHospiceContact || null,
        medical_records_location: context.medicalRecordsLocation || null,
      },
    },
    updated_at: new Date().toISOString(),
  };

  const workflowResult = existing?.id
    ? await admin.from('workflows').update(workflowRow).eq('id', existing.id).select().single()
    : await admin.from('workflows').insert([{ ...workflowRow, created_at: new Date().toISOString() }]).select().single();
  if (workflowResult.error || !workflowResult.data?.id) {
    return res.status(500).json({ error: workflowResult.error?.message || 'Could not create estate.' });
  }

  const workflow = workflowResult.data;
  const ownerLabel = clean(primaryOwner?.name);
  const ownerEmail = clean(primaryOwner?.email);
  const ownerPhone = clean(primaryOwner?.phone);

  const allTasks = CORE_TASKS.concat(conditionalTasksFor(context));
  const tasks = allTasks.map(({ position, ...task }, index) => ({
    ...task,
    workflow_id: workflow.id,
    user_id: user.id,
    position,
    status: index === 0 && ownerLabel ? 'assigned' : 'pending',
    assigned_to_name: index === 0 && ownerLabel ? ownerLabel : null,
    assigned_to_email: index === 0 && ownerEmail ? ownerEmail : null,
    recipient: index === 0 ? (ownerEmail || ownerPhone || ownerLabel || null) : null,
    channel: index === 0 && ownerEmail ? 'email' : index === 0 && ownerPhone ? 'sms' : null,
    last_action_at: index === 0 && ownerLabel ? new Date().toISOString() : null,
    last_actor: index === 0 && ownerLabel ? coordinatorName : null,
  }));
  await admin.from('tasks').upsert(tasks, { onConflict: 'workflow_id,title', ignoreDuplicates: false });

  const outcomes = CORE_OUTCOMES.map((outcome, index) => ({
    ...outcome,
    estate_id: workflow.id,
    owner_label: index === 0 && ownerLabel ? ownerLabel : null,
    status: index === 0 && ownerLabel ? 'in_progress' : outcome.status,
  }));
  for (const outcome of outcomes) {
    const { data: existingOutcome } = await admin
      .from('outcomes')
      .select('id')
      .eq('estate_id', workflow.id)
      .eq('title', outcome.title)
      .maybeSingle();
    if (existingOutcome?.id) {
      await admin.from('outcomes').update({ ...outcome, updated_at: new Date().toISOString() }).eq('id', existingOutcome.id);
    } else {
      await admin.from('outcomes').insert([outcome]);
    }
  }

  if (ownerEmail && ownerEmail.toLowerCase() !== user.email.toLowerCase()) {
    const accessRow = {
      workflow_id: workflow.id,
      email: ownerEmail.toLowerCase(),
      role: 'participant',
      status: 'invited',
      updated_at: new Date().toISOString(),
    };
    const { data: existingAccess } = await admin
      .from('estate_access')
      .select('id')
      .eq('workflow_id', workflow.id)
      .ilike('email', ownerEmail)
      .maybeSingle();
    if (existingAccess?.id) await admin.from('estate_access').update(accessRow).eq('id', existingAccess.id);
    else await admin.from('estate_access').insert([accessRow]);
  }

  await admin.from('estate_events').insert([{
    estate_id: workflow.id,
    event_type: 'urgent_command_center_created',
    title: existing?.id ? 'Urgent command center updated' : 'Urgent command center created',
    description: ownerLabel ? `First task assigned to ${ownerLabel}.` : 'First urgent tasks were prepared.',
    actor: coordinatorName,
  }]);

  return res.status(200).json({ estateId: workflow.id, workflow });
}
