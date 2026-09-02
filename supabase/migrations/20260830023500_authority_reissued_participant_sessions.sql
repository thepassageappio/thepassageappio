alter table authority_private.participant_sessions
  drop constraint if exists participant_sessions_invitation_id_key;

create unique index if not exists participant_sessions_one_active_invitation_idx
  on authority_private.participant_sessions(invitation_id)
  where status = 'active';

comment on index authority_private.participant_sessions_one_active_invitation_idx is
  'Allows revoked participant session history while enforcing one active session per invitation.';
