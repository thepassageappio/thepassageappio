# Evidence uploads up to 10 MB (direct to storage) — September 28, 2026

Local implementation only. Not merged, deployed, or proven on Demo or production.

## Problem

Both evidence uploads posted the file through a Next.js Server Action. Next.js 16.1.6
limits Server Action bodies to 1 MB by default (`node_modules/next/dist/server/app-render/action-handler.js`,
`defaultBodySizeLimit = '1 MB'`), and nothing raised it. Raising it would not be enough:
Vercel Functions reject request bodies over 4.5 MB with `413 FUNCTION_PAYLOAD_TOO_LARGE`
([Vercel Functions limits](https://vercel.com/docs/functions/limitations#request-body-size);
Vercel's guidance is to upload directly to the storage provider). A streaming route
handler has the same 4.5 MB request limit.

## Design

1. **Prepare** (`prepareParticipantEvidenceUploadAction`, `prepareSubmissionEvidenceUploadAction`):
   repeats the existing authorization (representative session and uploadable document
   requirement; or requester session, draft group, expected version), validates name,
   type and size with the existing validators, and returns a one-time Supabase signed
   upload token for a server-chosen path (`{record}/{artifact}/source.{ext}` in
   `authority-evidence`, `{group}/{artifact}/source.{ext}` in `authority-submission-evidence`).
   `upsert` is false, so a token can never overwrite a stored file. No row is written.
2. **Send**: the browser uploads the file with `uploadToSignedUrl`. The bytes never pass
   through a Vercel Function.
3. **Finalize** (`finalizeParticipantEvidenceUploadAction`, `finalizeSubmissionEvidenceUploadAction`):
   authorizes again, refuses any artifact id that a saved row already uses (a repeat of a
   finished upload succeeds), reads storage metadata (object exists; size 1 byte to 10 MiB;
   stored type matches), downloads the stored bytes, checks PDF/JPEG/PNG magic bytes,
   computes SHA-256 from the stored bytes, then calls the unchanged
   `record_participant_evidence_upload_v1` / `record_submission_group_evidence_upload_v1`
   RPC with the same arguments as before. Audit events, requirement status and record
   version changes stay inside those RPCs. Any object that fails a check is deleted. If
   the RPC fails and no row uses the object, the object is deleted, so no evidence row can
   point at a missing file.

The in-request actions (`uploadParticipantEvidenceAction`, `uploadSubmissionEvidenceAction`)
remain for compatibility and as the no-JavaScript form fallback (small files only). They
now also check magic bytes.

Shared rules: `src/lib/authority/evidence-upload.ts` (limits, messages, type and content
checks, browser-safe), `evidence-upload-access.ts` (who may upload),
`evidence-upload-verify.ts` (stored-object check and finalize order), `evidence-upload-storage.ts`
(service-role storage adapter), `evidence-direct-upload.ts` (browser send).

## Messages

- This file is too big. Files can be up to 10 MB.
- This file type can't be used. Upload a PDF, JPEG, or PNG.
- This file is empty. Choose another file.
- The upload did not finish. Check your internet connection and try again.
- We could not save this file. Try again in a moment.

Size and type are checked in the browser before upload and again on the server.

## Configuration

No migration, storage policy, or environment variable is required. Signed uploads are
performed by Storage as a superuser after it verifies the token, so the existing
`submission evidence server only` restrictive policy and `revoke all on storage.objects`
stay as they are. The browser uses the existing `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server validation does not depend on the bucket
limits in `20260928120200_evidence_bucket_limits.sql`; once applied, Storage also refuses
oversize or wrong-type files at upload time.

## Local evidence

- `pnpm verify`: domain tests (including 31 new upload tests), typecheck, lint, build.
- Storage end to end: Supabase `storage-api` run from source against local Postgres 17
  with the production bucket settings and storage policies reproduced, using the repo's
  own modules. A 7.0 MB PDF and an exactly 10 MiB PDF uploaded directly in both buckets
  with matching SHA-256; 10 MiB + 1 and 11 MB files were stopped before upload; an 11 MB
  file sent by a client that skipped the check was refused by the bucket limit
  (`authority-evidence`) or deleted at finalize (`authority-submission-evidence`); a PNG
  renamed to .pdf, a missing object, a failed record step, a token used for another path,
  a repeat send, and a lost connection all behaved as intended.
- Not exercised locally: the pages, cookies and RPCs (no local PostgREST/Auth stack).

## Demo QA after deploy (synthetic files only)

Prepare synthetic files: one PDF between 5 and 9 MB, one PDF over 10 MB, and a PNG
renamed to `.pdf`. Record the SHA-256 of the 5–9 MB PDF (`shasum -a 256 file.pdf`).

1. Representative upload (`authority-evidence`): open a synthetic Demo request at
   **Complete the requirements** (`/request/{id}/requirements`) as the representative.
   - Choose the over-10 MB PDF. Before pressing Upload, the page shows "This file is too
     big. Files can be up to 10 MB." Press **Upload for review**: the same message, and the
     browser network log shows no request to `/storage/v1/object/upload/sign/...`.
   - Choose the renamed PNG and upload. The page shows "This file type can't be used.
     Upload a PDF, JPEG, or PNG." The requirement status does not change.
   - Choose the 5–9 MB PDF and upload. The network log shows a `PUT` to
     `https://bklrclpertdtmhycpqlz.supabase.co/storage/v1/object/upload/sign/authority-evidence/...`
     returning 200, then the page shows "Your file is saved privately…" and the file line
     with its size. No 413 anywhere.
2. Institution side: open the same request in the workspace as a reviewer. The timeline
   shows the "… received" evidence event once. Open the file; it downloads completely and
   its SHA-256 matches the value recorded above.
3. Requester upload (`authority-submission-evidence`, Demo only): start a synthetic
   multi-institution request, reach **Shared files**, and repeat the three files for
   "Power of attorney document". Expect the same two messages and a successful upload
   that shows the file name.
4. Read-only SQL on Demo (no writes):
   `select id, storage_path, byte_size, sha256_hex from public.authority_evidence_artifacts order by created_at desc limit 3;`
   and the same for `public.authority_submission_group_evidence`; confirm `byte_size` and
   `sha256_hex` match the local file, and `storage.objects` has an object at each
   `storage_path`. Confirm no object exists under the rejected attempts
   (`select name, metadata->>'size' from storage.objects where bucket_id in ('authority-evidence','authority-submission-evidence') order by created_at desc limit 10;`).
