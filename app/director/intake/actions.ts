'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type ManualIntakeState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'upgrade-required';
  message?: string;
};

type CaseReceipt = { workflow_id: string; replayed: boolean };

export async function createManualCase(_previous: ManualIntakeState, formData: FormData): Promise<ManualIntakeState> {
  const organizationLocationId = String(formData.get('organizationLocationId') ?? '');
  const caseReference = String(formData.get('caseReference') ?? '').trim();
  const familyName = String(formData.get('familyName') ?? '').trim();
  const personName = String(formData.get('personName') ?? '').trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid.test(organizationLocationId) || caseReference.length < 1 || caseReference.length > 60
    || familyName.length < 1 || familyName.length > 200 || personName.length < 1 || personName.length > 200) {
    return { status: 'validation', message: 'Review the case details. Nothing was created.' };
  }

  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director' && viewer.viewer.role !== 'staff')) {
    return { status: 'denied', message: 'Creating a case requires director or authorized staff authority. Nothing changed.' };
  }
  const client = await createPassageServerClient();
  if (!client) return { status: 'unavailable', message: 'Passage could not reach the workspace right now. Nothing changed. Try again.' };

  const result = await client.rpc('create_case_manual_idempotent', {
    p_organization_id: viewer.viewer.organizationId,
    p_organization_location_id: organizationLocationId,
    p_case_reference: caseReference,
    p_family_name: familyName,
    p_person_name: personName,
    p_request_id: randomUUID(),
  });

  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return { status: 'denied', message: 'You do not have case-creation authority at this location. Nothing changed.' };
    if (result.error.code === '55001') return { status: 'upgrade-required', message: result.error.message?.trim() || 'Your 90-day trial has ended and you already have an active case. Upgrade to open another.' };
    return { status: 'unavailable', message: 'Passage could not create the case. Nothing changed.' };
  }
  const receipt = firstRpcRow<CaseReceipt>(result.data);
  if (!receipt?.workflow_id) return { status: 'unavailable', message: 'We could not confirm the case was created. Reload before trying again.' };
  redirect(`/director/cases/${receipt.workflow_id}`);
}
