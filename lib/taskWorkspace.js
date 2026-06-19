import { taskDisplayTitle } from './communicationCenter';

function includesAny(value, needles = []) {
  const text = String(value || '').toLowerCase();
  return needles.some(needle => text.includes(String(needle || '').toLowerCase()));
}

export function taskOutputFor(task, context = {}) {
  const title = taskDisplayTitle(task || {});
  const lower = title.toLowerCase();
  const caseName = context.caseName || context.estateName || 'this family';

  if (lower.includes('funeral home meeting')) {
    return {
      label: 'Arrangement meeting summary',
      body: 'Passage turns known family facts, service preferences, contact details, and missing fields into a meeting summary your team can print, export, or send back to the family.',
    };
  }
  if (lower.includes('obituary')) {
    return {
      label: 'Obituary draft workspace',
      body: 'Prepared obituary language with copy, download, share, and proof tracking before this is closed.',
    };
  }
  if (lower.includes('prepayment') || lower.includes('policy')) {
    return {
      label: 'Policy detail request',
      body: 'Policy carrier, policy number, funding status, document location, waiting state, and saved proof.',
    };
  }
  if (lower.includes('burial') || lower.includes('service') || lower.includes('wishes')) {
    return {
      label: 'Service wishes packet',
      body: 'Passage gathers burial, service, clergy, cemetery, and preference details into a structured summary that can feed the family view and funeral-home export.',
    };
  }
  if (lower.includes('clergy') || lower.includes('faith community') || lower.includes('officiant')) {
    return {
      label: 'Clergy outreach message',
      body: 'Passage prepares the outreach note, contact target, waiting state, and proof field so the family is not guessing who followed up.',
    };
  }
  if (includesAny(lower, ['pronouncement', 'medical examiner', 'hospice', 'hospital or facility release', 'facility release process'])) {
    return {
      label: 'Official release and authority record',
      body: 'Passage prepares the call script, captures who has authority, records the official instruction, and shows what downstream work can move next.',
    };
  }
  if (lower.includes('contact the funeral home')) {
    return {
      label: 'Funeral home call handoff',
      body: 'Passage prepares the call script, family contact details, transportation questions, itemized-pricing request, and the proof field for the next appointment or pickup instruction.',
    };
  }
  if (lower.includes('notify immediate family') || lower.includes('notify close friends') || lower.includes('extended family')) {
    return {
      label: 'Family notification message set',
      body: 'Passage prepares approved wording, recipient ownership, delivery tracking, and proof of who has been reached so the family does not repeat the same call.',
    };
  }
  if (lower.includes('secure the home') || includesAny(lower, ['home and valuables', 'pets', 'vehicle', 'mail'])) {
    return {
      label: 'Home safety check handoff',
      body: 'Passage prepares a trusted-person request covering doors, pets, mail, vehicles, urgent hazards, valuables, photos/notes, and follow-up proof.',
    };
  }
  if (lower.includes('healthcare proxy') || lower.includes('decision-maker')) {
    return {
      label: 'Decision-maker record',
      body: 'Passage records who can authorize release, medical, and funeral decisions, plus contact details and document location if available.',
    };
  }
  if (lower.includes('will') || lower.includes('advance directive') || lower.includes('key documents') || lower.includes('medical records')) {
    return {
      label: 'Document locator record',
      body: 'Passage captures where the key document lives, who can access it, what is still missing, and whether a professional should be looped in.',
    };
  }
  if (lower.includes('death certificate')) {
    return {
      label: 'Death certificate order tracker',
      body: 'Passage prepares the order path, copy count, vital-records office or funeral-home owner, pickup/mailing timeline, and proof of ordered or received status.',
    };
  }
  if (lower.includes('social security') || lower.includes('medicare') || lower.includes('medicaid') || lower.includes('veterans affairs') || lower.includes('dmv') || lower.includes('passport') || lower.includes('voter')) {
    return {
      label: 'Government notification packet',
      body: 'Passage prepares the agency-specific request, required identifiers, official link when available, waiting state, and confirmation/proof tracker.',
    };
  }
  if (lower.includes('bank') || lower.includes('financial') || lower.includes('insurance') || lower.includes('pension') || lower.includes('retirement') || lower.includes('credit')) {
    return {
      label: 'Institution request packet',
      body: 'Passage prepares the institution request, document checklist, owner, recipient, reference-number field, and follow-up tracker.',
    };
  }
  if (lower.includes('employer')) {
    return {
      label: 'Employer benefits request',
      body: 'Passage prepares the HR notice, final paycheck and benefits questions, recipient, and proof of the employer response.',
    };
  }
  if (lower.includes('attorney') || lower.includes('probate') || lower.includes('executor')) {
    return {
      label: 'Professional handoff packet',
      body: 'Passage prepares the attorney or executor handoff, known estate facts, missing documents, appointment status, and proof of the next legal step.',
    };
  }
  if (lower.includes('travel') || lower.includes('lodging') || lower.includes('reception') || lower.includes('gathering')) {
    return {
      label: 'Family logistics request',
      body: 'Passage prepares one clear request for the helper or vendor, tracks who owns it, and records the confirmed plan so details do not scatter into texts.',
    };
  }
  if (lower.includes('photos') || lower.includes('memories') || lower.includes('readings') || lower.includes('music') || lower.includes('pallbearers')) {
    return {
      label: 'Service materials tracker',
      body: 'Passage prepares a collection request, recipient list, received-materials tracker, and family approval proof for service details.',
    };
  }
  if (lower.includes('subscription') || lower.includes('digital') || lower.includes('social media') || lower.includes('password')) {
    return {
      label: 'Account closure tracker',
      body: 'Passage prepares the account list, required authority notes, official platform path, and proof of what was closed, memorialized, or left waiting.',
    };
  }
  if (task?.playbook?.actionResultLabel) {
    return {
      label: task.playbook.actionResultLabel.replace(/^Action result:\s*/i, ''),
      body: task.playbook?.whatPassageDoes || task.playbook?.automationExplanation || 'Prepared output, next action, owner, and proof.',
    };
  }
  return {
    label: 'Prepared output and proof trail',
    body: `Next step for ${caseName}, owner, status, and proof.`,
  };
}

export function taskExplanationFor(task, context = {}) {
  const title = taskDisplayTitle(task || {});
  const lower = [title, task?.description, task?.body, task?.playbook?.whatPassageDoes].join(' ').toLowerCase();
  const caseName = context.caseName || context.estateName || 'this family record';
  const coordinator = context.coordinatorName || 'the coordinator';
  const output = context.output || taskOutputFor(task, context);
  const guidance = context.guidance || taskGuidanceFor(task, context);

  if (includesAny(lower, ['primary confirmation', 'confirmation contact'])) {
    return {
      what: 'This identifies the person who can reliably confirm or carry this responsibility, without giving them the whole family workspace.',
      why: `${coordinator} needs one clear owner so the family knows whether this step is owned, waiting, or finished.`,
      done: 'Done means the owner accepted, declined, or gave a concrete waiting point that is saved back to the family record.',
    };
  }
  if (includesAny(lower, ['cemetery', 'burial', 'plot'])) {
    return {
      what: 'This gathers or confirms cemetery, burial, plot, deed, or committal details for the family record.',
      why: 'These details can affect transportation, service timing, cemetery coordination, and what the funeral home can finalize.',
      done: 'Done means the cemetery name, plot/deed detail, contact person, or missing-item note is saved as proof.',
    };
  }
  if (lower.includes('obituary')) {
    return {
      what: 'This prepares, reviews, or approves the obituary before anything is published or shared broadly.',
      why: 'Obituary work often blocks service announcements, newspaper submission, family updates, and public remembrance.',
      done: 'Done means the approved copy, missing detail, publication target, or reviewer decision is recorded.',
    };
  }
  if (includesAny(lower, ['pronouncement', 'medical examiner', 'hospice', 'hospital or facility release', 'facility release process'])) {
    return {
      what: 'This records the official authority step: who confirmed death or release, what they instructed, and what can happen next.',
      why: 'Official authority unlocks transportation, certificate work, funeral-home handoff, and downstream family coordination.',
      done: 'Done means the confirming person, time, instruction, and any reference or case number are saved as proof.',
    };
  }
  if (includesAny(lower, ['funeral home meeting', 'contact the funeral home', 'arrangement'])) {
    return {
      what: 'This prepares the family and funeral home for the arrangement handoff without starting from scattered notes.',
      why: 'The arrangement step anchors service planning, transportation, certificate work, family communication, and open decisions.',
      done: 'Done means the meeting summary, missing fields, family contact, service preferences, and next owner are captured.',
    };
  }
  if (lower.includes('death certificate')) {
    return {
      what: 'This tracks certified death certificate ordering, copy counts, pickup or mailing path, and receipt status.',
      why: 'Certificates are often required for banks, benefits, insurance, estate steps, and account closure.',
      done: 'Done means copies requested, owner, expected timing, and received or waiting status are recorded.',
    };
  }
  if (includesAny(lower, ['notify immediate family', 'notify close friends', 'extended family'])) {
    return {
      what: 'This prepares one approved family update instead of making the family repeat the same painful call.',
      why: 'One shared message reduces confusion, duplicate outreach, and mismatched details.',
      done: 'Done means the message, recipient group, owner, and reached/waiting status are saved.',
    };
  }
  if (includesAny(lower, ['bank', 'financial', 'insurance', 'pension', 'retirement', 'credit'])) {
    return {
      what: 'This prepares an institution request packet with owner, documents, reference number, and follow-up status.',
      why: 'Financial institutions usually require authority and proof before accounts, benefits, or claims can move safely.',
      done: 'Done means the institution path, required documents, confirmation number, or next waiting point is saved.',
    };
  }
  if (includesAny(lower, ['social security', 'medicare', 'medicaid', 'veterans affairs', 'dmv', 'passport', 'voter', 'government'])) {
    return {
      what: 'This prepares a government or agency notification path without pretending it has already been filed.',
      why: 'Agency notifications often depend on certificates, authority, and exact identifying information.',
      done: 'Done means the agency, required information, confirmation path, and follow-up status are recorded.',
    };
  }
  if (includesAny(lower, ['photo', 'memory', 'memories', 'readings', 'music', 'pallbearers'])) {
    return {
      what: 'This collects one service or remembrance contribution from the right person.',
      why: 'Keeping contributions on the family record prevents photos, readings, and decisions from scattering across texts.',
      done: 'Done means the contribution, approval, or missing item is saved where the coordinator can see it.',
    };
  }
  return {
    what: `This moves "${title}" for ${caseName} from an open worry into an owned, visible next step.`,
    why: guidance.why || 'It keeps responsibility, waiting state, message, and proof attached to one family record.',
    done: `${output.label || 'The prepared output'} is reviewed, the owner or waiting point is clear, and proof is saved before this is closed.`,
  };
}

export function taskRequestDraftFor(task, context = {}) {
  const title = taskDisplayTitle(task || {});
  const lower = title.toLowerCase();
  const coordinator = context.coordinatorName || 'the family coordinator';
  const caseName = context.caseName || context.estateName || 'your loved one';

  if (lower.includes('funeral home meeting')) {
    return `Hi ${coordinator}, we are preparing the arrangement meeting summary for ${caseName}. Please confirm any missing service wishes, cemetery details, clergy/officiant contact, prepaid policy information, or documents you want included.`;
  }
  if (lower.includes('prepayment') || lower.includes('policy')) {
    return `Hi ${coordinator}, can you send the prepaid funeral, Medicaid, insurance, or policy details you have for ${caseName}? Carrier name, policy number, funding status, and where the document is stored are enough to move this forward.`;
  }
  if (lower.includes('burial') || lower.includes('service') || lower.includes('wishes')) {
    return `Hi ${coordinator}, can you confirm the family's burial, service, clergy, cemetery, or final wishes for ${caseName}? Passage will keep this waiting until those details are recorded.`;
  }
  if (lower.includes('clergy') || lower.includes('faith community') || lower.includes('officiant')) {
    return `Hi ${coordinator}, can you confirm the clergy, faith community, or officiant contact for ${caseName}? Passage will prepare the outreach and keep the request waiting until someone confirms.`;
  }
  if (includesAny(lower, ['pronouncement', 'medical examiner', 'hospice', 'hospital or facility release', 'facility release process'])) {
    return `Hi ${coordinator}, can you confirm the official instruction for ${caseName}: who pronounced or authorized release, what they said must happen next, and any case/reference number? Passage will use that proof to unlock the dependent steps.`;
  }
  if (lower.includes('contact the funeral home')) {
    return `Hi ${coordinator}, can you confirm the funeral home contact for ${caseName}, who is allowed to speak with them, and any pickup or arrangement instructions already given? Passage will keep the call result and next appointment visible.`;
  }
  if (lower.includes('notify immediate family') || lower.includes('notify close friends') || lower.includes('extended family')) {
    return `Hi ${coordinator}, who should receive the family notification for ${caseName}, and who should own the first outreach? Passage can prepare the wording and track who has been reached.`;
  }
  if (lower.includes('secure the home') || includesAny(lower, ['home and valuables', 'pets', 'vehicle', 'mail'])) {
    return `Hi ${coordinator}, who can check the home, pets, mail, vehicle, doors, and urgent safety concerns for ${caseName}? Passage will ask them to reply with what they found and any photos or notes that need follow-up.`;
  }
  if (lower.includes('healthcare proxy') || lower.includes('decision-maker')) {
    return `Hi ${coordinator}, who can authorize release, medical, and funeral decisions for ${caseName}? If there is a healthcare proxy, next of kin, executor, or document location, please send that detail here.`;
  }
  if (lower.includes('death certificate')) {
    return `Hi ${coordinator}, can you confirm who will order certified death certificates for ${caseName}, how many copies are needed, and whether pickup or mailing instructions are known? Passage will keep the order status visible.`;
  }
  if (lower.includes('social security') || lower.includes('medicare') || lower.includes('medicaid') || lower.includes('veterans affairs') || lower.includes('dmv') || lower.includes('passport') || lower.includes('voter')) {
    return `Hi ${coordinator}, can you confirm the agency details or identifiers needed for "${title}" for ${caseName}? Passage will prepare the request path and record the confirmation or next appointment.`;
  }
  if (lower.includes('bank') || lower.includes('financial') || lower.includes('insurance') || lower.includes('pension') || lower.includes('retirement') || lower.includes('credit')) {
    return `Hi ${coordinator}, can you list the institution, policy, account, or plan details you have for ${caseName}? Passage will prepare the request packet and track the reference number or next step.`;
  }
  if (lower.includes('attorney') || lower.includes('probate') || lower.includes('executor')) {
    return `Hi ${coordinator}, who is the executor, attorney, or professional contact for ${caseName}, and what documents are already located? Passage will prepare a handoff packet and keep the next legal step visible.`;
  }
  return `Hi ${coordinator}, we need one detail from the family before "${title}" can move forward for ${caseName}. Please reply with what you know, what is missing, or who should own the next step.`;
}

export function taskProofDestination(task, context = {}) {
  const title = taskDisplayTitle(task || {});
  const surface = context.surface || 'proof panel';
  return `Saved to ${surface}, family-visible status, proof packet, and case export for "${title}".`;
}

export function taskGuidanceFor(task, context = {}) {
  const title = taskDisplayTitle(task || {});
  const lower = title.toLowerCase();
  const owner = task?.assigned_to_name || task?.playbook?.defaultOwner || task?.playbook?.partnerOwnerRole || context.owner || 'family coordinator';
  const defaultGuidance = {
    why: 'This keeps the next responsibility from drifting while the family is handling many moving pieces.',
    usualOwner: owner,
    timing: task?.playbook?.urgency || task?.playbook?.cadence || 'Handle when the next owner has the needed detail.',
    nextStep: task?.playbook?.nextAction || 'Confirm the owner, capture the missing detail, and save proof before marking it handled.',
    overwhelmed: 'If this feels like too much, assign one trusted person to gather only the next missing detail.',
  };

  if (lower.includes('obituary')) {
    return {
      why: 'The obituary becomes the shared public notice and often depends on service time, family approval, and a photo.',
      usualOwner: 'Family coordinator with funeral director support',
      timing: 'Usually prepared within 24-48 hours once service details are known.',
      nextStep: 'Collect the legal name, dates, photo, service details, and approval owner before anything is published.',
      overwhelmed: 'Start with one photo, the full legal name, and the service date; the rest can be drafted and reviewed calmly.',
    };
  }
  if (includesAny(lower, ['pronouncement', 'medical examiner', 'hospice', 'hospital or facility release', 'facility release process'])) {
    return {
      why: 'Official pronouncement or release authority unlocks transportation, certificate work, and the funeral-home handoff.',
      usualOwner: 'Hospice, hospital, medical authority, or funeral director',
      timing: 'Immediate: keep this visible until the authority, instruction, and next handoff are confirmed.',
      nextStep: 'Record who gave the instruction, what they said, and any case or reference number.',
      overwhelmed: 'Ask one person to make the authority call and write down only the name, phone number, and instruction received.',
    };
  }
  if (lower.includes('funeral home meeting') || lower.includes('contact the funeral home') || lower.includes('arrangement')) {
    return {
      why: 'This anchors transportation, service planning, death-certificate work, and the family communication rhythm.',
      usualOwner: 'Family coordinator and funeral director',
      timing: 'Usually today or the next business day, depending on release status and family readiness.',
      nextStep: 'Confirm the funeral-home contact, meeting time, missing fields, and which family member can authorize decisions.',
      overwhelmed: 'Passage can reduce this to one call script and one missing-items list before the meeting.',
    };
  }
  if (lower.includes('death certificate')) {
    return {
      why: 'Certified death certificates are required for many bank, benefit, insurance, estate, and account-closure steps.',
      usualOwner: 'Funeral director, vital-records office, or executor',
      timing: 'Start in the first days, then track ordered, waiting, received, and copies needed.',
      nextStep: 'Confirm who orders copies, how many are needed, pickup or mailing timing, and the expected update date.',
      overwhelmed: 'Ask the funeral home how many certified copies similar families usually start with, then record that number.',
    };
  }
  if (lower.includes('notify immediate family') || lower.includes('notify close friends') || lower.includes('extended family')) {
    return {
      why: 'One approved message prevents repeated painful calls and keeps the family from managing conflicting details.',
      usualOwner: 'Family coordinator or delegated participant',
      timing: 'Handle early, once the family has agreed what can be shared.',
      nextStep: 'Approve wording, assign recipient groups, and save who was reached or who is still waiting.',
      overwhelmed: 'Choose one trusted helper to own the first recipient list and keep the message short.',
    };
  }
  if (lower.includes('bank') || lower.includes('financial') || lower.includes('insurance') || lower.includes('pension') || lower.includes('retirement') || lower.includes('credit')) {
    return {
      why: 'Financial institutions usually need authority, certificates, and a confirmation path before accounts can change safely.',
      usualOwner: 'Executor, surviving spouse, beneficiary, or trusted financial contact',
      timing: 'After urgent funeral steps and certificate path are clear, unless there is immediate account risk.',
      nextStep: 'Prepare the institution name, authority document, certificate need, confirmation number field, and follow-up date.',
      overwhelmed: 'Start with one institution and record what it requires; do not try to close every account at once.',
    };
  }
  if (lower.includes('social security') || lower.includes('medicare') || lower.includes('medicaid') || lower.includes('veterans affairs') || lower.includes('dmv') || lower.includes('passport') || lower.includes('voter') || lower.includes('government')) {
    return {
      why: 'Government notifications affect benefits, records, identity risk, and downstream estate administration.',
      usualOwner: 'Funeral director, executor, surviving spouse, or agency contact',
      timing: 'Confirm whether the funeral home reports this automatically before duplicating work.',
      nextStep: 'Record the agency path, required identifiers, appointment or confirmation number, and next expected update.',
      overwhelmed: 'Ask the funeral home which agencies they already notify, then only assign what remains.',
    };
  }
  if (lower.includes('employer')) {
    return {
      why: 'Employers may hold final pay, benefits, pension, insurance, expenses, and company-property instructions.',
      usualOwner: 'Executor, surviving spouse, or HR contact',
      timing: 'After the family has the HR contact or employer name, usually within the first week.',
      nextStep: 'Ask HR for final pay, benefits, documents required, and the next follow-up date.',
      overwhelmed: 'Send one HR request and mark the item waiting until the employer replies.',
    };
  }
  if (lower.includes('attorney') || lower.includes('probate') || lower.includes('executor')) {
    return {
      why: 'Executor and professional handoffs turn scattered family facts into accountable estate administration.',
      usualOwner: 'Executor, attorney, or family coordinator',
      timing: 'After immediate arrangements are stable and key documents or contacts are located.',
      nextStep: 'Identify the executor or attorney, list located documents, and record the next appointment or filing step.',
      overwhelmed: 'Gather only document locations and the professional contact first; the legal sequence can follow.',
    };
  }
  if (lower.includes('secure the home') || includesAny(lower, ['home and valuables', 'pets', 'vehicle', 'mail'])) {
    return {
      why: 'Home, pets, mail, vehicles, and valuables can become urgent risks while the family is focused elsewhere.',
      usualOwner: 'Nearby trusted person or family coordinator',
      timing: 'Same day when property, pets, medication, or valuables may be unattended.',
      nextStep: 'Assign one nearby person, ask for a simple status note, and save any photos or follow-up needs.',
      overwhelmed: 'Ask for one check-in: doors, pets, mail, vehicle, and anything visibly urgent.',
    };
  }
  if (lower.includes('travel') || lower.includes('lodging') || lower.includes('reception') || lower.includes('gathering')) {
    return {
      why: 'Logistics become calmer when one person owns the plan and the confirmed details do not scatter across texts.',
      usualOwner: 'Delegated family helper, staff member, or vendor',
      timing: 'Once event date, location, and family needs are known.',
      nextStep: 'Send one scoped request, keep it waiting until confirmed, then save the final time, place, owner, and proof.',
      overwhelmed: 'Ask one helper to own only transportation, meals, lodging, or reception instead of all logistics.',
    };
  }
  if (lower.includes('photos') || lower.includes('memories') || lower.includes('readings') || lower.includes('music') || lower.includes('pallbearers')) {
    return {
      why: 'Service materials need deadlines and approvals so printing, music, readings, and tributes do not become last-minute stress.',
      usualOwner: 'Family coordinator with delegated helpers',
      timing: 'Before service, print, slideshow, or livestream deadlines.',
      nextStep: 'Assign each material type, set the deadline, and record received and approved items.',
      overwhelmed: 'Pick one collection owner and ask for only the materials needed for the next deadline.',
    };
  }

  return defaultGuidance;
}

export function taskWorkspaceFor(task, context = {}) {
  return {
    output: taskOutputFor(task, context),
    requestDraft: taskRequestDraftFor(task, context),
    proofDestination: taskProofDestination(task, context),
    guidance: taskGuidanceFor(task, context),
  };
}

export function taskPreparedPacketFor(task, context = {}) {
  const title = taskDisplayTitle(task || {});
  const lower = title.toLowerCase();
  const caseName = context.caseName || context.estateName || 'this family';
  const coordinator = context.coordinatorName || 'Family coordinator';
  const coordinatorEmail = context.coordinatorEmail || 'Not added yet';
  const coordinatorPhone = context.coordinatorPhone || 'Not added yet';
  const funeralHome = context.funeralHomeName || context.organizationName || 'Funeral home';
  const caseReference = context.caseReference || 'Not assigned';
  const locationName = context.locationName || 'Main location';
  const openItems = Array.isArray(context.openTasks) && context.openTasks.length
    ? context.openTasks.slice(0, 6).map((item, index) => `${index + 1}. ${taskDisplayTitle(item)} - ${item.status || 'open'}`).join('\n')
    : 'No additional open items supplied.';

  const header = [
    'Passage',
    'One calm place for the hardest family handoffs.',
    '',
    `${funeralHome}`,
    `${caseName} - ${title}`,
    `Case reference: ${caseReference}`,
    `Location: ${locationName}`,
    `Prepared: ${new Date().toLocaleDateString('en-US')}`,
  ].join('\n');
  const footer = [
    '',
    'Prepared by Passage',
    'Use: review with staff, copy into the case file, or share only after family approval.',
    'Nothing was sent automatically. Keep proof, owner, waiting state, and next update attached to the Passage family record.',
  ].join('\n');

  const contactBlock = [
    'Family contact',
    `Name: ${coordinator}`,
    `Email: ${coordinatorEmail}`,
    `Phone: ${coordinatorPhone}`,
  ].join('\n');

  if (lower.includes('funeral home meeting') || lower.includes('arrangement')) {
    return [
      header,
      '',
      'Arrangement meeting packet',
      contactBlock,
      '',
      'Known facts to confirm',
      '- Legal name, date of death, and pronouncement source',
      '- Burial or cremation preference',
      '- Service timing, location, clergy/officiant, cemetery, reception, and transportation',
      '- Prepaid policy, insurance, Medicaid, or funding documents',
      '- Obituary preferences and family approval path',
      '',
      'Open questions',
      openItems,
      '',
      'Family-facing status',
      'The funeral home is preparing the arrangement summary. Missing items will be requested once, then tracked in Passage until confirmed.',
      '',
      'Proof to save',
      'Meeting packet reviewed, missing fields requested, and next expected update recorded.',
      footer,
    ].join('\n');
  }

  if (lower.includes('bank') || lower.includes('financial') || lower.includes('insurance')) {
    return [
      header,
      '',
      'Financial institution packet',
      contactBlock,
      '',
      'Prepare before calling',
      '- Certified death certificate',
      '- Proof of authority, executor paperwork, or beneficiary documentation',
      '- Account, policy, or institution name if known',
      '- Mailing address and case reference for the estate file',
      '',
      'Call script',
      `Hello, I am helping coordinate next steps for ${caseName}. What documents do you require to report the death, restrict account activity, and confirm the next estate or beneficiary step?`,
      '',
      'Proof to save',
      'Institution contacted, required documents recorded, confirmation number or next step saved.',
      footer,
    ].join('\n');
  }

  if (lower.includes('social security') || lower.includes('government')) {
    return [
      header,
      '',
      'Government notification packet',
      contactBlock,
      '',
      'Prepare before contacting the agency',
      '- Certified death certificate if requested',
      '- Social Security number or agency identifier if known',
      '- Marriage, birth, or dependent records if survivor benefits may apply',
      '- Caller authority and callback information',
      '',
      'Next action',
      'Confirm whether the funeral home reports this automatically. If not, call the agency, record the appointment or claim path, and save the expected follow-up date.',
      '',
      'Proof to save',
      'Agency path, appointment, confirmation number, or benefit next step recorded.',
      footer,
    ].join('\n');
  }

  if (lower.includes('death certificate') || lower.includes('pronouncement')) {
    return [
      header,
      '',
      'Official record packet',
      contactBlock,
      '',
      'Fields to confirm',
      '- Pronouncing authority and contact information',
      '- Certifier / medical professional path',
      '- Number of certified copies requested',
      '- Ordering office, cost, pickup or mailing timeline',
      '',
      'Recommended family note',
      'We are confirming the official record path now. Once the certificate order is clear, Passage will show the order status and any downstream waiting items that depend on it.',
      '',
      'Proof to save',
      'Pronouncement source, certificate order path, number ordered, and next expected update.',
      footer,
    ].join('\n');
  }

  if (lower.includes('obituary')) {
    return [
      header,
      '',
      'Obituary draft packet',
      contactBlock,
      '',
      'Draft inputs',
      '- Full name, age, hometown, family names, service details, and donation preference',
      '- Tone: warm, factual, family-reviewed',
      '- Approval owner and deadline before publishing',
      '',
      'Next action',
      'Prepare a family-reviewed draft, mark it waiting for approval, and save the final approved text as proof.',
      '',
      'Proof to save',
      'Draft prepared, approval owner recorded, publication status updated.',
      footer,
    ].join('\n');
  }

  if (lower.includes('notify immediate family') || lower.includes('notify close friends') || lower.includes('extended family')) {
    return [
      header,
      '',
      'Family notification set',
      contactBlock,
      '',
      'Purpose',
      'Give the family one approved message, one recipient owner, and one place to record who has been reached.',
      '',
      'Short message draft',
      `I am so sorry to share that ${caseName} has passed away. We are coordinating the first steps now and will share confirmed service details when we have them. Please give the family a little room while the immediate arrangements are handled.`,
      '',
      'Recipient groups',
      '- Immediate family: direct call or personal message',
      '- Close friends: approved text or email after immediate family knows',
      '- Wider circle: wait until service details or family approval are ready',
      '',
      'Proof to save',
      'Approved wording, recipient owner, groups reached, groups still waiting, and any sensitive people who need a personal call.',
      footer,
    ].join('\n');
  }

  if (lower.includes('travel') || lower.includes('lodging') || lower.includes('reception') || lower.includes('gathering')) {
    return [
      header,
      '',
      'Family logistics packet',
      contactBlock,
      '',
      'Details to coordinate',
      '- Event date, time, location, and family point person',
      '- Travel, lodging, ride, meal, accessibility, or reception needs',
      '- Vendor/helper owner and backup contact',
      '- Budget or reimbursement expectation, if any',
      '',
      'Next action',
      'Send one scoped request to the helper or vendor, then keep the request waiting until the plan is confirmed.',
      '',
      'Proof to save',
      'Confirmed logistics, owner, location/time, and any vendor or helper follow-up recorded.',
      footer,
    ].join('\n');
  }

  if (lower.includes('attorney') || lower.includes('probate') || lower.includes('executor')) {
    return [
      header,
      '',
      'Executor / professional handoff summary',
      contactBlock,
      '',
      'Known estate facts',
      '- Family coordinator and primary contact',
      '- Date of death and certificate status if known',
      '- Located documents and missing documents',
      '- Known institutions, policies, property, and digital-account concerns',
      '',
      'Questions for the professional',
      '- Who has authority to act now?',
      '- Which documents are needed before the first appointment?',
      '- What should wait until certificates or court paperwork are available?',
      '- What confirmation number, filing date, or next appointment should Passage track?',
      '',
      'Open work',
      openItems,
      '',
      'Proof to save',
      'Professional contacted, authority path recorded, missing documents listed, and next legal or estate-administration step saved.',
      footer,
    ].join('\n');
  }

  if (lower.includes('photos') || lower.includes('memories') || lower.includes('readings') || lower.includes('music') || lower.includes('pallbearers')) {
    return [
      header,
      '',
      'Service materials packet',
      contactBlock,
      '',
      'Materials to collect',
      '- Photos, readings, music, memory notes, pallbearer names, or tribute details',
      '- Owner for each item and deadline before the service or print deadline',
      '- Approval person before anything is printed, played, or published',
      '',
      'Family-facing request',
      `Please send service materials for ${caseName} to the family coordinator. Passage will show what was received, what is still waiting, and who approved the final version.`,
      '',
      'Proof to save',
      'Materials received, missing items listed, approval owner recorded, and final version marked ready.',
      footer,
    ].join('\n');
  }

  if (lower.includes('subscription') || lower.includes('digital') || lower.includes('social media') || lower.includes('password')) {
    return [
      header,
      '',
      'Account closure / memorialization packet',
      contactBlock,
      '',
      'Account details to gather',
      '- Platform or provider name',
      '- Account email, username, profile URL, or customer identifier if known',
      '- Authority document required by the provider',
      '- Desired outcome: close, transfer, memorialize, preserve, or leave waiting',
      '',
      'Next action',
      'Use the official provider path, record what was submitted, and keep unknown accounts waiting instead of marking them done.',
      '',
      'Proof to save',
      'Provider path, submission date, confirmation/reference, and final account status recorded.',
      footer,
    ].join('\n');
  }

  if (lower.includes('employer')) {
    return [
      header,
      '',
      'Employer / HR benefits packet',
      contactBlock,
      '',
      'Questions for HR',
      '- Final paycheck, PTO, expense, pension, or employer benefit next steps',
      '- Employer life insurance or beneficiary claim process',
      '- Documents HR needs from the family or executor',
      '- Return of company property or access shutoff path',
      '',
      'Call or email script',
      `I am helping coordinate next steps for ${caseName}. Please confirm the HR contact, final pay and benefits process, documents required, and any employer life insurance or pension next step.`,
      '',
      'Proof to save',
      'HR contact, required documents, benefit next steps, and follow-up date recorded.',
      footer,
    ].join('\n');
  }

  return [
    header,
    '',
    'Next-step execution packet',
    contactBlock,
    '',
    'What Passage prepared',
    taskOutputFor(task, context).body,
    '',
    'Open work',
    openItems,
    '',
    'Proof to save',
    taskProofDestination(task, context),
    footer,
  ].join('\n');
}
