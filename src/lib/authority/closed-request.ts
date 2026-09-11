// Presentation only. Saved decisions and command authorization remain authoritative.
const closedMessages: Record<string, string> = {
  declined: "A participant declined this request. No further steps are needed for this request.",
  withdrawn: "The representative withdrew from this request. No further steps are needed for this request.",
  canceled: "This request was canceled. No further steps are needed for this request.",
  rejected: "The institution did not accept this request. Read the saved decision for the reason.",
  revoked: "A revocation was recorded. Read the receipt and saved history for details.",
  expired: "This request has ended. Read the saved history for details.",
};

export function closedRequestMessage(status: string): string | null {
  return Object.hasOwn(closedMessages, status) ? closedMessages[status] : null;
}
