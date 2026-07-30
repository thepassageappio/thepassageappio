export type InvitationInspection = {
  inviter_display_name: string;
  organization_name: string;
  invitation_role: string;
  location_names: string[];
  invitation_purpose: string;
  invitation_expires_at: string;
  invitation_state: 'available' | 'accepted' | 'revoked' | 'expired' | 'access_ended';
};

export type PassageInvitationInspection = {
  invitation_type: 'staff' | 'participant';
  inviter_display_name: string;
  space_name: string;
  invitation_role: string;
  scope_labels: string[];
  invitation_purpose: string;
  invitation_expires_at: string;
  invitation_state: 'available' | 'accepted' | 'revoked' | 'expired' | 'access_ended';
  delivery_state: 'not_sent';
};

export type InvitationAcceptance = {
  organization_member_id: string;
  organization_id: string;
  member_role: string;
  organization_location_ids: string[];
  landing_path: string;
  accepted_at: string;
  replayed: boolean;
};

export type ParticipantInvitationAcceptance = {
  participant_id: string;
  continuity_space_id: string;
  space_name: string;
  relationship: string;
  category_scope: string[];
  accepted_at: string;
  event_id: string;
  replayed: boolean;
};

export function validInvitationToken(value: string) {
  return /^[A-Za-z0-9_-]{32,256}$/.test(value);
}

export function firstRpcRow<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length > 0 ? data[0] as T : null;
}
