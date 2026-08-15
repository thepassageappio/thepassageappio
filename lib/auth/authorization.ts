import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export type OperationalRole = 'owner' | 'director' | 'staff';
export type OperationalViewer = { userId: string; email: string; membershipId: string; organizationId: string; organizationName: string; displayName: string; role: OperationalRole; locations: { id: string; name: string }[] };
export type OperationalViewerResult = { ok: true; viewer: OperationalViewer } | { ok: false; reason: 'environment-unavailable' | 'signed-out' | 'membership-required' | 'membership-revoked' | 'membership-selection-required' | 'authority-unavailable' };

type MembershipRow = { id: string; organization_id: string; role: string; status: string; display_name: string | null; email: string; organizations: { name: string } | { name: string }[] | null };
type LocationGrantRow = { organization_location_id: string; revoked_at: string | null; organization_locations: { name: string; status: string } | { name: string; status: string }[] | null };

function related<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

export async function resolveOperationalViewer(): Promise<OperationalViewerResult> {
  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'environment-unavailable' };
  const user = await verifiedUser(client);
  if (!user || !user.email) return { ok: false, reason: 'signed-out' };
  const membershipResult = await client.from('organization_members').select('id, organization_id, role, status, display_name, email, organizations(name)').eq('user_id', user.id).eq('status', 'active').limit(2);
  if (membershipResult.error) return { ok: false, reason: 'authority-unavailable' };
  const rows = (membershipResult.data ?? []) as unknown as MembershipRow[];
  if (rows.length === 0) {
    const revokedResult = await client.from('organization_members').select('id').eq('user_id', user.id).eq('status', 'revoked').limit(1);
    if (!revokedResult.error && (revokedResult.data?.length ?? 0) > 0) return { ok: false, reason: 'membership-revoked' };
    return { ok: false, reason: 'membership-required' };
  }
  if (rows.length > 1) return { ok: false, reason: 'membership-selection-required' };
  const membership = rows[0];
  if (!['owner', 'director', 'staff'].includes(membership.role)) return { ok: false, reason: 'authority-unavailable' };
  const locationResult = await client.from('organization_member_locations').select('organization_location_id, revoked_at, organization_locations(name, status)').eq('organization_member_id', membership.id).is('revoked_at', null);
  if (locationResult.error) return { ok: false, reason: 'authority-unavailable' };
  const locations = ((locationResult.data ?? []) as unknown as LocationGrantRow[]).map((grant) => ({ grant, location: related(grant.organization_locations) })).filter((item) => item.location?.status === 'active').map((item) => ({ id: item.grant.organization_location_id, name: item.location!.name }));
  if (locations.length === 0) return { ok: false, reason: 'authority-unavailable' };
  return { ok: true, viewer: { userId: user.id, email: user.email, membershipId: membership.id, organizationId: membership.organization_id, organizationName: related(membership.organizations)?.name ?? 'Funeral-home workspace', displayName: membership.display_name?.trim() || user.user_metadata.full_name || user.email, role: membership.role as OperationalRole, locations } };
}

export function landingPathForRole(role: OperationalRole) { return role === 'staff' ? '/staff' : '/director'; }
export function canOpenOperationalPath(role: OperationalRole, pathname: '/director' | '/staff') { return pathname === '/staff' ? role === 'staff' : role === 'owner' || role === 'director'; }
