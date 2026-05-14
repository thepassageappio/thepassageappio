export function isQaNotificationMode() {
  return !!process.env.QA_NOTIFICATION_OVERRIDE_EMAIL && (
    process.env.QA_NOTIFICATION_MODE === '1' ||
    process.env.QA_NOTIFICATION_MODE === 'true' ||
    process.env.PASSAGE_QA_MODE === '1' ||
    process.env.PASSAGE_QA_MODE === 'true'
  );
}

export function qaOverrideEmail() {
  return String(process.env.QA_NOTIFICATION_OVERRIDE_EMAIL || '').trim();
}

export function routeEmailRecipients(recipients) {
  const intended = (Array.isArray(recipients) ? recipients : [recipients])
    .filter(Boolean)
    .map(value => String(value).trim())
    .filter(Boolean);
  if (!isQaNotificationMode()) {
    return { intended, actual: intended, qaOverride: false, overrideEmail: null };
  }
  const override = qaOverrideEmail();
  return { intended, actual: override ? [override] : [], qaOverride: true, overrideEmail: override || null };
}

export function qaAuditFields(route) {
  if (!route?.qaOverride) return {};
  return {
    intended_recipient_email: route.intended?.[0] || null,
    actual_recipient_email: route.actual?.[0] || null,
    qa_override_active: true,
  };
}

export async function insertNotificationLog(admin, row) {
  if (!admin || !row) return;
  const { error } = await admin.from('notification_log').insert([row]);
  if (!error) return;
  const fallback = { ...row };
  delete fallback.intended_recipient_email;
  delete fallback.intended_recipient_phone;
  delete fallback.actual_recipient_email;
  delete fallback.actual_recipient_phone;
  delete fallback.qa_override_active;
  delete fallback.source;
  await admin.from('notification_log').insert([fallback]).then(() => {}, () => {});
}
