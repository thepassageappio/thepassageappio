create index if not exists notification_outbox_organization_id_idx
on authority_private.notification_outbox (organization_id);
