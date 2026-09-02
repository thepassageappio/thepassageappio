import type { AuthorityRecord } from "@/lib/authority/types";
import styles from "./journey.module.css";

const steps = ["Confirm", "Accept", "Evidence", "Review", "Decision"];

type StepState = "completed" | "current" | "not_started" | "not_required" | "declined" | "ended" | "recorded";

const stateLabel: Record<StepState, string> = {
  completed: "Completed",
  current: "Current",
  not_started: "Not started",
  not_required: "Not required",
  declined: "Declined",
  ended: "Ended",
  recorded: "Recorded",
};

function stepStates(record: AuthorityRecord): StepState[] {
  if (record.status === "declined") {
    return ["completed", "declined", "not_required", "not_required", "not_required"];
  }

  const evidenceComplete = record.requirements.filter((requirement) => requirement.required)
    .every((requirement) => requirement.status === "complete");
  const ended = ["withdrawn", "revoked", "expired"].includes(record.status);

  const states: StepState[] = [
    record.principalConfirmedAt ? "completed" : record.status === "awaiting_principal" ? "current" : "not_required",
    record.representativeAcceptedAt ? "completed" : record.status === "awaiting_representative" ? "current" : "not_required",
    record.submittedAt ? "completed" : ["evidence_required", "ready_to_submit"].includes(record.status) ? "current" : evidenceComplete ? "completed" : "not_started",
    record.decision ? "completed" : ["under_review", "information_requested"].includes(record.status) ? "current" : "not_started",
    record.decision ? "recorded" : ["accepted", "accepted_with_limits", "rejected"].includes(record.status) ? "current" : "not_started",
  ];

  if (ended && !record.decision) {
    const firstUnfinished = states.findIndex((state) => state === "not_started" || state === "current");
    if (firstUnfinished >= 0) {
      states[firstUnfinished] = "ended";
      for (let index = firstUnfinished + 1; index < states.length; index += 1) states[index] = "not_required";
    }
  }

  return states;
}

export function JourneyProgress({ record }: { record: AuthorityRecord }) {
  const states = stepStates(record);
  return <nav className={styles.progress} aria-label="Authority request progress"><ol>{steps.map((step,index) => {
    const state = states[index];
    const className = state === "completed" || state === "recorded" ? styles.done : state === "current" ? styles.current : state === "declined" || state === "ended" ? styles.halted : "";
    const marker = state === "completed" || state === "recorded" ? "✓" : state === "declined" ? "×" : state === "ended" ? "!" : state === "not_required" ? "·" : index + 1;
    return <li className={className} key={step}><span aria-hidden="true">{marker}</span><strong>{step}</strong><small>{stateLabel[state]}</small></li>;
  })}</ol></nav>;
}
