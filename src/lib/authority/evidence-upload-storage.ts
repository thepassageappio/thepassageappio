import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceObjectStore } from "./evidence-upload-verify.ts";

type StorageErrorLike = { message?: unknown; status?: unknown; statusCode?: unknown; originalError?: { status?: unknown } };

function isMissingObject(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as StorageErrorLike;
  const status = Number(value.status ?? value.statusCode ?? value.originalError?.status);
  if (status === 404) return true;
  const message = String(value.message ?? "").toLowerCase();
  return message.includes("not found") || message.includes("does not exist");
}

function numberOrNull(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Service-role storage access used only by trusted server commands. */
export function supabaseEvidenceObjectStore(admin: SupabaseClient): EvidenceObjectStore {
  return {
    async info(bucket, path) {
      const { data, error } = await admin.storage.from(bucket).info(path);
      if (error) {
        if (isMissingObject(error)) return null;
        throw new Error("evidence_storage_unavailable");
      }
      const row = data as unknown as Record<string, unknown> & { metadata?: Record<string, unknown> | null };
      return {
        size: numberOrNull(row.size) ?? numberOrNull(row.metadata?.size) ?? numberOrNull(row.metadata?.contentLength),
        contentType: stringOrNull(row.contentType) ?? stringOrNull(row.metadata?.mimetype),
      };
    },
    async download(bucket, path) {
      const { data, error } = await admin.storage.from(bucket).download(path);
      if (error || !data) {
        if (isMissingObject(error)) return null;
        throw new Error("evidence_storage_unavailable");
      }
      return { bytes: new Uint8Array(await data.arrayBuffer()), contentType: stringOrNull(data.type) };
    },
    async remove(bucket, path) {
      await admin.storage.from(bucket).remove([path]);
    },
  };
}

/** A one-time upload for exactly one new object. Existing objects are never overwritten. */
export async function createEvidenceSignedUpload(admin: SupabaseClient, bucket: string, path: string) {
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) throw new Error("evidence_storage_unavailable");
  return { token: data.token };
}
