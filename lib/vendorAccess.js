import { isPassageAdmin } from './adminAccess';

export async function loadVendorForUser(admin, user, vendorId = null) {
  const email = String(user?.email || '').trim().toLowerCase();
  const adminUser = isPassageAdmin(email);

  if (vendorId && adminUser) {
    const { data: vendor, error } = await admin
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .maybeSingle();
    if (error) throw error;
    return { vendor: vendor || null, membership: { role: 'admin', status: 'active' }, adminUser };
  }

  if (!email) return { vendor: null, membership: null, adminUser };

  const { data: vendor, error: vendorError } = await admin
    .from('vendors')
    .select('*')
    .eq('status', 'active')
    .ilike('contact_email', email)
    .maybeSingle();
  if (vendorError) throw vendorError;
  if (vendor) return { vendor, membership: { role: 'owner', status: 'active' }, adminUser };

  const { data: member, error: memberError } = await admin
    .from('vendor_team_members')
    .select('id,email,display_name,role,status,vendor_id,vendors(*)')
    .ilike('email', email)
    .in('status', ['active', 'invited'])
    .limit(1)
    .maybeSingle();
  if (memberError && memberError.code !== '42P01') throw memberError;
  if (member?.vendors?.status === 'active') return { vendor: member.vendors, membership: member, adminUser };

  return { vendor: null, membership: null, adminUser };
}

export function canManageVendorPayments(membership) {
  return ['owner', 'manager', 'admin'].includes(membership?.role || 'owner');
}
