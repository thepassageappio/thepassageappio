-- Pilot readiness: remove broad public access and seed a realistic funeral-home demo case.

drop policy if exists "Anyone can read workflows" on public.workflows;
drop policy if exists "Anyone can insert workflows" on public.workflows;
drop policy if exists "workflows owner coordinator participant or org select" on public.workflows;
drop policy if exists "workflows authenticated owner insert" on public.workflows;

create policy "workflows owner coordinator participant or org select"
on public.workflows for select
to authenticated
using (
  user_id = auth.uid()
  or lower(coordinator_email) = lower(auth.jwt() ->> 'email')
  or exists (
    select 1 from public.estate_access ea
    where ea.workflow_id = workflows.id
      and coalesce(ea.status, 'accepted') <> 'revoked'
      and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
  )
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = workflows.organization_id
      and coalesce(om.status, 'active') = 'active'
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
);

create policy "workflows authenticated owner insert"
on public.workflows for insert
to authenticated
with check (
  user_id = auth.uid()
  or lower(coordinator_email) = lower(auth.jwt() ->> 'email')
);

drop policy if exists "Anyone can manage announcements" on public.announcements;
drop policy if exists "Anyone can manage estate events" on public.estate_events;
drop policy if exists "Anyone can manage messages" on public.messages;
drop policy if exists "estate announcements visible to estate users" on public.announcements;
drop policy if exists "estate announcements managed by owners and org staff" on public.announcements;
drop policy if exists "estate events visible to estate users" on public.estate_events;
drop policy if exists "estate events inserted by estate users" on public.estate_events;
drop policy if exists "messages visible to estate users" on public.messages;
drop policy if exists "messages managed by estate owners and org staff" on public.messages;

create policy "estate announcements visible to estate users"
on public.announcements for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = announcements.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'accepted') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "estate announcements managed by owners and org staff"
on public.announcements for all
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = announcements.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and om.role in ('owner', 'admin', 'staff')
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
)
with check (
  exists (
    select 1 from public.workflows w
    where w.id = announcements.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and om.role in ('owner', 'admin', 'staff')
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "estate events visible to estate users"
on public.estate_events for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = estate_events.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'accepted') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "estate events inserted by estate users"
on public.estate_events for insert
to authenticated
with check (
  exists (
    select 1 from public.workflows w
    where w.id = estate_events.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'accepted') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "messages visible to estate users"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = messages.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'accepted') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "messages managed by estate owners and org staff"
on public.messages for all
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = messages.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and om.role in ('owner', 'admin', 'staff')
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
)
with check (
  exists (
    select 1 from public.workflows w
    where w.id = messages.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and om.role in ('owner', 'admin', 'staff')
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

insert into public.organizations (id, type, name, slug, primary_color, support_email, from_name, white_label_enabled)
values (
  '11111111-1111-4111-8111-111111111111',
  'funeral_home',
  'Hudson Valley Funeral Home Demo',
  'hudson-valley-demo',
  '#6b8f71',
  'thepassageappio@gmail.com',
  'Hudson Valley Funeral Home',
  true
)
on conflict (id) do update set
  name = excluded.name,
  primary_color = excluded.primary_color,
  support_email = excluded.support_email,
  from_name = excluded.from_name,
  white_label_enabled = excluded.white_label_enabled,
  updated_at = now();

insert into public.organization_members (organization_id, email, role, status)
values (
  '11111111-1111-4111-8111-111111111111',
  'thepassageappio@gmail.com',
  'admin',
  'active'
)
on conflict (organization_id, email) do update set role = excluded.role, status = excluded.status, updated_at = now();

insert into public.workflows (
  id, organization_id, organization_case_reference, name, deceased_name, coordinator_name,
  coordinator_email, status, activation_status, path, mode, trigger_type, created_at, updated_at
)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'DEMO-001',
  'Estate of Margaret Collins',
  'Margaret Collins',
  'Steven Demo',
  'thepassageappio@gmail.com',
  'active',
  'activated',
  'red',
  'red',
  'death_confirmed',
  now(),
  now()
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  organization_case_reference = excluded.organization_case_reference,
  status = excluded.status,
  activation_status = excluded.activation_status,
  updated_at = now();

insert into public.tasks (
  workflow_id, title, description, category, priority, due_days_after_trigger,
  status, assigned_to_name, assigned_to_email, playbook_key, automation_level, execution_kind,
  waiting_on, partner_owner_role, funeral_home_eligible, proof_required, last_action_at, last_actor, channel, recipient
)
values
  ('22222222-2222-4222-8222-222222222222', 'Contact the funeral home', 'Confirm transportation, documents needed, timing, and itemized pricing.', 'service', 'urgent', 0, 'waiting', 'Hudson Valley Funeral Home', 'thepassageappio@gmail.com', 'contact the funeral home', 'PARTNER_HANDOFF', 'call', 'funeral home', 'funeral_home_director', true, 'transportation or arrangement next step confirmed', now(), 'Steven Demo', 'email', 'thepassageappio@gmail.com'),
  ('22222222-2222-4222-8222-222222222222', 'Order death certificates - minimum 15 copies', 'Confirm certificate order process and expected timing.', 'legal', 'high', 3, 'waiting', 'Hudson Valley Funeral Home', 'thepassageappio@gmail.com', 'order death certificates minimum 15 copies', 'PARTNER_HANDOFF', 'packet', 'funeral home or vital records office', 'funeral_home_director', true, 'certificate order path confirmed', now(), 'Steven Demo', 'email', 'thepassageappio@gmail.com'),
  ('22222222-2222-4222-8222-222222222222', 'Notify immediate family members', 'Closest family should hear directly before wider announcements.', 'notifications', 'urgent', 0, 'sent', 'Ashlee Demo', 'thepassageappio@gmail.com', 'notify immediate family members', 'SEND_TRACK', 'message', 'family confirmation', null, false, 'family notified or assigned', now(), 'Steven Demo', 'email', 'thepassageappio@gmail.com')
on conflict (workflow_id, title) do update set
  status = excluded.status,
  assigned_to_name = excluded.assigned_to_name,
  assigned_to_email = excluded.assigned_to_email,
  playbook_key = excluded.playbook_key,
  automation_level = excluded.automation_level,
  execution_kind = excluded.execution_kind,
  waiting_on = excluded.waiting_on,
  partner_owner_role = excluded.partner_owner_role,
  funeral_home_eligible = excluded.funeral_home_eligible,
  proof_required = excluded.proof_required,
  last_action_at = excluded.last_action_at,
  last_actor = excluded.last_actor,
  channel = excluded.channel,
  recipient = excluded.recipient,
  updated_at = now();

insert into public.estate_events (estate_id, event_type, title, description, actor)
values
  ('22222222-2222-4222-8222-222222222222', 'plan_started', 'Plan in motion', 'Funeral home outreach, family notification, and death-certificate handoff are visible in one place.', 'Steven Demo'),
  ('22222222-2222-4222-8222-222222222222', 'task_message_sent', 'Family notification sent', 'Message sent to Ashlee Demo. Waiting for confirmation.', 'Steven Demo')
on conflict do nothing;

insert into public.task_status_events (workflow_id, status, last_actor, channel, recipient, detail, provider, provider_message_id, provider_event_id)
values
  ('22222222-2222-4222-8222-222222222222', 'sent', 'Steven Demo', 'email', 'thepassageappio@gmail.com', 'Funeral home email sent. Waiting for confirmation.', 'resend', 'demo_resend_message_001', 'demo_resend_event_sent_001'),
  ('22222222-2222-4222-8222-222222222222', 'waiting', 'Passage', 'email', 'thepassageappio@gmail.com', 'Waiting for funeral home confirmation.', 'resend', 'demo_resend_message_001', 'demo_waiting_001')
on conflict do nothing;
