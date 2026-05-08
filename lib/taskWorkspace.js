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
