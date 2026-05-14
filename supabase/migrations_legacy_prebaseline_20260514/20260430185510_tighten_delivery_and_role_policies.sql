alter table public.estate_access drop constraint if exists estate_access_role_check;
alter table public.estate_access add constraint estate_access_role_check check (role = any (array['owner'::text, 'participant'::text, 'external_partner'::text, 'activator'::text, 'read_only'::text, 'operator'::text]));

drop policy if exists "Users manage own subscription" on public.stripe_subscriptions;
create policy "stripe subscriptions owner read" on public.stripe_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Anyone can manage notification log" on public.notification_log;
create policy "notification log estate owner read" on public.notification_log
  for select to authenticated
  using (exists (
    select 1 from public.workflows w
    where w.id = notification_log.workflow_id
      and w.user_id = auth.uid()
  ));
create policy "notification log recipient read" on public.notification_log
  for select to authenticated
  using (
    lower(recipient_email) = lower(auth.jwt() ->> 'email')
  );;
