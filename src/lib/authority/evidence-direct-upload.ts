// Browser half of the evidence upload. The file goes from the browser straight to
// Supabase Storage using a one-time signed upload the server issued for one path, so
// the file never passes through a Vercel Function (4.5 MB request body limit).
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";
import {
  checkEvidenceFile,
  EVIDENCE_UPLOAD_MESSAGES,
  type EvidenceUploadProblem,
  type EvidenceUploadTicket,
  type EvidenceUploadTicketResult,
} from "./evidence-upload.ts";

export type DirectUploadOutcome = { ok: true } | { ok: false; problem: EvidenceUploadProblem };

function storageFailure(error: unknown) {
  if (!error || typeof error !== "object") return { status: null, message: "" };
  const value = error as { message?: unknown; status?: unknown; statusCode?: unknown; originalError?: { status?: unknown } };
  const status = Number(value.status ?? value.statusCode ?? value.originalError?.status);
  return { status: Number.isFinite(status) ? status : null, message: String(value.message ?? "").toLowerCase() };
}

export async function sendEvidenceToStorage(ticket: EvidenceUploadTicket, file: File): Promise<DirectUploadOutcome> {
  try {
    const config = requireSupabasePublicConfig();
    const supabase = createSupabaseClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    // Storage records the multipart part's type, so label the bytes with the checked type.
    const body = new Blob([file], { type: ticket.mediaType });
    const { error } = await supabase.storage
      .from(ticket.bucket)
      .uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: ticket.mediaType, upsert: false });
    if (!error) return { ok: true };
    const failure = storageFailure(error);
    // An object already at this path means an earlier attempt reached storage; finalize checks it.
    if (failure.message.includes("already exists")) return { ok: true };
    // Bucket limits (size or type) answer 413/415 or 400 with a size or mime message.
    if (failure.status === 413 || /too large|exceeded the maximum|size/.test(failure.message)) return { ok: false, problem: "file_too_large" };
    if (failure.status === 415 || /mime|content type|not supported/.test(failure.message)) return { ok: false, problem: "file_type_not_allowed" };
    return { ok: false, problem: "upload_interrupted" };
  } catch {
    return { ok: false, problem: "upload_interrupted" };
  }
}

/**
 * Runs the three steps for one chosen file: check it here, ask the server for a signed
 * upload, send the bytes to storage, then ask the server to check and record it. Any
 * failure returns a plain message; a thrown server call (lost connection) counts as an
 * interrupted upload that is safe to try again.
 */
export async function uploadEvidenceDirect<Finalized>(
  file: File | null | undefined,
  steps: {
    prepare(file: { name: string; type: string; size: number }): Promise<EvidenceUploadTicketResult>;
    finalize(ticket: EvidenceUploadTicket): Promise<Finalized>;
  },
): Promise<{ ok: true; finalized: Finalized } | { ok: false; error: string }> {
  const check = checkEvidenceFile(file);
  if (!check.ok || !file) return { ok: false, error: EVIDENCE_UPLOAD_MESSAGES[check.ok ? "file_required" : check.problem] };
  const interrupted = { ok: false as const, error: EVIDENCE_UPLOAD_MESSAGES.upload_interrupted };
  try {
    const prepared = await steps.prepare({ name: file.name, type: check.mediaType, size: check.size });
    if (!prepared.ok) return { ok: false, error: prepared.error || EVIDENCE_UPLOAD_MESSAGES.storage_unavailable };
    const sent = await sendEvidenceToStorage(prepared.ticket, file);
    if (!sent.ok) return { ok: false, error: EVIDENCE_UPLOAD_MESSAGES[sent.problem] };
    return { ok: true, finalized: await steps.finalize(prepared.ticket) };
  } catch {
    return interrupted;
  }
}
