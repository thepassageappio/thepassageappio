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
  // (or org staff/director authority). An empty result means either the case
  // doesn't exist or this account isn't authorized for it -- collapsed into
  // one reason on purpose, so the response can't be used to enumerate cases.
  if (!workflowResult.data) return { ok: false, reason: 'not-authorized' };
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
