export type CancellationReceipt = {
  receiptCode: string; referenceCode: string; reason: string; canceledAt: string;
  recordVersion: number; institutionName: string; principalName: string;
  representativeName: string; accountBoundary: string; receiptSha256: string;
};
export function mapCancellationReceipt(value: unknown): CancellationReceipt | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!row.receipt_snapshot || typeof row.receipt_snapshot !== "object") return null;
  const snapshot = row.receipt_snapshot as Record<string, unknown>;
  const keys = ["receipt_code", "reference_code", "reason", "canceled_at", "institution_name", "principal_name", "representative_name", "account_boundary"];
  if (snapshot.status !== "canceled" || keys.some(key => typeof snapshot[key] !== "string" || !snapshot[key]) || !Number.isSafeInteger(snapshot.record_version) || Number(snapshot.record_version) < 1 || typeof row.receipt_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(row.receipt_sha256) || !Number.isFinite(Date.parse(String(snapshot.canceled_at)))) return null;
  return {receiptCode: String(snapshot.receipt_code), referenceCode: String(snapshot.reference_code), reason: String(snapshot.reason), canceledAt: String(snapshot.canceled_at), recordVersion: Number(snapshot.record_version), institutionName: String(snapshot.institution_name), principalName: String(snapshot.principal_name), representativeName: String(snapshot.representative_name), accountBoundary: String(snapshot.account_boundary), receiptSha256: row.receipt_sha256};
}
