export function smsDeliveryState() {
  const hasTwilioCredentials = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  );
  const explicitlyEnabled = String(process.env.PASSAGE_SMS_LIVE_ENABLED || '').toLowerCase() === 'true';
  return {
    hasTwilioCredentials,
    liveEnabled: hasTwilioCredentials && explicitlyEnabled,
    pausedReason: hasTwilioCredentials
      ? 'SMS delivery is paused until Passage confirms carrier registration for production texting.'
      : 'Twilio SMS is not configured for this environment.',
  };
}
