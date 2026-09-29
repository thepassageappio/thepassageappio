/**
 * The "Account" line staff type goes into the participant invitation email,
 * which reaches personal inboxes. Steer staff to a name the member knows and
 * away from account numbers, even partial ones.
 */
export const ACCOUNT_LABEL_PLACEHOLDER = "For example, Joint checking";
export const ACCOUNT_LABEL_HELP = "Use a name the member will recognize. Don't include account numbers.";
export const ACCOUNT_LABEL_NUMBER_WARNING = "This looks like it has an account number. Please take the numbers out. You can still save.";
export const SAMPLE_ACCOUNT_LABEL = "Sample joint checking";
/** Prefill for the local sandbox request form and fixture. */
export const SAMPLE_ACCOUNT_EXAMPLE = "Joint checking";

/** Soft check only. It never blocks saving. */
export function accountLabelLooksLikeNumber(value: string) {
  return /\d{4,}/.test(value.replace(/[\s-]/g, ""));
}
