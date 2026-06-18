export const VENDOR_REQUEST_STATUSES = [
  'requested',
  'viewed',
  'quoted',
  'family_accepted',
  'payment_pending',
  'paid',
  'scheduled',
  'completed',
  'declined',
  'cancelled',
  'refunded',
];

export const VENDOR_PAYMENT_STATUSES = [
  'not_required',
  'quote_needed',
  'quote_ready',
  'family_accepted',
  'checkout_created',
  'payment_pending',
  'paid',
  'failed',
  'refunded',
  'cancelled',
];

export function canonicalVendorStatus(status) {
  if (status === 'accepted') return 'quoted';
  if (status === 'in_progress') return 'scheduled';
  return status || 'requested';
}

export function vendorStatusLabel(status) {
  const value = canonicalVendorStatus(status);
  if (value === 'viewed') return 'Viewed';
  if (value === 'quoted') return 'Quote Ready';
  if (value === 'family_accepted') return 'Quote Approved';
  if (value === 'payment_pending') return 'Payment Pending';
  if (value === 'paid') return 'Paid';
  if (value === 'scheduled') return 'Paid and Scheduled';
  if (value === 'completed') return 'Completed';
  if (value === 'declined') return 'Declined';
  if (value === 'cancelled') return 'Cancelled';
  if (value === 'refunded') return 'Refunded';
  return 'Quote Requested';
}

export function paymentStatusLabel(status) {
  if (status === 'quote_ready') return 'Quote Ready';
  if (status === 'family_accepted') return 'Quote Approved';
  if (status === 'checkout_created') return 'Checkout Created';
  if (status === 'payment_pending') return 'Payment Pending';
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Payment Failed';
  if (status === 'refunded') return 'Refunded';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'not_required' || status === 'waived') return 'Not Required';
  return 'Quote Needed';
}

export function vendorNextExpected(status, paymentStatus) {
  const value = canonicalVendorStatus(status);
  if (value === 'completed') return 'Completed. Proof and payment history stay on the family record.';
  if (value === 'scheduled') return 'Paid and scheduled. Complete the service, then mark it completed with proof.';
  if (value === 'paid') return 'Payment is confirmed. Schedule or complete the service when ready.';
  if (value === 'payment_pending' || paymentStatus === 'checkout_created') return 'Waiting for secure family payment.';
  if (value === 'family_accepted') return 'Quote approved. Payment checkout is the next step.';
  if (value === 'quoted') return 'Quote ready. Waiting for the family or coordinator to approve and pay.';
  if (value === 'declined') return 'Declined. Passage keeps this visible so another option can be found.';
  if (value === 'viewed') return 'Viewed. Send a quote, ask for details, or decline if you cannot help.';
  return 'Waiting for vendor response. Send a quote, ask for details, or decline if you cannot help.';
}