import { createClient } from '@supabase/supabase-js';
import { saveFuneralHomePipelineRequest } from '../../lib/funeralHomePipeline';

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
    withPersonNow: clean(input.withPersonNow),
    pronouncementStatus: clean(input.pronouncementStatus),
    authorityStatus: clean(input.authorityStatus),
    emergencyCalled: clean(input.emergencyCalled),
    funeralHomeName: clean(input.funeralHomeName),
    funeralHomeAddress: clean(input.funeralHomeAddress),
    funeralHomeCity: clean(input.funeralHomeCity),
    funeralHomeState: clean(input.funeralHomeState),
    funeralHomeZip: clean(input.funeralHomeZip),
    funeralHomeCountry: clean(input.funeralHomeCountry),
    funeralHomeHandoffIntent: clean(input.funeralHomeHandoffIntent),
    funeralHomeReferralCity: clean(input.funeralHomeReferralCity),
    funeralHomeReferralState: clean(input.funeralHomeReferralState),
    funeralHomeReferralZip: clean(input.funeralHomeReferralZip),
    funeralHomeReferralNote: clean(input.funeralHomeReferralNote),
    cemeteryName: clean(input.cemeteryName),
    cemeteryAddress: clean(input.cemeteryAddress),
    cemeteryCity: clean(input.cemeteryCity),
    cemeteryState: clean(input.cemeteryState),
    cemeteryZip: clean(input.cemeteryZip),
    cemeteryCountry: clean(input.cemeteryCountry),
    faithTradition: clean(input.faithTradition),
    clergyName: clean(input.clergyName),
    authorityName: clean(input.authorityName),
    hospitalOrHospiceContact: clean(input.hospitalOrHospiceContact),
    hospitalOrHospiceAddress: clean(input.hospitalOrHospiceAddress),
    hospitalOrHospiceCity: clean(input.hospitalOrHospiceCity),
    hospitalOrHospiceState: clean(input.hospitalOrHospiceState),
    hospitalOrHospiceZip: clean(input.hospitalOrHospiceZip),
    hospitalOrHospiceCountry: clean(input.hospitalOrHospiceCountry),
    medicalRecordsLocation: clean(input.medicalRecordsLocation),
    pronouncementDate: clean(input.pronouncementDate),
    releaseDate: clean(input.releaseDate),
    arrangementDate: clean(input.arrangementDate),
    visitationDate: clean(input.visitationDate),
    funeralDate: clean(input.funeralDate),
    burialDate: clean(input.burialDate),
    shivaDate: clean(input.shivaDate),
    receptionDate: clean(input.receptionDate),
    obituaryDeadline: clean(input.obituaryDeadline),
  };
}

function timelineAnchorsForContext(context) {
  return [
    ['pronouncement', 'Official pronouncement', context.pronouncementDate, 'Official death pronouncement date if known.'],
    ['release', 'Release / pickup', context.releaseDate, 'Hospital, facility, hospice, or pickup timing if known.'],
    ['arrangement', 'Arrangement meeting', context.arrangementDate, 'Funeral home arrangement meeting date if known.'],
    ['visitation', 'Wake / visitation', context.visitationDate, 'Wake, visitation, or calling hours if known.'],
    ['funeral', 'Funeral / memorial service', context.funeralDate, 'Funeral or memorial service date if known.'],
    ['burial', 'Burial / committal', context.burialDate, 'Burial, committal, cremation, or cemetery appointment if known.'],
    ['shiva', 'Shiva / mourning period', context.shivaDate, 'Shiva or mourning-period start date if known.'],
    ['reception', 'Reception / gathering', context.receptionDate, 'Reception or family gathering date if known.'],
    ['obituary_deadline', 'Obituary deadline', context.obituaryDeadline, 'Obituary submission or publication deadline if known.'],
  ].filter(item => item[2]).map(item => ({
    event_type: item[0],
    name: item[1],
    date: item[2],
    notes: item[3],
  }));
}

function safeTaskCategory(category) {
  const value = clean(category).toLowerCase();
  const allowed = new Set(['notifications', 'property', 'legal', 'government', 'financial', 'personal', 'memorial', 'digital', 'service', 'logistics', 'medical']);
  if (allowed.has(value)) return value;
  if (value === 'documents') return 'legal';
  if (value === 'other') return 'personal';
  return 'personal';
}

function task(title, description, category, priority, dueDays, position, playbookKey, extras = {}) {
  const merged = {
    title,
    description,
    category: safeTaskCategory(category),
    priority,
    due_days_after_trigger: dueDays,
    position,
    playbook_key: playbookKey || title,
    ...extras,
  };
  return {
    ...merged,
    category: safeTaskCategory(merged.category),
    automation_level: merged.automation_level || 'MANUAL',
    execution_kind: merged.execution_kind || 'record',
    waiting_on: merged.waiting_on || null,
    partner_owner_role: merged.partner_owner_role || null,
    funeral_home_eligible: Boolean(merged.funeral_home_eligible),
    proof_required: merged.proof_required || 'confirmation',
  };
}

function conditionalTasksFor(context) {
  const tasks = [];
  let position = 7;
  const add = (...args) => tasks.push(task(...args));

  if (context.funeralHomeHandoffIntent === 'request_help') {
    add(
      'Review funeral-home options before outreach',
      'The family asked Passage to help identify a funeral home, but no funeral home should be contacted until the family approves the handoff.',
      'service',
      'urgent',
      0,
      position++,
      'review funeral home options before outreach',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'record', waiting_on: 'family approval', funeral_home_eligible: true, proof_required: 'approved funeral-home handoff path saved' }
    );
  } else if (context.funeralHomeHandoffIntent === 'not_ready') {
    add(
      'Decide funeral-home handoff path',
      'Keep the funeral-home decision visible without forcing the family to choose before they are ready.',
      'service',
      'high',
      1,
      position++,
      'decide funeral home handoff path',
      { automation_level: 'MANUAL', execution_kind: 'record', waiting_on: 'family preference', funeral_home_eligible: true, proof_required: 'funeral-home preference or not-ready status recorded' }
    );
  }

  if (context.pronouncementStatus !== 'confirmed') {
    add(
      'Confirm official pronouncement of death',
      'A death must be officially pronounced by a medical professional before transportation, paperwork, or release steps move forward.',
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

function taskKey(title) {
  return clean(title).toLowerCase();
}

const LOCAL_OUTCOME_TASK_TITLES = {
  emergency: 'Call 911 or emergency services',
  pronouncement: 'Confirm official pronouncement of death',
  authority: 'Identify healthcare proxy or legal decision-maker',
  hospice: 'Call hospice nurse or hospice agency',
  release: 'Confirm hospital or facility release process',
  funeral: 'Contact the funeral home',
  family: 'Notify immediate family members',
  home: 'Secure the home and valuables',
};

function localOutcomeMap(rawOutcomes) {
  const map = new Map();
  if (!Array.isArray(rawOutcomes)) return map;
  rawOutcomes.forEach(item => {
    const proof = clean(item?.proof);
    if (!proof && item?.status !== 'handled') return;
    const canonicalTitle = LOCAL_OUTCOME_TASK_TITLES[item?.id] || clean(item?.title);
    if (!canonicalTitle) return;
    map.set(taskKey(canonicalTitle), {
      proof,
      status: item?.status === 'handled' ? 'handled' : clean(item?.status),
      owner: item?.owner || null,
    });
  });
  return map;
}

function firstTasksForContext(context) {
  const tasks = [];
  let position = 1;
  const add = (...args) => tasks.push(task(...args));

  if (context.deathContext === 'unexpected') {
    add(
      'Call 911 or emergency services',
      'If this was unexpected at home, call 911 now. A death must be officially pronounced by a medical professional before anything else can happen.',
      'medical',
      'urgent',
      0,
      position++,
      'call 911 or emergency services',
      { automation_level: 'EXTERNAL', execution_kind: 'call', waiting_on: '911, police, coroner, or medical examiner', proof_required: 'emergency response or official instruction recorded' }
    );
    add(
      'Confirm emergency or medical examiner next steps',
      'Emergency services will determine whether a medical examiner, police report, or official release step is required.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm emergency or medical examiner next steps',
      { automation_level: 'EXTERNAL', execution_kind: 'call', waiting_on: '911, police, coroner, or medical examiner', proof_required: 'official next step recorded' }
    );
    add(
      'Confirm official pronouncement of death',
      'Record which medical professional pronounced death, when, and what must happen before transportation.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm official pronouncement of death',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'doctor, hospice, hospital, or medical examiner', funeral_home_eligible: true, proof_required: 'pronouncement source recorded' }
    );
    add(
      'Identify healthcare proxy or legal decision-maker',
      context.authorityName ? `Record ${context.authorityName}'s authority and contact path so release and funeral questions go to the right person.` : 'Identify who has authority for medical, release, and funeral decisions before anything important is sent.',
      'legal',
      'urgent',
      0,
      position++,
      'identify healthcare proxy or legal decision-maker',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'family or proxy', proof_required: 'decision-maker recorded' }
    );
  } else if (context.deathContext === 'hospice') {
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
    add(
      'Confirm official pronouncement of death',
      'Confirm who pronounced death, when, and what hospice says should happen next.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm official pronouncement of death',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'hospice nurse, doctor, or hospice medical director', funeral_home_eligible: true, proof_required: 'pronouncement source recorded' }
    );
  } else if (['hospital', 'facility'].includes(context.deathContext)) {
    add(
      'Confirm hospital or facility release process',
      context.deathContext === 'hospital'
        ? 'Ask the nurse, social worker, or decedent affairs contact who can authorize release and what the funeral home needs.'
        : 'Ask the facility who can authorize release and what the funeral home needs for pickup.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm hospital or facility release process',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'hospital or facility staff', funeral_home_eligible: true, proof_required: 'release process recorded' }
    );
    add(
      'Identify healthcare proxy or legal decision-maker',
      context.authorityName ? `Record ${context.authorityName}'s authority and contact path so release questions go to the right person.` : 'Confirm who can authorize release and funeral arrangements.',
      'legal',
      'urgent',
      0,
      position++,
      'identify healthcare proxy or legal decision-maker',
      { automation_level: 'PACKET', execution_kind: 'record', waiting_on: 'family or proxy', proof_required: 'decision-maker recorded' }
    );
  } else if (context.deathContext === 'home_expected') {
    add(
      'Confirm official pronouncement of death',
      'If death was expected at home, confirm the medical professional or hospice pronouncement path before transportation.',
      'medical',
      'urgent',
      0,
      position++,
      'confirm official pronouncement of death',
      { automation_level: 'PARTNER_HANDOFF', execution_kind: 'call', waiting_on: 'doctor, hospice, or local authority', funeral_home_eligible: true, proof_required: 'pronouncement source recorded' }
    );
  }

  return tasks;
}

function buildTasksForContext(context) {
  const leading = firstTasksForContext(context);
  const seen = new Set(leading.map(item => taskKey(item.title)));
  const core = CORE_TASKS.filter(item => !seen.has(taskKey(item.title)));
  const conditional = conditionalTasksFor(context).filter(item => !seen.has(taskKey(item.title)));
  return leading.concat(core, conditional).map((item, index) => ({ ...item, position: index + 1 }));
}

function timeframeForTask(task) {
  if (task.due_days_after_trigger === 0 && task.category === 'medical') return ['now', 'Minutes'];
  if (task.due_days_after_trigger === 0) return ['now', 'Today'];
  if (task.due_days_after_trigger <= 3) return ['72h', 'Next 72 hours'];
  if (task.due_days_after_trigger <= 7) return ['week', 'First week'];
  if (task.due_days_after_trigger <= 31) return ['month', 'First month'];
  return ['year', 'First year'];
}

function outcomeFromTask(task, index, ownerLabel) {
  const [timeframe, timeframeLabel] = timeframeForTask(task);
  return {
    title: task.title,
    description: task.description,
    why_it_matters: task.proof_required ? `Proof needed: ${task.proof_required}.` : 'This keeps the next step visible and owned.',
    recommended_action: task.execution_kind === 'call' ? 'Make the call, record what they say, and mark the next step.' : 'Assign an owner and record the result.',
    reassurance: task.waiting_on ? `Waiting on: ${task.waiting_on}.` : 'Passage will keep this visible until it is handled.',
    status: index === 0 && ownerLabel ? 'in_progress' : 'needs_owner',
    priority: task.priority === 'urgent' ? 'critical' : task.priority || 'normal',
    timeframe,
    timeframe_label: timeframeLabel,
    next_action_cta: task.execution_kind === 'call' ? 'Call or assign owner' : 'Assign owner',
    category: task.category,
    position: index + 1,
  };
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
  const firstOwner = req.body?.firstOwner || primaryOwner || null;
  const context = cleanContext(req.body?.context);
  const localOutcomes = localOutcomeMap(req.body?.outcomes);

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
    setup_stage: 'active',
    activation_status: 'activated',
    orchestration_summary: {
      ...(existing?.orchestration_summary || {}),
      chaplain_context: context,
      timeline_anchors: timelineAnchorsForContext(context),
      funeral_home_handoff: {
        intent: context.funeralHomeHandoffIntent || (context.funeralHomeName ? 'known' : 'not_ready'),
        source: 'direct_family_intake',
        family_outreach_approved: false,
        preferred_funeral_home: context.funeralHomeName ? {
          name: context.funeralHomeName,
          address: context.funeralHomeAddress || null,
          city: context.funeralHomeCity || null,
          state: context.funeralHomeState || null,
          postal_code: context.funeralHomeZip || null,
          country: context.funeralHomeCountry || null,
        } : null,
        requested_market: context.funeralHomeHandoffIntent === 'request_help' ? {
          city: context.funeralHomeReferralCity || null,
          state: context.funeralHomeReferralState || null,
          postal_code: context.funeralHomeReferralZip || null,
          note: context.funeralHomeReferralNote || null,
        } : null,
        proof: context.funeralHomeHandoffIntent === 'known'
          ? 'Preferred funeral home saved; outreach still requires family approval.'
          : context.funeralHomeHandoffIntent === 'request_help'
            ? 'Family requested help choosing a funeral home; no outreach sent.'
            : 'Funeral-home decision not ready yet.',
      },
      trusted_advisors: {
        funeral_home: context.funeralHomeName ? {
          name: context.funeralHomeName,
          address: context.funeralHomeAddress || null,
          city: context.funeralHomeCity || null,
          state: context.funeralHomeState || null,
          postal_code: context.funeralHomeZip || null,
          country: context.funeralHomeCountry || null,
        } : null,
        cemetery: context.cemeteryName || context.cemeteryAddress ? {
          name: context.cemeteryName || null,
          address: context.cemeteryAddress || null,
          city: context.cemeteryCity || null,
          state: context.cemeteryState || null,
          postal_code: context.cemeteryZip || null,
          country: context.cemeteryCountry || null,
        } : null,
        clergy: context.clergyName || null,
        healthcare_proxy_or_decision_maker: context.authorityName || null,
        hospital_hospice_or_doctor: context.hospitalOrHospiceContact || context.hospitalOrHospiceAddress ? {
          name: context.hospitalOrHospiceContact || null,
          address: context.hospitalOrHospiceAddress || null,
          city: context.hospitalOrHospiceCity || null,
          state: context.hospitalOrHospiceState || null,
          postal_code: context.hospitalOrHospiceZip || null,
          country: context.hospitalOrHospiceCountry || null,
        } : null,
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
  const funeralHomeProvider = context.funeralHomeName
    ? {
      name: context.funeralHomeName,
      address: context.funeralHomeAddress,
      city: context.funeralHomeCity,
      state: context.funeralHomeState,
      zip: context.funeralHomeZip,
      country: context.funeralHomeCountry,
    }
    : context.funeralHomeHandoffIntent === 'request_help'
      ? {
        name: `Funeral home help requested${context.funeralHomeReferralCity ? ` - ${context.funeralHomeReferralCity}` : ''}${context.funeralHomeReferralState ? `, ${context.funeralHomeReferralState}` : ''}`,
        city: context.funeralHomeReferralCity,
        state: context.funeralHomeReferralState,
        zip: context.funeralHomeReferralZip,
      }
      : null;

  if (funeralHomeProvider?.name) {
    const pipelineResult = await saveFuneralHomePipelineRequest({
      admin,
      user,
      workflow,
      provider: funeralHomeProvider,
      source: 'urgent_path',
      urgency: 'urgent',
      familyPermission: true,
      notes: context.funeralHomeHandoffIntent === 'request_help'
        ? `Family asked Passage to help identify a funeral home. ${context.funeralHomeReferralNote || 'No outreach was sent automatically.'}`
        : 'Family saved a preferred funeral home during urgent intake. No outreach was sent automatically.',
      sourceUrl: '/urgent',
    });
    if (pipelineResult?.success) {
      await admin.from('estate_events').insert([{
        estate_id: workflow.id,
        event_type: 'funeral_home_request_saved',
        title: pipelineResult.matchedOrganization ? 'Partner funeral home request saved' : 'Funeral home request saved for Passage review',
        description: pipelineResult.matchedOrganization
          ? `${funeralHomeProvider.name} is a Passage partner. The request is available in the partner inbound queue.`
          : `${funeralHomeProvider.name} was saved as a family-requested funeral home for Passage outreach review.`,
        payload: {
          provider: funeralHomeProvider,
          request_id: pipelineResult.request?.id || null,
          matched_organization_id: pipelineResult.matchedOrganization?.id || null,
        },
        created_at: new Date().toISOString(),
      }]).then(() => {}, () => {});
    }
  }

  const ownerLabel = clean(firstOwner?.name);
  const ownerEmail = clean(firstOwner?.email);
  const ownerPhone = clean(firstOwner?.phone);

  const allTasks = buildTasksForContext(context);
  const now = new Date().toISOString();
  const tasks = allTasks.map(({ position, ...task }, index) => {
    const local = localOutcomes.get(taskKey(task.title));
    const localOwner = local?.owner || null;
    const taskOwnerLabel = clean(localOwner?.name) || (index === 0 && ownerLabel ? ownerLabel : null);
    const taskOwnerEmail = clean(localOwner?.email) || (index === 0 && ownerEmail ? ownerEmail : null);
    const taskOwnerPhone = clean(localOwner?.phone) || (index === 0 && ownerPhone ? ownerPhone : null);
    const completed = ['handled', 'completed', 'done'].includes(local?.status);
    const row = {
      ...task,
      workflow_id: workflow.id,
      user_id: user.id,
      category: safeTaskCategory(task.category),
      automation_level: task.automation_level || 'MANUAL',
      execution_kind: task.execution_kind || 'record',
      waiting_on: task.waiting_on || null,
      partner_owner_role: task.partner_owner_role || null,
      funeral_home_eligible: Boolean(task.funeral_home_eligible),
      proof_required: task.proof_required || 'confirmation',
      status: completed ? 'handled' : taskOwnerLabel ? 'assigned' : 'pending',
      assigned_to_name: taskOwnerLabel,
      assigned_to_email: taskOwnerEmail,
      recipient: taskOwnerEmail || taskOwnerPhone || taskOwnerLabel || null,
      channel: taskOwnerEmail ? 'email' : taskOwnerPhone ? 'sms' : null,
      last_action_at: (completed || taskOwnerLabel) ? now : null,
      last_actor: completed ? (taskOwnerLabel || coordinatorName) : taskOwnerLabel ? coordinatorName : null,
    };
    if (local?.proof) row.notes = local.proof;
    if (completed) {
      row.completed_at = now;
      row.completed_by = taskOwnerLabel || coordinatorName;
      row.completed_by_email = taskOwnerEmail || user.email;
    }
    return row;
  });
  const { error: tasksError } = await admin.from('tasks').upsert(tasks, { onConflict: 'workflow_id,title', ignoreDuplicates: false });
  if (tasksError) {
    return res.status(500).json({ error: tasksError.message || 'Could not create urgent tasks.' });
  }

  const completedLocalTasks = tasks.filter(task => ['handled', 'completed', 'done'].includes(task.status) && task.notes);
  if (completedLocalTasks.length > 0) {
    const { data: savedTasks } = await admin
      .from('tasks')
      .select('id,title,workflow_id,status,notes,last_actor,last_action_at')
      .eq('workflow_id', workflow.id)
      .in('title', completedLocalTasks.map(task => task.title));
    const events = (savedTasks || []).map(task => ({
      workflow_id: workflow.id,
      task_id: task.id,
      status: 'handled',
      last_action_at: task.last_action_at || now,
      last_actor: task.last_actor || coordinatorName,
      channel: 'urgent_path',
      recipient: task.last_actor || coordinatorName,
      detail: `${task.title} - proof saved from urgent help: ${task.notes}`,
    }));
    if (events.length) await admin.from('task_status_events').insert(events).then(() => {}, () => {});
  }

  const outcomes = allTasks.slice(0, 5).map((taskItem, index) => ({
    ...outcomeFromTask(taskItem, index, ownerLabel),
    estate_id: workflow.id,
    owner_label: index === 0 && ownerLabel ? ownerLabel : null,
  }));
  for (const outcome of outcomes) {
    const { data: existingOutcome } = await admin
      .from('outcomes')
      .select('id')
      .eq('estate_id', workflow.id)
      .eq('title', outcome.title)
      .maybeSingle();
    if (existingOutcome?.id) {
      const { error: outcomeUpdateError } = await admin.from('outcomes').update({ ...outcome, updated_at: new Date().toISOString() }).eq('id', existingOutcome.id);
      if (outcomeUpdateError) return res.status(500).json({ error: outcomeUpdateError.message || 'Could not update urgent outcomes.' });
    } else {
      const { error: outcomeInsertError } = await admin.from('outcomes').insert([outcome]);
      if (outcomeInsertError) return res.status(500).json({ error: outcomeInsertError.message || 'Could not create urgent outcomes.' });
    }
  }

  const timelineAnchors = timelineAnchorsForContext(context);
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
      if (existingEvent?.id) await admin.from('estate_events').update(row).eq('id', existingEvent.id);
      else await admin.from('estate_events').insert([row]);
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
