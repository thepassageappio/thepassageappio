import 'server-only';

import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export type AccountHomeLink = { href: string; label: string; personalHref?: string };

// Lightweight, nav-only membership check -- deliberately not resolveOperationalViewer/
// resolvePartnerViewer (those also pull location grants and are meant to gate real
// operational pages, not decide what a marketing-page header link should say). Used by
// TopShell on every gateway page, so kept to the minimum needed to route "my account"
// correctly instead of always showing "Sign in" to an already-authenticated visitor.
export async function resolveAccountHomeLink(): Promise<AccountHomeLink | null> {
  const client = await createPassageServerClient();
  if (!client) return null;
  const user = await verifiedUser(client);
  if (!user) return null;

  const [orgMembership, partnerMembership] = await Promise.all([
    client.from('organization_members').select('role').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle(),
    client.from('partner_members').select('id').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle(),
  ]);

  // An org/vendor role and a personal D2C planning record are independent --
  // /case is keyed to user_id alone, never to organization_members/partner_members
  // -- but nothing in the nav ever offered the personal side once someone had a
  // work role, so a funeral-home director had no discoverable way to plan for
  // their own family. personalHref surfaces that second, genuinely separate
  // destination without changing which link is primary.
  if (orgMembership.data) {
    const role = (orgMembership.data as { role: string }).role;
    return role === 'staff' ? { href: '/staff', label: 'My work', personalHref: '/case' } : { href: '/director', label: 'My dashboard', personalHref: '/case' };
  }
  if (partnerMembership.data) return { href: '/partner', label: 'My work', personalHref: '/case' };
  return { href: '/case', label: 'My account' };
}
