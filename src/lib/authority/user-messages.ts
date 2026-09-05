import { requestCoordinatorRecoveryMessage } from "./role-capabilities.ts";

const errorMessages: Record<string, string> = {
  access_unavailable: "Account access is temporarily unavailable. Please try again shortly.",
  access_revoked: "Your previous organization access was removed. Contact an organization owner if you believe access should be restored.",
  email_invalid: "Enter a valid work email address.",
  link_unavailable: "This sign-in link is no longer available. Request a new secure link.",
  authorized_use_required: "Confirm that you are authorized to evaluate Passage Authority for this organization.",
  organization_details_incomplete: "Complete each required organization field.",
  organization_exists: "Your account already belongs to an organization. Sign in to continue.",
  acceptances_required: "Review and confirm all three required statements.",
  terms_changed: "The documents changed before you finished. Review the current versions and confirm again.",
  template_unavailable: "This template is not available for your organization.",
  role_invalid: "Choose an available role.",
  member_exists: "This person already has access to the organization.",
  invitation_pending: "A current invitation already exists for this email address.",
  role_not_allowed: "Your role cannot grant that level of access.",
  member_management_not_allowed: "Your role cannot manage organization access.",
  last_owner_protected: "Add another owner before removing or changing the final owner.",
  member_changed: "This person's access changed before your action completed. Review the current status and try again.",
  invitation_changed: "This invitation changed before your action completed. Review the current status and try again.",
  invitation_unavailable: "This invitation is no longer available. Ask the organization to send a new one.",
  invitation_expired: "This invitation has expired. Ask the organization to send a new one.",
  invitation_email_mismatch: "Sign in with the same email address that received this invitation.",
  request_failed: "We could not complete that action. Nothing was changed. Please try again.",
  request_creation_not_allowed: requestCoordinatorRecoveryMessage,
  request_activation_not_allowed: requestCoordinatorRecoveryMessage,
  organization_not_ready: "Complete organization setup before creating a request.",
  participant_name_invalid: "Enter the full name of each person.",
  participant_email_invalid: "Enter a valid email address for each person.",
  participant_roles_must_be_distinct: "Use a different email address for the person granting authority and the representative.",
  account_boundary_invalid: "Describe the account or relationship covered by this request.",
  valid_until_invalid: "Choose a valid future end date.",
  allowed_action_invalid: "Choose at least one supported action.",
  request_changed: "The request details changed during submission. Review them and try again.",
  request_unavailable: "This authority request is not available.",
  request_not_activatable: "This request has already moved beyond the draft stage.",
  evaluation_unavailable: "Evaluation access is temporarily unavailable. Nothing was sent or counted.",
  evaluation_expired: "The free evaluation has ended. Existing requests remain available.",
  evaluation_limit_reached: "The free evaluation includes five activated requests. Existing requests remain available.",
  evidence_review_not_allowed: "Your role cannot review evidence for this request.",
  evidence_review_not_available: "Evidence review is not available in the current request state.",
  evidence_changed: "The evidence changed before your action completed. Review the current status and try again.",
  evidence_review_invalid: "Choose an available evidence review action.",
  evidence_review_note_required: "Explain exactly what the representative needs to correct.",
  institution_decision_acknowledgment_required: "Confirm that this is the institution's decision for this request.",
  institution_decision_outcome_invalid: "Choose an available institution decision.",
  institution_decision_reason_required: "Record a clear decision reason using 3 to 500 characters.",
  institution_decision_limit_invalid: "Use no more than 10 limits, with 240 characters or fewer for each limit.",
  institution_decision_limit_required: "List at least one limit for a limited acceptance.",
  institution_decision_limit_not_allowed: "Limits can be recorded only when the institution accepts with limits.",
  institution_decision_not_allowed: "Your role cannot record the institution decision.",
  institution_decision_not_ready: "Complete every required review step before recording the institution decision.",
  institution_decision_request_expired: "This request has reached its end date and cannot be accepted.",
  institution_decision_requirements_incomplete: "Complete every required review step before recording the institution decision.",
  institution_decision_already_recorded: "The institution decision is already saved. Review the current receipt.",
  authority_lifecycle_acknowledgment_required: "Confirm that this lifecycle change should be saved to the receipt.",
  authority_lifecycle_action_invalid: "Choose an available lifecycle action.",
  authority_lifecycle_reason_required: "Record a clear revocation reason using 3 to 500 characters.",
  authority_lifecycle_not_allowed: "Your role cannot change the authority lifecycle.",
  authority_lifecycle_not_available: "This lifecycle change is not available for the current decision.",
  authority_lifecycle_not_expired: "This request has not reached its recorded end date.",
  institution_decision_unavailable: "The institution decision receipt is not available.",
  information_request_message_required: "Explain what information is still needed.",
  information_request_not_allowed: "Your role cannot request information for this review.",
  information_request_not_available: "More information can be requested only while the institution is reviewing the request.",
  information_request_requirement_invalid: "Choose a current policy requirement.",
  information_request_already_open: "This request already has an unanswered information request.",
  demo_recipient_configuration_invalid: "The controlled demo inboxes are not ready. Nothing was created or sent.",
  invitation_configuration_invalid: "Secure-link delivery is not connected to this site. Nothing was changed or sent. Ask a Passage administrator to check the deployment settings.",
};

const noticeMessages: Record<string, string> = {
  invitation_sent: "The secure invitation is ready for the recipient.",
  invitation_created: "The invitation is saved. Delivery is pending.",
  invitation_accepted: "Your organization access is active.",
  role_updated: "The person's role has been updated.",
  access_revoked: "The person's access has been revoked.",
  invitation_revoked: "The invitation has been revoked.",
  draft_created: "The draft is saved. No invitation was sent and no transaction was counted.",
  request_activated: "The request is activated and one transaction was counted. The email provider accepted the principal invitation. Final delivery confirmation is pending, and representative access remains held until the principal confirms.",
  request_activated_delivery_pending: "The request is activated and one transaction was counted. The email provider did not accept the principal invitation. Representative access remains held.",
  participant_invitation_submitted: "The email provider accepted the fresh secure invitation. Final delivery confirmation is pending.",
  participant_invitation_delivery_pending: "The fresh secure invitation is ready, but the email provider did not accept it.",
  evidence_review_saved: "The evidence review was saved and the representative can see the current result.",
  institution_decision_saved: "The institution decision and scoped receipt were saved together.",
  institution_decision_saved_receipts_submitted: "The decision was saved and both participant receipt emails were submitted for delivery.",
  institution_decision_saved_receipts_pending: "The decision was saved. One or more receipt emails need attention; send a fresh receipt link below.",
  authority_revocation_saved: "The revocation notice was saved and the receipt now shows that future reliance has ended.",
  authority_expiration_saved: "The request expiration was saved to the receipt.",
  information_requested: "The information request was saved and is visible to the representative.",
  demo_run_prepared: "A fresh sample request is ready. Nothing was sent or counted, and earlier demo runs were not changed.",
};

export function userErrorMessage(code: string | undefined) {
  return code ? errorMessages[code] ?? errorMessages.request_failed : null;
}

export function userNoticeMessage(code: string | undefined) {
  return code ? noticeMessages[code] ?? null : null;
}

const deliveryNoticeCodes = new Set([
  "request_activated",
  "request_activated_delivery_pending",
  "participant_invitation_submitted",
  "participant_invitation_delivery_pending",
]);

export function hostedRequestNoticeMessage(
  code: string | undefined,
  currentDeliveryStatus: string | null | undefined,
) {
  const message = userNoticeMessage(code);
  if (!code || !message || !deliveryNoticeCodes.has(code)) return message;
  if (currentDeliveryStatus === null) return null;
  if (currentDeliveryStatus === "delivered") return "Email delivery confirmed.";
  if (currentDeliveryStatus === "failed") return "Email delivery needs attention. Send a fresh secure link.";
  if (currentDeliveryStatus === "retrying") return "Email delivery is being retried.";
  return message;
}
