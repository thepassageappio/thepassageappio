import 'server-only';

import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';
import type {
  FamilyProviderSelection,
  ProviderAddress,
} from './types';

type ContinuitySpaceRow = {
  id: string;
};

export type ProviderSelectionRow = {
  provider_name: string;
  address_line1: string;
  address_line2: string | null;
  locality: string;
  administrative_area: string;
  postal_code: string;
  country_code: string;
  formatted_address: string;
  address_review_required: boolean;
  handoff_available: boolean;
  selected_at: string;
  viewer_count?: number;
  replayed?: boolean;
};

export type OwnedProviderContext =
  | { state: 'unavailable' }
  | { state: 'signed_out' }
  | { state: 'no_space' }
  | {
      state: 'ready';
      client: NonNullable<Awaited<ReturnType<typeof createPassageServerClient>>>;
      continuitySpaceId: string;
    };

export async function getOwnedProviderContext(): Promise<OwnedProviderContext> {
  const client = await createPassageServerClient();
  if (!client) return { state: 'unavailable' };
  if (!(await verifiedUser(client))) return { state: 'signed_out' };

  const spaces = await client.rpc('list_owned_continuity_spaces');
  if (spaces.error) return { state: 'unavailable' };
  const space = ((spaces.data ?? [])[0] as ContinuitySpaceRow | undefined);
  if (!space?.id) return { state: 'no_space' };
  return { state: 'ready', client, continuitySpaceId: space.id };
}
export async function loadCurrentProviderSelection() {
  const context = await getOwnedProviderContext();
  if (context.state !== 'ready') return context;

  const [result, participants] = await Promise.all([
    context.client.rpc(
      'get_family_provider_selection_projection',
      { p_continuity_space_id: context.continuitySpaceId },
    ),
    context.client.rpc('list_owned_continuity_participant_projection'),
  ]);
  if (result.error || participants.error) {
    return { state: 'unavailable' as const };
  }
  const row = ((result.data ?? [])[0] as ProviderSelectionRow | undefined);
  const audience = audienceLabel(
    row?.viewer_count
      ?? (participants.data ?? []).filter(
        (participant: unknown) =>
          (participant as { status?: string }).status === 'active',
      ).length + 1,
  );
  return {
    state: 'ready' as const,
    selection: row ? mapProviderSelection(row) : null,
    audience,
  };
}

export function mapProviderSelection(
  row: ProviderSelectionRow,
  replayed = row.replayed ?? false,
): FamilyProviderSelection {
  const address: ProviderAddress = {
    line1: row.address_line1,
    ...(row.address_line2 ? { line2: row.address_line2 } : {}),
    locality: row.locality,
    administrativeArea: row.administrative_area,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    formatted: row.formatted_address,
  };
  return {
    displayName: row.provider_name,
    address,
    addressReviewRequired: row.address_review_required,
    handoffAvailability: row.handoff_available
      ? 'connected_preview'
      : 'save_only',
    selectedAt: row.selected_at,
    audience: audienceLabel(row.viewer_count ?? 1),
    replayed,
  };
}

function audienceLabel(viewerCount: number) {
  if (viewerCount <= 1) {
    return 'Only you can see this until you choose to share it.';
  }
  if (viewerCount === 2) {
    return 'You and one person with family access can see this choice.';
  }
  return `You and ${viewerCount - 1} people with family access can see this choice.`;
}
