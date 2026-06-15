export const RATE_LIMIT_POLICIES = {
  tracking: {
    label: 'Anonymous product telemetry',
    routes: ['/api/trackEvent'],
    windowSeconds: 60,
    maxRequests: 30,
    identity: 'ip+session+path',
    response: 'Drop or coalesce excess anonymous events; never block core product use.',
  },
  contactIntake: {
    label: 'Contact and lead intake',
    routes: ['/api/contact', '/api/leads', '/api/vendorApplication'],
    windowSeconds: 3600,
    maxRequests: 5,
    identity: 'ip+email',
    response: 'Return 429 with a calm support message and preserve no duplicate CRM rows.',
  },
  authSensitive: {
    label: 'Auth, magic link, and reset attempts',
    routes: ['/login', '/api/auth/*'],
    windowSeconds: 900,
    maxRequests: 5,
    identity: 'ip+email',
    response: 'Cooldown before another auth email or password attempt can be requested.',
  },
  adminReadiness: {
    label: 'System-admin readiness checks',
    routes: ['/api/system/*Readiness', '/api/system/orchestrationSmokeTest'],
    windowSeconds: 60,
    maxRequests: 10,
    identity: 'adminUser',
    response: 'Return 429 and show last successful readiness result instead of hammering integrations.',
  },
  outboundDelivery: {
    label: 'Email, SMS, task sends, and reminders',
    routes: ['/api/sendEmail', '/api/sendSMS', '/api/processTaskReminders', '/api/processScheduledDeliveries'],
    windowSeconds: 3600,
    maxRequests: 20,
    identity: 'workflow+recipient+action',
    response: 'Prevent repeated sends; surface delivery trail and next allowed send time.',
  },
  vendorCommerce: {
    label: 'Vendor quote, checkout, and payout-sensitive actions',
    routes: ['/api/vendor*', '/api/stripe/*'],
    windowSeconds: 300,
    maxRequests: 20,
    identity: 'user+vendor+request',
    response: 'Throttle mutation attempts and require fresh state before retrying payment transitions.',
  },
};

export const REFRESH_POLICIES = {
  adminDashboard: {
    label: 'System Admin dashboards',
    minSeconds: 60,
    backoff: 'Double interval after errors until five minutes; manual refresh remains available.',
  },
  funeralHomeMyDay: {
    label: 'Funeral-home My Day',
    minSeconds: 30,
    backoff: 'Use visibility-aware refresh; pause when tab is hidden and refresh on focus.',
  },
  participantTask: {
    label: 'Participant task page',
    minSeconds: 45,
    backoff: 'Prefer explicit saved state over polling; refresh after submit or focus regain.',
  },
  vendorRequest: {
    label: 'Vendor request page',
    minSeconds: 45,
    backoff: 'Refresh after quote/status mutation; otherwise avoid repeated payment-state polling.',
  },
  publicMarketing: {
    label: 'Public site and sample console',
    minSeconds: 0,
    backoff: 'No background polling unless a demo tool explicitly needs it.',
  },
};

export function getRateLimitPolicy(key) {
  return RATE_LIMIT_POLICIES[key] || null;
}

export function getRefreshPolicy(key) {
  return REFRESH_POLICIES[key] || null;
}

export function rateLimitPolicyChecklist() {
  return Object.entries(RATE_LIMIT_POLICIES).map(([key, policy]) => ({ key, ...policy }));
}

export function refreshPolicyChecklist() {
  return Object.entries(REFRESH_POLICIES).map(([key, policy]) => ({ key, ...policy }));
}
