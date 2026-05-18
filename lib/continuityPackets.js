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
    careTeamType: value(input.careTeamType || input.providerType, 'Care team'),
    careSetting: value(input.careSetting, 'Care setting not added yet'),
    careTeamName: value(input.careTeamName || input.hospiceAgency || input.facilityName, 'Care team not added yet'),
    careTeamContact: value(input.careTeamContact || input.hospiceContact || input.facilityContact, 'Care/on-call contact not added yet'),
    careTeamPhone: value(input.careTeamPhone || input.hospicePhone || input.facilityPhone, ''),
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
    `Passage care-transition handoff`,
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
    `Care setting: ${ctx.careSetting}`,
    `Care team type: ${ctx.careTeamType}`,
    `Care team: ${ctx.careTeamName}`,
    `Care/on-call contact: ${ctx.careTeamContact}${ctx.careTeamPhone ? ` - ${ctx.careTeamPhone}` : ''}`,
    '',
    'If death occurs',
    bullet([
      'Call the hospice, on-call care team, or facility contact first if this is an expected death in care.',
      'Record who pronounced or confirmed death and any reference number.',
      'Do not share this packet with a funeral home until the family coordinator approves.',
      'Open Passage urgent coordination so the next official steps use the context already gathered.',
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
    `Care / facility contact: ${ctx.careTeamContact}${ctx.careTeamPhone ? ` - ${ctx.careTeamPhone}` : ''}`,
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

export function buildSecureHomeAssetsPacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    'Secure home and practical assets checklist',
    `${ctx.familyName}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Primary coordinator',
    `${ctx.coordinatorName}${ctx.coordinatorEmail ? ` - ${ctx.coordinatorEmail}` : ''}${ctx.coordinatorPhone ? ` - ${ctx.coordinatorPhone}` : ''}`,
    '',
    'Handle soon',
    bullet([
      'Confirm who has keys, garage codes, alarm codes, and building access.',
      'Check doors, windows, heat/AC, refrigerator, pets, plants, mail, packages, and obvious safety issues.',
      'Photograph rooms, valuables, vehicles, documents, and urgent maintenance concerns before moving items.',
      'Keep receipts for locksmith, cleaning, storage, repairs, travel, or emergency property costs.',
      'Do not distribute property until the executor, administrator, or attorney confirms the right path.',
    ]),
    '',
    'People to identify',
    bullet([
      'Executor or legal decision maker.',
      'Trusted local person who can enter the home.',
      'Landlord, property manager, neighbor, or building staff if applicable.',
      'Pet caregiver if animals are present.',
      'Insurance agent if the property is vacant or damaged.',
    ]),
    '',
    'Proof to save in Passage',
    bullet([
      'Who entered the home and when.',
      'Photos or notes showing urgent issues.',
      'Receipts or reference numbers.',
      'Any instructions from the executor, attorney, landlord, or insurer.',
    ]),
  ]);
}

export function buildVendorServiceRequestPacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    'Vendor service request packet',
    `${ctx.familyName}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Request context',
    `Loved one: ${ctx.lovedOne}`,
    `Coordinator: ${ctx.coordinatorName}${ctx.coordinatorEmail ? ` - ${ctx.coordinatorEmail}` : ''}${ctx.coordinatorPhone ? ` - ${ctx.coordinatorPhone}` : ''}`,
    `Funeral home: ${ctx.funeralHomeName}`,
    '',
    'Known dates',
    ctx.events.length ? ctx.events.map(eventLine).join('\n') : 'Service dates are not finalized yet. Vendor quote should include what depends on date, time, and location.',
    '',
    'Quote should include',
    bullet([
      'Service description.',
      'Date, time, arrival window, location, and delivery details.',
      'Gross price, taxes/fees if applicable, cancellation terms, and payment deadline.',
      'What proof the vendor will save when completed.',
      'Best contact for day-before and day-of questions.',
    ]),
    '',
    'Passage boundary',
    'Vendors receive only the scoped request details needed to quote or complete this task. They do not browse the family record.',
  ]);
}

export function buildObituaryServicePacket(input = {}) {
  const ctx = buildContinuityContext(input);
  return brandedLines([
    'Obituary and service materials packet',
    `${ctx.familyName}`,
    `Prepared: ${ctx.preparedDate}`,
    '',
    'Known facts',
    bullet([
      `Loved one: ${ctx.lovedOne}`,
      `Date of death: ${ctx.dateOfDeath}`,
      `Funeral home: ${ctx.funeralHomeName}`,
      `Disposition preference: ${ctx.dispositionPreference}`,
      `Service preference: ${ctx.servicePreference}`,
    ]),
    '',
    'Known events',
    ctx.events.length ? ctx.events.map(eventLine).join('\n') : 'No public service dates recorded yet.',
    '',
    'Review before publishing',
    bullet([
      'Spelling of names, dates, locations, and survivors.',
      'Photo selection and permission.',
      'Donation, flowers, livestream, reception, or visiting instructions.',
      'Newspaper, funeral-home website, church bulletin, or social post deadline.',
      'Who gives final approval before anything publishes.',
    ]),
    '',
    'Proof to save',
    bullet([
      'Final approved text.',
      'Where it was submitted.',
      'Publication link, confirmation number, receipt, or screenshot.',
    ]),
  ]);
}

export function buildContinuityPackets(input = {}) {
  return [
    {
      id: 'hospice-handoff',
      title: 'Care-team / care-prep handoff',
      description: 'Carries caregiver, hospice or facility context, family coordinator, preferences, missing items, and first-hour guidance into urgent coordination.',
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
    {
      id: 'secure-home-assets',
      title: 'Secure home and assets checklist',
      description: 'A practical checklist for property access, pets, mail, valuables, insurance, receipts, and proof.',
      text: buildSecureHomeAssetsPacket(input),
    },
    {
      id: 'vendor-service-request',
      title: 'Vendor quote request packet',
      description: 'A scoped quote brief for flowers, catering, printing, livestream, clergy, transportation, venue, or other local support.',
      text: buildVendorServiceRequestPacket(input),
    },
    {
      id: 'obituary-service-packet',
      title: 'Obituary and service materials packet',
      description: 'A review-first packet for obituary facts, service details, approval, submission, and publication proof.',
      text: buildObituaryServicePacket(input),
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
    careTeamType: 'Hospice',
    careSetting: 'Home hospice',
    careTeamName: 'Hudson Valley Hospice',
    careTeamContact: 'Nurse line / social worker',
    careTeamPhone: '(555) 014-2200',
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
    preparedDate: 'May 10, 2026',
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
