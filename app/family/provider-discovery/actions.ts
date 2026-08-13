'use server';

import { revalidatePath } from 'next/cache';
import {
  getOwnedProviderContext,
  mapProviderSelection,
  type ProviderSelectionRow,
} from '@/lib/provider-discovery/family-selection';
import type {
  ProviderConfirmationInput,
  ProviderConfirmationResult,
} from '@/lib/provider-discovery/types';

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function confirmProviderSelection(
  input: ProviderConfirmationInput,
): Promise<ProviderConfirmationResult> {
  if (
    !uuid.test(input.requestId)
    || (input.expectedSelectionSavedAt !== null
      && !Number.isFinite(Date.parse(input.expectedSelectionSavedAt)))
  ) {
    return failure(
      'validation',
      'Review the funeral-home details, then try again. Nothing was saved.',
    );
  }

  const context = await getOwnedProviderContext();
  if (context.state === 'signed_out') {
    return failure(
      'signed_out',
      'Your sign-in could not be verified. Sign in again, then retry.',
    );
  }
  if (context.state === 'no_space') {
    return failure(
      'unavailable',
      'Create your family space before saving a funeral home.',
    );
  }
  if (context.state !== 'ready') {
    return failure(
      'unavailable',
      'Passage cannot reach your family space right now. Nothing was saved. Try again.',
    );
  }

  const parameters = input.sourceKind === 'synthetic_directory'
    ? {
        p_continuity_space_id: context.continuitySpaceId,
        p_request_id: input.requestId,
        p_expected_active_selected_at: input.expectedSelectionSavedAt,
        p_source_kind: input.sourceKind,
        p_source_key: input.sourceKey.slice(0, 120),
        p_provider_name: null,
        p_address_line1: null,
        p_address_line2: null,
        p_locality: null,
        p_administrative_area: null,
        p_postal_code: null,
        p_country_code: null,
      }
    : {
        p_continuity_space_id: context.continuitySpaceId,
        p_request_id: input.requestId,
        p_expected_active_selected_at: input.expectedSelectionSavedAt,
        p_source_kind: input.sourceKind,
        p_source_key: null,
        p_provider_name: input.displayName.slice(0, 160),
        p_address_line1: input.address.line1.slice(0, 160),
        p_address_line2: input.address.line2?.slice(0, 160) ?? null,
        p_locality: input.address.locality.slice(0, 100),
        p_administrative_area:
          input.address.administrativeArea.slice(0, 80),
        p_postal_code: input.address.postalCode.slice(0, 20),
        p_country_code: input.address.countryCode.slice(0, 2),
      };

  const result = await context.client.rpc(
    'confirm_family_provider_selection',
    parameters,
  );
  if (result.error) return rpcFailure(result.error);
  const receipt = ((result.data ?? [])[0] as ProviderSelectionRow | undefined);
  if (!receipt?.provider_name || !receipt.selected_at) {
    return failure(
      'known_failure',
      'Passage could not verify the saved choice. Reload before trying again.',
    );
  }

  const projection = await context.client.rpc(
    'get_family_provider_selection_projection',
    { p_continuity_space_id: context.continuitySpaceId },
  );
  const projected = ((projection.data ?? [])[0] as
    | ProviderSelectionRow
    | undefined);
  if (projection.error || !projected?.provider_name || !projected.selected_at) {
    return failure(
      'known_failure',
      'Your choice may have been saved, but Passage could not verify it. Reload before trying again.',
    );
  }

  revalidatePath('/family');
  return {
    ok: true,
    selection: mapProviderSelection(
      { ...projected, replayed: Boolean(receipt.replayed) },
      Boolean(receipt.replayed),
    ),
  };
}
function failure(
  reason: Exclude<
    ProviderConfirmationResult,
    { ok: true }
  >['reason'],
  message: string,
): ProviderConfirmationResult {
  return { ok: false, reason, message };
}

function rpcFailure(error: {
  code?: string;
  message?: string;
}): ProviderConfirmationResult {
  if (error.code === '40001') {
    return failure(
      'conflict',
      'This funeral home changed in another session. Review the saved choice before trying again.',
    );
  }
  if (error.code === '42501' || error.code === '28000') {
    return failure(
      'signed_out',
      'Your family access could not be verified. Nothing was saved. Sign in again, then retry.',
    );
  }
  if (error.code === '22023' || error.code === 'P0002') {
    return failure(
      'validation',
      'That choice is incomplete or no longer available. Nothing was saved. Search again or enter the details yourself.',
    );
  }
  return failure(
    'known_failure',
    "We couldn't save this funeral home. Your previous choice has not changed. Try again.",
  );
}
