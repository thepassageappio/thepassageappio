'use server';

import { verifiedUser } from '@/lib/auth/session';
import { firstRpcRow } from '@/lib/auth/invitations';
import { VENDOR_CATEGORIES, type VendorCategory } from '@/lib/partner/categories';
import { createPassageServerClient } from '@/lib/supabase/server';

export type VendorSignupState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'created';
  message?: string;
};

type RpcReceipt = { partner_organization_id: string; partner_member_id: string };

function failure(status: VendorSignupState['status'], message: string): VendorSignupState {
  return { status, message };
}

export async function createVendorOrganization(_previous: VendorSignupState, formData: FormData): Promise<VendorSignupState> {
  const organizationName = String(formData.get('organizationName') ?? '').trim();
  const category = String(formData.get('category') ?? '') as VendorCategory;
  const contactEmail = String(formData.get('contactEmail') ?? '').trim();
  const contactPhone = String(formData.get('contactPhone') ?? '').trim();

  if (!organizationName || organizationName.length > 200) return failure('validation', 'Enter your business name. Nothing was created.');
  if (!VENDOR_CATEGORIES.includes(category)) return failure('validation', 'Choose a category. Nothing was created.');

  const client = await createPassageServerClient();
  if (!client) return failure('unavailable', 'Passage could not verify sign-in right now. Nothing was created.');
  const user = await verifiedUser(client);
  if (!user) return failure('denied', 'Sign in before setting up your vendor account. Nothing was created.');

  const result = await client.rpc('self_serve_create_partner_organization', {
    p_organization_name: organizationName,
    p_category: category,
    p_contact_email: contactEmail || null,
    p_contact_phone: contactPhone || null,
  });

  if (result.error) {
    if (result.error.code === '28000') return failure('denied', 'Sign in before setting up your vendor account. Nothing was created.');
    if (result.error.code === '22023' && result.error.message.includes('already belongs')) {
      return failure('conflict', 'This account already belongs to an active vendor organization. Sign in with a different account.');
    }
    if (result.error.code === '22023') return failure('validation', 'Review the business name and category. Nothing was created.');
    return failure('unavailable', 'Passage could not create your vendor account right now. Nothing was created.');
  }

  const receipt = firstRpcRow<RpcReceipt>(result.data);
  if (!receipt?.partner_organization_id) return failure('unavailable', 'Passage did not confirm the new vendor account. Nothing is shown as created.');

  return { status: 'created' };
}
