-- Defense in depth for service-only tables in the non-exposed authority_private
-- schema. Direct table privileges were already revoked from browser roles; RLS
-- adds a second default-deny boundary without changing the SECURITY DEFINER
-- command surface or service_role access model.

alter table authority_private.command_receipts enable row level security;
alter table authority_private.commercial_account_workspaces enable row level security;
alter table authority_private.commercial_accounts enable row level security;
alter table authority_private.commercial_adjustments enable row level security;
alter table authority_private.commercial_allowance_lots enable row level security;
alter table authority_private.commercial_contracts enable row level security;
alter table authority_private.commercial_event_ledger enable row level security;
alter table authority_private.commercial_inquiries enable row level security;
alter table authority_private.commercial_orders enable row level security;
alter table authority_private.commercial_subscriptions enable row level security;
alter table authority_private.commercial_usage_allocations enable row level security;
alter table authority_private.integration_outbox enable row level security;
alter table authority_private.notification_outbox enable row level security;
alter table authority_private.organization_invitation_secrets enable row level security;
alter table authority_private.participant_command_receipts enable row level security;
alter table authority_private.participant_invitation_secrets enable row level security;
alter table authority_private.participant_sessions enable row level security;
alter table authority_private.provider_event_inbox enable row level security;
alter table authority_private.provider_webhook_events enable row level security;
alter table authority_private.sample_access_leads enable row level security;

revoke all on all tables in schema authority_private from public, anon, authenticated;

alter default privileges in schema authority_private
  revoke all on tables from public, anon, authenticated;

comment on schema authority_private is
  'Non-exposed service-command schema. Base tables use default-deny RLS and revoke browser-role privileges; approved functions remain the application boundary.';
