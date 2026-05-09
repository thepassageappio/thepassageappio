import { taskDisplayTitle } from './communicationCenter';

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
