-- Align storage bucket limits with the app upload validators.
-- Originally drafted by Ops as 20260924120200; re-timestamped to sort after the newest migration on main.
--
-- App sources (both server-side validators run before any storage upload):
--   src/lib/authority/evidence.ts: AUTHORITY_EVIDENCE_BUCKET = 'authority-evidence',
--     MAX_EVIDENCE_FILE_BYTES = 10 MiB; pdf/jpeg/png
--   src/lib/authority/multi-institution-submission.ts: SUBMISSION_EVIDENCE_BUCKET = 'authority-submission-evidence',
--     MAX_GROUP_EVIDENCE_FILE_BYTES = 10 MiB; pdf/jpeg/png
-- authority-evidence already has these limits (20260830210000). authority-submission-evidence was created with
-- null limits (20260913150000). Idempotent for both.

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[]
where id in ('authority-evidence', 'authority-submission-evidence');
