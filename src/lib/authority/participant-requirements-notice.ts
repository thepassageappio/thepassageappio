/** Participant requirements page flash notices. */
const NOTICES: Record<string, string> = {
  file_received: "Your file is saved privately. It is waiting for the institution to review it.",
  certification_saved: "Your statement was saved, including the words you agreed to and the time.",
};

/**
 * Suppress stale "waiting for institution to review" after bank review when
 * all required checks are already complete (e.g. 3/3).
 */
export function participantRequirementsNotice(
  notice: string | undefined,
  allRequirementsComplete: boolean,
): string | null {
  if (!notice) return null;
  const message = NOTICES[notice];
  if (!message) return null;
  if (notice === "file_received" && allRequirementsComplete) return null;
  return message;
}

export const PARTICIPANT_REQUIREMENTS_NOTICES = NOTICES;
