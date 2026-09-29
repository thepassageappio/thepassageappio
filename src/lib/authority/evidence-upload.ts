// Shared rules for evidence files (PDF, JPEG, PNG up to 10 MiB). Safe to import from
// browser code: no Node or Supabase imports. The server repeats every check, and the
// finalize step checks the stored bytes, so nothing here is trusted on its own.
//
// Why files go straight to storage: Next.js Server Actions accept 1 MB bodies by default,
// and Vercel Functions reject any request body over 4.5 MB (413 FUNCTION_PAYLOAD_TOO_LARGE,
// https://vercel.com/docs/functions/limitations#request-body-size). A 10 MB evidence file
// therefore cannot pass through a Server Action or route handler on Vercel. The server
// issues a signed upload for one server-chosen path, the browser sends the file to Supabase
// Storage, and a small finalize command checks the stored object before recording it.

export const EVIDENCE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const EVIDENCE_UPLOAD_MEDIA_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type EvidenceUploadMediaType = keyof typeof EVIDENCE_UPLOAD_MEDIA_TYPES;

/** Value for `<input type="file" accept>`. Extensions help browsers that report no type. */
export const EVIDENCE_UPLOAD_ACCEPT = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";

export type EvidenceUploadProblem =
  | "file_required"
  | "file_empty"
  | "file_too_large"
  | "file_type_not_allowed"
  | "upload_interrupted"
  | "storage_unavailable";

export const EVIDENCE_UPLOAD_MESSAGES: Record<EvidenceUploadProblem, string> = {
  file_required: "Choose a file to upload.",
  file_empty: "This file is empty. Choose another file.",
  file_too_large: "This file is too big. Files can be up to 10 MB.",
  file_type_not_allowed: "This file type can't be used. Upload a PDF, JPEG, or PNG.",
  upload_interrupted: "The upload did not finish. Check your internet connection and try again.",
  storage_unavailable: "We could not save this file. Try again in a moment.",
};

/** Error codes raised by the evidence validators, the finalize check, and the RPCs. */
const PROBLEM_BY_CODE: Record<string, EvidenceUploadProblem> = {
  evidence_file_required: "file_required",
  evidence_file_empty: "file_empty",
  evidence_file_too_large: "file_too_large",
  evidence_file_type_not_allowed: "file_type_not_allowed",
  evidence_upload_missing: "upload_interrupted",
  evidence_upload_interrupted: "upload_interrupted",
  evidence_storage_unavailable: "storage_unavailable",
  evidence_path_invalid: "storage_unavailable",
};

export function evidenceUploadProblemFromCode(code: string): EvidenceUploadProblem | null {
  return PROBLEM_BY_CODE[code] ?? null;
}

const EXTENSION_MEDIA_TYPES: Record<string, EvidenceUploadMediaType> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/**
 * Returns the allowed media type for a chosen file. The browser's type wins; when a
 * browser reports no type (or a generic one), the file extension decides. The stored
 * bytes are checked again at finalize, so a renamed file still fails there.
 */
export function resolveEvidenceMediaType(name: string, type: string): EvidenceUploadMediaType | null {
  const declared = type.trim().toLowerCase();
  if (declared in EVIDENCE_UPLOAD_MEDIA_TYPES) return declared as EvidenceUploadMediaType;
  if (declared && declared !== "application/octet-stream") return null;
  const extension = name.trim().toLowerCase().split(".").pop() ?? "";
  return EXTENSION_MEDIA_TYPES[extension] ?? null;
}

export type EvidenceFileCheck =
  | { ok: true; mediaType: EvidenceUploadMediaType; size: number }
  | { ok: false; problem: EvidenceUploadProblem };

/** The same size and type rules the server uses, for a message before any upload starts. */
export function checkEvidenceFile(input: { name: string; type: string; size: number } | null | undefined): EvidenceFileCheck {
  if (!input || !input.name.trim()) return { ok: false, problem: "file_required" };
  const mediaType = resolveEvidenceMediaType(input.name, input.type);
  if (!mediaType) return { ok: false, problem: "file_type_not_allowed" };
  if (!Number.isSafeInteger(input.size) || input.size < 1) return { ok: false, problem: "file_empty" };
  if (input.size > EVIDENCE_UPLOAD_MAX_BYTES) return { ok: false, problem: "file_too_large" };
  return { ok: true, mediaType, size: input.size };
}

/** Number of leading bytes the content check needs. */
export const EVIDENCE_SNIFF_BYTES = 1024;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

/**
 * Identifies PDF, JPEG, or PNG from the file's first bytes. PDF readers accept a short
 * preamble before "%PDF-", so the PDF marker may appear anywhere in the first 1024 bytes.
 */
export function sniffEvidenceMediaType(bytes: Uint8Array): EvidenceUploadMediaType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  const limit = Math.min(bytes.length, EVIDENCE_SNIFF_BYTES) - PDF_SIGNATURE.length;
  for (let offset = 0; offset <= limit; offset += 1) {
    if (startsWith(bytes, PDF_SIGNATURE, offset)) return "application/pdf";
  }
  return null;
}

/** What the browser needs to send one file to one server-chosen storage path. */
export type EvidenceUploadTicket = {
  bucket: string;
  path: string;
  token: string;
  artifactId: string;
  mediaType: EvidenceUploadMediaType;
  originalFilename: string;
  idempotencyKey: string;
};

export type EvidenceUploadTicketResult = { ok: true; ticket: EvidenceUploadTicket } | { ok: false; error: string };
