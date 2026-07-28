export const DEMO_EXPIRY_TIME_ZONE: 'America/Los_Angeles';

export function deriveDemoExpiry(activatedAt: string, expiryId: string): string | null;

export function formatDemoExpiry(expiresAt: string): string | null;

export function normalizeDemoTransferDraft(value: unknown): {
  recipientId: string;
  scopeIds: string[];
  expiryId: string;
  activatedAt: string;
  expiresAt: string;
} | null;
