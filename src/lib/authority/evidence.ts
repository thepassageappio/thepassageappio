export const AUTHORITY_EVIDENCE_BUCKET = "authority-evidence";
export const MAX_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EVIDENCE_MEDIA_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type EvidenceMediaType = keyof typeof ALLOWED_EVIDENCE_MEDIA_TYPES;

export type PreparedEvidenceUpload = {
  originalFilename: string;
  mediaType: EvidenceMediaType;
  byteSize: number;
  extension: string;
};

export function prepareEvidenceUpload(input: { name: string; type: string; size: number }): PreparedEvidenceUpload {
  const originalFilename = input.name.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180);
  const mediaType = input.type.trim().toLowerCase() as EvidenceMediaType;
  const extension = ALLOWED_EVIDENCE_MEDIA_TYPES[mediaType];

  if (!originalFilename) throw new Error("evidence_file_required");
  if (!extension) throw new Error("evidence_file_type_not_allowed");
  if (!Number.isSafeInteger(input.size) || input.size < 1) throw new Error("evidence_file_empty");
  if (input.size > MAX_EVIDENCE_FILE_BYTES) throw new Error("evidence_file_too_large");

  return { originalFilename, mediaType, byteSize: input.size, extension };
}

export function evidenceStoragePath(recordId: string, artifactId: string, extension: string) {
  if (!/^[0-9a-f-]{36}$/i.test(recordId) || !/^[0-9a-f-]{36}$/i.test(artifactId)) {
    throw new Error("evidence_path_invalid");
  }
  if (!/^[a-z0-9]{2,5}$/.test(extension)) throw new Error("evidence_path_invalid");
  return `${recordId}/${artifactId}/source.${extension}`;
}
