import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export type PartnerViewer = {
  userId: string;
  email: string;
  partnerMemberId: string;
  partnerOrganizationId: string;
  partnerOrganizationName: string;
  displayName: string;
  role: 'owner' | 'member';
};

export type PartnerViewerResult =
  | { ok: true; viewer: PartnerViewer }
  | { ok: false; reason: 'environment-unavailable' | 'signed-out' | 'membership-required' | 'authority-unavailable' };

type PartnerMembershipRow = {
  id: string;
  partner_organization_id: string;
  role: string;
  status: string;
  display_name: string;
  email: string;
  partner_organizations: { name: string; status: string } | { name: string; status: string }[] | null;
};

function related<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

// Mirrors lib/auth/authorization.ts's resolveOperationalViewer(), but scoped to
// the vendor/partner side: partner_members + partner_organizations instead of
// organization_members + organizations. Deliberately its own table lineage
// (not a role on organization_members) since a vendor is an external company,
// not funeral-home staff.
export async function resolvePartnerViewer(): Promise<PartnerViewerResult> {
  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'environment-unavailable' };
  const user = await verifiedUser(client);
  if (!user || !user.email) return { ok: false, reason: 'signed-out' };

  const membershipResult = await client
    .from('partner_members')
    .select('id, partner_organization_id, role, status, display_name, email, partner_organizations(name, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);
  if (membershipResult.error) return { ok: false, reason: 'authority-unavailable' };

  const rows = (membershipResult.data ?? []) as unknown as PartnerMembershipRow[];
  if (rows.length === 0) return { ok: false, reason: 'membership-required' };

  const membership = rows[0];
  const partnerOrg = related(membership.partner_organizations);
  if (!partnerOrg || partnerOrg.status !== 'active') return { ok: false, reason: 'authority-unavailable' };
  if (!['owner', 'member'].includes(membership.role)) return { ok: false, reason: 'authority-unavailable' };

  return {
    ok: true,
    viewer: {
      userId: user.id,
      email: user.email,
      partnerMemberId: membership.id,
      partnerOrganizationId: membership.partner_organization_id,
      partnerOrganizationName: partnerOrg.name,
      displayName: membership.display_name?.trim() || user.user_metadata.full_name || user.email,
      role: membership.role as 'owner' | 'member',
    },
  };
}
