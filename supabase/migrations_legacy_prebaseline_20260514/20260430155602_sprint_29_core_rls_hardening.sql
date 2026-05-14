-- Sprint 29: remove broad public read/update policies from core estate orchestration tables.
-- Keep public workflow inserts for the current unauthenticated urgent/planning entry paths,
-- but restrict estate data reads/updates to owners and matching participants.

-- PEOPLE
DROP POLICY IF EXISTS "Anyone can read people" ON public.people;
DROP POLICY IF EXISTS "Anyone can update people" ON public.people;
DROP POLICY IF EXISTS "Anyone can insert people" ON public.people;
DROP POLICY IF EXISTS "people owner select" ON public.people;
DROP POLICY IF EXISTS "people owner insert" ON public.people;
DROP POLICY IF EXISTS "people owner update" ON public.people;
DROP POLICY IF EXISTS "people participant read self" ON public.people;

CREATE POLICY "people owner select" ON public.people
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "people owner insert" ON public.people
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "people owner update" ON public.people
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "people participant read self" ON public.people
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email') OR linked_user_id = auth.uid());

-- TASKS
DROP POLICY IF EXISTS "Anyone can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks owner select" ON public.tasks;
DROP POLICY IF EXISTS "tasks owner insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks owner update" ON public.tasks;
DROP POLICY IF EXISTS "tasks participant select" ON public.tasks;
DROP POLICY IF EXISTS "tasks participant update status" ON public.tasks;

CREATE POLICY "tasks owner select" ON public.tasks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = tasks.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "tasks owner insert" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = tasks.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "tasks owner update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = tasks.workflow_id AND w.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = tasks.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "tasks participant select" ON public.tasks
  FOR SELECT TO authenticated
  USING (lower(assigned_to_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "tasks participant update status" ON public.tasks
  FOR UPDATE TO authenticated
  USING (lower(assigned_to_email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(assigned_to_email) = lower(auth.jwt() ->> 'email'));

-- WORKFLOW ACTIONS
DROP POLICY IF EXISTS "Anyone can read workflow_actions" ON public.workflow_actions;
DROP POLICY IF EXISTS "Anyone can insert workflow_actions" ON public.workflow_actions;
DROP POLICY IF EXISTS "Anyone can update workflow_actions" ON public.workflow_actions;
DROP POLICY IF EXISTS "workflow actions owner select" ON public.workflow_actions;
DROP POLICY IF EXISTS "workflow actions owner insert" ON public.workflow_actions;
DROP POLICY IF EXISTS "workflow actions owner update" ON public.workflow_actions;
DROP POLICY IF EXISTS "workflow actions participant select" ON public.workflow_actions;
DROP POLICY IF EXISTS "workflow actions participant update" ON public.workflow_actions;

CREATE POLICY "workflow actions owner select" ON public.workflow_actions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_actions.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow actions owner insert" ON public.workflow_actions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_actions.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow actions owner update" ON public.workflow_actions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_actions.workflow_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_actions.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow actions participant select" ON public.workflow_actions
  FOR SELECT TO authenticated
  USING (lower(recipient_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "workflow actions participant update" ON public.workflow_actions
  FOR UPDATE TO authenticated
  USING (lower(recipient_email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(recipient_email) = lower(auth.jwt() ->> 'email'));

-- WORKFLOW EVENTS
DROP POLICY IF EXISTS "Anyone can read events" ON public.workflow_events;
DROP POLICY IF EXISTS "Anyone can insert events" ON public.workflow_events;
DROP POLICY IF EXISTS "Anyone can update events" ON public.workflow_events;
DROP POLICY IF EXISTS "Anyone can delete events" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow events owner select" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow events owner insert" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow events owner update" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow events owner delete" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow events participant select" ON public.workflow_events;

CREATE POLICY "workflow events owner select" ON public.workflow_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_events.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow events owner insert" ON public.workflow_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_events.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow events owner update" ON public.workflow_events
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_events.workflow_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_events.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow events owner delete" ON public.workflow_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_events.workflow_id AND w.user_id = auth.uid()));

CREATE POLICY "workflow events participant select" ON public.workflow_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.estate_access ea
    WHERE ea.workflow_id = workflow_events.workflow_id
      AND ea.status <> 'revoked'
      AND (ea.user_id = auth.uid() OR lower(ea.email) = lower(auth.jwt() ->> 'email'))
  ));

-- WORKFLOWS: keep token/share reads available for current public confirmation/share routes, but remove public updates.
DROP POLICY IF EXISTS "Owner can update workflows" ON public.workflows;
DROP POLICY IF EXISTS "workflows owner update" ON public.workflows;
DROP POLICY IF EXISTS "workflows participant read" ON public.workflows;

CREATE POLICY "workflows owner update" ON public.workflows
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workflows participant read" ON public.workflows
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.estate_access ea
    WHERE ea.workflow_id = workflows.id
      AND ea.status <> 'revoked'
      AND (ea.user_id = auth.uid() OR lower(ea.email) = lower(auth.jwt() ->> 'email'))
  ));

-- Core indexes for owner/participant lookups.
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON public.tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_email_lower ON public.tasks(lower(assigned_to_email));
CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow_id ON public.workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_recipient_email_lower ON public.workflow_actions(lower(recipient_email));
CREATE INDEX IF NOT EXISTS idx_workflow_events_workflow_id ON public.workflow_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_people_owner_id ON public.people(owner_id);
CREATE INDEX IF NOT EXISTS idx_people_email_lower ON public.people(lower(email));
CREATE INDEX IF NOT EXISTS idx_estate_access_workflow_id ON public.estate_access(workflow_id);
CREATE INDEX IF NOT EXISTS idx_estate_access_user_id ON public.estate_access(user_id);
CREATE INDEX IF NOT EXISTS idx_estate_access_email_lower ON public.estate_access(lower(email));;
