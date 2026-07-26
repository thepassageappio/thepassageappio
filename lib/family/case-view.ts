import 'server-only';

/**
 * PLACEHOLDER SHELL -- NOT WIRED TO SUPABASE. See file-level notes in the
 * commit message. This module exists only to give app/case/[id]/* a stable,
 * typed data contract to build a real layout against ahead of the backend
 * (a family/participant RLS grant on workflows + tasks) that it needs to
 * become real. Nothing here should be presented to a user as their actual
 * case data.
 */

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
  | { ok: true; data: FamilyCaseView; isPlaceholder: true }
  | { ok: false; reason: 'not-found' | 'not-authorized' | 'unavailable' };

const PLACEHOLDER_CASE: FamilyCaseView = {
  workflow: {
    id: 'placeholder-workflow',
    caseReference: 'Sample case',
    familyName: 'Sample family',
    personName: 'Sample record',
    phase: 'care_in_motion',
    status: 'active',
  },
  currentTask: {
    id: 'placeholder-task',
    workflowId: 'placeholder-workflow',
    title: 'Sample next step',
    status: 'in_progress',
    waitingParty: null,
    dueAt: null,
    ownerLabel: 'The care team',
    lastUpdateSummary: 'This is placeholder text. It shows the layout before this page is wired to a real case.',
    lastUpdateAt: new Date().toISOString(),
  },
  recentUpdates: [
    {
      id: 'placeholder-update-1',
      summary: 'Placeholder update. Real activity will appear here once this page is wired up.',
      occurredAt: new Date().toISOString(),
    },
  ],
};

/**
 * PLACEHOLDER. Always resolves to the same synthetic case regardless of
 * `workflowId`, and performs no data access of any kind. Replace the body
 * with a real, auth-gated, RLS-scoped Supabase read once
 * passage_private.can_view_workflow_as_family (or equivalent) exists --
 * the exported types are the contract that call should satisfy.
 */
export async function loadFamilyCaseView(workflowId: string): Promise<FamilyCaseViewResult> {
  void workflowId;
  return { ok: true, data: PLACEHOLDER_CASE, isPlaceholder: true };
}
