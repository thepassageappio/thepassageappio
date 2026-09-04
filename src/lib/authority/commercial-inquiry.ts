import { AuthorityError } from "./errors.ts";

export const INQUIRY_TYPES = ["demo", "pilot", "general", "billing", "feature"] as const;
export const ORGANIZATION_TYPES = ["bank", "credit_union", "law_firm", "service_organization", "fintech", "other"] as const;
export const CURRENT_PROCESSES = ["email_and_documents", "branch_or_call_center", "case_management", "document_platform", "existing_vendor", "other"] as const;
export const VOLUME_BANDS = ["under_100", "100_499", "500_1999", "2000_plus", "unknown"] as const;
export const COMMERCIAL_CONSENT_VERSION = "commercial-contact-2026.1";

type InquiryType = typeof INQUIRY_TYPES[number];
type OrganizationType = typeof ORGANIZATION_TYPES[number];
type CurrentProcess = typeof CURRENT_PROCESSES[number];
type VolumeBand = typeof VOLUME_BANDS[number];

export type CommercialInquiry = {
  inquiryType: InquiryType;
  fullName: string;
  email: string;
  organizationName: string;
  organizationType: OrganizationType;
  jobRole: string;
  currentProcess: CurrentProcess;
  annualVolumeBand: VolumeBand;
  message: string;
};

function oneOf<T extends string>(value: string, choices: readonly T[]): value is T {
  return choices.includes(value as T);
}

export function prepareCommercialInquiry(input: Record<string, string>): CommercialInquiry {
  const inquiryType = (input.inquiryType ?? "").trim();
  const fullName = (input.fullName ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const organizationName = (input.organizationName ?? "").trim();
  const organizationType = (input.organizationType ?? "").trim();
  const jobRole = (input.jobRole ?? "").trim();
  const currentProcess = (input.currentProcess ?? "").trim();
  const annualVolumeBand = (input.annualVolumeBand ?? "").trim();
  const message = (input.message ?? "").trim();

  if (!oneOf(inquiryType, INQUIRY_TYPES) || !oneOf(organizationType, ORGANIZATION_TYPES)
    || !oneOf(currentProcess, CURRENT_PROCESSES) || !oneOf(annualVolumeBand, VOLUME_BANDS)) {
    throw new AuthorityError("Choose each required option.", "INVALID_COMMAND", 400);
  }
  if (fullName.length < 2 || fullName.length > 120 || organizationName.length < 2 || organizationName.length > 200
    || jobRole.length < 2 || jobRole.length > 120) {
    throw new AuthorityError("Complete each required field.", "INVALID_COMMAND", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new AuthorityError("Enter a valid work email address.", "INVALID_COMMAND", 400);
  }
  if (message.length > 1200) {
    throw new AuthorityError("Keep the additional context under 1,200 characters.", "INVALID_COMMAND", 400);
  }
  return { inquiryType, fullName, email, organizationName, organizationType, jobRole, currentProcess, annualVolumeBand, message };
}
