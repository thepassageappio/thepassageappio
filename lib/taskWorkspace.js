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
      body: 'Prepared obituary language with copy, download, share, and proof tracking before the task is closed.',
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
      body: 'Passage gathers burial, service, clergy, cemetery, and preference details into a structured summary that can feed the family view and partner export.',
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
      body: task.playbook?.whatPassageDoes || task.playbook?.automationExplanation || 'Prepared task output, next action, owner, and proof.',
    };
  }
  return {
    label: 'Task output and proof trail',
    body: `Next step for ${caseName}, owner, status, and proof.`,
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
    return `Hi ${coordinator}, can you confirm the clergy, faith community, or officiant contact for ${caseName}? Passage will prepare the outreach and keep the task waiting until someone confirms.`;
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
  const surface = context.surface || 'task proof panel';
  return `Saved to ${surface}, family status, reports, and export for "${title}".`;
}

export function taskWorkspaceFor(task, context = {}) {
  return {
    output: taskOutputFor(task, context),
    requestDraft: taskRequestDraftFor(task, context),
    proofDestination: taskProofDestination(task, context),
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
    `${funeralHome}`,
    `${caseName} - ${title}`,
    `Case reference: ${caseReference}`,
    `Location: ${locationName}`,
    `Prepared: ${new Date().toLocaleDateString('en-US')}`,
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
      'We are confirming the official record path now. Once the certificate order is clear, Passage will show the order status and any downstream tasks that depend on it.',
      '',
      'Proof to save',
      'Pronouncement source, certificate order path, number ordered, and next expected update.',
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
      'Send one scoped request to the helper or vendor, then keep the task waiting until the plan is confirmed.',
      '',
      'Proof to save',
      'Confirmed logistics, owner, location/time, and any vendor or helper follow-up recorded.',
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
    ].join('\n');
  }

  return [
    header,
    '',
    'Task execution packet',
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
  ].join('\n');
}
