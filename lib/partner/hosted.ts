import 'server-only';

import { resolvePartnerViewer, type PartnerViewer } from '@/lib/auth/partner-authorization';
import { createPassageServerClient } from '@/lib/supabase/server';

export type HostedPartnerRequest = {
  id: string;
  organization_id: string;
  workflow_id: string;
  partner_organization_id: string;
  category: 'florist' | 'catering' | 'transport' | 'memorial_products' | 'other';
  title: string;
  details: string;
  needed_by: string | null;
  status: 'sent' | 'in_progress' | 'declined' | 'proof_submitted' | 'verified';
  version: number;
  quote_amount_cents: number | null;
  response_note: string | null;
  decline_reason: string | null;
  proof_summary: string | null;
  proof_reference: string | null;
  sent_at: string;
  responded_at: string | null;
  started_at: string | null;
  proof_submitted_at: string | null;
  verified_at: string | null;
};

export type HostedPartnerRequestEvent = {
  id: string;
  partner_request_id: string;
  actor_organization_member_id: string | null;
  actor_partner_member_id: string | null;
  name: string;
  previous_state: string | null;
  next_state: string;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
};

export type HostedPartnerMember = {
  id: string;
  display_name: string;
};

export type HostedPartnerData = {
  viewer: PartnerViewer;
  requests: HostedPartnerRequest[];
  events: HostedPartnerRequestEvent[];
  members: HostedPartnerMember[];
};

export type HostedPartnerResult =
  | { ok: true; data: HostedPartnerData }
  | { ok: false; message: string };

const PARTNER_REQUEST_COLUMNS = 'id, organization_id, workflow_id, partner_organization_id, category, title, details, needed_by, status, version, quote_amount_cents, response_note, decline_reason, proof_summary, proof_reference, sent_at, responded_at, started_at, proof_submitted_at, verified_at';

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

  const [requestResult, eventResult, memberResult] = await Promise.all([
    client.from('partner_requests').select(PARTNER_REQUEST_COLUMNS).eq('partner_organization_id', viewerResult.viewer.partnerOrganizationId).order('sent_at', { ascending: false }),
    options.events
      ? client.from('partner_request_events').select('id, partner_request_id, actor_organization_member_id, actor_partner_member_id, name, previous_state, next_state, idempotency_key, metadata, occurred_at').eq('partner_organization_id', viewerResult.viewer.partnerOrganizationId).order('occurred_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
    client.from('partner_members').select('id, display_name').eq('partner_organization_id', viewerResult.viewer.partnerOrganizationId).eq('status', 'active'),
  ]);

  const error = requestResult.error ?? eventResult.error ?? memberResult.error;
  if (error) return { ok: false, message: 'Passage could not verify durable vendor requests. No data is shown.' };

  return {
    ok: true,
    data: {
      viewer: viewerResult.viewer,
      requests: (requestResult.data ?? []) as HostedPartnerRequest[],
      events: (eventResult.data ?? []) as HostedPartnerRequestEvent[],
      members: (memberResult.data ?? []) as HostedPartnerMember[],
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
  const requestResult = await client
    .from('partner_requests')
    .select(PARTNER_REQUEST_COLUMNS)
    .eq('workflow_id', workflowId)
    .order('sent_at', { ascending: false });
  const requests = (requestResult.data ?? []) as HostedPartnerRequest[];
  const requestPartnerIds = [...new Set(requests.map((request) => request.partner_organization_id))];
  const [activeOrganizationResult, requestedOrganizationResult] = await Promise.all([
    client.from('partner_organizations').select('id, name, category, status').eq('status', 'active').order('name'),
    requestPartnerIds.length > 0
      ? client.from('partner_organizations').select('id, name, category, status').in('id', requestPartnerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const partnerOrganizations = [
    ...((activeOrganizationResult.data ?? []) as { id: string; name: string; category: string; status: string }[]),
    ...((requestedOrganizationResult.data ?? []) as { id: string; name: string; category: string; status: string }[]),
  ].filter((organization, index, all) => all.findIndex((candidate) => candidate.id === organization.id) === index);
  const requestIds = requests.map((request) => request.id);
  const eventResult = requestIds.length > 0
    ? await client.from('partner_request_events').select('id, partner_request_id, actor_organization_member_id, actor_partner_member_id, name, previous_state, next_state, idempotency_key, metadata, occurred_at').in('partner_request_id', requestIds).order('occurred_at', { ascending: false }).limit(100)
    : { data: [], error: null };
  return {
    requests,
    partnerOrganizations,
    events: (eventResult.data ?? []) as HostedPartnerRequestEvent[],
    error: requestResult.error ?? activeOrganizationResult.error ?? requestedOrganizationResult.error ?? eventResult.error ?? null,
  };
}

const categoryLabels: Record<string, string> = {
  florist: 'Florist',
  catering: 'Catering',
  transport: 'Transport',
  memorial_products: 'Memorial products',
  other: 'Other vendor',
};

const statusLabels: Record<string, string> = {
  sent: 'Waiting for vendor response',
  in_progress: 'Accepted — in progress',
  declined: 'Declined by vendor',
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
