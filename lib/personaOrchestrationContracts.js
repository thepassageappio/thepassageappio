export const personaOrchestrationContracts = [
  {
    id: 'family-coordinator',
    persona: 'Family coordinator',
    entry: 'Urgent or planning estate',
    action: 'Creates the family record, reviews updates, assigns work, requests outside help, and sees what is waiting.',
    proof: 'Urgent stabilization context, dependency state, generated outputs, task status, family update, vendor request, announcement, and event rows stay tied to the same estate.',
    notification: 'Reviewed family update, task assignment email, and reminder handoff with direct CTAs.',
    nextState: 'Coordinator sees situation, pronouncement, funeral-home readiness, owner, waiting point, proof, and next expected update.',
    smokeChecks: ['temporary_case_created', 'task_owner_assignment_saved', 'urgent_stabilization_context_visible_in_spine', 'orchestration_state_machine_contract', 'output_generation_templates_available', 'reviewed_family_update_email', 'task_assignment_spine_contract', 'task_reminder_spine_rows_contract', 'spine_rows_recorded'],
  },
  {
    id: 'participant',
    persona: 'Participant / helper',
    entry: 'Scoped participant workspace',
    action: 'Receives one responsibility, marks waiting or handled, and leaves a note or proof without seeing the full record.',
    proof: 'Participant action writes a task status event back to the estate spine.',
    notification: 'Task assignment and reminder emails route through Passage notification safety with direct task links.',
    nextState: 'Coordinator sees the participant response and the task remains visible until resolved.',
    smokeChecks: ['participant_assignment_email', 'participant_scoped_waiting_update', 'task_reminder_notification_contract', 'participant_action_spine_contract', 'task_reminder_spine_rows_contract', 'spine_rows_recorded'],
  },
  {
    id: 'funeral-home-director',
    persona: 'Funeral home director',
    entry: 'Private partner command center',
    action: 'Reviews My Day, unassigned cases, unassigned tasks, warm inbounds, staff load, reporting, and proof.',
    proof: 'Director-visible task close creates task proof, estate event, notification row, exportable status, and packet-ready output context.',
    notification: 'Family proof email is sent only after the funeral-home action is saved.',
    nextState: 'Handled work drops out of active attention while proof remains in the case.',
    smokeChecks: ['funeral_home_close_with_proof', 'funeral_home_proof_spine_contract', 'output_generation_templates_available', 'spine_rows_recorded'],
  },
  {
    id: 'funeral-home-employee',
    persona: 'Funeral home employee',
    entry: 'Assigned work queue',
    action: 'Works only assigned tasks with case context, location scope, owner, waiting point, and proof controls.',
    proof: 'Employee close/waiting action uses the same partner task handler as director work and sees the same orchestration state.',
    notification: 'Family/coordinator update can be generated from the task after proof is saved.',
    nextState: 'Director sees staff completion and current case status in My Day/reporting.',
    smokeChecks: ['funeral_home_close_with_proof', 'funeral_home_proof_spine_contract', 'orchestration_state_machine_contract', 'spine_rows_recorded'],
  },
  {
    id: 'vendor',
    persona: 'Vendor',
    entry: 'Scoped vendor request or vendor portal',
    action: 'Receives a scoped request, quotes it, accepts scheduling details, and sees payment/payout status.',
    proof: 'Vendor request, quote, scoped output brief, order, payment, Passage fee, vendor net, and paid event all write to the spine.',
    notification: 'Vendor request and quote/payment updates use the branded Passage email shell.',
    nextState: 'Family sees review/payment state; vendor sees paid/payout status without browsing family records.',
    smokeChecks: ['vendor_scoped_request_created', 'vendor_quote_status_recorded', 'vendor_commerce_no_money_dry_run', 'orchestration_state_machine_contract', 'vendor_request_spine_contract', 'spine_rows_recorded'],
  },
  {
    id: 'activation-witness',
    persona: 'Activation witness',
    entry: 'Planning activation review',
    action: 'A different trusted person confirms activation before a planning record becomes urgent.',
    proof: 'Activation request, confirmation, estate event, and orchestration event record who did what and why.',
    notification: 'Second trusted person receives the activation review email/deep link.',
    nextState: 'Estate becomes active only after second validation; same-person confirmation is blocked.',
    smokeChecks: ['green_red_activation_tables_available', 'green_red_activation_review_started', 'green_red_same_person_confirmation_blocked', 'green_red_second_confirmation_activates_record'],
  },
];

export function summarizePersonaContracts(checks = []) {
  const checkMap = new Map((checks || []).map((check) => [check.name, check]));
  return personaOrchestrationContracts.map((contract) => {
    const results = contract.smokeChecks.map((name) => {
      const check = checkMap.get(name);
      const ok = Boolean(check && (check.ok === true || (typeof check.status === 'number' && check.status < 400)));
      return {
        name,
        ok,
        status: check?.status || null,
        error: check?.error || check?.json?.error || null,
      };
    });
    return {
      ...contract,
      ok: results.every((result) => result.ok),
      results,
    };
  });
}
