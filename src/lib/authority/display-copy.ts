const LEGACY_FINANCIAL_POA_PURPOSE = "request recognition of limited financial power of attorney authority";

export function authorityPurposeLabel(purpose: string) {
  const value = purpose.trim();
  return value.toLowerCase().replaceAll(/\s+/g, " ") === LEGACY_FINANCIAL_POA_PURPOSE
    ? "Financial power of attorney request"
    : value;
}
