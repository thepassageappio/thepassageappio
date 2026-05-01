const normalizeTitle = (value) => String(value || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

export const AUTOMATION_LEVELS = {
  SEND_TRACK: {
    level: 1,
    tier: 'Fully automated',
    label: 'Passage can send and track this',
    shortLabel: 'Tier 1',
    explanation: 'Passage prepares the message, sends it, and tracks confirmation.',
  },
  PARTNER_HANDOFF: {
    level: 1,
    tier: 'Fully automated',
    label: 'Funeral home can handle this',
    shortLabel: 'Tier 1',
    explanation: 'A funeral home or service partner can complete this with family approval.',
  },
  PACKET: {
    level: 2,
    tier: 'Assisted execution',
    label: 'Passage can prepare the packet',
    shortLabel: 'Tier 2',
    explanation: 'Passage gathers the required information, prepares the request, and tracks proof.',
  },
  PROFESSIONAL: {
    level: 3,
    tier: 'Guided manual',
    label: 'Professional handoff recommended',
    shortLabel: 'Tier 3',
    explanation: 'This should be handled by an attorney, CPA, executor, or licensed professional.',
  },
  EXTERNAL: {
    level: 3,
    tier: 'Guided manual',
    label: 'Official site or institution required',
    shortLabel: 'Tier 3',
    explanation: 'Passage guides the next step and records the outcome, but the outside agency controls completion.',
  },
};

export const TOP_PROOF_TASKS = [
  'contact the funeral home',
  'notify immediate family members',
  'order death certificates minimum 15 copies',
  'notify social security administration',
  'notify primary bank and all financial institutions',
  'contact all life insurance companies to file claims',
  'notify the deceased s employer',
  'contact the dmv to cancel the driver s license',
  'notify the three credit bureaus',
  'contact veterans affairs if veteran',
];

export const INSTITUTION_TEMPLATES = {
  ssa: {
    label: 'Social Security notification',
    match: ['notify social security administration', 'apply for social security survivor benefits'],
    subject: 'Death notification and survivor benefit next steps',
    proof: 'confirmation number, appointment time, or SSA instructions',
    body: 'I am helping coordinate the estate of [name]. Please confirm the next step to report the death and identify any survivor benefit actions. We can provide the Social Security number, date of death, and certified death certificate when required.',
  },
  bank: {
    label: 'Bank / financial institution notice',
    match: ['notify primary bank and all financial institutions'],
    subject: 'Estate account notification and next steps',
    proof: 'case/reference number or institution instructions',
    body: 'I am helping coordinate the estate of [name]. Please confirm what is required to freeze or update accounts, who is authorized to act, and where certified death certificates or letters testamentary should be sent.',
  },
  insurance: {
    label: 'Life insurance claim request',
    match: ['contact all life insurance companies to file claims'],
    subject: 'Life insurance claim next steps',
    proof: 'claim number or packet submission confirmation',
    body: 'I am helping coordinate the estate of [name]. Please confirm the claim process, required forms, policy number requirements, and where beneficiaries should send the certified death certificate.',
  },
  employer: {
    label: 'Employer / HR notification',
    match: ['notify the deceased s employer'],
    subject: 'Employee death notification and benefits next steps',
    proof: 'HR contact, final paycheck, benefits, or life insurance next step',
    body: 'I am helping coordinate the estate of [name]. Please confirm final paycheck, benefits, employer life insurance, pension, and any documents HR needs from the family or executor.',
  },
  dmv: {
    label: 'DMV license / vehicle request',
    match: ['contact the dmv to cancel the driver s license', 'transfer vehicle titles with the dmv'],
    subject: 'Deceased driver record and vehicle title next steps',
    proof: 'state DMV instruction, receipt, or reference number',
    body: 'I am helping coordinate the estate of [name]. Please confirm the state process to cancel the driver record and transfer or update any vehicle titles.',
  },
  credit: {
    label: 'Credit bureau deceased alert',
    match: ['notify the three credit bureaus', 'notify all credit card companies'],
    subject: 'Deceased alert and account protection request',
    proof: 'deceased alert confirmation or account closure instruction',
    body: 'I am helping coordinate the estate of [name]. Please confirm the process to place a deceased alert, prevent new credit activity, and identify required documents.',
  },
  va: {
    label: 'Veterans Affairs burial benefits',
    match: ['contact veterans affairs if veteran'],
    subject: 'Veteran burial benefit and memorial next steps',
    proof: 'VA claim, appointment, or benefit instruction',
    body: 'I am helping coordinate the estate of [name]. Please confirm burial allowance, memorial, and survivor benefit next steps and whether DD-214 or other documentation is required.',
  },
};

const base = {
  automationLevel: 'SEND_TRACK',
  executionKind: 'message',
  waitingOn: 'recipient',
  ownerRole: 'family_coordinator',
  partnerOwnerRole: '',
  funeralHomeEligible: false,
  proofRequired: 'confirmation',
  requiredInfo: [],
  requiredDocuments: [],
  officialLink: '',
  officialLinkLabel: '',
};

const byTitle = {
  'obtain official pronouncement of death': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'call',
    waitingOn: 'doctor, hospice, coroner, or medical examiner',
    ownerRole: 'funeral_home_or_family',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'pronouncement source recorded',
    requiredInfo: ['date/time of death', 'location of death', 'pronouncing provider'],
  },
  'contact the funeral home': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'call',
    waitingOn: 'funeral home',
    ownerRole: 'family_coordinator',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'transportation or arrangement next step confirmed',
    requiredInfo: ['place of death', 'next of kin', 'preferred funeral home'],
  },
  'notify immediate family members': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'family confirmation',
    proofRequired: 'family notified or assigned',
  },
  'secure the home and valuables': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'trusted local person',
    ownerRole: 'family_or_neighbor',
    proofRequired: 'home check note',
  },
  'locate the will and advance directives': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'message',
    waitingOn: 'executor or attorney',
    ownerRole: 'executor',
    partnerOwnerRole: 'estate_attorney',
    proofRequired: 'document location recorded',
    requiredDocuments: ['will', 'trust', 'advance directive'],
  },
  'make arrangements for minor children and pets': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'guardian or trusted helper',
    ownerRole: 'family_coordinator',
    proofRequired: 'care confirmed',
  },
  'notify the executor of the estate': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'executor',
    ownerRole: 'family_coordinator',
    proofRequired: 'executor acknowledged',
  },
  'document the date time and location of death': {
    automationLevel: 'PACKET',
    executionKind: 'record',
    waitingOn: 'family record',
    proofRequired: 'estate details saved',
    requiredInfo: ['date of death', 'time of death', 'location of death'],
  },
  'notify hospice or home care providers': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'call',
    waitingOn: 'hospice or care provider',
    proofRequired: 'equipment/records next step confirmed',
  },
  'order death certificates minimum 15 copies': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'packet',
    waitingOn: 'funeral home or vital records office',
    ownerRole: 'funeral_home_or_executor',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'ordered / received status',
    requiredInfo: ['legal name', 'date of death', 'place of death', 'number of copies'],
    requiredDocuments: ['proof of authority if ordered directly'],
    officialLink: 'https://www.cdc.gov/nchs/w2w/index.htm',
    officialLinkLabel: 'Find state vital records office',
  },
  'notify close friends and extended family': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'family coordinator',
    proofRequired: 'notification sent',
  },
  'share the news on social media': {
    automationLevel: 'PACKET',
    executionKind: 'record',
    waitingOn: 'family approval',
    proofRequired: 'approved wording saved',
  },
  'draft the obituary': {
    automationLevel: 'PACKET',
    executionKind: 'record',
    waitingOn: 'family reviewer',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'draft approved',
  },
  'meet with funeral director to finalize arrangements': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'call',
    waitingOn: 'funeral home',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'arrangement meeting outcome',
  },
  'draft and submit the obituary': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'packet',
    waitingOn: 'newspaper or funeral home',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'submission confirmation',
  },
  'notify the deceased s employer': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'employer / HR',
    proofRequired: 'HR next step confirmed',
  },
  'coordinate out of town family travel and lodging': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'travel coordinator',
    proofRequired: 'lodging/travel details saved',
  },
  'select readings music and pallbearers': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'officiant or family reviewer',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'service details confirmed',
  },
  'gather photos and memories for the service': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'photo coordinator',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'materials received',
  },
  'plan the reception or post service gathering': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'venue or caterer',
    proofRequired: 'venue/catering confirmed',
  },
  'notify the faith community or religious leader': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'officiant or faith community',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'officiant acknowledged',
  },
  'contact the cemetery or crematorium': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'call',
    waitingOn: 'cemetery or crematorium',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'interment/cremation next step confirmed',
    requiredDocuments: ['burial or cremation authorization if required'],
  },
  'request an itemized funeral home contract': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'packet',
    waitingOn: 'funeral home',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'itemized statement received',
  },
  'notify social security administration': {
    automationLevel: 'PARTNER_HANDOFF',
    executionKind: 'packet',
    waitingOn: 'funeral director or SSA',
    partnerOwnerRole: 'funeral_home_director',
    funeralHomeEligible: true,
    proofRequired: 'SSA report path confirmed',
    requiredInfo: ['Social Security number', 'date of death'],
    requiredDocuments: ['SSA-721 if funeral director reports outside EDR'],
    officialLink: 'https://www.usa.gov/social-security-report-a-death',
    officialLinkLabel: 'Open SSA death reporting guidance',
  },
  'notify primary bank and all financial institutions': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'bank or executor',
    ownerRole: 'executor',
    proofRequired: 'institution instructions recorded',
    requiredDocuments: ['death certificate', 'proof of authority'],
  },
  'contact all life insurance companies to file claims': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'insurance company',
    ownerRole: 'beneficiary_or_executor',
    proofRequired: 'claim number or submitted packet',
    requiredDocuments: ['death certificate', 'policy number', 'beneficiary ID'],
  },
  'contact estate attorney to begin probate process': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'message',
    waitingOn: 'estate attorney',
    ownerRole: 'executor',
    partnerOwnerRole: 'estate_attorney',
    proofRequired: 'attorney next step recorded',
  },
  'notify pension and retirement account administrators': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'plan administrator',
    ownerRole: 'beneficiary_or_executor',
    proofRequired: 'claim instructions recorded',
  },
  'address health insurance for surviving family members': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'health insurer / benefits administrator',
    proofRequired: 'coverage next step recorded',
  },
  'notify medicare and medicaid if applicable': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'benefits agency',
    proofRequired: 'agency path recorded',
    officialLink: 'https://www.medicare.gov/basics/reporting-medicare-fraud-and-abuse/report-death',
    officialLinkLabel: 'Open Medicare guidance',
  },
  'contact veterans affairs if veteran': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'VA',
    proofRequired: 'VA claim or appointment started',
    requiredDocuments: ['DD214 if available', 'death certificate', 'receipts for burial allowance'],
    officialLink: 'https://www.va.gov/burials-memorials/veterans-burial-allowance/',
    officialLinkLabel: 'Open VA burial benefits',
  },
  'cancel voter registration': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'local election office',
    proofRequired: 'office instructions recorded',
    officialLink: 'https://www.usa.gov/death-notification',
    officialLinkLabel: 'Open government death notifications',
  },
  'set up mail forwarding or hold with usps': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'USPS',
    proofRequired: 'forwarding/hold confirmation',
    officialLink: 'https://www.usps.com/manage/forward.htm',
    officialLinkLabel: 'Open USPS forwarding',
  },
  'secure digital accounts and retrieve important passwords': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'message',
    waitingOn: 'executor or digital account contact',
    ownerRole: 'executor',
    proofRequired: 'account inventory saved',
  },
  'notify all credit card companies': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'card issuer',
    ownerRole: 'executor',
    proofRequired: 'account closure instructions recorded',
    requiredDocuments: ['death certificate', 'proof of authority'],
  },
  'contact the dmv to cancel the driver s license': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'state DMV',
    proofRequired: 'DMV confirmation or instruction recorded',
    officialLink: 'https://www.usa.gov/motor-vehicle-services',
    officialLinkLabel: 'Find state DMV',
  },
  'collect contact info for thank you notes': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'record',
    waitingOn: 'family coordinator',
    proofRequired: 'contact list saved',
  },
  'notify professional licensing boards if applicable': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'licensing board',
    proofRequired: 'board instructions recorded',
  },
  'apply for social security survivor benefits': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'SSA',
    proofRequired: 'appointment or application step recorded',
    officialLink: 'https://www.ssa.gov/benefits/survivors/',
    officialLinkLabel: 'Open SSA survivor benefits',
  },
  'file for pension and annuity survivor benefits': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'plan administrator',
    proofRequired: 'claim started',
  },
  'update or create a new will for surviving spouse': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'message',
    waitingOn: 'estate attorney',
    ownerRole: 'surviving_spouse_or_attorney',
    proofRequired: 'attorney appointment or plan',
  },
  'update beneficiary designations on all accounts': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'account providers',
    proofRequired: 'updated beneficiary checklist',
  },
  'transfer vehicle titles with the dmv': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'state DMV',
    proofRequired: 'title transfer instructions or receipt',
    officialLink: 'https://www.usa.gov/motor-vehicle-services',
    officialLinkLabel: 'Find state DMV',
  },
  'begin real property transfer or sale process': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'message',
    waitingOn: 'real estate attorney or title company',
    ownerRole: 'executor',
    proofRequired: 'professional next step recorded',
  },
  'cancel all subscriptions and recurring services': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'service providers',
    proofRequired: 'cancellation list updated',
  },
  'memorialize or close social media accounts': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'social platform',
    proofRequired: 'platform request submitted',
  },
  'file the final income tax return': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'link',
    waitingOn: 'CPA or tax preparer',
    ownerRole: 'executor_or_cpa',
    proofRequired: 'tax owner and filing deadline recorded',
    officialLink: 'https://www.irs.gov/individuals/file-the-final-income-tax-returns-of-a-deceased-person',
    officialLinkLabel: 'Open IRS final return guidance',
  },
  'file estate tax return if applicable': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'link',
    waitingOn: 'CPA or estate attorney',
    ownerRole: 'executor_or_cpa',
    proofRequired: 'filing requirement decision recorded',
    officialLink: 'https://www.irs.gov/individuals/deceased-person',
    officialLinkLabel: 'Open IRS deceased person guidance',
  },
  'notify the three credit bureaus': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'credit bureaus',
    proofRequired: 'deceased alert confirmations',
    requiredDocuments: ['death certificate', 'proof of authority'],
    officialLink: 'https://www.identitytheft.gov/',
    officialLinkLabel: 'Open identity theft guidance',
  },
  'arrange estate sale or donation of belongings': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'estate sale company or charity',
    proofRequired: 'pickup/sale plan confirmed',
  },
  'cancel or surrender the passport': {
    automationLevel: 'EXTERNAL',
    executionKind: 'link',
    waitingOn: 'Department of State',
    proofRequired: 'passport instructions or submission recorded',
    officialLink: 'https://travel.state.gov/content/travel/en/passports/have-passport/passport-deceased.html',
    officialLinkLabel: 'Open passport surrender guidance',
  },
  'notify professional and alumni associations': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'association contact',
    proofRequired: 'association notified',
  },
  'establish a memorial fund or charitable giving option': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'message',
    waitingOn: 'charity or family reviewer',
    proofRequired: 'donation path confirmed',
  },
  'send handwritten thank you notes': {
    automationLevel: 'SEND_TRACK',
    executionKind: 'record',
    waitingOn: 'family coordinator',
    proofRequired: 'thank-you list handled',
  },
  'review and update home and auto insurance': {
    automationLevel: 'PACKET',
    executionKind: 'packet',
    waitingOn: 'insurance agent',
    proofRequired: 'policy update instructions recorded',
  },
  'contact attorney about formally closing the estate': {
    automationLevel: 'PROFESSIONAL',
    executionKind: 'message',
    waitingOn: 'estate attorney',
    ownerRole: 'executor',
    proofRequired: 'estate closing next step recorded',
  },
};

function fallbackForTitle(title) {
  const lower = normalizeTitle(title);
  if (lower.includes('funeral') || lower.includes('cemetery') || lower.includes('crematorium') || lower.includes('obituary')) {
    return { ...base, automationLevel: 'PARTNER_HANDOFF', partnerOwnerRole: 'funeral_home_director', funeralHomeEligible: true, waitingOn: 'funeral home or service partner', proofRequired: 'partner update' };
  }
  if (lower.includes('bank') || lower.includes('insurance') || lower.includes('benefit') || lower.includes('credit')) {
    return { ...base, automationLevel: 'PACKET', executionKind: 'packet', waitingOn: 'institution', proofRequired: 'institution instructions recorded' };
  }
  if (lower.includes('tax') || lower.includes('probate') || lower.includes('attorney') || lower.includes('property')) {
    return { ...base, automationLevel: 'PROFESSIONAL', waitingOn: 'professional advisor', proofRequired: 'professional next step recorded' };
  }
  if (lower.includes('dmv') || lower.includes('passport') || lower.includes('social security') || lower.includes('medicare') || lower.includes('voter')) {
    return { ...base, automationLevel: 'EXTERNAL', executionKind: 'link', waitingOn: 'agency', proofRequired: 'agency next step recorded' };
  }
  return { ...base };
}

export function getTaskPlaybook(title) {
  const key = normalizeTitle(title);
  const exact = byTitle[key] || fallbackForTitle(title);
  const level = AUTOMATION_LEVELS[exact.automationLevel] || AUTOMATION_LEVELS.SEND_TRACK;
  const template = Object.values(INSTITUTION_TEMPLATES).find(item => item.match.includes(key)) || null;
  return {
    ...base,
    ...exact,
    playbookKey: key,
    automation: level,
    executionTier: level.tier,
    topProofTask: TOP_PROOF_TASKS.includes(key),
    institutionTemplate: template,
    automationLabel: level.label,
    automationShortLabel: level.shortLabel,
    automationExplanation: level.explanation,
  };
}

export function enrichTaskWithPlaybook(task) {
  const playbook = getTaskPlaybook(task?.title);
  return { ...task, playbook };
}

export function partnerTaskPriority(task) {
  const playbook = task?.playbook || getTaskPlaybook(task?.title);
  if (task?.status === 'blocked' || task?.status === 'failed' || task?.status === 'needs_review') return 0;
  if (playbook.funeralHomeEligible) return 1;
  if (playbook.automationLevel === 'PARTNER_HANDOFF') return 2;
  if (playbook.automationLevel === 'PACKET') return 3;
  return 4;
}
