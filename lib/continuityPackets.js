function value(input, fallback = 'Not added yet') {
  const text = String(input || '').trim();
  return text || fallback;
}

function lines(items = []) {
  return items.filter(Boolean).join('\n');
}

function brandedLines(items = []) {
  return lines([
    'Passage',
    'Powered by Passage | thepassageapp.io',
    '',
    ...items,
  ]);
}

function bullet(items = []) {
  return items.filter(Boolean).map(item => `- ${item}`).join('\n');
}

function eventLine(event = {}) {
  const title = value(event.title || event.label, 'Event');
  const date = value(event.date || event.when, 'date unknown');
  const location = value(event.location, 'location pending');
  const time = value(event.time, '');
  return `${title}: ${date}${time && time !== 'Not added yet' ? ` at ${time}` : ''} - ${location}`;
}

export function buildContinuityContext(input = {}) {
  const familyName = value(input.familyName || input.caseName || input.deceasedName, 'Family');
  const lovedOne = value(input.lovedOne || input.deceasedName || input.caseName, 'Your loved one');
  return {
    familyName,
    lovedOne,
    coordinatorName: value(input.coordinatorName || input.familyCoordinator, 'Family coordinator'),
    coordinatorEmail: value(input.coordinatorEmail, ''),
    coordinatorPhone: value(input.coordinatorPhone, ''),
    caregiverName: value(input.caregiverName, 'Primary caregiver'),
    hospiceAgency: value(input.hospiceAgency, 'Hospice agency not added yet'),
    hospiceContact: value(input.hospiceContact, 'Hospice/on-call contact not added yet'),
    hospicePhone: value(input.hospicePhone, ''),
    funeralHomeName: value(input.funeralHomeName, 'Funeral home not selected yet'),
    funeralHomeContact: value(input.funeralHomeContact, 'Funeral-home contact pending'),
    authorityContact: value(input.authorityContact, 'Decision maker not recorded yet'),
    dispositionPreference: value(input.dispositionPreference, 'Preference not recorded yet'),
    servicePreference: value(input.servicePreference, 'Service preferences not recorded yet'),
    dateOfDeath: value(input.dateOfDeath, 'Date of death not recorded yet'),
    deathLocation: value(input.deathLocation, 'Location not recorded yet'),
    caseReference: value(input.caseReference, 'Not assigned'),
    events: Array.isArray(input.events) ? input.events : [],
    openTasks: Array.isArray(input.openTasks) ? input.openTasks : [],
    missingItems: Array.isArray(input.missingItems) ? input.missingItems : [],
    preparedDate: input.preparedDate || new Date().toLocaleDateString('en-US'),
  };
}

export function buildHospiceHandoffPacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    `Passage warm-path handoff`,
    `${ctx.familyName}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Family coordinator',
    `Name: ${ctx.coordinatorName}`,
    `Email: ${ctx.coordinatorEmail}`,
    `Phone: ${ctx.coordinatorPhone}`,
    '',
    'Care context',
    `Loved one: ${ctx.lovedOne}`,
    `Current location: ${ctx.deathLocation}`,
    `Primary caregiver: ${ctx.caregiverName}`,
    `Hospice agency: ${ctx.hospiceAgency}`,
    `Hospice/on-call contact: ${ctx.hospiceContact}${ctx.hospicePhone ? ` - ${ctx.hospicePhone}` : ''}`,
    '',
    'If death occurs',
    bullet([
      'Call the hospice/on-call contact first if this is an expected hospice death.',
      'Record who pronounced or confirmed death and any reference number.',
      'Do not share this packet with a funeral home until the family coordinator approves.',
      'Open the Passage red path so the next official steps use the context already gathered.',
    ]),
    '',
    'Funeral-home preference',
    `Preferred funeral home: ${ctx.funeralHomeName}`,
    `Funeral-home contact: ${ctx.funeralHomeContact}`,
    `Authority / decision maker: ${ctx.authorityContact}`,
    '',
    'Known preferences',
    `Disposition: ${ctx.dispositionPreference}`,
    `Service: ${ctx.servicePreference}`,
    '',
    'Known events',
    ctx.events.length ? ctx.events.map(eventLine).join('\n') : 'No service or ceremony dates recorded yet.',
    '',
    'Missing items to keep visible',
    ctx.missingItems.length ? bullet(ctx.missingItems) : 'No missing items supplied.',
  ]);
}

export function buildFuneralHomeArrangementPacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    `Funeral-home arrangement packet`,
    `${ctx.familyName}`,
    `Case reference: ${ctx.caseReference}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Primary family contact',
    `Name: ${ctx.coordinatorName}`,
    `Email: ${ctx.coordinatorEmail}`,
    `Phone: ${ctx.coordinatorPhone}`,
    '',
    'Death / release context',
    `Loved one: ${ctx.lovedOne}`,
    `Date of death: ${ctx.dateOfDeath}`,
    `Location: ${ctx.deathLocation}`,
    `Hospice / facility contact: ${ctx.hospiceContact}${ctx.hospicePhone ? ` - ${ctx.hospicePhone}` : ''}`,
    `Authority / decision maker: ${ctx.authorityContact}`,
    '',
    'Service and disposition preferences',
    `Disposition: ${ctx.dispositionPreference}`,
    `Service: ${ctx.servicePreference}`,
    '',
    'Important dates',
    ctx.events.length ? ctx.events.map(eventLine).join('\n') : 'Dates are not known yet. Keep missing event dates visible until available.',
    '',
    'Open work for the family or staff',
    ctx.openTasks.length ? bullet(ctx.openTasks) : 'No open work supplied.',
    '',
    'Proof to record',
    bullet([
      'Arrangement details reviewed.',
      'Missing items requested once from the family.',
      'Next expected update saved on the case.',
      'Family-facing status updated after review.',
    ]),
  ]);
}

export function buildExecutorSummaryPacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    'Executor / family continuity summary',
    `${ctx.familyName}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Who is coordinating',
    `Family coordinator: ${ctx.coordinatorName}`,
    `Authority / decision maker: ${ctx.authorityContact}`,
    '',
    'What is already known',
    bullet([
      `Loved one: ${ctx.lovedOne}`,
      `Date of death: ${ctx.dateOfDeath}`,
      `Funeral home: ${ctx.funeralHomeName}`,
      `Disposition preference: ${ctx.dispositionPreference}`,
    ]),
    '',
    'Near-term estate work',
    bullet([
      'Locate will, trust, or attorney contact.',
      'Order or confirm certified death certificates.',
      'Hold mail and watch for bank, insurance, tax, and benefit notices.',
      'Do not distribute assets until authority and legal path are clear.',
    ]),
    '',
    'Open items',
    ctx.openTasks.length ? bullet(ctx.openTasks) : 'No open executor items supplied.',
  ]);
}

export function buildAgencyNotificationPacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    'Government / institution notification packet',
    `${ctx.familyName}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Caller context',
    `Coordinator: ${ctx.coordinatorName}`,
    `Authority / decision maker: ${ctx.authorityContact}`,
    `Loved one: ${ctx.lovedOne}`,
    `Date of death: ${ctx.dateOfDeath}`,
    '',
    'Use this for',
    bullet([
      'Social Security, Medicare/Medicaid, VA, DMV, passport, voter registration, employer, bank, insurance, pension, retirement, or credit bureau workflows.',
      'Ask what documents are required.',
      'Record confirmation number, claim number, appointment, mailing address, or next expected update.',
      'Save proof before marking the task handled.',
    ]),
    '',
    'Documents to gather',
    bullet([
      'Certified death certificate if requested.',
      'Proof of authority, executor paperwork, beneficiary form, or account reference if applicable.',
      'Agency identifier or account number if known.',
    ]),
  ]);
}

export function buildFamilyEventOnePager(input = {}) {
  const ctx = buildContinuityContext(input);
  const eventList = ctx.events.length ? ctx.events.map(eventLine).join('\n') : 'Event dates are still being confirmed.';
  return brandedLines([
    `${ctx.familyName} family update`,
    '',
    `${ctx.lovedOne} has died. The family is coordinating next steps through Passage so updates, dates, and responsibilities stay in one place.`,
    '',
    'Known events',
    eventList,
    '',
    'Family note',
    'Thank you for giving the family space and support. If you have photos, stories, or practical help to offer, please send them to the family coordinator so nothing gets lost in separate threads.',
    '',
    'Family coordinator',
    `${ctx.coordinatorName}${ctx.coordinatorEmail ? ` - ${ctx.coordinatorEmail}` : ''}${ctx.coordinatorPhone ? ` - ${ctx.coordinatorPhone}` : ''}`,
  ]);
}

export function buildContinuityPackets(input = {}) {
  return [
    {
      id: 'hospice-handoff',
      title: 'Hospice / warm-path handoff',
      description: 'Carries caregiver, hospice, family coordinator, preferences, missing items, and first-hour guidance into the red path.',
      text: buildHospiceHandoffPacket(input),
    },
    {
      id: 'funeral-home-arrangement',
      title: 'Funeral-home arrangement packet',
      description: 'Gives the director known contacts, dates, release context, preferences, open work, and proof requirements.',
      text: buildFuneralHomeArrangementPacket(input),
    },
    {
      id: 'executor-summary',
      title: 'Executor / family summary',
      description: 'Gives the executor or family coordinator the next legal and administrative work without pretending to be legal advice.',
      text: buildExecutorSummaryPacket(input),
    },
    {
      id: 'agency-notification',
      title: 'Government / institution packet',
      description: 'Reusable script and document checklist for benefits, agencies, banks, insurance, employers, and account workflows.',
      text: buildAgencyNotificationPacket(input),
    },
    {
      id: 'family-event-one-pager',
      title: 'Family event one-pager',
      description: 'A calm family-facing update with event dates, locations, and coordinator contact before any email or text send.',
      text: buildFamilyEventOnePager(input),
    },
  ];
}

export function demoContinuityInput() {
  return {
    familyName: 'Taylor family',
    lovedOne: 'Jack Taylor',
    coordinatorName: 'Maya Taylor',
    coordinatorEmail: 'maya@example.com',
    coordinatorPhone: '(555) 014-1188',
    caregiverName: 'Daniel Taylor',
    hospiceAgency: 'Hudson Valley Hospice',
    hospiceContact: 'Nurse line / social worker',
    hospicePhone: '(555) 014-2200',
    funeralHomeName: 'Hudson Valley Funeral Group',
    funeralHomeContact: 'Eleanor Price',
    authorityContact: 'Maya Taylor, daughter and family coordinator',
    dispositionPreference: 'Cremation with memorial service',
    servicePreference: 'Small memorial with clergy blessing and family stories',
    dateOfDeath: 'May 9, 2026',
    deathLocation: 'Home under hospice care',
    caseReference: 'HVFG-2026-0142',
    events: [
      { title: 'Arrangement meeting', date: 'May 10, 2026', time: '11:00 AM', location: 'Hudson Valley Funeral Group' },
      { title: 'Memorial service', date: 'May 14, 2026', time: '2:00 PM', location: 'St. Mark Community Chapel' },
      { title: 'Reception', date: 'May 14, 2026', time: '3:30 PM', location: 'Family home' },
    ],
    openTasks: [
      'Confirm official pronouncement and release path',
      'Collect obituary approval from Maya',
      'Confirm clergy availability',
      'Prepare family event one-pager',
    ],
    missingItems: [
      'Cemetery or final resting preference if family changes from cremation',
      'Final obituary approval',
      'Photo for service program',
    ],
  };
}
