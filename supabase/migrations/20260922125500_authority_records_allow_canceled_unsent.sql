-- Draft cancel keeps activated_at null (never sent). Widen check1 so canceled
-- is allowed with or without activated_at; draft still requires null; other
-- non-draft statuses still require activated_at.
alter table public.authority_records
  drop constraint if exists authority_records_check1;

alter table public.authority_records
  add constraint authority_records_check1 check (
    (status = 'draft' and activated_at is null)
    or (status = 'canceled')
    or (status <> 'draft' and status <> 'canceled' and activated_at is not null)
  );
