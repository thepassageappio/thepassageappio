// Server-side check of a file the browser sent straight to storage. Storage I/O is
// injected so the rules can be tested without Supabase. Nothing here trusts what the
// browser said about the file: size and type come from storage, and the content check
// reads the stored bytes. Any object that fails is deleted so it can never be recorded.
import { createHash } from "node:crypto";
import { EVIDENCE_SNIFF_BYTES, EVIDENCE_UPLOAD_MAX_BYTES, sniffEvidenceMediaType, type EvidenceUploadMediaType } from "./evidence-upload.ts";

export type StoredEvidenceInfo = { size: number | null; contentType: string | null };

export type EvidenceObjectStore = {
  /** Object metadata, or null when no object exists at the path. Throws on other failures. */
  info(bucket: string, path: string): Promise<StoredEvidenceInfo | null>;
  /** Full object bytes, or null when no object exists at the path. Throws on other failures. */
  download(bucket: string, path: string): Promise<{ bytes: Uint8Array; contentType: string | null } | null>;
  remove(bucket: string, path: string): Promise<void>;
};

export type VerifiedEvidence = { ok: true; byteSize: number; sha256Hex: string };
export type RejectedEvidence = { ok: false; code: string };

function sameType(actual: string | null, expected: EvidenceUploadMediaType) {
  if (!actual) return true; // Missing metadata cannot show a mismatch; the byte check still decides.
  return actual.split(";")[0].trim().toLowerCase() === expected;
}

export async function verifyUploadedEvidence(
  store: EvidenceObjectStore,
  input: { bucket: string; path: string; mediaType: EvidenceUploadMediaType },
): Promise<VerifiedEvidence | RejectedEvidence> {
  const reject = async (code: string): Promise<RejectedEvidence> => {
    await store.remove(input.bucket, input.path).catch(() => undefined);
    return { ok: false, code };
  };

  let info: StoredEvidenceInfo | null;
  try {
    info = await store.info(input.bucket, input.path);
  } catch {
    return { ok: false, code: "evidence_storage_unavailable" };
  }
  if (!info) return { ok: false, code: "evidence_upload_missing" };
  if (info.size !== null && info.size > EVIDENCE_UPLOAD_MAX_BYTES) return reject("evidence_file_too_large");
  if (info.size !== null && info.size < 1) return reject("evidence_file_empty");
  if (!sameType(info.contentType, input.mediaType)) return reject("evidence_file_type_not_allowed");

  let stored: { bytes: Uint8Array; contentType: string | null } | null;
  try {
    stored = await store.download(input.bucket, input.path);
  } catch {
    return { ok: false, code: "evidence_storage_unavailable" };
  }
  if (!stored) return { ok: false, code: "evidence_upload_missing" };
  const { bytes } = stored;
  if (bytes.byteLength > EVIDENCE_UPLOAD_MAX_BYTES) return reject("evidence_file_too_large");
  if (bytes.byteLength < 1) return reject("evidence_file_empty");
  if (!sameType(stored.contentType, input.mediaType)) return reject("evidence_file_type_not_allowed");
  if (sniffEvidenceMediaType(bytes.subarray(0, EVIDENCE_SNIFF_BYTES)) !== input.mediaType) {
    return reject("evidence_file_type_not_allowed");
  }

  return { ok: true, byteSize: bytes.byteLength, sha256Hex: createHash("sha256").update(bytes).digest("hex") };
}

/** Content check for the older in-request upload path, which already holds the bytes. */
export function evidenceBytesMatchType(bytes: Uint8Array, mediaType: EvidenceUploadMediaType) {
  return sniffEvidenceMediaType(bytes.subarray(0, EVIDENCE_SNIFF_BYTES)) === mediaType;
}

export type FinalizeEvidenceDeps<Auth> = {
  /** Re-checks the caller's access for this request or submission. Throws when not allowed. */
  authorize(): Promise<Auth>;
  /** Throws when the requirement no longer accepts a new file. */
  assertUploadable(auth: Auth): void;
  /** The request or submission that a saved evidence row with this id belongs to, or null. */
  recordedOwner(artifactId: string): Promise<string | null>;
  store: EvidenceObjectStore;
  /** Saves the evidence row and its audit event (the existing RPC). Throws on failure. */
  record(auth: Auth, verified: VerifiedEvidence): Promise<void>;
};

export type FinalizeEvidenceInput = {
  /** The request or submission id that is also the first segment of the path. */
  scopeId: string;
  artifactId: string;
  bucket: string;
  path: string;
  mediaType: EvidenceUploadMediaType;
};

/**
 * Finishes a direct upload. Order matters:
 * 1. authorize the caller again (no storage access before this);
 * 2. never touch an object a saved row already uses; a repeat of a finished upload succeeds;
 * 3. check the stored object and delete it if it fails;
 * 4. record it; if recording fails and no row uses the object, delete the object.
 */
export async function finalizeEvidenceUpload<Auth>(
  deps: FinalizeEvidenceDeps<Auth>,
  input: FinalizeEvidenceInput,
): Promise<{ replayed: boolean }> {
  const auth = await deps.authorize();

  let owner: string | null;
  try {
    owner = await deps.recordedOwner(input.artifactId);
  } catch {
    throw new Error("evidence_storage_unavailable");
  }
  if (owner === input.scopeId) return { replayed: true };
  if (owner !== null) throw new Error("evidence_path_invalid");
  deps.assertUploadable(auth);

  const verified = await verifyUploadedEvidence(deps.store, input);
  if (!verified.ok) throw new Error(verified.code);

  try {
    await deps.record(auth, verified);
  } catch (error) {
    // A lost reply can hide a saved row, so look again before deleting anything.
    const after = await deps.recordedOwner(input.artifactId).catch(() => "unknown");
    if (after === input.scopeId) return { replayed: false };
    if (after === null) await deps.store.remove(input.bucket, input.path).catch(() => undefined);
    throw error;
  }
  return { replayed: false };
}
