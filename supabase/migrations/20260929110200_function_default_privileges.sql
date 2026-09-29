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
-- global/built-in defaults, never remove from them. Same for anon/authenticated — grants that
-- exist on the global (no-schema) default ACL cannot be cleared by an IN SCHEMA revoke.
-- Defaults owned by supabase_admin (functions Supabase itself creates) cannot be changed from a
-- migration and are left alone.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema authority_private revoke execute on functions from anon, authenticated;

do $$
declare
  remaining text;
begin
  select string_agg(
    format(
      'ns=%s grantee=%s priv=%s',
      coalesce(n.nspname::text, '(global)'),
      a.grantee::regrole::text,
      a.privilege_type
    ),
    '; '
    order by coalesce(n.nspname::text, ''), a.grantee::regrole::text, a.privilege_type
  )
  into remaining
  from pg_default_acl d
  left join pg_namespace n on n.oid = d.defaclnamespace
  cross join lateral aclexplode(d.defaclacl) a
  where d.defaclrole = 'postgres'::regrole
    and d.defaclobjtype = 'f'
    and a.grantee in ('anon'::regrole, 'authenticated'::regrole);

  if remaining is not null then
    raise exception 'postgres default function privileges still grant anon/authenticated: %', remaining;
  end if;
end;
$$;
