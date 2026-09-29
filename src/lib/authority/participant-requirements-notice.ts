import { EVIDENCE_UPLOAD_MESSAGES } from "./evidence-upload.ts";

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

/** Participant requirements page errors, keyed by the short codes in the page URL. */
const ERRORS: Record<string, string> = {
  file_required: EVIDENCE_UPLOAD_MESSAGES.file_required,
  file_type_not_allowed: EVIDENCE_UPLOAD_MESSAGES.file_type_not_allowed,
  file_empty: EVIDENCE_UPLOAD_MESSAGES.file_empty,
  file_too_large: EVIDENCE_UPLOAD_MESSAGES.file_too_large,
  upload_interrupted: EVIDENCE_UPLOAD_MESSAGES.upload_interrupted,
  file_unavailable: EVIDENCE_UPLOAD_MESSAGES.storage_unavailable,
  evidence_unavailable: "These requirements are not available for this request.",
  evidence_changed: "This requirement changed. Review the current status and try again.",
  certification_required: "Confirm the certification before continuing.",
};

const FALLBACK_ERROR = "That action could not be completed. Nothing was changed.";

export function participantRequirementsError(code: string | undefined): string | null {
  if (!code) return null;
  return ERRORS[code] ?? FALLBACK_ERROR;
}
