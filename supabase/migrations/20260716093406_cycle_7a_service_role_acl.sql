
-- Cycle 7A follow-up: public wrappers require an authenticated end-user
-- context. Remove default service-role EXECUTE so the catalog does not imply a
-- server-only bypass that the SECURITY INVOKER wrappers cannot support.

revoke all on function public.inspect_organization_invitation(text)
  from service_role;
revoke all on function public.create_employee_invitation(uuid, text, uuid[], text, timestamp with time zone)
  from service_role;
revoke all on function public.accept_organization_invitation(text)
  from service_role;
revoke all on function public.revoke_organization_invitation(uuid, text)
  from service_role;

