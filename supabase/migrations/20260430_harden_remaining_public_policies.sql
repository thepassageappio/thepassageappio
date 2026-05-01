-- Remove remaining broad "Anyone can..." policies from estate-adjacent data.
-- Keep public lead capture insert-only, but do not allow public reads or updates.

drop policy if exists "Anyone can manage estate context" on public.estate_user_context;
drop policy if exists "Anyone can insert leads" on public.leads;
drop policy if exists "Anyone can manage obituaries" on public.obituaries;
drop policy if exists "Anyone can manage orch events" on public.orchestration_events;
drop policy if exists "Anyone can manage outcomes" on public.outcomes;
drop policy if exists "Anyone can manage urgent sessions" on public.urgent_sessions;
drop policy if exists "Anyone can manage wishes" on public.wishes;
drop policy if exists "Anyone can manage announcements" on public.workflow_announcements;

drop policy if exists "estate context owned by estate users" on public.estate_user_context;
drop policy if exists "lead intake can create leads" on public.leads;
drop policy if exists "obituaries owned by estate users" on public.obituaries;
drop policy if exists "orchestration events visible to estate users" on public.orchestration_events;
drop policy if exists "orchestration events inserted by estate users" on public.orchestration_events;
drop policy if exists "outcomes owned by estate users" on public.outcomes;
drop policy if exists "urgent sessions owned by user or estate users" on public.urgent_sessions;
drop policy if exists "wishes owned by estate users" on public.wishes;
drop policy if exists "workflow announcements owned by estate users" on public.workflow_announcements;

create policy "estate context owned by estate users"
on public.estate_user_context for all
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = estate_user_context.estate_id
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
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = estate_user_context.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "lead intake can create leads"
on public.leads for insert
to anon, authenticated
with check (true);

create policy "obituaries owned by estate users"
on public.obituaries for all
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = obituaries.workflow_id
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
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = obituaries.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "orchestration events visible to estate users"
on public.orchestration_events for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = orchestration_events.workflow_id
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

create policy "orchestration events inserted by estate users"
on public.orchestration_events for insert
to authenticated
with check (
  exists (
    select 1 from public.workflows w
    where w.id = orchestration_events.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "outcomes owned by estate users"
on public.outcomes for all
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = outcomes.estate_id
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
)
with check (
  exists (
    select 1 from public.workflows w
    where w.id = outcomes.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "urgent sessions owned by user or estate users"
on public.urgent_sessions for all
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = urgent_sessions.estate_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'accepted') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = urgent_sessions.estate_id
      and (w.user_id = auth.uid() or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email'))
  )
);

create policy "wishes owned by estate users"
on public.wishes for all
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = wishes.workflow_id
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
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.workflows w
    where w.id = wishes.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

create policy "workflow announcements owned by estate users"
on public.workflow_announcements for all
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = workflow_announcements.workflow_id
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
)
with check (
  exists (
    select 1 from public.workflows w
    where w.id = workflow_announcements.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);
