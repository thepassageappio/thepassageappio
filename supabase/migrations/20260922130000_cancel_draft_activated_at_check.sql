-- Unsent draft cancel sets status=canceled while activated_at stays null.
-- authority_records_check1 previously required every non-draft row to have
-- activated_at set, which blocked draft -> canceled (QA: PA-DEEE9ECDD4).
alter table public.authority_records drop constraint if exists authority_records_check1;
alter table public.authority_records add constraint authority_records_check1 check (
  (status = 'draft' and activated_at is null)
  or (status = 'canceled')
  or (status <> 'draft' and status <> 'canceled' and activated_at is not null)
);
