import 'server-only';

import { resolvePartnerViewer, type PartnerViewer } from '@/lib/auth/partner-authorization';
import { VENDOR_CATEGORY_LABELS, type VendorCategory } from '@/lib/partner/categories';
import { createPassageServerClient } from '@/lib/supabase/server';

export type HostedPartnerRequest = {
  id: string;
  organization_id: string;
  workflow_id: string;
  partner_organization_id: string;
  category: VendorCategory;
  title: string;
  details: string;
  needed_by: string | null;
  status: 'sent' | 'quoted' | 'in_progress' | 'declined' | 'proof_submitted' | 'verified';
  version: number;
  quote_amount_cents: number | null;
  response_note: string | null;
  decline_reason: string | null;
  proof_summary: string | null;
  proof_reference: string | null;
  platform_fee_cents: number | null;
  vendor_payout_cents: number | null;
  payout_released_at: string | null;
  sent_at: string;
  responded_at: string | null;
  quoted_at: string | null;
  started_at: string | null;
  proof_submitted_at: string | null;
  verified_at: string | null;
};

export type HostedPartnerRequestEvent = {
  id: string;
  partner_request_id: string;
  name: string;
  previous_state: string | null;
  next_state: string;
  occurred_at: string;
};

export type HostedPartnerData = {
  viewer: PartnerViewer;
  requests: HostedPartnerRequest[];
  events: HostedPartnerRequestEvent[];
};

export type HostedPartnerResult =
  | { ok: true; data: HostedPartnerData }
  | { ok: false; message: string };

const PARTNER_REQUEST_COLUMNS = 'id, organization_id, workflow_id, partner_organization_id, category, title, details, needed_by, status, version, quote_amount_cents, response_note, decline_reason, proof_summary, proof_reference, platform_fee_cents, vendor_payout_cents, payout_released_at, sent_at, responded_at, quoted_at, started_at, proof_submitted_at, verified_at';

// Vendor-side loader, scoped by RLS to this partner organization's own
// requests only (see partner_requests_authorized_select). Deliberately does
// NOT join organizations/organization_locations/workflows for case identity:
// a partner_members user has no organization_members row, so RLS on those
// tables returns nothing for them anyway (verified against
// cycle_7a_isolated_lab_locations_self_select) -- the vendor's view of a
// request is intentionally bounded to what this table itself carries
// (category, title, details, needed_by), matching
// docs/product/persona-action-architecture.md's "one bounded request/order".
export async function loadHostedPartnerData(options: { events?: boolean } = {}): Promise<HostedPartnerResult> {
  const viewerResult = await resolvePartnerViewer();
  if (!viewerResult.ok) return { ok: false, message: 'Passage could not verify current vendor authority.' };
  const client = await createPassageServerClient();
  if (!client) return { ok: false, message: 'The isolated workspace data service is unavailable.' };

  const [requestResult, eventResult] = await Promise.all([
    client.from('partner_requests').select(PARTNER_REQUEST_COLUMNS).eq('partner_organization_id', viewerResult.viewer.partnerOrganizationId).order('sent_at', { ascending: false }),
    options.events
      ? client.from('partner_request_events').select('id, partner_request_id, name, previous_state, next_state, occurred_at').eq('partner_organization_id', viewerResult.viewer.partnerOrganizationId).order('occurred_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = requestResult.error ?? eventResult.error;
  if (error) return { ok: false, message: 'Passage could not verify durable vendor requests. No data is shown.' };

  return {
    ok: true,
    data: {
      viewer: viewerResult.viewer,
      requests: (requestResult.data ?? []) as HostedPartnerRequest[],
      events: (eventResult.data ?? []) as HostedPartnerRequestEvent[],
    },
  };
}

export type PassageServerClient = NonNullable<Awaited<ReturnType<typeof createPassageServerClient>>>;

// Director-side helper: partner requests + eligible vendor organizations for
// one case (workflow). Used by the Case Room to show any vendor requests
// already sent for this case, and to originate a new one. Relies on the same
// RLS policy as the vendor loader (director authority is checked via
// passage_private.can_manage_location inside partner_requests_authorized_select),
// so a director only ever sees requests for cases they are authorized to manage.
export async function loadPartnerContextForWorkflow(client: PassageServerClient, workflowId: string) {
  const [requestResult, organizationResult] = await Promise.all([
    client.from('partner_requests').select(PARTNER_REQUEST_COLUMNS).eq('workflow_id', workflowId).order('sent_at', { ascending: false }),
    // A vendor cannot receive requests until payout setup (Stripe Connect) is
    // complete -- founder decision 2026-08-16 -- so the picker only ever
    // shows vendors who can actually be paid out once an order is verified.
    client.from('partner_organizations').select('id, name, category').eq('status', 'active').eq('stripe_connect_payouts_enabled', true).order('name'),
  ]);
  return {
    requests: (requestResult.data ?? []) as HostedPartnerRequest[],
    partnerOrganizations: (organizationResult.data ?? []) as { id: string; name: string; category: string }[],
    error: requestResult.error ?? organizationResult.error ?? null,
  };
}

const categoryLabels: Record<string, string> = VENDOR_CATEGORY_LABELS;

const statusLabels: Record<string, string> = {
  sent: 'Waiting for vendor response',
  quoted: 'Quoted — waiting for approval',
  in_progress: 'Approved & paid — in progress',
  declined: 'Declined',
  proof_submitted: 'Delivery proof waiting for review',
  verified: 'Verified — complete',
};

export function humanPartnerCategory(value: string) {
  return categoryLabels[value] ?? 'Vendor request';
}

export function humanPartnerRequestStatus(value: string) {
  return statusLabels[value] ?? 'Status unavailable';
}

export function formatPartnerAmount(cents: number | null) {
  if (cents === null || cents === undefined) return 'No quote yet';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function formatPartnerTime(value: string | null) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
}
