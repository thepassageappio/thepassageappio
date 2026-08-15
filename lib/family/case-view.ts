import 'server-only';

import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export type FamilyCaseStatus = 'active' | 'closed';
export type FamilyTaskStatus = 'assigned' | 'in_progress' | 'proof_submitted' | 'blocked' | 'completed';

export type FamilyWorkflowView = {
  id: string;
  caseReference: string | null;
  familyName: string | null;
  personName: string | null;
  phase: string | null;
  status: FamilyCaseStatus;
};

export type FamilyTaskView = {
  id: string;
  workflowId: string;
  title: string | null;
  status: FamilyTaskStatus;
  waitingParty: string | null;
  dueAt: string | null;
  /** Minimum reassuring translation of who owns it -- never an internal member id, email, or raw role. */
  ownerLabel: string;
  /** Minimum reassuring translation of the latest proof -- never the raw task_proofs row or its artifact. */
  lastUpdateSummary: string | null;
  lastUpdateAt: string | null;
};

export type FamilyCaseUpdate = {
  id: string;
  summary: string;
  occurredAt: string;
};

export type FamilyCaseView = {
  workflow: FamilyWorkflowView;
  currentTask: FamilyTaskView | null;
  recentUpdates: FamilyCaseUpdate[];
};

export type FamilyCaseViewResult =
  | { ok: true; data: FamilyCaseView }
  | { ok: false; reason: 'signed-out' | 'not-found' | 'not-authorized' | 'unavailable' };

type WorkflowRow = { id: string; case_reference: string | null; family_name: string | null; person_name: string | null; phase: string | null; status: string };
type TaskRow = { id: string; workflow_id: string; title: string | null; status: string; waiting_party: string | null; due_at: string | null; updated_at: string | null };
type EventRow = { id: string; name: string; occurred_at: string };

// Row shape of public.get_family_case_update_for_workflow(p_workflow_id) --
// the workflow-id-scoped sibling of public.list_participant_family_updates()
// added in the participant_case_update_for_workflow migration. Only ever
// returns a row for the *calling* user when they're an active, updates-scoped
// continuity_participants row on this specific workflow's space -- same
// predicate can_message_workflow() already uses for the messaging RPC.
type ParticipantCaseUpdateRow = {
  workflow_id: string;
  space_name: string | null;
  participant_name: string | null;
  relationship: string | null;
  purpose: string | null;
  can_see: string[] | null;
  accepted_at: string | null;
  family_name: string | null;
  person_name: string | null;
  current_step_title: string | null;
  current_step_summary: string | null;
  current_step_owner: string | null;
  current_step_updated_at: string | null;
  latest_update_summary: string | null;
  latest_update_at: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECENT_UPDATE_LIMIT = 3;

// Deliberately generic -- a family/participant identity has no RLS grant on
// organization_members (confirmed: its SELECT policy is self-row or
// can_view_team_member(), neither of which a family caller satisfies), so
// there is no authorized way to resolve or show an assigned staff member's
// name here even if we wanted to.
function familyOwnerLabel(waitingParty: string | null): string {
  const trimmed = waitingParty?.trim();
  return trimmed ? trimmed : 'Your care team';
}

function familyTaskSummary(status: string): string {
  if (status === 'assigned') return 'This step hasn’t started yet.';
  if (status === 'in_progress') return 'Your care team is working on this now.';
  if (status === 'proof_submitted') return 'A step was just completed and is being double-checked.';
  if (status === 'blocked') return 'This step needs a little more time before it can continue.';
  if (status === 'completed') return 'This step is complete.';
  return 'Passage will show the next update here as soon as there is one.';
}

// public.get_family_case_update_for_workflow() bakes the status -> sentence
// translation into SQL rather than returning the raw tasks.status enum (the
// bounded participant projection deliberately exposes no operator-facing
// columns). This is the inverse of that specific SQL CASE -- note the wording
// intentionally differs slightly from familyTaskSummary() above, so match
// against the RPC's exact strings, not this file's. Unrecognized text (e.g.
// if the RPC's wording changes) falls back to 'in_progress' rather than
// guessing further -- close enough for a status badge, never a blocker.
const PARTICIPANT_STEP_STATUS_BY_SUMMARY: Record<string, FamilyTaskStatus> = {
  'This step has not started yet.': 'assigned',
  'The care team is working on this now.': 'in_progress',
  'A step was completed and is being double-checked.': 'proof_submitted',
  'This step needs more time before it can continue.': 'blocked',
  'This step is complete.': 'completed',
};

function participantStepStatus(summary: string | null): FamilyTaskStatus {
  if (!summary) return 'in_progress';
  return PARTICIPANT_STEP_STATUS_BY_SUMMARY[summary] ?? 'in_progress';
}

// Prefers a task waiting on review, then the earliest still-open task, and
// only falls back to a completed one if every task on the case is done --
// a "what's happening now" surface should never lead with something that's
// already finished when there's real open work to show instead.
function selectCurrentTask(tasks: TaskRow[]): TaskRow | null {
  return tasks.find((task) => task.status === 'proof_submitted')
    ?? tasks.find((task) => task.status !== 'completed')
    ?? tasks.at(-1)
    ?? null;
}

// Plain-language sentence per event *name*, never the raw event name,
// metadata, or any internal identity. Anything unrecognized (including event
// types this file doesn't know about yet) falls back to a safe generic line
// rather than surfacing internal detail.
const FAMILY_EVENT_SUMMARIES: Record<string, string> = {
  'task.assigned': 'A next step was set up for your case.',
  'task.reassigned': 'Your case moved to another team member.',
  'task.started': 'Work began on the next step.',
  'task.proof_submitted': 'A step was completed and is being reviewed.',
  'task.proof_verified': 'A completed step was confirmed.',
  'task.proof_replacement_requested': 'The team is redoing part of a step to make sure it’s right.',
};

function summarizeEventForFamily(name: string): string {
  return FAMILY_EVENT_SUMMARIES[name] ?? 'There’s an update on your case.';
}

// Builds a FamilyCaseView from the bounded participant projection. Deliberately
// thinner than the owner path: no case reference, no workflow phase, no task
// id, no waiting-party/due-date detail, and at most one recent update -- that's
// the ceiling of what get_family_case_update_for_workflow() exposes, by design
// (see participant_updates_case_scope migration). workflowId is safe to reuse
// as a synthetic id here since it's the URL the participant already has, not
// an internal identifier.
function buildParticipantCaseView(workflowId: string, row: ParticipantCaseUpdateRow): FamilyCaseView {
  const currentTask: FamilyTaskView | null = row.current_step_title
    ? {
        id: `${workflowId}:current-step`,
        workflowId,
        title: row.current_step_title,
        status: participantStepStatus(row.current_step_summary),
        waitingParty: null,
        dueAt: null,
        ownerLabel: row.current_step_owner ?? 'Your care team',
        lastUpdateSummary: row.current_step_summary,
        lastUpdateAt: row.current_step_updated_at,
      }
    : null;

  const recentUpdates: FamilyCaseUpdate[] = row.latest_update_summary
    ? [{ id: `${workflowId}:latest-update`, summary: row.latest_update_summary, occurredAt: row.latest_update_at ?? new Date(0).toISOString() }]
    : [];

  return {
    workflow: {
      id: workflowId,
      caseReference: null,
      familyName: row.family_name,
      personName: row.person_name,
      phase: null,
      status: 'active',
    },
    currentTask,
    recentUpdates,
  };
}

export async function loadFamilyCaseView(workflowId: string): Promise<FamilyCaseViewResult> {
  if (!UUID_PATTERN.test(workflowId)) return { ok: false, reason: 'not-found' };

  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'unavailable' };

  const user = await verifiedUser(client);
  if (!user) return { ok: false, reason: 'signed-out' };

  const workflowResult = await client
    .from('workflows')
    .select('id, case_reference, family_name, person_name, phase, status')
    .eq('id', workflowId)
    .maybeSingle();
  if (workflowResult.error) return { ok: false, reason: 'unavailable' };
  // RLS scopes this query to workflows.continuity_space_id -> can_view_workflow_as_family()
  // (owner only as of the participant_updates_case_scope migration) or org staff/director
  // authority. An empty result here doesn't necessarily mean "not authorized" anymore --
  // an active, updates-scoped participant is a real, intended caller who is correctly
  // denied by this owner-only path and needs the bounded projection fallback below.
  if (!workflowResult.data) return loadFamilyCaseViewAsParticipant(client, workflowId);
  const workflowRow = workflowResult.data as WorkflowRow;

  const tasksResult = await client
    .from('tasks')
    .select('id, workflow_id, title, status, waiting_party, due_at, updated_at')
    .eq('workflow_id', workflowId)
    .order('due_at', { ascending: true });
  if (tasksResult.error) return { ok: false, reason: 'unavailable' };
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const selectedTask = selectCurrentTask(tasks);

  const currentTask: FamilyTaskView | null = selectedTask
    ? {
        id: selectedTask.id,
        workflowId: selectedTask.workflow_id,
        title: selectedTask.title,
        status: selectedTask.status as FamilyTaskStatus,
        waitingParty: selectedTask.waiting_party,
        dueAt: selectedTask.due_at,
        ownerLabel: familyOwnerLabel(selectedTask.waiting_party),
        lastUpdateSummary: familyTaskSummary(selectedTask.status),
        lastUpdateAt: selectedTask.updated_at ?? selectedTask.due_at,
      }
    : null;

  const eventsResult = await client
    .from('workflow_events')
    .select('id, name, occurred_at')
    .eq('workflow_id', workflowId)
    .order('occurred_at', { ascending: false })
    .limit(RECENT_UPDATE_LIMIT);
  if (eventsResult.error) return { ok: false, reason: 'unavailable' };
  const events = (eventsResult.data ?? []) as EventRow[];
  const recentUpdates: FamilyCaseUpdate[] = events.map((event) => ({
    id: event.id,
    summary: summarizeEventForFamily(event.name),
    occurredAt: event.occurred_at,
  }));

  return {
    ok: true,
    data: {
      workflow: {
        id: workflowRow.id,
        caseReference: workflowRow.case_reference,
        familyName: workflowRow.family_name,
        personName: workflowRow.person_name,
        phase: workflowRow.phase,
        status: workflowRow.status as FamilyCaseStatus,
      },
      currentTask,
      recentUpdates,
    },
  };
}

// Fallback path for callers the owner-only raw table read correctly denies:
// active, updates-scoped continuity_participants. Uses the SECURITY DEFINER
// RPC (not RLS on workflows/tasks directly) since participants have no RLS
// grant on those tables by design -- get_family_case_update_for_workflow()
// re-checks the participant predicate itself and returns nothing for anyone
// who doesn't match (revoked participants, unrelated accounts, wrong workflow
// id), so a null/empty result here is a real "not-authorized", not a bug.
async function loadFamilyCaseViewAsParticipant(
  client: Awaited<ReturnType<typeof createPassageServerClient>>,
  workflowId: string,
): Promise<FamilyCaseViewResult> {
  if (!client) return { ok: false, reason: 'unavailable' };
  const participantResult = await client.rpc('get_family_case_update_for_workflow', { p_workflow_id: workflowId });
  if (participantResult.error) return { ok: false, reason: 'unavailable' };
  const rows = (participantResult.data ?? []) as ParticipantCaseUpdateRow[];
  const row = rows[0];
  if (!row) return { ok: false, reason: 'not-authorized' };
  return { ok: true, data: buildParticipantCaseView(workflowId, row) };
}
