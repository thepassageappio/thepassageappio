export const mobileCompanionPersonas = [
  {
    id: 'family-coordinator',
    label: 'Family coordinator',
    promise: 'Open the active record, see the next move, assign help, approve updates, and add proof from a phone.',
    primaryScreen: 'My Day',
    actions: ['view_next_moves', 'assign_task', 'invite_helper', 'approve_update', 'upload_proof'],
    requiredApis: ['/api/myEstates', '/api/estateContext', '/api/tasks/[id]/assign', '/api/familyUpdate', '/api/estateFile'],
  },
  {
    id: 'participant',
    label: 'Participant/helper',
    promise: 'Open one scoped request, understand the ask, respond, save a note, or complete proof in under one minute.',
    primaryScreen: 'Assigned request',
    actions: ['accept_responsibility', 'mark_waiting', 'save_note', 'ask_for_help', 'complete_task'],
    requiredApis: ['/api/participantContext', '/api/participantAction'],
  },
  {
    id: 'funeral-home-staff',
    label: 'Funeral-home employee',
    promise: 'See only assigned work, location scope, case context, waiting point, and proof action.',
    primaryScreen: 'Staff My Day',
    actions: ['view_assigned_work', 'request_family_info', 'mark_waiting', 'close_with_proof'],
    requiredApis: ['/api/partnerContext', '/api/partnerHandleTask', '/api/partnerCase'],
  },
  {
    id: 'funeral-home-director',
    label: 'Funeral-home director',
    promise: 'See My Day across locations, unassigned work, warm inbounds, staff load, and reporting signals.',
    primaryScreen: 'Director My Day',
    actions: ['view_locations', 'assign_staff', 'open_case', 'review_warm_inbound', 'export_proof'],
    requiredApis: ['/api/partnerContext', '/api/partnerStaff', '/api/partnerLocations', '/api/partnerExport'],
  },
  {
    id: 'vendor',
    label: 'Vendor',
    promise: 'Open a scoped request, quote or decline, confirm date/time/location, and mark completion proof.',
    primaryScreen: 'Vendor request',
    actions: ['view_request', 'submit_quote', 'decline_request', 'mark_scheduled', 'mark_completed'],
    requiredApis: ['/api/vendors/me', '/api/vendorRequests/portal', '/api/vendorRequests/respond', '/api/vendorRequests/decision'],
  },
];

export const mobileCompanionApiSurface = [
  {
    id: 'role_resolver',
    label: 'Role resolver',
    plannedEndpoint: '/api/mobile/me',
    currentWebApis: ['/api/myEstates', '/api/participantContext', '/api/partnerContext', '/api/vendors/me'],
    success: 'A signed-in mobile user lands in the right persona home without choosing from a confusing menu.',
  },
  {
    id: 'my_day',
    label: 'My Day',
    plannedEndpoint: '/api/mobile/my-day',
    currentWebApis: ['/api/estateContext', '/api/partnerContext', '/api/vendors/me'],
    success: 'Every role sees do-now, waiting, blocked, and completed states from the same spine.',
  },
  {
    id: 'task_action',
    label: 'Task action',
    plannedEndpoint: '/api/mobile/tasks/[id]/action',
    currentWebApis: ['/api/participantAction', '/api/partnerHandleTask', '/api/tasks/[id]/status', '/api/tasks/[id]/assign'],
    success: 'Accept, waiting, help, note, proof, and complete actions produce status events and notifications.',
  },
  {
    id: 'proof_upload',
    label: 'Proof upload',
    plannedEndpoint: '/api/mobile/uploads',
    currentWebApis: ['/api/estateFile'],
    success: 'Photos, PDFs, and notes attach to the task or estate event with role-scoped visibility.',
  },
  {
    id: 'push_tokens',
    label: 'Push notification registration',
    plannedEndpoint: '/api/mobile/push-token',
    currentWebApis: ['/api/sendEmail', '/api/sendSMS'],
    success: 'Email remains the production notification path now; mobile push tokens can be added without changing the email spine.',
  },
];

export const mobileCompanionSuccessCriteria = [
  'Participant can open a phone link, understand one task, respond, and leave proof in under one minute.',
  'Funeral-home employee sees what needs attention today with no director clutter.',
  'Vendor can quote or update a request from a phone with date, time, location, payment status, and obligation reminders clear.',
  'Family coordinator can approve or send a reviewed update from mobile without losing the proof trail.',
  'Every mobile action writes the same task/status/notification proof as the web app.',
];

export function buildMobileCompanionScore({ env = {}, schema = {}, routes = {} } = {}) {
  const checks = [
    {
      id: 'email_notifications',
      label: 'Email notification spine',
      ok: Boolean(env.resend),
      detail: env.resend ? 'Resend configured' : 'RESEND_API_KEY missing',
    },
    {
      id: 'mobile_push_storage',
      label: 'Push-token storage',
      ok: Boolean(schema.mobile_push_tokens),
      detail: schema.mobile_push_tokens ? 'mobile_push_tokens table exists' : 'Add mobile_push_tokens table before native push launch',
    },
    {
      id: 'role_api_contract',
      label: 'Role API contract',
      ok: Boolean(routes.role_resolver),
      detail: routes.role_resolver ? 'Role resolver planned' : 'Define /api/mobile/me before app build',
    },
    {
      id: 'action_api_contract',
      label: 'Action API contract',
      ok: Boolean(routes.task_action),
      detail: routes.task_action ? 'Task action contract planned' : 'Define /api/mobile/tasks/[id]/action before app build',
    },
    {
      id: 'proof_api_contract',
      label: 'Proof upload contract',
      ok: Boolean(routes.proof_upload),
      detail: routes.proof_upload ? 'Proof upload contract planned' : 'Define /api/mobile/uploads before app build',
    },
  ];
  return {
    status: checks.every(check => check.ok || check.id === 'mobile_push_storage') ? 'scoped' : 'needs_scope',
    checks,
  };
}
