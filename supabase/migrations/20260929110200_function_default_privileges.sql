-- Default EXECUTE privileges for functions created by postgres (audit 2026-09-28).
--
-- Independent of 20260929110000/110100 and safe to apply at any time. Affects ONLY functions
-- created after this runs; existing functions keep their explicit ACLs. Replacing an existing
-- function with CREATE OR REPLACE keeps its ACL. A function that is dropped and re-created, or
-- a brand-new one, starts with EXECUTE for its owner (and service_role in public) only, so the
-- migration that creates it must GRANT EXECUTE explicitly to anon/authenticated if a client
-- calls it. 206 of the 207 functions in public/authority_private already carry explicit grants,
-- so this matches house style and makes a forgotten grant fail closed instead of open.
--
-- PUBLIC must be revoked in the global form: per-schema default privileges can only add to the
-- global/built-in defaults, never remove from them. Defaults owned by supabase_admin (functions
-- Supabase itself creates) cannot be changed from a migration and are left alone.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_default_acl d, aclexplode(d.defaclacl) a
    where d.defaclrole = 'postgres'::regrole and d.defaclobjtype = 'f'
      and a.grantee in ('anon'::regrole, 'authenticated'::regrole)
  ) then
    raise exception 'postgres default function privileges still grant anon/authenticated';
  end if;
end;
$$;
